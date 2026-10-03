const supabase = require('../config/supabase');

const handleLogin = async (req, res) => {
    const { email, password } = req.body;

    // Cek kecocokan data di tabel 'users' Supabase
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

    if (error || !user) {
        return res.send('Login Gagal: Email atau password salah.');
    }

    // Simpan ke cookie (tahan 1 hari)
    const userData = { id: user.id, email: user.email, role: user.role };
    res.cookie('userSession', JSON.stringify(userData), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    // Redirect berdasarkan Role
    if (user.role === 'Admin') {
        res.redirect('/admin/piutang');
    } else {
        res.redirect('/user/beranda');
    }
};

const handleLogout = (req, res) => {
    res.clearCookie('userSession');
    res.redirect('/');
};

module.exports = { handleLogin, handleLogout };
