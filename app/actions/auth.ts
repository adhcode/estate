// app/actions/auth.ts
import { SupabaseClient, AuthError } from '@supabase/supabase-js';

// Sign up a new resident
export async function signUp(supabase: SupabaseClient, email: string, password: string, fullName: string) {
  const { data, error }: { data: { user: any } | null; error: AuthError | null } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { user: null, error }; // Return error if sign-up fails
  }

  // Insert user into the users table with role 'resident'
  const { error: insertError } = await supabase
    .from('users')
    .insert([{ id: data.user.id, email, full_name: fullName, role: 'resident' }]);

  if (insertError) {
    return { user: null, error: insertError }; // Return error if insertion fails
  }

  return { user: data.user, error: null }; // Return user on success
}

// Sign in an existing user
export async function signIn(supabase: SupabaseClient, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { session: null, error }; // Match Supabase's structure
  }

  return { session: data.session, error: null }; // Return the session
}

// Sign out the current user
export async function signOut(supabase: SupabaseClient) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return error; // Return error if sign-out fails
  }

  return null; // Return null on success
}

// Get the current session
export async function getSession(supabase: SupabaseClient) {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    return { session: null, error }; // Return error if session retrieval fails
  }

  return { session, error: null }; // Return session on success
}

// Get the user role by user ID
export async function getUserRole(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single(); // Fetch a single user role

  if (error) {
    return null; // Return null if there's an error
  }

  return data.role; // Return the user role
}
