const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const pino = require('pino');
const { useMultiFileAuthState, fetchLatestBaileysVersion, makeWASocket, Browsers, jidNormalizedUser } = require('@whiskeysockets/baileys');
const NodeCache = require('node-cache');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let phoneNumber = '';

async function startWave(phoneNumber, res) {
    let { version, isLatest } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    const msgRetryCounterCache = new NodeCache();

    const Wave = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        auth: state,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid);
            let msg = await store.loadMessage(jid, key.id);
            return msg.message || "";
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    });

    if (!phoneNumber) {
        console.log("Phone number not provided.");
        return;
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    setTimeout(async () => {
        let code = await Wave.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(`Your Pairing Code: ${code}`);
        res.json({ pairingCode: code });
    }, 3000);
}

app.post('/generate-pairing-code', (req, res) => {
    phoneNumber = req.body.phoneNumber;
    startWave(phoneNumber, res);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
