import { supabase } from './supabase'

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
