require('./Config')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const moment = require('moment-timezone');
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const Config = require("./Config")
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./src/lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./src/lib/myfunc.js')
const { default: WaveConnect, delay, PHONENUMBER_MCC, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, getAggregateVotesInPollMessage, jidDecode, proto, Browsers } = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")

const prefix = global.prefa || "." 

const makeWASocket = require("@whiskeysockets/baileys").default

const store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
})

let phoneNumber = "254745247106"
let owner = JSON.parse(fs.readFileSync('./src/database/owner.json'))

const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startWave() {
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache() // for retry message, "waiting message"
    const Wave = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode, // popping up QR in terminal log
        mobile: useMobile, // mobile api (prone to bans)
        browser: Browsers.ubuntu('Chrome'), // for this issues https://github.com/WhiskeySockets/Baileys/issues/328
        auth: state,
        markOnlineOnConnect: true, // set false for offline
        generateHighQualityLinkPreview: true, // make high preview link
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg.message || ""
        },
        msgRetryCounterCache, // Resolve waiting messages
        defaultQueryTimeoutMs: undefined, // for this issues https://github.com/WhiskeySockets/Baileys/issues/276
    })

    store.bind(Wave.ev)

    if (pairingCode && !Wave.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        if (!!phoneNumber) {
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

            if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
                console.log(chalk.bgBlack(chalk.redBright("Start with country code of your WhatsApp Number, Example: +254745247106")))
                process.exit(0)
            }
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Your WhatsApp bot number\nFor example: +254745247106: `)))
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

            if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
                console.log(chalk.bgBlack(chalk.redBright("Start with country code of your WhatsApp Number, Example: +254745247106")))

                phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Your WhatsApp bot number please\nFor example: +254745247106: `)))
                phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
            }
        }

        setTimeout(async () => {
            let code = await Wave.requestPairingCode(phoneNumber)
            code = code?.match(/.{1,4}/g)?.join("-") || code
            console.log(chalk.black(chalk.bgGreen(`Your Pairing Code: `)), chalk.black(chalk.white(code)))
            rl.close()
        }, 3000)
    }

    Wave.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
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
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await Wave.getName(i + '@s.whatsapp.net')}\nFN:${await Wave.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nitem2.EMAIL;type=INTERNET:bealthguy@proton.me\nitem2.X-ABLabel:Email\nitem3.URL:https://instagram.com/bealthguy\nitem3.X-ABLabel:Instagram\nitem4.ADR:;;Kenya;;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
            })
        }
        Wave.sendMessage(jid, { contacts: { displayName: global.ownername, contacts: list }, ...opts }, { quoted })
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
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === Wave.decodeJid(Wave.user.id) ?
            Wave.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    Wave.public = true

    Wave.serializeM = (m) => smsg(Wave, m, store)

    Wave.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            console.log(chalk.green('Welcome to Wave-MD'));
            console.log(chalk.gray('\n\nLOADING...'));
            console.log(chalk.cyan('\n\nConnected'));

            Wave.sendMessage(Wave.user.id, {
                text: `WAVE-MD CONNECTED

ᴘʀᴇꜰɪx: [ ${prefix} ]\n
ᴄᴏᴍᴍᴀɴᴅꜱ: 246\n
ᴠᴇʀꜱɪᴏɴ: 4.2.3\n
ꜰʀᴀᴍᴇᴡᴏʀᴋ: ʙᴀɪʟᴇʏꜱ\n
ᴘʟᴀᴛꜰᴏʀᴍ: ᴍᴅ\neɴᴊᴏʏ!\n`,
            });
        }
        if (connection === "close") {
            lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                ? startWave()
                : console.log(chalk.bgBlack(chalk.redBright("WaMD connection has been logged out...")))
        }
    })

    Wave.ev.on("creds.update", saveCreds)

    Wave.reply = (jid, text = "", quoted, options) => {
        return Buffer.isBuffer(text) ? Wave.sendMessage(jid, {
            ...options,
            quoted,
            image: text
        }, {
            quoted,
            ...options
        }) : Wave.sendMessage(jid, {
            text: text,
            ...options
        }, {
            quoted,
            ...options
        })
    }

    Wave.ws.on('CB:call', async (json) => {
        let m = json.content[0]
        let from = m.attrs['call-creator']
        if (m.tag == 'offer') {
            let a = await Wave.sendContact(from, global.owner, m)
            await Wave.reply(from, `Automated Block System!\nDon't Call Bot!\nChat Owner If Urgent!`, a)
            await sleep(8000)
            await Wave.updateBlockStatus(from, "block")
        }
    })

    Wave.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        let mime = ""
        let res = await axios.head(url)
        mime = res.headers['content-type']
        if (mime.split("/")[1] === "gif") {
            return Wave.sendMessage(jid, {
                video: await getBuffer(url),
                caption: caption,
                gifPlayback: true,
                ...options
            }, {
                quoted: quoted,
                ...options
            })
        }
        let type = mime.split("/")[0] + "Message"
        if (mime === "application/pdf") {
            return Wave.sendMessage(jid, {
                document: await getBuffer(url),
                mimetype: mime,
                caption: caption,
                ...options
            }, {
                quoted: quoted,
                ...options
            })
        }
        if (mime.split("/")[0] === "image") {
            return Wave.sendMessage(jid, {
                image: await getBuffer(url),
                caption: caption,
                ...options
            }, {
                quoted: quoted,
                ...options
            })
        }
        if (mime.split("/")[0] === "video") {
            return Wave.sendMessage(jid, {
                video: await getBuffer(url),
                caption: caption,
                mimetype: mime,
                ...options
            }, {
                quoted: quoted,
                ...options
            })
        }
        if (mime.split("/")[0] === "audio") {
            return Wave.sendMessage(jid, {
                audio: await getBuffer(url),
                mimetype: mime,
                ...options
            }, {
                quoted: quoted,
                ...options
            })
        }
    }
}

startWave()

process.on("uncaughtException", console.error)
