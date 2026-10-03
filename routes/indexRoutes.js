const express = require('express');
const router = express.Router();
const { handleLogin, handleLogout } = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');

// === HALAMAN LOGIN ===
router.get('/', (req, res) => {
    // Jika sudah login, bisa diredirect langsung
    if (req.cookies.userSession) {
        const user = JSON.parse(req.cookies.userSession);
        return user.role === 'Admin' ? res.redirect('/admin/piutang') : res.redirect('/user/beranda');
    }
    res.render('login');
});
router.post('/login', handleLogin);
router.get('/logout', handleLogout);

// === RUTE USER (Butuh Login) ===
router.get('/user/beranda', requireAuth, (req, res) => {
    res.render('user/beranda', { user: req.user });
});
router.get('/user/chat', requireAuth, (req, res) => {
    res.render('user/chat', { user: req.user });
});

// === RUTE ADMIN (Butuh Login & Status Admin) ===
router.get('/admin/piutang', requireAuth, requireAdmin, (req, res) => {
    res.render('admin/piutang', { user: req.user });
});
router.get('/admin/stok', requireAuth, requireAdmin, (req, res) => {
    res.render('admin/stok', { user: req.user });
});

module.exports = router;
