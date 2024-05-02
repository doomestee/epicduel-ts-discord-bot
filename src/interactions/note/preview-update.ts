import { Embed, Message } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";
import Config from "../../config/index.js";
import DesignNoteManager from "../../manager/designnote.js";
import Logger from "../../manager/logger.js";
import DNExecutor from "../../util/DNExecutor.js";
import { epoch } from "../../util/Misc.js";

export default new Command(CommandType.Application, { cmd: ["unavailable"], aliases: ["Preview Update Note"] })
    .attach('run', async ({ client, interaction }) => {
        if (interaction.type !== 2) return;

        let message = interaction.data.target;//.resolved.messages.find(msg => msg.id === interaction.data.targetID));

        if (!message || !(message instanceof Message) || message.channelID !== process.env.NOTE_LOG_CHNL_ID) {
            return interaction.createMessage({ content: `No, this command only works for <#${process.env.NOTE_LOG_CHNL_ID}>`, flags: 64});
        }

        if (message.webhookID !== process.env.NOTE_LOG_WEBHOOK_ID) return interaction.createMessage({ content: `Must be used on <@${process.env.NOTE_LOG_WEBHOOK_ID}> message.`, flags: 64});
        if (/* blacklist check */ false) return interaction.createMessage({ content: "You're blacklisted, you cannot use this command :(", flags: 64}); 

        await interaction.defer(64);

        /**
         * @type {string}
         */

        let link = message.embeds[0].url || message.content.match(/\(https\:\/\/epicduel\.artix\.com\/((\w|\/|-)+|)\)/gi) || message.content.match(/\(https\:\/\/www\.artix\.com\/posts\/(\w|\/|-)+\/\?id\=\d+\)/gi);
        if (link == null || link[0] == null) return interaction.createFollowup({ content: "Unfortunately, we're unable to find the link for that message, either from the first embed or in the content."});
        link = link[0].slice(1, -1);

        let result = await DesignNoteManager.extractNote(link);//.extractNote(link);

        if (!result.success) {
            // logger.error(result);
            Logger.getLogger("DNote").error(result.error);

            return interaction.createFollowup({ content: "Error occurred when trying to fetch a note."});
            //.event.emit('design_note_error', result.error, result.text);
        } else {
            const note = result.result;

            let embeds = DNExecutor.extractData(note), errorSent = false;

            let updateTime = Date.now();
            let id = (message.embeds[message.embeds.length - 1].footer) ? Number(message.embeds[message.embeds.length - 1]?.footer?.text.slice("ID: ".length)) || updateTime - epoch.special0 : updateTime - epoch.special0;

            let embedsOfEmbeds:Embed[][] = [[]];
            let count = 0;
            let indseck = 0;

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

                    if (embedsOfEmbeds[indseck].length > 9) { // But there's 10 embeds in the list though
                        embedsOfEmbeds.push([]);
                        indseck++;
                        count = 0;
                    }

                    embedsOfEmbeds[indseck].push(embed);
                    count += coink;
                } else { // Bloody hell innit
                    if (coink >= 6000) {continue;} // no

                    count = coink;
                    embedsOfEmbeds.push([embed]); indseck++;
                }
            }


            let overallLength = embedsOfEmbeds.reduce((a, b) => a + b.length, 0);

            await interaction.createFollowup({
                content: `A [new post has been posted on design note](${link}) by **${note.poster.name}**!\n${(note.tags && Array.isArray(note.tags) && note.tags) ? `Tags: ${note.tags.map(tag => `[${tag}](http://epicduel.artix.com/gamedesignnotes/tag/${encodeURIComponent(tag)})`).join(', ')}` : 'No tags are scraped...'}\n\nUpdated as of <t:${Math.round(updateTime/1000)}:D><t:${Math.round(updateTime/1000)}:T>`,
                embeds: embedsOfEmbeds[0].map((embed, index) => {
                    if (overallLength < 10 && index == overallLength-1) {
                        embed['timestamp'] = ((message.embeds[message.embeds.length - 1].timestamp) ? new Date(message.embeds[message.embeds.length - 1].timestamp ?? Date.now()) : new Date()).toISOString();//new Date((message.embeds[message.embeds.length - 1]) ? message.embeds[message.embeds.length - 1].timestamp : );//reserves.convertDate(new Date(updateTime - 18000000)) == note.date ? new Date(updateTime) : new Date(note.date);
                        embed['footer'] = {
                            text: "ID: " + id//message.embeds[message.embeds.length - 1].footer.text.slice("ID: ".length)
                        };
                    }

                    return embed;
                }), flags: 64
            }).catch(error => { errorSent = true; Logger.getLogger("DNote").error(error); interaction.createFollowup({flags: 64, content: `A problem has been encountered trying to send a design note (successfully extracted, unable to send).\nID of Note: ${id}\n${note.post.link}`}).catch(() => {false;})});

            //await client.editWebhookMessage(process.env.NOTE_LOG_WEBHOOK_ID, process.env.NOTE_LOG_WEBHOOK_TOKEN, message.id, {
                
            //}).then((msg) => {return msg.crosspost();}).catch(error => {errorSent = true; logger.error(error); client.executeWebhook(process.env.NOTE_LOG_WEBHOOK_ID, process.env.NOTE_LOG_WEBHOOK_TOKEN, {content: `A problem has been encountered trying to send a design note (successfully extracted, unable to send).\nID of Note: ${id}\n${note.post.link}`}).catch(() => {false;})});

            if (!errorSent && embedsOfEmbeds.length > 1) {
                for (let a = 1; a < embedsOfEmbeds.length; a++) {
                    interaction.createFollowup({//await client.executeWebhook(process.env.NOTE_LOG_WEBHOOK_ID, process.env.NOTE_LOG_WEBHOOK_TOKEN, {
                        embeds: embedsOfEmbeds[a].map((embed, index) => {
                            if ((a+1) === embedsOfEmbeds.length && index == embedsOfEmbeds[a].length-1) {
                                embed['timestamp'] = ((message.embeds[message.embeds.length - 1].timestamp) ? new Date(message.embeds[message.embeds.length - 1].timestamp ?? Date.now()) : new Date()).toISOString()//reserves.convertDate(new Date(updateTime - 18000000)) == note.date ? new Date(updateTime) : new Date(note.date)//(new Date().toDateString().slice(4).split(' ').reduce((a, b, c) => { if (c != 2) return a+' '+b; else return a+', '+b; }) == note.date) ? Date.now() : new Date(note.date);
                                embed['footer'] = {
                                   text: "ID: " + id//message.embeds[message.embeds.length - 1].footer.text.slice("ID: ".length)
                                };
                            }

                            return embed;
                        }), flags: 64
                    }).catch(error => Logger.getLogger("DNote").error(error));
                }

                /*for (let a = 0; a <= Math.floor(embeds.length / 10); a++) {
                    await client.executeWebhook(process.env.NOTE_LOG_WEBHOOK_ID, process.env.NOTE_LOG_WEBHOOK_TOKEN, {
                        embeds: embeds.slice(a*10, 10+(a*10)).map((embed, index) => {
                            if (index == embeds.length-1) {
                                embed['timestamp'] = convertDate(new Date(updateTime - 18000000)) == note.date ? new Date(updateTime) : new Date(note.date)//(new Date().toDateString().slice(4).split(' ').reduce((a, b, c) => { if (c != 2) return a+' '+b; else return a+', '+b; }) == note.date) ? Date.now() : new Date(note.date);
                                embed['footer'] = { text: "ID: " + id};
                            }
            
                            //console.log(embed);
                            return embed;
                        }), username: note.poster.name, avatarURL: note.poster.image, wait: true
                    }).then((msg) => {return /*msg.crosspost()*//*;}).catch(error => designNoteManager.logger.error(error));
                }*/
            }
        }      

    })