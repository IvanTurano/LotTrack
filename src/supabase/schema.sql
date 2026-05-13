-- ============================================================
-- LotTrack — Supabase Schema
-- WARNING: This drops and recreates ALL tables.
-- Only run on a fresh database or when you need to reset.
-- ============================================================

-- Drop in correct order (foreign keys)
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS incomes CASCADE;
DROP TABLE IF EXISTS fixed_expenses CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS user_balance CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 1. Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  sales_amount NUMERIC NOT NULL,
  commission NUMERIC NOT NULL,
  tip NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sales" ON sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sales" ON sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sales" ON sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sales" ON sales FOR DELETE USING (auth.uid() = user_id);

-- 2. Categories
CREATE TABLE categories (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  PRIMARY KEY (id, user_id)
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- 3. Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'virtual')),
  balance NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#3ecf8e',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallets" ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets" ON wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wallets" ON wallets FOR DELETE USING (auth.uid() = user_id);

-- 4. Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_id TEXT NOT NULL,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  fixed_expense_id TEXT,
  created_at BIGINT DEFAULT EXTRACT(epoch FROM now()) * 1000
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- 5. Incomes
CREATE TABLE incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  created_at BIGINT DEFAULT EXTRACT(epoch FROM now()) * 1000
);
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own incomes" ON incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own incomes" ON incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incomes" ON incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own incomes" ON incomes FOR DELETE USING (auth.uid() = user_id);

-- 6. Fixed expenses
CREATE TABLE fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id TEXT NOT NULL,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  day_of_month INT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at BIGINT DEFAULT EXTRACT(epoch FROM now()) * 1000
);
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own fixed_expenses" ON fixed_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fixed_expenses" ON fixed_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fixed_expenses" ON fixed_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fixed_expenses" ON fixed_expenses FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_sales_user_date ON sales(user_id, date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX idx_incomes_user_date ON incomes(user_id, date);
CREATE INDEX idx_expenses_user_created ON expenses(user_id, created_at);
CREATE INDEX idx_incomes_user_created ON incomes(user_id, created_at);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_expenses_wallet ON expenses(wallet_id);
CREATE INDEX idx_incomes_wallet ON incomes(wallet_id);
CREATE INDEX idx_fixed_expenses_wallet ON fixed_expenses(wallet_id);

-- ============================================================
-- RPC Functions for atomic operations
-- Run these in Supabase SQL Editor if they don't exist yet
-- ============================================================

-- 1. Atomically update wallet balance (avoids race condition from read-then-write)
CREATE OR REPLACE FUNCTION update_wallet_balance_atomic(
  p_wallet_id UUID,
  p_user_id UUID,
  p_amount_change NUMERIC
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallets
  SET balance = balance + p_amount_change
  WHERE id = p_wallet_id AND user_id = p_user_id;
END;
$$;

-- 2. Atomically transfer between wallets (both succeed or neither)
CREATE OR REPLACE FUNCTION transfer_between_wallets_atomic(
  p_from_wallet_id UUID,
  p_to_wallet_id UUID,
  p_user_id UUID,
  p_amount NUMERIC
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deduct from source
  UPDATE wallets
  SET balance = balance - p_amount
  WHERE id = p_from_wallet_id AND user_id = p_user_id;

  -- Add to destination
  UPDATE wallets
  SET balance = balance + p_amount
  WHERE id = p_to_wallet_id AND user_id = p_user_id;
END;
$$;
