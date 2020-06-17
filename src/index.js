const puppeteer = require('puppeteer');
const { Telegraf } = require('telegraf')

require('dotenv').config();
let lastTest = {};
let finito = false;
const bot = new Telegraf(process.env.BOT_TOKEN)

async function doUrl(url) {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage();

    while (true) {
        if (finito) {
            browser.close()
            return;
        }


        await page.goto(url);

        //LOGIN
        if (page.url().indexOf("idp.unitn.it/idp/profile/SAML2") >= 0) {
            let iid = Math.random()
            sendMessage("LOGGANDO" + iid);

            await sleep(400);
            page.type("input#clid.form-control", 'nicola.toscan');
            await sleep(400);
            page.type("input#inputPassword", process.env.PASSWORD);
            await sleep(400);
            page.click("#btnAccedi")
            await sleep(400);

            while (page.url().indexOf("esse3.unitn.it/auth/studente/Appelli") < 0) {
                await sleep(300);
                await page.waitForNavigation({ waitUntil: 'networkidle0' })
            }
            sendMessage("LOGGATO" + iid);
        }


        //CLICCA
        page.click("#btnSalva");
        while (page.url().indexOf("esse3.unitn.it/auth/studente/Appelli/EffettuaPrenotazioneAppello") < 0) {
            await sleep(300);
            await page.waitForNavigation({ waitUntil: 'networkidle0' })
        }

        const element = await page.$("#app-text_esito_pren_msg");
        const text = await page.evaluate(element => element.textContent, element);
        if (text.indexOf("PRENOTAZIONE NON EFFETTUATA") < 0) {
            sendMessage("FATTO");
            finito = true;
        }
        lastTest[url] = new Date();
        console.log("TENTATIVO FATTO");
        await sleep(7000);

    }

};


function sleep(d) {
    return new Promise(r => setTimeout(r, d));
}

function sendMessage(text) {
    console.log(text);
    try {
        bot.telegram.sendMessage(process.env.CHAT_ID, text);
    } catch (err) {
        console.log(err);
    }
}

bot.on("message", (ctx) => ctx.reply("Last test:\n" + Object.keys(lastTest).map(k => lastTest[k]).join("\n")))
bot.launch();

(async () => {
    let esami = process.env.ESAMI_URLS.split(",");
    esami.forEach(e => doUrl(e));
})();