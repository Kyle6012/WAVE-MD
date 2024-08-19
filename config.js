const fs = require('fs');
const chalk = require('chalk');
//contact details
global.ownernumber = [process.env.OWNER_NUMBER || "254745247106"],
    global.ownername = process.env.OWNER_NAME || "ꪶ♱ꫂ 𝐵𝐸𝐴𝐿𝑇𝐻 𝐺𝑈𝑌 ⛧",
    global.ytname = "YT: "
global.socialm = "GitHub: Kyle6012"
global.location = "Kenya"

global.botname = process.env.BOTNAME || "WAVE-MD",

    //sticker details
    global.stickername = process.env.STICKER || "bealth guy",
    global.packname = 'Sticker By'
global.author = process.env.AUTHOR || "ꪶ♱ꫂ 𝐵𝐸𝐴𝐿𝑇𝐻 𝐺𝑈𝑌 ⛧",
    //console view/theme
    global.themeemoji = '🎭'
global.wm = "bealthguy"

//theme link
global.link = 'https://bealthguy.netlify.app'

//custom prefix
global.prefa = process.env.PREFIX || ".",

    //false=disable and true=enable
    global.welcome = process.env.WELCOME || "false", //auto welcome
    global.autoRecording = false //auto recording
global.autoTyping = false //auto typing
global.autorecordtype = false //auto typing + recording
global.autoread = false //auto read messages
global.autobio = true //auto update bio
global.anti212 = true //auto block +212
global.autoread_status = true



//reply messages
global.mess = {
    done: ' *Here you go !* ',
    prem: ' *Dawg, this feature is reserved for premium users only*',
    admin: '*Dude , this feature is reserved for admins only*',
    botAdmin: ' *This feature can only be used when the bot is a group admin* ',
    owner: '*This feature is reserved for the owner only*',
    group: '*This feature is exclusively for groups*',
    private: '*This feature is exclusively for private chats*',
    wait: '*in process...* ',
    error: ' *Dude , there seems to be an error!*',
}

module.exports = {
    ownernumber: global.ownernumber,
    ownername: global.ownername,
    sessionId: process.env.id,
    AUTO_BLOCK: process.env.PM_BLOCKER,
    STATUS_SAVER: "true",
    ANTI_BOT: "true",
}


global.thumb = fs.readFileSync('./src/themes/ch2.jpg')

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update'${__filename}'`))
    delete require.cache[file]
    require(file)
})