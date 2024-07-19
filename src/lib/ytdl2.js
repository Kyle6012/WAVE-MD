const ytdl = require('@distube/ytdl-core');
const yts = require('youtube-yts');
const readline = require('readline');
const ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');
const fs = require('fs');
const { fetchBuffer } = require("./myfunc2");
const ytM = require('node-youtube-music');
const { randomBytes } = require('crypto');
const ytIdRegex = /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/;
const cookies = "__Secure-1PAPISID=ZZOntn7aSXZp6r71%2FA6O56ZdgIbymgW7Fe;" + " __Secure-1PSID=g.a000lQiECUgHv0iidYU863rgu0wcm3iGOvFNOtgWEO6izTHeViCraQe0qA9kClKy7jVUHc7Q6QACgYKAc0SARISFQHGX2MiqT_fxXXVLfMbSO1NFG2XxRoVAUF8yKqt0H7Hxkn9YSRuiV_rhiG40076;" + " __Secure-1PSIDCC=AKEyXzVUjUsXtX3S1UfwPC2QYjZzy6FWvpH9Vt035956eTCTwTweqZ00rgJ2F30eI-fwDtMr;" + " __Secure-1PSIDTS=sidts-CjEB4E2dkSFp91ZR0VDPfFNFb2i7vjE58UnlCQ9zHj1b77_bQHzPzHrj68olS0J6aCmrEAA;" + " __Secure-3PAPISID=ZZOntn7aSXZp6r71%2FA6O56ZdgIbymgW7Fe;" + " __Secure-3PSID=g.a000lQiECUgHv0iidYU863rgu0wcm3iGOvFNOtgWEO6izTHeViCrk2n2zftjIAz5-bumpU_CyAACgYKAdESARISFQHGX2MilBWSpcVW6lmSmMu0Syf_DhoVAUF8yKrWeWTjiofeIIm1OrgjpixF0076;" + " __Secure-3PSIDCC=AKEyXzVhTpvXCWJR-dv3h4OWdJoi1evUse5gZUGMFUHxkEN5bcWVB64BACRG6gBaS8kf_SdBcA;"+ " __Secure-3PSIDTS=sidts-CjEB4E2dkSFp91ZR0VDPfFNFb2i7vjE58UnlCQ9zHj1b77_bQHzPzHrj68olS0J6aCmrEAA;" + " APISID=9naOBNWCKty7ltsS%2FA8lil_Ord1fPUdyIc;" + " HSID=AYh6wvghSVHiGek7A;" + " LOGIN_INFO=AFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%3AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " PREF=tz%3DAfrica.Nairobi%26f5%3D30000%26f7%3D100;" + " SAPISID=ZZOntn7aSXZp6r71%2FA6O56ZdgIbymgW7Fe;" + " SID=g.a000lQiECUgHv0iidYU863rgu0wcm3iGOvFNOtgWEO6izTHeViCrP3VdNSSBLbuONm8Lgttv0QACgYKAZoSARISFQHGX2MiRSZu8koqvtc5zlGf1KRJAhoVAUF8yKp2o9xQhsrKZzrip_w0vtyc0076;" + " SIDCC=AKEyXzW7JhIQzDZBRycY3griz86eHmTKVhzGWQY8VnrpF_bx0KiAjKwZME392GA72ItV_Zc90w;" + " SSID=A63sbrkwvdylCqL0w;" + " ST-183jmdn=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " ST-19abqm4=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " ST-1b=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " ST-3opvp5=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " ST-ajz0dg=itct%3DCG0Q3DAiEwivxPP5jO2GAxWFwUIFHTAhCAcyCmctaGlnaC1yZWNaD0ZFd2hhdF90b193YXRjaJoBBhCOHhieAQ%253D%253D%26csn%3DsFIh5qRdgVIzq75C%26session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3%26endpoint%3D%257B%2522clickTrackingParams%2522%253A%2522CG0Q3DAiEwivxPP5jO2GAxWFwUIFHTAhCAcyCmctaGlnaC1yZWNaD0ZFd2hhdF90b193YXRjaJoBBhCOHhieAQ%253D%253D%2522%252C%2522commandMetadata%2522%253A%257B%2522webCommandMetadata%2522%253A%257B%2522url%2522%253A%2522%252Fwatch%253Fv%253D6A6EC0hD-QQ%2522%252C%2522webPageType%2522%253A%2522WEB_PAGE_TYPE_WATCH%2522%252C%2522rootVe%2522%253A3832%257D%257D%252C%2522watchEndpoint%2522%253A%257B%2522videoId%2522%253A%25226A6EC0hD-QQ%2522%252C%2522watchEndpointSupportedOnesieConfig%2522%253A%257B%2522html5PlaybackOnesieConfig%2522%253A%257B%2522commonConfig%2522%253A%257B%2522url%2522%253A%2522https%253A%252F%252Frr2---sn-vg5obx3x-ocvl.googlevideo.com%252Finitplayback%253Fsource%253Dyoutube%2526oeis%253D1%2526c%253DWEB%2526oad%253D3200%2526ovd%253D3200%2526oaad%253D11000%2526oavd%253D11000%2526ocs%253D700%2526oewis%253D1%2526oputc%253D1%2526ofpcc%253D1%2526siu%253D1%2526msp%253D1%2526odepv%253D1%2526id%253De80e840b4843f904%2526ip%253D102.166.93.200%2526initcwndbps%253D116250%2526mt%253D1718986398%2526oweuc%253D%2522%257D%257D%257D%257D%257D;" + " ST-amrb2j=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " ST-bybo0g=csn%3DsFIh5qRdgVIzq75C%26itct%3DCI8BENwwIhMIr8Tz-YzthgMVhcFCBR0wIQgHMgpnLWhpZ2gtcmVjWg9GRXdoYXRfdG9fd2F0Y2iaAQYQjh4YngE%253D%26endpoint%3D%257B%2522clickTrackingParams%2522%253A%2522CI8BENwwIhMIr8Tz-YzthgMVhcFCBR0wIQgHMgpnLWhpZ2gtcmVjWg9GRXdoYXRfdG9fd2F0Y2iaAQYQjh4YngE%253D%2522%252C%2522commandMetadata%2522%253A%257B%2522webCommandMetadata%2522%253A%257B%2522url%2522%253A%2522%252Fwatch%253Fv%253Dgt3opVXf2no%2522%252C%2522webPageType%2522%253A%2522WEB_PAGE_TYPE_WATCH%2522%252C%2522rootVe%2522%253A3832%257D%257D%252C%2522watchEndpoint%2522%253A%257B%2522videoId%2522%253A%2522gt3opVXf2no%2522%252C%2522watchEndpointSupportedOnesieConfig%2522%253A%257B%2522html5PlaybackOnesieConfig%2522%253A%257B%2522commonConfig%2522%253A%257B%2522url%2522%253A%2522https%253A%252F%252Frr2---sn-vg5obx3x-ocvl.googlevideo.com%252Finitplayback%253Fsource%253Dyoutube%2526oeis%253D1%2526c%253DWEB%2526oad%253D3200%2526ovd%253D3200%2526oaad%253D11000%2526oavd%253D11000%2526ocs%253D700%2526oewis%253D1%2526oputc%253D1%2526ofpcc%253D1%2526siu%253D1%2526msp%253D1%2526odepv%253D1%2526id%253D82dde8a555dfda7a%2526ip%253D102.166.93.200%2526initcwndbps%253D116250%2526mt%253D1718986398%2526oweuc%253D%2522%257D%257D%257D%257D%257D%26session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " ST-mbenfb=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " ST-p3wshz=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " ST-tladcw=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " ST-x6o0hb=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3; ST-xuwub9=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " ST-yve142=session_logininfo%3DAFmmF2swRQIhANL1cRnjLY0yNB_INI6xbihBTVc20vm5ak8cBNQnm4oQAiBVLV060lVk_wysRokRLEBhX9bbOhwZoLA2ytgVAcIHug%253AQUQ3MjNmekhYQUQ1cVhqRWcwN2FMNGlMc01kQ0QybUM4cldtLVlCdXNveHRGU0FJY3E3amxEWWpMdTd5Q08wRUhmbEF0dkp0VnZZX1VKMm1VR0h0MUVFc3dCWXZERHBiSlBQUHVWQjRDRXB4SkY1eG1QdFlIVU5Wc0plZ3BfaktfdHZ4U2JBeWo1ZlQ1X3BFZ3FWaGVVUHpOTEpQcE5tdlp3;" + " VISITOR_INFO1_LIVE=wlw_Ym2snqk;" + " VISITOR_PRIVACY_METADATA=CgJLRRIEGgAgVA%253D%253D;" + " YSC=MHKZHOHbvj8";

class YT {
    constructor() { }

    /**
     * Checks if it is yt link
     * @param {string|URL} url youtube url
     * @returns Returns true if the given YouTube URL.
     */
    static isYTUrl = (url) => {
        return ytIdRegex.test(url);
    }

    /**
     * VideoID from url
     * @param {string|URL} url to get videoID
     * @returns 
     */
    static getVideoID = (url) => {
        if (!this.isYTUrl(url)) throw new Error('is not YouTube URL');
        return ytIdRegex.exec(url)[1];
    }

    /**
     * @typedef {Object} IMetadata
     * @property {string} Title track title
     * @property {string} Artist track Artist
     * @property {string} Image track thumbnail url
     * @property {string} Album track album
     * @property {string} Year track release date
     */

    /**
     * Write Track Tag Metadata
     * @param {string} filePath 
     * @param {IMetadata} Metadata 
     */
    static WriteTags = async (filePath, Metadata) => {
        NodeID3.write(
            {
                title: Metadata.Title,
                artist: Metadata.Artist,
                originalArtist: Metadata.Artist,
                image: {
                    mime: 'jpeg',
                    type: {
                        id: 3,
                        name: 'front cover',
                    },
                    imageBuffer: (await fetchBuffer(Metadata.Image)).buffer,
                    description: `Cover of ${Metadata.Title}`,
                },
                album: Metadata.Album,
                year: Metadata.Year || ''
            },
            filePath
        );
    }

    /**
     * 
     * @param {string} query 
     * @returns 
     */
    static search = async (query, options = {}) => {
        const search = await yts.search({ query, hl: 'id', gl: 'ID', ...options });
        return search.videos;
    }

    /**
     * @typedef {Object} TrackSearchResult
     * @property {boolean} isYtMusic is from YT Music search?
     * @property {string} title music title
     * @property {string} artist music artist
     * @property {string} id YouTube ID
     * @property {string} url YouTube URL
     * @property {string} album music album
     * @property {Object} duration music duration {seconds, label}
     * @property {string} image Cover Art
     */

    /**
     * search track with details
     * @param {string} query 
     * @returns {Promise<TrackSearchResult[]>}
     */
    static searchTrack = (query) => {
        return new Promise(async (resolve, reject) => {
            try {
                let ytMusic = await ytM.searchMusics(query);
                let result = [];
                for (let i = 0; i < ytMusic.length; i++) {
                    result.push({
                        isYtMusic: true,
                        title: `${ytMusic[i].title} - ${ytMusic[i].artists.map(x => x.name).join(' ')}`,
                        artist: ytMusic[i].artists.map(x => x.name).join(' '),
                        id: ytMusic[i].youtubeId,
                        url: 'https://youtu.be/' + ytMusic[i].youtubeId,
                        album: ytMusic[i].album,
                        duration: {
                            seconds: ytMusic[i].duration.totalSeconds,
                            label: ytMusic[i].duration.label
                        },
                        image: ytMusic[i].thumbnailUrl.replace('w120-h120', 'w600-h600')
                    });
                }
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @typedef {Object} MusicResult
     * @property {TrackSearchResult} meta music meta
     * @property {string} path file path
     */

    /**
     * Download music with full tag metadata
     * @param {string|TrackSearchResult[]} query title of track want to download
     * @returns {Promise<MusicResult>} filepath of the result
     */
    static downloadMusic = async (query) => {
        try {
            const getTrack = Array.isArray(query) ? query : await this.searchTrack(query);
            const search = getTrack[0];
            const videoInfo = await ytdl.getInfo('https://www.youtube.com/watch?v=' + search.id, { lang: 'id', requestOptions: { headers: { Cookie: cookies } } });
            let stream = ytdl(search.id, { filter: 'audioonly', quality: 140, requestOptions: { headers: { Cookie: cookies } } });
            let songPath = `./src/audio/${randomBytes(3).toString('hex')}.mp3`;
            stream.on('error', (err) => console.log(err));

            const file = await new Promise((resolve) => {
                ffmpeg(stream)
                    .audioFrequency(44100)
                    .audioChannels(2)
                    .audioBitrate(128)
                    .audioCodec('libmp3lame')
                    .audioQuality(5)
                    .toFormat('mp3')
                    .save(songPath)
                    .on('end', () => resolve(songPath));
            });
            await this.WriteTags(file, { Title: search.title, Artist: search.artist, Image: search.image, Album: search.album, Year: videoInfo.videoDetails.publishDate.split('-')[0] });
            return {
                meta: search,
                path: file,
                size: fs.statSync(songPath).size
            };
        } catch (error) {
            throw new Error(error);
        }
    }

    /**
     * get downloadable video urls
     * @param {string|URL} query videoID or YouTube URL
     * @param {string} quality 
     * @returns
     */
    static mp4 = async (query, quality = 134) => {
        try {
            if (!query) throw new Error('Video ID or YouTube Url is required');
            const videoId = this.isYTUrl(query) ? this.getVideoID(query) : query;
            const videoInfo = await ytdl.getInfo('https://www.youtube.com/watch?v=' + videoId, { lang: 'id', requestOptions: { headers: { Cookie: cookies } } });
            const format = ytdl.chooseFormat(videoInfo.formats, { format: quality, filter: 'videoandaudio' });
            return {
                title: videoInfo.videoDetails.title,
                thumb: videoInfo.videoDetails.thumbnails.slice(-1)[0],
                date: videoInfo.videoDetails.publishDate,
                duration: videoInfo.videoDetails.lengthSeconds,
                channel: videoInfo.videoDetails.ownerChannelName,
                quality: format.qualityLabel,
                contentLength: format.contentLength,
                description: videoInfo.videoDetails.description,
                videoUrl: format.url
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Download YouTube to mp3
     * @param {string|URL} url YouTube link want to download to mp3
     * @param {IMetadata} metadata track metadata
     * @param {boolean} autoWriteTags if set true, it will auto write tags meta following the YouTube info
     * @returns 
     */
    static mp3 = async (url, metadata = {}, autoWriteTags = false) => {
        try {
            if (!url) throw new Error('Video ID or YouTube Url is required');
            url = this.isYTUrl(url) ? 'https://www.youtube.com/watch?v=' + this.getVideoID(url) : url;
            const { videoDetails } = await ytdl.getInfo(url, { lang: 'id', requestOptions: { headers: { Cookie: cookies } } });
            let stream = ytdl(url, { filter: 'audioonly', quality: 140, requestOptions: { headers: { Cookie: cookies } } });
            let songPath = `./src/audio/${randomBytes(3).toString('hex')}.mp3`;

            let starttime;
            stream.once('response', () => {
                starttime = Date.now();
            });
            stream.on('progress', (chunkLength, downloaded, total) => {
                const percent = downloaded / total;
                const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
                const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
                process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
                process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
                process.stdout.write(`, estimated time left: ${estimatedDownloadTime.toFixed(2)}minutes `);
                readline.moveCursor(process.stdout, 0, -1);
            });
            stream.on('end', () => process.stdout.write('\n\n'));
            stream.on('error', (err) => console.log(err));

            const file = await new Promise((resolve) => {
                ffmpeg(stream)
                    .audioFrequency(44100)
                    .audioChannels(2)
                    .audioBitrate(128)
                    .audioCodec('libmp3lame')
                    .audioQuality(5)
                    .toFormat('mp3')
                    .save(songPath)
                    .on('end', () => {
                        resolve(songPath);
                    });
            });
            if (Object.keys(metadata).length !== 0) {
                await this.WriteTags(file, metadata);
            }
            if (autoWriteTags) {
                await this.WriteTags(file, { Title: videoDetails.title, Album: videoDetails.author.name, Year: videoDetails.publishDate.split('-')[0], Image: videoDetails.thumbnails.slice(-1)[0].url });
            }
            return {
                meta: {
                    title: videoDetails.title,
                    channel: videoDetails.author.name,
                    seconds: videoDetails.lengthSeconds,
                    image: videoDetails.thumbnails.slice(-1)[0].url
                },
                path: file,
                size: fs.statSync(songPath).size
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = YT;
