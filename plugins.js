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
const { default: WaveConnect, delay, PHONENUMBER_MCC, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore,getAggregateVotesInPollMessage, jidDecode, proto, Browsers } = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const Pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")

const prefix = global.prefa || "." 

const makeWASocket = 
require("@whiskeysockets/baileys").default

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
//------------------------------------------------------
let { version, isLatest } = await fetchLatestBaileysVersion()
const {  state, saveCreds } =await useMultiFileAuthState(`./session`)
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

    // login use pairing code
   // source code https://github.com/WhiskeySockets/Baileys/blob/master/Example/example.ts#L61
   if (pairingCode && !Wave.authState.creds.registered) {
      if (useMobile) throw new Error('Cannot use pairing code with mobile api')

      let phoneNumber
      if (!!phoneNumber) {
         phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

         if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
            console.log(chalk.bgBlack(chalk.redBright("Start with country code of your WhatsApp Number, Example : +254745247106")))
            process.exit(0)
         }
      } else {
         phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Your WhatsApp bot number\nFor example: +254745247106 : `)))
         phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

         // Ask again when entering the wrong number
         if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
            console.log(chalk.bgBlack(chalk.redBright("Start with country code of your WhatsApp Number, Example : +254745247106")))

            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Your WhatsApp bot number please\nFor example: +254745247106: `)))
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
           
         }
      }

      setTimeout(async () => {
         let code = await Wave.requestPairingCode(phoneNumber)
         code = code?.match(/.{1,4}/g)?.join("-") || code
         console.log(chalk.black(chalk.bgGreen(`Your Pairing Code: `)), chalk.black(chalk.white(code)))
         rl.close();
      }, 3000)
   }

    Wave.ev.on('messages.upsert', async chatUpdate => {
        //console.log(JSON.stringify(chatUpdate, undefined, 2))
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast'){
            if (autoread_status) {
            await Wave.readMessages([mek.key]) 
            }
            } 
            if (!Wave.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            const m = smsg(Wave, mek, store)
            require("./Heart")(Wave, m, chatUpdate, store)
        } catch (err) {
            console.log(err)
        }
    })

   Wave.sendContact = async (jid, kon, quoted = '', opts = {}) => {
	let list = []
	for (let i of kon) {
	    list.push({
	    	displayName: await Wave.getName(i + '@s.whatsapp.net'),
	    	vcard: `BEGIN:VCARD\nVERSION:2.0\nN:${await Wave.getName(i + '@s.whatsapp.net')}\nFN:${await Wave.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nitem2.EMAIL;type=INTERNET:bealthguy@proton.me\nitem2.X-ABLabel:Email\nitem3.URL:https://instagram.com/bealth.guy\nitem3.X-ABLabel:Instagram\nitem4.ADR:;;Indefinite;;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
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

Wave.ev.on("connection.update",async  (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
console.log(chalk.green('Welcome to Wave-md'));
console.log(chalk.gray('\n\nStarting...'));
            
console.log(chalk.cyan('\n\nConnected'));

Wave.sendMessage(Wave.user.id, {
    text: `ᴍᴀʀɪᴀ-ᴍᴅ ᴄᴏɴɴᴇᴄᴛᴇᴅ 

ᴘʀᴇꜰɪx: [ ${prefix} ]\n
ᴄᴏᴍᴍᴀɴᴅꜱ: 262\n
ᴠᴇʀꜱɪᴏɴ: 2.0.0\n
ᴄʀᴇᴀᴛᴏʀ: Bealth Guy\n
_ᴛʏᴘᴇ ${prefix}ᴀʟɪᴠᴇ `
});


const rainbowColors = ['red', 'yellow', 'green', 'blue', 'purple'];
let index = 0;

function printRainbowMessage() {
  const color = rainbowColors[index];
  console.log(chalk.keyword(color)('\n\nwaiting for messages'));
  index = (index + 1) % rainbowColors.length;
  setTimeout(printRainbowMessage, 60000);  // Adjust the timeout for desired speed
}

printRainbowMessage();
}
    
        
                if (
            connection === "close" &&
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output.statusCode != 401
        ) {
            startWave()
        }
    })
    Wave.ev.on('creds.update', saveCreds)
    Wave.ev.on("messages.upsert",  () => { })

    Wave.sendText = (jid, text, quoted = '', options) => Wave.sendMessage(jid, {
        text: text,
        ...options
    }, {
        quoted,
        ...options
    })
    Wave.sendTextWithMentions = async (jid, text, quoted, options = {}) => Wave.sendMessage(jid, {
        text: text,
        mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'),
        ...options
    }, {
        quoted
    })
    
     async function appenTextMessage(text, chatUpdate) {
        let messages = await generateWAMessage(m?.chat, { text: text, mentions: m?.mentionedJid }, {
            userJid: Wave.user.id,
            quoted:m?.quoted && m?.quoted.fakeObj
        })
        messages.key.fromMe = areJidsSameUser(m?.sender, Wave.user.id)
        messages.key.id = m?.key.id
        messages.pushName = m?.pushName
        if (m?.isGroup) messages.participant = m?.sender
        let msg = {
            ...chatUpdate,
            messages: [proto.WebMessageInfo.fromObject(messages)],
            type: 'append'}
Wave.ev.emit('messages.upsert', msg)}       

    Wave.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options)
        } else {
            buffer = await imageToWebp(buff)
        }

        await Wave.sendMessage(jid, {
            sticker: {
                url: buffer
            },
            ...options
        }, {
            quoted
        })
        return buffer
    }
    Wave.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options)
        } else {
            buffer = await videoToWebp(buff)
        }

        await Wave.sendMessage(jid, {
            sticker: {
                url: buffer
            },
            ...options
        }, {
            quoted
        })
        return buffer
    }
    Wave.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        // save to file
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }
    //////
async function getMessage(key){
        if (store) {
            const msg = await store.loadMessage(key.remoteJid, key.id)
            return msg?.message
        }
        return {
            conversation: "Wave Bot Here!"
        }
    }
    Wave.ev.on('messages.update', async chatUpdate => {
        for(const { key, update } of chatUpdate) {
			if(update.pollUpdates && key.fromMe) {
				const pollCreation = await getMessage(key)
				if(pollCreation) {
				    const pollUpdate = await getAggregateVotesInPollMessage({
							message: pollCreation,
							pollUpdates: update.pollUpdates,
						})
	                var toCmd = pollUpdate.filter(v => v.voters.length !== 0)[0]?.name
	                if (toCmd == undefined) return
                    var prefCmd = xprefix+toCmd
	                Wave.appenTextMessage(prefCmd, chatUpdate)
				}
			}
		}
    })



Wave.sendPoll = (jid, name = '', values = [], selectableCount = 1) => {
    return Wave.sendMessage(jid, { poll: { name, values, selectableCount } });
}
//welcome
Wave.ev.on('group-participants.update', async (anu) => {
    	if (global.welcome){
console.log(anu)
try {
let metadata = await Wave.groupMetadata(anu.id)
let participants = anu.participants
for (let num of participants) {
try {
ppuser = await Wave.profilePictureUrl(num, 'image')
} catch (err) {
ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60'
}
try {
ppgroup = await Wave.profilePictureUrl(anu.id, 'image')
} catch (err) {
ppgroup = 'https://i.ibb.co/RBx5SQC/avatar-group-large-v2.png?q=60'
}
	
memb = metadata.participants.length
WaveWlcm = await getBuffer(ppuser)
WaveLft = await getBuffer(ppuser)
                if (anu.action == 'add') {
                const Wavebuffer = await getBuffer(ppuser)
                let WaveName = num
                const xtime = moment.tz('Asia/Kolkata').format('HH:mm:ss')
	            const xdate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY')
	            const xmembers = metadata.participants.length
Wavebody = `┌──⊰ 𝑾𝑬𝑳𝑪𝑶𝑴𝑬
│⊳  🌐 To: ${metadata.subject}
│⊳  📋 Name: @${WaveName.split("@")[0]}
│⊳  👥 Members: ${xmembers}th
│⊳  🕰️ Joined: ${xtime} ${xdate}
└──────────⊰`
Wave.sendMessage(anu.id,
 { text: Wavebody,
 contextInfo:{
 mentionedJid:[num],
 "externalAdReply": {"showAdAttribution": true,
 "containsAutoReply": true,
 "title": ` ${global.botname}`,
"body": `${ownername}`,
 "previewType": "PHOTO",
"thumbnailUrl": ``,
"thumbnail": WaveWlcm,
"sourceUrl": `${link}`}}})
                } else if (anu.action == 'remove') {
                	const Wavebuffer = await getBuffer(ppuser)
                    const Wavetime = moment.tz('Asia/Kolkata').format('HH:mm:ss')
	                const Wavedate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY')
                	let WaveName = num
                    const Wavemembers = metadata.participants.length  
     Wavebody = `┌── 𝑭𝑨𝑹𝑬𝑾𝑬𝑳𝑳
│⊳  👤 From: ${metadata.subject}
│⊳  📃 Reason: Left
│⊳  📔 Name: @${WaveName.split("@")[0]}
│⊳  👥 Members: ${Wavemembers}th
│⊳  🕒 Time: ${Wavetime} ${Wavedate}
└──────────⊰`
Wave.sendMessage(anu.id,
 { text: Wavebody,
 contextInfo:{
 mentionedJid:[num],
 "externalAdReply": {"showAdAttribution": true,
 "containsAutoReply": true,
 "title": ` ${global.botname}`,
"body": `${ownername}`,
 "previewType": "PHOTO",
"thumbnailUrl": ``,
"thumbnail": WaveLft,
"sourceUrl": `${link}`}}})
}
}
} catch (err) {
console.log(err)
}
}
})
    Wave.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        return buffer
    }
    }
return startWave()

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})

process.on('uncaughtException', function (err) {
let e = String(err)
if (e.includes("Socket connection timeout")) return
if (e.includes("item-not-found")) return
if (e.includes("rate-overlimit")) return
if (e.includes("Connection Closed")) return
if (e.includes("Timed Out")) return
if (e.includes("Value not found")) return
console.log('Caught exception: ', err)
})
