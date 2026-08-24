const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  proto
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// State
let sock = null;
let qrCodeDataUrl = null;
let rawQrCode = null;
let connectionState = 'DISCONNECTED'; // 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTING' | 'CONNECTED'
let connectedUser = null;
let isSimulationMode = false;

const AUTH_FOLDER = path.join(__dirname, 'auth_info_baileys');
const logger = pino({ level: 'silent' });

async function startWhatsApp() {
  try {
    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    connectionState = 'CONNECTING';

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: ['CarpenterBullet CRM', 'Chrome', '120.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        rawQrCode = qr;
        try {
          qrCodeDataUrl = await qrcode.toDataURL(qr, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 320,
            color: {
              dark: '#052e16',
              light: '#ffffff'
            }
          });
          connectionState = 'SCAN_QR';
          console.log('[WhatsApp Gateway] New QR code generated.');
        } catch (err) {
          console.error('[WhatsApp Gateway] Failed to generate QR Data URL:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp Gateway] Connection closed. Reason: ${statusCode}, shouldReconnect: ${shouldReconnect}`);
        
        connectionState = 'DISCONNECTED';
        qrCodeDataUrl = null;
        rawQrCode = null;
        connectedUser = null;

        if (statusCode === DisconnectReason.loggedOut) {
          cleanAuth();
        }

        if (shouldReconnect && !isSimulationMode) {
          setTimeout(() => startWhatsApp(), 3000);
        }
      } else if (connection === 'open') {
        connectionState = 'CONNECTED';
        qrCodeDataUrl = null;
        rawQrCode = null;
        
        const rawJid = sock?.user?.id || '';
        const phone = rawJid.split(':')[0] || rawJid.split('@')[0];
        connectedUser = {
          id: rawJid,
          phone: phone,
          name: sock?.user?.name || 'CarpenterBullet User',
        };
        console.log(`[WhatsApp Gateway] Successfully connected as ${phone} (${connectedUser.name})`);
      }
    });

  } catch (error) {
    console.error('[WhatsApp Gateway] Error initializing socket:', error);
    connectionState = 'DISCONNECTED';
  }
}

function cleanAuth() {
  try {
    if (fs.existsSync(AUTH_FOLDER)) {
      fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('[WhatsApp Gateway] Error cleaning auth folder:', e);
  }
}

function formatJID(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/[^\d]/g, '');
  if (!cleaned) return null;
  // If 10 digits without country code, default to 91 (India) or keep as-is if length >= 11
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return `${cleaned}@s.whatsapp.net`;
}

// ----------------- API ROUTES ----------------- //

// 1. Status & QR
app.get('/status', (req, res) => {
  res.json({
    status: connectionState,
    isConnected: connectionState === 'CONNECTED',
    qrCode: qrCodeDataUrl,
    rawQr: rawQrCode,
    user: connectedUser,
    isSimulationMode: isSimulationMode,
    timestamp: new Date().toISOString()
  });
});

// 2. Send Single Message
app.post('/send-message', async (req, res) => {
  const { phone, message, mediaUrl, mediaType } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'Phone and message are required.' });
  }

  // If in simulated demo mode
  if (isSimulationMode) {
    return res.json({
      success: true,
      simulated: true,
      messageId: `SIM_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      to: phone,
      timestamp: new Date().toISOString()
    });
  }

  if (connectionState !== 'CONNECTED' || !sock) {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp is not connected. Please scan the QR code first.'
    });
  }

  const jid = formatJID(phone);
  if (!jid) {
    return res.status(400).json({ success: false, error: `Invalid phone number format: ${phone}` });
  }

  try {
    let result;

    if (mediaUrl) {
      if (mediaType === 'image') {
        result = await sock.sendMessage(jid, { image: { url: mediaUrl }, caption: message });
      } else if (mediaType === 'document') {
        result = await sock.sendMessage(jid, { document: { url: mediaUrl }, caption: message, fileName: 'document.pdf' });
      } else {
        result = await sock.sendMessage(jid, { text: message });
      }
    } else {
      result = await sock.sendMessage(jid, { text: message });
    }

    const messageId = result?.key?.id || `MSG_${Date.now()}`;
    return res.json({
      success: true,
      messageId,
      to: phone,
      jid,
      status: 'SENT',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[WhatsApp Gateway] Failed to send message to ${phone}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
      phone
    });
  }
});

// 3. Disconnect / Logout
app.post('/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
      sock = null;
    }
    cleanAuth();
    connectionState = 'DISCONNECTED';
    qrCodeDataUrl = null;
    connectedUser = null;
    isSimulationMode = false;

    // Restart socket to offer fresh QR
    setTimeout(() => startWhatsApp(), 1500);

    res.json({ success: true, message: 'Disconnected successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Force Restart Socket
app.post('/restart', async (req, res) => {
  try {
    if (sock) {
      sock.end(undefined);
      sock = null;
    }
    await startWhatsApp();
    res.json({ success: true, message: 'Restarting WhatsApp socket...' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Toggle Simulation Mode (for immediate testing without scanning physical device)
app.post('/toggle-simulation', (req, res) => {
  const { enable, phone, name } = req.body;
  isSimulationMode = enable !== undefined ? enable : !isSimulationMode;

  if (isSimulationMode) {
    connectionState = 'CONNECTED';
    connectedUser = {
      id: `${phone || '919876543210'}@s.whatsapp.net`,
      phone: phone || '919876543210',
      name: name || 'CarpenterBullet Demo WhatsApp',
    };
    qrCodeDataUrl = null;
  } else {
    connectionState = 'DISCONNECTED';
    connectedUser = null;
    startWhatsApp();
  }

  res.json({
    success: true,
    isSimulationMode,
    status: connectionState,
    user: connectedUser
  });
});

// Start Gateway
startWhatsApp();

app.listen(PORT, () => {
  console.log(`🚀 [WhatsApp Gateway] Running on http://localhost:${PORT}`);
});
