require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Set EJS sebagai Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pembaca isian form dan cookie
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Jadikan folder 'public' sebagai tempat file statis (CSS/JS/Gambar)
app.use(express.static(path.join(__dirname, 'public')));

// Sambungkan rute
const indexRoutes = require('./routes/indexRoutes');
app.use('/', indexRoutes);

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
