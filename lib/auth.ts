import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: 'reclutador' | 'administrador';
}

export async function signUp(email: string, password: string, nombre: string) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // TODO: Insert into usuarios table when table is created
    // For now, just create the auth user
    // User data can be stored in auth.user.user_metadata

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('SignUp error:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, user: data.user };
  } catch (error) {
    console.error('SignIn error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('SignOut error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('GetCurrentUser error:', error);
    return null;
  }
}

export async function getUserProfile(userId: string): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetUserProfile error:', error);
    return null;
  }
}
