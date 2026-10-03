const requireAuth = (req, res, next) => {
    const userCookie = req.cookies.userSession;
    if (!userCookie) {
        return res.redirect('/');
    }
    req.user = JSON.parse(userCookie);
    next();
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).send('Akses Ditolak: Anda bukan Admin.');
    }
};

module.exports = { requireAuth, requireAdmin };
