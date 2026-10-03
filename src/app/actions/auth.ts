'use server';

import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserSession } from '@/types';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email dan kata sandi wajib diisi.' };
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !user) {
    return { error: 'Email atau password salah.' };
  }

  // Set user session in cookies (Expires in 1 day)
  const userData: UserSession = {
    id: user.id,
    email: user.email,
    store_name: user.store_name,
    owner_name: user.owner_name,
    phone_number: user.phone_number,
  };
  
  const cookieStore = await cookies();
  cookieStore.set('userSession', JSON.stringify(userData), { 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 
  });

  redirect('/dashboard');
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const store_name = formData.get('store_name') as string;
  const owner_name = formData.get('owner_name') as string;
  const phone_number = formData.get('phone_number') as string;

  if (!email || !password || !store_name || !owner_name) {
    return { error: 'Semua kolom bertanda bintang wajib diisi.' };
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return { error: 'Email sudah terdaftar.' };
  }

  // Insert new user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert([
      { email, password, store_name, owner_name, phone_number }
    ])
    .select()
    .single();

  if (error || !newUser) {
    console.error('Supabase Insert Error:', error);
    return { error: error?.message || 'Terjadi kesalahan saat mendaftar.' };
  }

  // Auto login
  const userData: UserSession = {
    id: newUser.id,
    email: newUser.email,
    store_name: newUser.store_name,
    owner_name: newUser.owner_name,
    phone_number: newUser.phone_number,
  };
  
  const cookieStore = await cookies();
  cookieStore.set('userSession', JSON.stringify(userData), { 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 
  });

  redirect('/dashboard');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('userSession');
  redirect('/login');
}
