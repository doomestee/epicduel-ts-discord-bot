import { request } from "undici";
import { find, map } from "../util/Misc.js";
import { JSDOM } from "jsdom";
import Logger from "./logger.js";
import DNExecutor from "../util/DNExecutor.js";
import type Hydra from "./discord.js";

export interface DesignNote {
    date: string;
    title: string;
    poster: { name: string, image: string };
    post: { billboard: [string, string][], link: string };
    tags: string[];
    fields: [string, string][]
}

/**
 * As in, this will take an image link from artix.com site, and remove the ?abc=etc so the image will be in its raw form.
 */
function replaceArtixLinkTag(str: string) {
    return str.replace(/(jpg|jpeg|png)\?.+/gi, "$1");
}

export function replaceHTMLbits(text: string, images?: [string, string][], h2: string ="empty", linkIdentifier="ArtixPost") {
    return text.trim()
        .replace(/<strong>|<\/strong>/gi, "**")
        .replace(/<strong [^>]*>/gi, "**")
        .replace(/<b>|<\/b>/gi, "**")
        .replace(/<b [^>]*>/gi, "**")
        .replace(/<i>|<\/i>/gi, "**")
        .replace(/<i [^>]*>/gi, "**")
        .replace(/<em>|<\/em>/gi, "**")
        .replace(/<em [^>]*>/gi, "**")
        .replace(/<del>|<\/del>/gi, "~~")
        .replace(/<del [^>]*>/gi, "~~")
        .replace(/<ins>|<\/ins>/gi, "__")
        .replace(/<ins [^>]*>/gi, "__")
        .replace(/<br>|<\/br>/gi, "\n") /* I don't know why did I prepare in case of </br>... */

        // Cos of NW being inconsistent ass with styling, I have to cover each of the possible thing...

        // Crossed out lines
        .replace(/<(p|span) style=\".{0,}text-decoration: line-through;.{0,}\">(.{1,})<\/span>/gi, "~~$2~~")

        // Anchors
        .replace(/<a href=\"(.{1,})\">(.{1,})<\/a>/gi, (match, href, str) => {
            if (href.startsWith("/")) return `[${str}](<https://www.artix.com${href}>)`;
            else return `[${str}](<${href}>)`;
        })

        // Images

        .replace(/<img src=\"(.{1,})\">(<\/img>)?/gi, (match, src) => {
            if (images === undefined) return match;

            const link = replaceArtixLinkTag((linkIdentifier === "Epicduel" ? '' : "https://artix.com") + src);

            if (images.some(v => v[0] === (h2 ?? "empty") && v[1] === link )) return "";

            images.push([h2 ?? "empty", link]);
            
            // We can't directly embed image into text on discord, hence we have passed in the mutable images array in the first place
            return "";
        })

        .replace(/\&nbsp\;/gi, " ") // although while the code itself is intended to break, its not necessary here so no
        
        .replace(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g, "") /* This must be executed after everything else, just in case there isn't something else that is so kind... */;
}

function htmlLiTagConvert(length=1) {
    if (length == 1) return "●";
    if (length == 2) return "⚬";
    //if (length == 3) return "▪";
    else return "▪".repeat(length-2);
}

function loopText(data: string[], images: [string, string][], h2="empty", linkIdentifier="ArtixPost") {
    //let result = []; // A list of fields
    let parsed:[number, string][] = []; // idk why did i chose this name

    let newlines = 0; // A counter that will increment 

    for (let i = 0, len = data.length; i < len; i++) {
        const text = data[i];

        if (text.includes("<li>")) newlines++;

        if (newlines) {
            let texto = replaceHTMLbits(text, images, h2, linkIdentifier).trim();

            if (texto.length != 0) {
                parsed.push([newlines, texto])
            }
        }

        if (text.includes("</li>")) newlines--;
    }

    return map(parsed, text => htmlLiTagConvert(text[0]) + " " + text[1]).join('\n').trim();//parsed.map(text => (text[0] == 1) ? "- " + text[1] : "=".repeat(text[0] - 1) + "> " + text[1]).join('\n');
}

export default class DesignNoteManager {
    static async extractNote(url: string = "https://www.artix.com/gamelauncher/?id=1141", extra: Partial<{ identifier: "ArtixMain"|"ArtixPost"|"Epicduel"|"ArtixNews" }> = {}) : Promise<{ success: false, text?: string, error: any } | { success: true, result: DesignNote }> {
        let linkIdentifier:"ArtixMain"|"ArtixPost"|"Epicduel"|"ArtixNews" = (extra && extra.identifier) ? extra.identifier : 
            (url === undefined) ? "Epicduel" as "Epicduel" : 
            (['http', 'https'].some(val => url.startsWith(val + '://epicduel.artix.com/gamedesignnotes/'))) ? "Epicduel" as "Epicduel"  :
            (['http', 'https'].some(val => url.startsWith(val + '://www.artix.com/gamelauncher/?id=1141'))) ? "ArtixMain" as "ArtixMain" :
            (['http', 'https'].some(val => url.startsWith(val + '://www.artix.com/posts/')))                ? "ArtixPost" as "ArtixPost" : //null as unknown as "ArtixPost";
            (['http', 'https'].some(val => url.startsWith(val + '://www.artix.com/news/')))                 ? "ArtixNews" as "ArtixNews" : null as unknown as "ArtixNews";

        if (url === undefined) url = 'https://www.artix.com/gamelauncher/?id=1141';
        else if (linkIdentifier === null) throw Error();//return { error: "INVALID_URL", result: null};//!['http', 'https'].some((val) => url.startsWith(val + '://epicduel.artix.com/gamedesignnotes/') || url.startsWith(val + 'https://www.artix.com/gamelauncher/?id=1141') || url.startsWith(val + '://www.artix.com/posts/'))) return { error: "INVALID_URL", result: null};

        try {
            const response = await request(url, { method: "GET", headers: {"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.3" }});
            const text = await response.body.text();

            if ((response.statusCode < 200 || response.statusCode > 300)) return { success: false, text, error: response };

            const { document } = new JSDOM(text).window;

            const result:DesignNote = {
                date: "", // I know, but they won't give us the exact date or anything in number, only something like 'February 31, 1970'
                title: "", // Something like "Reintroduction of Omega!"
                poster: {
                    name: "", // Could be from Titan, or Artix stating that Epicduel is due to shut down.
                    image: "" // yes
                },
                post: {
                    /**
                     * @type {[string, string][]}
                     */
                    billboard: [], // The URL to the image, usually they would have one.
                    link: "", // The URL to the post itself
                }, tags: [], // A list of tags (string).
                fields: [["empty", ""]] // An array of arrays with the first index being the heading and the second being... stuff?
            };

            let elementToExtract: Element;
            let imgSpace: Element;

            switch (linkIdentifier) {
                case "Epicduel":
                    elementToExtract = document.getElementsByTagName("table")[0].children[0].children[0].children[1];
    
                    imgSpace = document.getElementsByTagName("table")[0].children[0].children[0].children[0].children[0].children[0];
    
                    result.poster.name = imgSpace.getAttribute('alt') ?? "N/A";
                    result.poster.image = `https://epicduel.artix.com` + imgSpace.getAttribute('src');
                break;
                case "ArtixMain":
                    let link = 'https' + (document.getElementsByClassName('row data-api-items')[0].children[0].children[0].children[0].children[1].children[0].getAttribute('href') as string).slice(4, -8); /* Wipes off HTTP (so it can become HTTPS) and &view=GL which will otherwise ruin the page. */
    
                    extra['identifier'] = "ArtixPost";
                    return this.extractNote(link, extra);
                    //if (!extra.recent || !extra.recent.artix) return extractNote(link, extra);
    
                    //let posName = document.getElementsByClassName('row data-api-items')[0].children[0].children[0].children[0].children[1].children[0].children[1].textContent.trim();
                    //let notName = document.getElementsByClassName('row data-api-items')[0].children[0].children[0].children[0].children[1].children[1].children[0].textContent.trim();
                    //let notDate = document.getElementsByClassName('row data-api-items')[0].children[0].children[0].children[0].children[1].children[0].children[2].textContent.trim().slice('- '.length);
    
                    // Not matching notes
                    //if (extra.recent.artix.date !== notDate && extra.recent.epicduel.title !== notName) return extractNote(link, extra);
                    //else if
                break;
                case "ArtixPost":
                    elementToExtract = document.getElementsByClassName('container newsPost')[0].children[2].children[0];
    
                    result.poster.name = (document.getElementsByClassName('container newsPost')[0].children[0].children[0].children[2].children[1].textContent as string).trim();
                    result.poster.image = 'https://www.artix.com' + document.getElementsByClassName('container newsPost')[0].children[0].children[0].children[2].children[0].children[0].getAttribute('src');
                    result.date = (document.getElementsByClassName('container newsPost')[0].children[0].children[0].children[2].children[2].textContent as string).slice(2);
                    result.title = (document.getElementsByClassName('container newsPost')[0].children[0].children[0].children[1].textContent as string).trim();
                    result.post.link = url;
                    result.post.billboard.push(["empty", replaceArtixLinkTag(find(Object.values(document.getElementsByTagName('meta')), a => a.getAttribute('property') as string === 'og:image' || a.getAttribute('name') as string === 'twitter:image')?.getAttribute('content') as string)]);
                break;
                case "ArtixNews":
                    const news = Object.values(document.getElementsByClassName("newsblurb"));

                    for (let i = 0, len = news.length; i < len; i++) {
                        const blurb = news[i].children;

                        // This is because sometimes Artix the CEO would make some fucking useless posts but nevertheless
                        // because his ego parallels to Elon Musk, he has to self advertise.
                        // So in case the first newsblurb isn't for ED.

                        // Also I've noticed, and I love it the fact that aq2d posts are http, whereas all others are https.
                        if (blurb[0].getAttribute("href")?.includes("aq2d")) continue;

                        const twat = blurb[1].children[0].children[1].textContent?.trim().toLowerCase() as string;
                        const heading = blurb[1].children[1].textContent?.toLowerCase() as string;
                        const desc = blurb[0].children[2].textContent?.toLowerCase() as string;

                        if (twat !== "nightwraith") {
                            if (heading.includes("aqw") || heading.includes("switch")) continue;
                            if (desc.includes("aqw") || desc.includes("switch")) continue;
                        }

                        extra["identifier"] = "ArtixPost";
                        return this.extractNote(blurb[0].getAttribute("href") as string, extra);
                    }
                    
                    return { success: false, error: "unexpected", text: "lazy." };
                    break;
            }



            //console.log(table.children[3].children);

            //let mode = ""; // This is used for after the continuation of the loop, for example what may it be...? i have no idea
            let h2 = ""; // This is for the title of what the part of code may as well be...
            let h2continuation = 0;

            // This will fetch the poster's... information?

            for (let i = 0; i < elementToExtract.children.length; i++) {
                let child = elementToExtract.children[i];

                if (linkIdentifier === "Epicduel") {
                    let thong = false;

                    switch (i) {
                        case 0:
                            result.date = child.textContent as string;
                            thong = true;
                            break;
                        case 1:
                            result.title = child.textContent as string;
                            result.post.link = "https://epicduel.artix.com/gamedesignnotes" + child.getAttribute("href");
                            thong = true;
                            break;
                        case 2:
                            if (child.lastElementChild != null) {
                                if (child.lastElementChild.tagName == "IMG") {
                                    if ((child.lastElementChild.getAttribute("src") as string).startsWith("http")) {
                                        result.post.billboard.push(["empty", child.lastElementChild.getAttribute("src") as string]);
                                        //result.post.billboard = (child.lastElementChild.getAttribute("src"));
                                        thong = true;
                                    }
                                }
                            }
                            break;
                        default:
                            //thong = true;
                        //default:
                        //    loopText(child, (result.post.billboard == "") ? false : true);
                    }

                    if (thong) continue;
                }

                // TAG CHECK for artix.com 
                if (linkIdentifier === "ArtixPost" && child.classList.contains('tags')) {
                    if (child.tagName !== 'UL') break; // idk but i cba

                    if ((child.children[0].textContent as string).startsWith('#')) result.tags = map(Object.values(child.children), eg => eg.textContent as string);

                    break;
                }

                switch (child.tagName) {
                    case "H2":
                        h2 = replaceHTMLbits(child.textContent as string, result.post.billboard, "empty", linkIdentifier);
                        h2continuation = 0;

                        if ([":"].some(char => h2.endsWith(char))) h2 = h2.slice(0, -1);

                        result.fields.push([h2, ""]) // This is to create a section in the fields.
                        //result.fields[child.textContent] = ""; // This is to create a section in the fields.
                        break;
                    case "P":

                        // TAG CHECK
                        // Also this is a paragraph element, why would it have null for text content
                        if (child.textContent?.startsWith("Tags: ")) {
                            Object.values(child.children).forEach(tag => result.tags.push(tag.textContent as string))
                            break;
                        }

                        // PURIFY THE PARAGRAPH ELEMENT
                        if (replaceHTMLbits(child.innerHTML, result.post.billboard, h2, linkIdentifier).length != 0)
                            result.fields[result.fields.findIndex(a => a[0] == ((h2) ? h2 : "empty"))][1] += `${replaceHTMLbits(child.innerHTML, result.post.billboard, h2, linkIdentifier)}\n`; // This is assuming it would never... error... right? please.
                        else {
                            if (child.lastElementChild != null) {
                                if (child.lastElementChild.tagName == "IMG") {
                                    if (child.lastElementChild.getAttribute("src")?.startsWith("http")) {
                                        /*// Checks if the image already exists for that heading, if so, it will create a heading separate to the previous.
                                        if (result.post.billboard.some(a => a[0] === h2)) {
                                            h2continuation++;

                                            h2 = (h2continuation > 1) ? `${h2.slice(0, -2)} ${h2continuation}` : h2 + ' ' + h2continuation;

                                            result.fields.push([h2, ""]);
                                        }*/

                                        result.post.billboard.push([((h2) ? h2 : "empty"), replaceArtixLinkTag(((linkIdentifier === "Epicduel") ? '' : 'https://artix.com' ) + child.lastElementChild.getAttribute("src"))]);
                                    }
                                }
                            }
                        }
                        break;
                    case "UL": case "OL":
                        let text = child.innerHTML.trim().split('\n');

                        let wong = loopText(text, result.post.billboard, h2, linkIdentifier);
                        result.fields[result.fields.findIndex(a => a[0] == ((h2) ? h2 : "empty"))][1] += `${wong}\n`;
                        break;
                    case "IMG":
                        result.post.billboard.push([((h2) ? h2 : "empty"),  replaceArtixLinkTag(((linkIdentifier === "Epicduel") ? '' : 'https://artix.com' ) + child.getAttribute("src"))]); //result.post.billboard.push(child.getAttribute("src"));//result.post.billboard.push([((h2) ? h2 : "empty"), child.getAttribute("src")]);
                        break;
                }
            }

            // This will filter out duplicates in tags list.

            result.tags = [...new Set(result.tags)];

            return { success: true, result };

        } catch (err) {
            return { success: false, error: err };
        }
    }

    static index = 0;
    static url = ["https://www.artix.com/gamelauncher/?id=1141"];

    static queue:{ channelId: string, requestee: string }[] = [];

    static recent = {
        artix: {
            date: "", title: "", poster: {name: ""}, dateObj: new Date()
        }, epicduel: { date: "", title: "", poster: {name: ""}, dateObj: new Date() }
    }

    static counter = 0;

    static interval = 5000;
    static stop = false;
    static isRunning = false;

    static timer?:NodeJS.Timeout;

    static changeInterval(interval=5000) {
        this.interval = interval;
    }
    
    static stopRun() {
        this.stop = true;
        clearTimeout(this.timer);
        this.isRunning = false;
    }

    static async addQueue(channelId: string, requestee: string, link?: string) {
        if (!this.isRunning || this.stop) {
            let result = await this.extractNote(link);

            if (result.success) {
                return this.executor.processRequest([{ channelId, requestee }], result.result);
            } else Logger.getLogger("DNote").error(result);

            // if (result.error || result.text) {
            //     this.logger.error(result);
            //     return this.event.emit('design_note_request_error', [{channelID, requestee, link}], result.error, result.text);
            // } else return this.event.emit('design_note_request', [{channelID, requestee, link}], result.result);   
        }

        this.queue.push({channelId, requestee});
        return true;
    }

    static async #timerFunc() {
        if (!this.stop) {
            let link = this.url[this.index];

            let result = await this.extractNote(link);//, { recent: this.recent });

            if (!result.success) {
                this.isRunning = true;

                if (result.error?.statusCode > 500) {
                    // Ignore, just a server error.
                    // console.log("Server issue happened when fetching a fresh design note.");
                    this.changeInterval(10000);
                } else if (result.text?.includes("Object moved")) {
                    this.changeInterval(10000);
                    // Ignore, this is just server error.
                } else Logger.getLogger("DNote").error(result);//this.logger.error(result);
                // this.event.emit('design_note_error', result.error, result.text);
            } else {
                this.changeInterval(5000);
                this.counter++;

                if (this.counter > 5) {
                    // TODO: smth in case if it didn't decrease back down, usually if the bot's been offline for way too long or idk
                }

                if (this.queue.length) {
                    // this.event.emit('design_note_request', this.queue.slice(0), result.result);
                    this.executor.processRequest(this.queue.splice(0), result.result);
                }

                this.executor.process(result.result);
                // this.event.emit('design_note', result.result);
            }

            if ((this.index + 1) >= this.url.length) this.index = 0;
            else this.index++;

            // this.url[0] = (this.url[0] === 1) ? 2 : 1;
            this.timer = setTimeout(this.#timerFunc.bind(this), this.interval).unref();
            // this._timer = setTimeout(this._timerFunc.bind(this), this.interval);
        } else {
            Logger.getLogger("DNote").info("Scraping has stopped.");
            // this.logger.info("Scraping has stopped.", chalk.red);
            this.stop = false; this.isRunning = false; clearTimeout(this.timer);
            return;
        }
    }

    static run() {
        if (this.isRunning) return false;

        this.isRunning = true;

        this.#timerFunc();
        
        return true;//.catch((err) => {})
        //timer().catch((err) => {this.logger.error(err); this.isRunning = false;});
    }

    static executor = new DNExecutor(this);

    static discord: Hydra;
}