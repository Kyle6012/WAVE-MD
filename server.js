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

const store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
})

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
Wave.ev.on('messages.upsert', async chatUpdate => {
        //console.log(JSON.stringify(chatUpdate, undefined, 2))
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemera>
            if (mek.key && mek.key.remoteJid === 'status@broadcast'){
            if (autoread_status) {
            await Wave.readMessages([mek.key])
            }
            }
            if (!Wave.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            const m = smsg(Wave, mek, store)
            require("./engine.js")(Wave, m, chatUpdate, store)
        } catch (err) {
            console.log(err)
        }
    })

   Wave.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = []
        for (let i of kon) {
            list.push({
                displayName: await Wave.getName(i + '@s.whatsapp.net'),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await Wave.getName(i + '@s.whatsapp.net')}\nFN:>
            })
        }
        Wave.sendMessage(jid, { contacts: { displayName: global.ownername, contacts: list }, ...opts >
    }

    Wave.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    Wave.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = Wave.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = {
                id,
                name: contact.notify
            }
        }
    })

    Wave.getName = (jid, withoutContact = false) => {
        id = Wave.decodeJid(jid)
        withoutContact = Wave.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = Wave.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNu>
        })
        else v = id === '0@s.whatsapp.net' ? {
                id,
                name: 'WhatsApp'
            } : id === Wave.decodeJid(Wave.user.id) ?
            Wave.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid>
    }

    Wave.public = true

    Wave.serializeM = (m) => smsg(Wave, m, store)
app.post('/generate-pairing-code', (req, res) => {
    phoneNumber = req.body.phoneNumber;
    startWave(phoneNumber, res);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
