'use server'

import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData) {
  const email = formData.get('email');
  const password = formData.get('password');

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
  const userData = {
    id: user.id,
    email: user.email,
    store_name: user.store_name,
    owner_name: user.owner_name
  };
  
  cookies().set('userSession', JSON.stringify(userData), { 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 
  });

  redirect('/dashboard');
}

export async function register(formData) {
  const email = formData.get('email');
  const password = formData.get('password');
  const store_name = formData.get('store_name');
  const owner_name = formData.get('owner_name');
  const phone_number = formData.get('phone_number');

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
    return { error: 'Terjadi kesalahan saat mendaftar.' };
  }

  // Auto login
  const userData = {
    id: newUser.id,
    email: newUser.email,
    store_name: newUser.store_name,
    owner_name: newUser.owner_name
  };
  
  cookies().set('userSession', JSON.stringify(userData), { 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 
  });

  redirect('/dashboard');
}

export async function logout() {
  cookies().delete('userSession');
  redirect('/login');
}
