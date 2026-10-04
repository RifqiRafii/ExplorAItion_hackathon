const express = require('express');
const cors = require('cors');
const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Akan print QR code di terminal
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            console.log('Koneksi terputus, mencoba menyambung kembali...');
            connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Berhasil Terhubung!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// Endpoint untuk mengirim pesan
app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;

    if (!sock) {
        return res.status(500).json({ error: 'WhatsApp belum terhubung' });
    }

    try {
        // Format nomor HP ke format internasional WA (misal: 628123456789@s.whatsapp.net)
        let formattedPhone = phone;
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
        }
        const jid = formattedPhone + '@s.whatsapp.net';

        await sock.sendMessage(jid, { text: message });
        res.json({ success: true, message: 'Pesan berhasil dikirim!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengirim pesan' });
    }
});

app.listen(3001, () => {
    console.log('🚀 WA Server berjalan di http://localhost:3001');
    connectToWhatsApp();
});
