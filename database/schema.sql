-- Salin dan jalankan script ini di SQL Editor Supabase Anda

-- Membuat tabel 'users' untuk mengelola login dan role
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT auth.uid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Catatan: Di produksi nyata gunakan hashing (seperti bcrypt), namun untuk hackathon ini pakai teks biasa agar mudah
    role TEXT NOT NULL CHECK (role IN ('Admin', 'User')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan Row Level Security (opsional tapi disarankan)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Insert data dummy untuk percobaan Login
INSERT INTO public.users (email, password, role) VALUES 
('admin@warung.com', 'admin123', 'Admin'),
('kasir@warung.com', 'kasir123', 'User');
