import { ButtonStyles, ComponentTypes, Embed, EmbedField, EmbedOptions, MessageActionRow, Webhook } from "oceanic.js";
import type DesignNoteManager from "../manager/designnote.js";
import { DesignNote } from "../manager/designnote.js";
import { chunkStr, epoch, filter, find, findIndex, map, trimString } from "./Misc.js";
import Logger from "../manager/logger.js";

function tagBuilder(isFromArtixPost: boolean, tag: string) {
    return (isFromArtixPost) ? `[${tag.slice(1)}](https://www.artix.com/news/post/?tag=${encodeURIComponent(tag)})` : `[${tag}](http://epicduel.artix.com/gamedesignnotes/tag/${encodeURIComponent(tag)})`; 
}

const lazyLen = (embed: Embed, v: keyof EmbedOptions) : number => {
    const prop = embed[v];

    if (typeof prop === "string") return prop.length;
    else if (v === "author") return embed[v]?.name.length ?? 0;
    else return 0;
}

export default class DNExecutor {
    #dn: typeof DesignNoteManager;

    constructor(dn: typeof DesignNoteManager) {
        this.#dn = dn;
    }

    static convertDate(date:string | Date) {
        const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
        if (date instanceof Date) date = date.toLocaleDateString('en-GB');
        //console.log(date);
        if (date.split('/').length != 3 || date.split('/').slice(0, 3).some(a => Number.isNaN(parseInt(a)))) return 'January 1, 1970';
    
        let chunk = date.split('/').map(Number);
    
        // Please, I'm begging that this toLocaleDateString thing will return in proper date format, and that should be DD/MM/YYYY :(
    
        return `${month[chunk[1] - 1]} ${(chunk[0] - 0).toString().padStart(2, '0')}, ${chunk[2]}`;
    }

    // Intentionally poorly documented, as I just copied it from old code.
    static extractData(note: DesignNote) : Embed[] {
        // This is where big brain will start, as the bot will think the best ways to display the design note out.
    
        //#region 0.1 This will initialise the variables for the... operation?
    
    
        let fields = note.fields;
        // let embeds = []; //[/*new MessageEmbed()*/]; // NOTE THIS IS IMPORTANT, REMOVE 'new MessageEmbed()' HERE WHEN RUNNING THE CODE.
    
        let length = [0];
    
        //#endregion
        //#region 1.1 Before processing everything else, the first heading must be sent no matter what.

        const embeds:Embed[] = [{
            title: note.title,//`[${note.title}](${note.post.link})`,
            description: trimString(`` + (fields.shift()?.[1] ?? "N/A"), 2048),
            author: {
                name: trimString(note.poster.name, 256),
                iconURL: note.poster.image
            }
        }];// as Required<Pick<Embed, "title"|"image">> & Pick<Embed, "author"|"description">];

        length[0] = lazyLen(embeds[0], 'title') + lazyLen(embeds[0], 'description') + lazyLen(embeds[0], 'author');//']['name'].length;
    
        const emptyBoard = find(note.post.billboard, v => v[0] == 'empty');

        if (emptyBoard) {
            embeds[0]['image'] = {url: encodeURI(emptyBoard[1]) };
            length[0] += embeds[0]['image']['url'].length
        }
    
        //#endregion
        //#region 1.2 Initialises even further... This will check all of the fields to see if they have length lower than 1024

        let fieldsBoard = filter(fields, a => find(note.post.billboard, b => b[0].length == a[0].length) != undefined);
        fields = filter(fields, a => find(note.post.billboard, b => b[0].length == a[0].length) == undefined);
    
        let fieldsFiltered = filter(fields, a => a[1].length < 1024);
        fields = filter(fields, a => !(a[1].length < 1024));
    
        //#endregion
        //#region 1.3 This will prioritise those fields with their own billboard.
        
        function regurgitate(data: string) : [string, string][] {
            // If anyone has a better idea, just gimme lmao.

            if (data.length >= 4096) {
                return [["Unknown heading", data]];
            }
    
            let headings:[string, string][] = [];//['regugrgiate msm', 'Ice cream!\nCoco pops!']];
            let previousStart = false; // i have no idea what's with the inaccurate naming.
            let previousLine = '';

            let arroy = data.trim().split('\n');

            for (let index = 0, len = arroy.length; index < len; index++) {
                const strong = arroy[index];

                if (index == 0) {
                    if (['●', '⚬', '▪'].some(circle => strong.startsWith(circle))) {
                        headings.push(['Unknown heading', strong]);
                        previousStart = true;
                        previousLine = 'Unknown heading';
                        continue;
                    } else {
                        if (index == (arroy.length-1)) { // If it's the last element then how tf
                            headings.push(['Unknown heading', strong]);
                            previousStart = true;
                            previousLine = 'Unknown heading';
    
                            //headings.find(a => a[0] == previousLine)[1] += `\n${strong}`;
                            continue;
                        } else {
                            if (!(['●', '⚬', '▪'].some(a => arroy[index+1].startsWith(a)))) { // If the next element does not start with circles.
                                headings.push(['Unknown heading', strong]);
                                previousStart = true;
                                previousLine = 'Unknown heading';
                                continue;
                            }
                        }
                    }
    
                    previousLine = ([':'].some(char => strong.endsWith(char))) ? strong.slice(0, -1) : strong;
                    continue;
                }

                const indexed = findIndex(headings, a => a[0] === previousLine);
                
                if (['●', '⚬', '▪'].some(a => strong.startsWith(a))) {
                    if (previousStart) {
                        headings[indexed][1] += `\n${strong}`;
    
                    } else {
                        previousStart = true;
    
                        //headings.find(a => a[0] == previousLine)[1] += `\n${([':'].some(char => strong.endsWith(char))) ? strong.slice(0, -1) : strong}`;
    
                        headings.push([previousLine, strong]);
                    }
                } else {
                    if (headings.length == (arroy.length-1)) { // If it's the last element
                        headings[indexed][1] += `\n${strong}`;
                        continue;
                    } else {
                        if (!(['●', '⚬', '▪'].some(a => arroy[headings.length+1].startsWith(a)))) { // If the next element does not start with circles.
                            headings[indexed][1] += `\n${strong}`;
                            continue;
                        }
                    }
    
                    //if (previousStart) {
                        previousStart = false;
                    //}

                    previousLine = ([':'].some(char => strong.endsWith(char))) ? strong.slice(0, -1) : strong;
    
                    //if (index == (arroy.length-1)) {
    
                    //} else {
                    //}
                }
            }
    
            // To purge some null fields
    
            return headings;
        }
    
        let billboards = note.post.billboard;
    
        let urlembedder = "https://www.google.com/search?q=please%20don%27t%20click,%20the%20url%20is%20for%20embedding%20multiple%20images%20";

        // cringe name ik, but still copied and cba renaming
        for (let i = 0, len = fieldsBoard.length; i < len; i++) {
            const field = fieldsBoard[i];

            const imgUrl = find(note.post.billboard, a => a[0] == field[0]);

            if (field[1].trim().length > 2048) {
                let stuff = regurgitate(field[1]);
    
                embeds.push({
                    title: trimString(`​${field[0]}`, 256),
                    fields: map(stuff, a => ({
                            name: a[0] !== "" ? trimString(a[0], 256) : "Unknown name",
                            value: trimString(a[1], 1024),
                        })),
                    image: {
                        url: encodeURI(imgUrl?.[1] ?? "")
                    },
                });
                
                let boardFiltered = filter(billboards, a => a[0] === field[0]);
    
                if (boardFiltered.length > 1) {
                    embeds[embeds.length-1].url = urlembedder + i;

                    for (let j = 0, jen = boardFiltered.length; j < jen; j++) {
                        const a = boardFiltered[j];
                        if (j === 0) continue;
                        embeds.push({
                            image: {
                                url: encodeURI(a[1])
                            }, url: urlembedder + i
                        });
                    }
                }
    
                length.push(trimString(`​${field[0]}`, 256).length + stuff
                    .map(a => { return (trimString(a[0], 256).length + trimString(a[1], 1024).length); })
                    .reduce((accum, stoff) => accum + stoff, 0));
            } else {
                embeds.push({
                    title: trimString(`​${field[0]}`, 256),
                    description: trimString(field[1], 2048),
                    image: {
                        url: encodeURI(imgUrl?.[1] ?? "")//(note.post.billboard.find(a => a[0] == field[0])) ? encodeURI(note.post.billboard.find(a => a[0] == field[0])[1]) : null
                    }
                });
    
                let boardFiltered = billboards.filter(a => a[0] === field[0]);
    
                if (boardFiltered.length > 1) {
                    embeds[embeds.length-1].url = urlembedder + i;

                    for (let j = 0, jen = boardFiltered.length; j < jen; j++) {
                        const a = boardFiltered[j];
                        if (j === 0) continue;
                        embeds.push({
                            image: {
                                url: encodeURI(a[1])
                            }, url: urlembedder + i
                        });
                    }
                }
    
                length.push(trimString(`​${field[0]}`, 256).length + trimString(field[1], 2048).length)
            }
        }
    
        //#endregion
        //#region 1.4 This will prioritise those fields with more than 1024 characters.

        for (let i = 0, len = fields.length; i < len; i++) {
            const field = fields[i];

            let stuff = regurgitate(field[1]);
            //if (field[1].trim().length > 2048) {
            // An embed will be dedicated entirely for this thing provided the overall chars does not go over 6000 chars smh pls.

            // const embed = {
            //     title: trimString(`​${field[0]}`, 256),
            //     fields: [] as EmbedField[]
            // };

            // const preFields = map(stuff, ([heading, desc]) => {
            //     return {
            //         name: heading !== "" ? "Unknown Name" : trimString(heading, 256),
            //         list: [trimString(desc, 1024), ...chunkStr(desc.slice(1024), 1024)]
            //     }
            // });

            // let count = embed.title.length;

            // for (let j = 0, jen = preFields.length; j < jen; j++) {
            //     if (count > 6000) continue;

            //     const preField = preFields[i];
                
            //     let newLen = 0;

            //     if (preField.list.length === 1) {
            //         newLen = preField.list[0].length + preField.list[0].length;
            //         if (newLen + count > 6000) break;

            //         count += newLen;

            //         embed.fields.push({
            //             name: preField.name, value: preField.list[0]
            //         }); continue;
            //     }

            //     for (let x = 0, xen = Math.min(preField.list.length, 25); x < xen; x++) {
            //         newLen += 
            //     }
            // }
    
            // embeds.push({
                
            //     fields: map(stuff, (a, b) => ({ name: (a[0] != "") ? trimString(a[0], 256) : "Unknown Name", value: trimString(a[1], 1024), inline: (a[1].length < 500 && b % 2) as boolean })),
            // });

            const embed = {
                title: trimString(`​${field[0]}`, 256),
                description: "",
                fields: map(stuff, (a, b) => ({ name: (a[0] != "") ? trimString(a[0], 256) : "Unknown Name", value: trimString(a[1], 1024), inline: (a[1].length < 500 && b % 2) !== 0 })),
            };

            if (embed.fields.length === 1 && embed.fields[0]["name"] === "Unknown Name" || embed.fields[0]["name"] === "Unknown heading") {
                embed.description = trimString(stuff[0][1], 4096);
                embed.fields = [];
            }

            embeds.push(embed);
    
            length.push(embed.title.length + embed.description.length + map(embed.fields, v => v.name.length + v.value.length)//trimString(a[0], 256).length + trimString(a[1], 1024).length); })
                .reduce((accum, stoff) => accum + stoff, 0));
            //} else {
    
            //}
        }
    
        //#endregion
        //#region 1.5 This will then begin calculations for the remaining inferior embeds.
    
        //        1.5.1 All of the fields that have been filtered will now be funneled (5 at a time)
    
    
        // If there are more than one element inside 'fields' list which means they have more than permitted characters according to discord...
    
    
    
        let slombs:[number, number, boolean][] = [];
        //let slombs = [[3, 3, false]]; 
        /* slombs is a list of a list with index of an element in the embed list,
        the 2nd index is of the length list and a boolean determining if its available or not */
    
        /*
        PLAN:
        - If index is 0, add it first.
        -- Add to a list 'slombs' with the index of embed and boolean (possibly length array index)
        - Else, check 'slombs' list and find the first element with a boolean true determining if it's available
        -- If true, simply add to that and update the slombs list whether if there are more than enough characters still.
        */
    
        let previousIndex = 0; // idk the naming either

        for (let index = 0, len = fieldsFiltered.length; index < len; index++) {
            const field = fieldsFiltered[index];
    
            let count = field[0].length + field[1].length;
            //console.log(count, length);

            const slombdex = findIndex(slombs, a => (length[a[1]] + count) <= 6000);
    
            if (slombdex !== -1) {
                let bomb = slombs[slombdex];
    
                //let bomb = slombs.filter(a => (length[a[1]]+count) <= 6000)[0]; // embed, length, boolean
    
                embeds[bomb[0]].fields?.push({
                    name: (field[0] != "") ? trimString(field[0], 256) : "Unknown Name",
                    value: trimString(field[1], 1024),
                    inline: (field[1].length < 500 && index % 2) !== 0
                });
    
                //let reference = slombs.find((stuff) => stuff[0] == bomb[0] && stuff[1] == bomb[1] && stuff[2] == bomb[2]);
    
                length[bomb[1]] += trimString(field[0], 256).length + trimString(field[1], 1024).length;
                //bomb[1] += trimString(field[0], 256).length + trimString(field[1], 1024).length;
                //console.log(bomb[1]);
                // Note: bomb is sort of a reference to slombs.stuff so should be fine... probably idk
    
                continue;
            } else {
                slombs.push([
                    embeds.push({
                        fields: [{
                            name: (field[0] != "") ? trimString(field[0], 256) : "Unknown Name",
                            value: trimString(field[1], 1024),
                            inline: (field[1].length < 500 && index % 2) !== 0
                        }]
                    })-1, length.push(trimString(field[0], 256).length + trimString(field[1], 1024).length)-1, true
                ]);
    
                continue;
            }
        }
    
        //#endregion
    
        // Sloppy fix:

        // the f is this down here for, it's not even...
        // embeds.map((embed) => {
        //     if (embed.fields && Array.isArray(embed.fields)) embed.fields.filter((field) => field.value && field.value !== '');
    
        //     return embed;
        // });
    
        return embeds;
    }

    async process(note: DesignNote) {
        if (!this.#dn.discord.ready) return;

        const isFromArtixPost = note.post.link.split('//')[1].startsWith("www.artix.com/posts/");

        const recenttag = isFromArtixPost ? 'artix' : 'epicduel'; const oppositetag = isFromArtixPost ? 'epicduel' : 'artix'; // I know this is super lazy but I cba still

        if (note.date === this.#dn.recent[recenttag].date && note.title === this.#dn.recent[recenttag].title && note.poster.name === this.#dn.recent[recenttag].poster.name) {
            // this.#dn.event.emit('bot_is_connected', {type: 'OLD_NOTE'});
            this.#dn.counter = 0;
            if (this.#dn.debug) Logger.getLogger("DesignNote").debug(`A note was received: OLD note 1`);

            return;
        }//else console.log([note.date, this.#dn.recent[recenttag].date, note.title, this.#dn.recent[recenttag].title, note.poster.name, this.#dn.recent[recenttag].poster.name])

        // This note is older than the recent from the opposite page.
        if (new Date(note.date).getTime() <= this.#dn.recent[oppositetag].dateObj.getTime()) {
            this.#dn.counter = 0;
            if (this.#dn.debug) Logger.getLogger("DesignNote").debug(`A note was received: OLD note 2`);

            // this.#dn.event.emit('bot_is_connected', {type: 'OLD_NOTE'});
            return;
        }

        // This note is older than the recent from the recent page.
        if (new Date(note.date).getTime() <= this.#dn.recent[recenttag].dateObj.getTime()) {
            this.#dn.counter = 0;
            if (this.#dn.debug) Logger.getLogger("DesignNote").debug(`A note was received: OLD note 3`);

            // this.#dn.event.emit('bot_is_connected', {type: 'OLD_NOTE'});
            return;
        }

        // if (this.#dn.debug)
        Logger.getLogger("DesignNote").debug(`A note was received: NEW note`)

        if (process.env.DN_STOP === "1") return console.log("PREVENTED A NEW DESIGN NOTE FROM PASSING THROUGH!");

        this.#dn.recent[recenttag].date = note.date;
        this.#dn.recent[recenttag].title = note.title;
        this.#dn.recent[recenttag].dateObj = new Date(note.date);
        this.#dn.recent[recenttag].poster.name = note.poster.name;

        // this.#dn.event.emit('bot_is_connected', {type: 'NEW_NOTE'});
        // This will reset the interval back to 5s, presumably after it was forced to 1ms as a response to an impending server shutdown.

        let embeds = DNExecutor.extractData(note), errorSent = false;

        let creationTime = Date.now();
        let id = creationTime - epoch.special0;

        let embedsOfEmbeds:Embed[][] = [[]];
        let count = 0;
        let index = 0;

        for (let aeg = 0; aeg < embeds.length; aeg++) {
            let embed = embeds[aeg];

            const coink = (embed.author && embed.author.name) ? embed.author.name.length : 0
                + ((embed.description?.length) ? embed.description.length : 0)
                + ((embed.fields?.length) ? embed.fields.reduce((a, b) => a + b.name.length + b.value.length, 0) : 0)
                + ((embed.footer && embed.footer.text) ? embed.footer.text.length : 0)
                + ((embed.title) ? embed.title.length : 0)
                + ((embed.image && embed.image.url) ? embed.image.url.length : 0)
                + ((embed.url) ? embed.url.length : 0);

            if ((count + coink) < 6000) { // Meaning it hasn't violated the 6000 chars limit yet
                if (coink >= 6000) {continue;} // how tf

                if (embedsOfEmbeds[index].length > 9) { // But there's 10 embeds in the list though
                    embedsOfEmbeds.push([]);
                    index++;
                    count = 0;
                }

                embedsOfEmbeds[index].push(embed);
                count += coink;
            } else { // Bloody hell innit
                if (coink >= 6000) {continue;} // no

                count = coink;
                embedsOfEmbeds.push([embed]); index++;
            }
        }

        let overallLength = embedsOfEmbeds.reduce((a, b) => a + b.length, 0);

        let webbie:Webhook | undefined;

        await this.#dn.discord.rest.webhooks.get("937075371281641483").then(v => {
            webbie = v;
            return v.execute({
                content: `A [new post has been posted on design note](${note.post.link}) by **${note.poster.name}**!\n${(note.tags && Array.isArray(note.tags)) ? `Tags: ${note.tags.map(tag => tagBuilder(isFromArtixPost, tag)).join(', ')}` : 'No tags were scraped...'}`,
                embeds: map(embedsOfEmbeds[0], (embed, index) => {
                    if (overallLength < 10 && index == overallLength-1) {
                        embed['timestamp'] = (new Date(DNExecutor.convertDate(new Date(creationTime - 18000000))).getTime() == new Date(note.date).getTime() ? new Date(creationTime) : new Date(note.date)).toISOString();
                        embed['footer'] = {
                            text: "ID: " + id
                        };
                    }

                    return embed;

                })/*embeds.slice(0, 10).map((embed, index) => {
                    if (embeds.length < 10 && index == embeds.length-1) {
                        embed['timestamp'] = convertDate(new Date(creationTime - 18000000)) == note.date ? new Date(creationTime) : new Date(note.date)//(new Date().toDateString().slice(4).split(' ').reduce((a, b, c) => { if (c != 2) return a+' '+b; else return a+', '+b; }) == note.date) ? Date.now() : new Date(note.date);
                        embed['footer'] = {
                            text: "ID: " + id
                        }
                    }

                    //console.log(embed);
                    return embed;
                })*/, username: note.poster.name, avatarURL: note.poster.image, wait: true
            }).then(msg => msg.crosspost()).catch(err => {
                errorSent = true;
                Logger.getLogger("DNote").error(err);
                if (webbie) {
                    return webbie.execute({
                        content: "ERROR, unable to send a design note at the final stage.\n(Note was successfully extracted and processed, but can't be sent to discord).\nURL to the note: " + note.post.link,
                        wait: true
                    }).then(v => v.crosspost()).catch(() => {});
                }
            });
        });

        if (webbie && !errorSent && embedsOfEmbeds.length > 1) {
            for (let a = 1; a < embedsOfEmbeds.length; a++) {
                await webbie.execute({
                    embeds: map(embedsOfEmbeds[a], (embed, index) => {
                        if ((a+1) === embedsOfEmbeds.length && index == embedsOfEmbeds[a].length-1) {
                            embed['timestamp'] = (new Date(DNExecutor.convertDate(new Date(creationTime - 18000000))).getTime() == new Date(note.date).getTime() ? new Date(creationTime) : new Date(note.date)).toISOString()//(new Date().toDateString().slice(4).split(' ').reduce((a, b, c) => { if (c != 2) return a+' '+b; else return a+', '+b; }) == note.date) ? Date.now() : new Date(note.date);
                            embed['footer'] = { text: "ID: " + id};
                        }

                        return embed;
                    }), username: note.poster.name, avatarURL: note.poster.image, wait: true
                }).then((msg) => {return msg.crosspost();})
                    .catch(err => {
                        errorSent = true;
                        Logger.getLogger("DNote").error(err);
                        if (webbie) {
                            return webbie.execute({
                                content: "ERROR, unable to send a design note at the final stage.\n(Note was successfully extracted and processed, but can't be sent to discord).\nURL to the note: " + note.post.link,
                                wait: true
                            }).then(v => v.crosspost()).catch(() => {});
                        }
                    });
            }

            /*for (let a = 0; a <= Math.floor(embeds.length / 10); a++) {
                await client.executeWebhook(process.env.NOTE_LOG_WEBHOOK_ID, process.env.NOTE_LOG_WEBHOOK_TOKEN, {
                    embeds: embeds.slice(a*10, 10+(a*10)).map((embed, index) => {
                        if (index == embeds.length-1) {
                            embed['timestamp'] = convertDate(new Date(creationTime - 18000000)) == note.date ? new Date(creationTime) : new Date(note.date)//(new Date().toDateString().slice(4).split(' ').reduce((a, b, c) => { if (c != 2) return a+' '+b; else return a+', '+b; }) == note.date) ? Date.now() : new Date(note.date);
                            embed['footer'] = { text: "ID: " + id};
                        }
        
                        //console.log(embed);
                        return embed;
                    }), username: note.poster.name, avatarURL: note.poster.image, wait: true
                }).then((msg) => {return /*msg.crosspost()*//*;}).catch(error => designNoteManager.logger.error(error));
            }*/
        }

        this.#dn.discord.rest.webhooks.get('941353608836960326').then(v => {
            return v.execute({
                files: [{
                    contents: Buffer.from(JSON.stringify(note, undefined, 2)), name: id + '.json'
                }]
            })
        }).catch(err => Logger.getLogger("DNote").error(err));

        if (!errorSent) {
            this.#dn.discord.rest.channels.editMessage('937078109751083038', '937081994406400170', {
                content: "Recent: " + btoa(JSON.stringify({
                    epicduel: {
                        date: this.#dn.recent.epicduel.date,
                        title: this.#dn.recent.epicduel.title,
                        poster: {name: this.#dn.recent.epicduel.poster.name}
                    }, artix: {
                        date: this.#dn.recent.artix.date,
                        title: this.#dn.recent.artix.title,
                        poster: {name: this.#dn.recent.artix.poster.name}
                    }
                }))
            });
        }
        
        /*.then(webhooks => {
            const webhook = webhooks.find(v => v.id === "937113225311453255")
        })
        await this.#dn.discord.rest.webhooks.execute("937113225311453255", )*/
    }

    async processRequest(requests: { requestee: string, channelId: string}[], note: DesignNote) {
        // if (!Array.isArray(request) && request['requestee'] && request['channelID']) request = [request];
        if (requests.length < 1) return [];

        const isFromArtixPost = note.post.link.split('//')[1].startsWith("www.artix.com/posts/");
        /**
         * @type {'artix'|'epicduel'}
         */
        const recenttag = isFromArtixPost ? 'artix' : 'epicduel';// const oppositetag = isFromArtixPost ? 'epicduel' : 'artix'; // I know this is super lazy but I cba still

        if (!(note.date === this.#dn.recent[recenttag].date && note.title === this.#dn.recent[recenttag].title && note.poster.name === this.#dn.recent[recenttag].poster.name)) {
            //This note is new, somehow just at the right timing so this will be disregarded to make way for the global post.

            return [];
        }

        let embeds = DNExecutor.extractData(note);
        let creationTime = Date.now();
        let id = 'No ID.';

        let initialEmbeds = map(embeds.slice(0, 10), (embed, index) => {
            if (embeds.length < 10 && index === embeds.length - 1) {
                embed['timestamp'] = (new Date(DNExecutor.convertDate(new Date(creationTime - 18000000))).getTime() == new Date(note.date).getTime() ? new Date(creationTime) : new Date(note.date)).toISOString();
                embed['footer'] = {
                    text: "ID: " + id
                }
            }

            return embed;
        });

        const components:MessageActionRow[] = [{
            type: ComponentTypes.ACTION_ROW, components: [{
                type: ComponentTypes.BUTTON, url: note.post.link, style: ButtonStyles.LINK, label: "Deez Note Page"
            }]
        }];

        const result:{ errorSent: boolean }[] = [];

        for (let i = 0, len = requests.length; i < len; i++) {
            result[i]['errorSent'] = false;

            await this.#dn.discord.rest.channels.createMessage(requests[i]['channelId'], {
                content: `As requested, here is the recent design note:\n${(note.tags && Array.isArray(note.tags)) ? `Tags: ${note.tags.map(tag => tag)}` : 'No tags were scraped...'}`,
                embeds: initialEmbeds, components: (embeds.length < 10 && note.post.link) ? components : undefined
            }).catch((err) => {result[i]['errorSent'] = true; /* idk, the dude probably disabled permission or smth. */});

            if (!result[i]['errorSent'] && embeds.length > 10) {
                for (let a = 0; a <= Math.floor(embeds.length / 10); a++) {
                    await this.#dn.discord.rest.channels.createMessage(requests[i]['channelId'], {
                        embeds: map(embeds.slice(a*10, 10+(a*10)), (embed, index) => {
                            if (index == embeds.length-1) {
                                embed['timestamp'] = (new Date(DNExecutor.convertDate(new Date(creationTime - 18000000))).getTime() == new Date(note.date).getTime() ? new Date(creationTime) : new Date(note.date)).toISOString()
                                embed['footer'] = { text: "ID: " + id};
                            }
            
                            //console.log(embed);
                            return embed;
                        }), components: (note.post.link && a === Math.floor(embeds.length / 10)) ? components : undefined
                    }).catch(() => {})
                }
            }
        }

        return result;
    }
}