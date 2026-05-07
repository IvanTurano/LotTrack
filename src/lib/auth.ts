import { supabase, isSupabaseConfigured } from "@/utils/supabase/client";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function register(
  email: string,
  nombre: string,
  apellido: string,
  password: string
): Promise<AuthResult> {
  if (!email || !nombre || !apellido || !password) {
    return { success: false, error: "Todos los campos son obligatorios." };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 6 caracteres.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Supabase no está configurado. Revisá el archivo .env.local",
    };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        apellido,
        full_name: `${nombre} ${apellido}`,
      },
      emailRedirectTo: `${window.location.origin}/auth/confirmed`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!email || !password) {
    return { success: false, error: "Email y contraseña son obligatorios." };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Supabase no está configurado. Revisá el archivo .env.local",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function forgotPassword(email: string): Promise<AuthResult> {
  if (!email) {
    return { success: false, error: "El email es obligatorio." };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Supabase no está configurado. Revisá el archivo .env.local",
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resetPassword(newPassword: string): Promise<AuthResult> {
  if (!newPassword) {
    return { success: false, error: "La nueva contraseña es obligatoria." };
  }

  if (newPassword.length < 6) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 6 caracteres.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Supabase no está configurado. Revisá el archivo .env.local",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<AuthResult> {
  if (!currentPassword || !newPassword) {
    return { success: false, error: "Todos los campos son obligatorios." };
  }

  if (newPassword.length < 6) {
    return {
      success: false,
      error: "La nueva contraseña debe tener al menos 6 caracteres.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Supabase no está configurado. Revisá el archivo .env.local",
    };
  }

  // First verify the current password by signing in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { success: false, error: "No se pudo obtener el usuario actual." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: "La contraseña actual es incorrecta." };
  }

  // Now update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(
  callback: (user: Awaited<ReturnType<typeof getUser>>) => void
) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}
