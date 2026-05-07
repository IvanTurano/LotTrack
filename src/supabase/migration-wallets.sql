-- ============================================================
-- Migration: Single balance → Multi-wallet system
-- Run this on existing databases to migrate.
-- ============================================================

-- 1. Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
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

-- 2. Add wallet_id columns to existing tables
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;
ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;

-- 3. Migrate existing balance data to wallets (one wallet per user_balance row)
-- Creates "Efectivo" and "Banco" wallets for each user that had a balance
INSERT INTO wallets (user_id, name, type, balance, color)
SELECT user_id, 'Efectivo', 'cash', COALESCE(cash_balance, 0), '#3ecf8e'
FROM user_balance
WHERE COALESCE(cash_balance, 0) != 0
ON CONFLICT DO NOTHING;

INSERT INTO wallets (user_id, name, type, balance, color)
SELECT user_id, 'Banco', 'bank', COALESCE(bank_balance, 0), '#6366f1'
FROM user_balance
WHERE COALESCE(bank_balance, 0) != 0
ON CONFLICT DO NOTHING;

-- 4. Link existing expenses/incomes to migrated wallets
-- For cash expenses → link to "Efectivo" wallet
UPDATE expenses e
SET wallet_id = w.id
FROM wallets w
WHERE w.user_id = e.user_id
  AND w.name = 'Efectivo'
  AND e.payment_method = 'cash'
  AND e.wallet_id IS NULL;

-- For card/transfer expenses → link to "Banco" wallet
UPDATE expenses e
SET wallet_id = w.id
FROM wallets w
WHERE w.user_id = e.user_id
  AND w.name = 'Banco'
  AND e.payment_method IN ('card', 'transfer')
  AND e.wallet_id IS NULL;

-- For cash incomes → link to "Efectivo" wallet
UPDATE incomes i
SET wallet_id = w.id
FROM wallets w
WHERE w.user_id = i.user_id
  AND w.name = 'Efectivo'
  AND i.payment_method = 'cash'
  AND i.wallet_id IS NULL;

-- For bank incomes → link to "Banco" wallet
UPDATE incomes i
SET wallet_id = w.id
FROM wallets w
WHERE w.user_id = i.user_id
  AND w.name = 'Banco'
  AND i.payment_method = 'bank'
  AND i.wallet_id IS NULL;

-- For fixed_expenses: same logic as expenses
UPDATE fixed_expenses fe
SET wallet_id = w.id
FROM wallets w
WHERE w.user_id = fe.user_id
  AND w.name = 'Efectivo'
  AND fe.payment_method = 'cash'
  AND fe.wallet_id IS NULL;

UPDATE fixed_expenses fe
SET wallet_id = w.id
FROM wallets w
WHERE w.user_id = fe.user_id
  AND w.name = 'Banco'
  AND fe.payment_method IN ('card', 'transfer')
  AND fe.wallet_id IS NULL;

-- 5. Add indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_wallet ON expenses(wallet_id);
CREATE INDEX IF NOT EXISTS idx_incomes_wallet ON incomes(wallet_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_wallet ON fixed_expenses(wallet_id);

-- 6. Drop old balance table (uncomment when ready)
-- DROP TABLE IF EXISTS user_balance CASCADE;
