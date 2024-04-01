import { ButtonStyles, ComponentTypes, Constants } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";
import Config from "../../config/index.js";
import { inspect } from "util";
import DatabaseManager from "../../manager/database.js";
import Swarm from "../../manager/epicduel.js";

export default new Command(CommandType.Application, { cmd: ["admin", "eval"]})
    .attach("run", async ({ client, interaction }) => {

        // For intellisense
        if (interaction.type !== 2) return;

        if (!client.isMaintainer(interaction.user.id)) return interaction.createMessage({content: "You are not a bot admin!", flags: 64});
        await interaction.defer();
    
        const msg = interaction.data.options.getString("msg", true);//focused.options.find(v => v.name === "msg") ? focused.options.find(v => v.name === "msg").value : 1;
        let isAsync = interaction.data.options.getInteger("async", false) ?? 0;//focused.options.find(v => v.name === "async") ? focused.options.find(v => v.name === "async").value : 0;

        function clean(text: any) {
            if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
            else return text;
        }

        let components = () => {
            if (interaction.guildID !== "565155762335383581") {
                return [{
                    type: 1, components: [{
                        type: 2, style: Constants.ButtonStyles.DANGER, customID: "remove_message_1234", label: "Remove"
                    }]
                }];
            }

            return [];
        }
   
        try {
            let code = msg;//message.slice(1).join(" ");
            /**
             * @type {string}
             */
            let evaled = null;

            // for some reason it just wouldnt work if I use DatabaseManager or Swarm.
            let db = DatabaseManager;
            let swarm = Swarm;

            if (isAsync === 0) {
                if (code.startsWith("cope")) {
                    code = code.slice(4);
                    isAsync = 2;
                } else if (code.startsWith("sex")) {
                    code = code.slice(3);
                    isAsync = 1;
                } else if (code.startsWith("img")) {
                    code = code.slice(3);
                    isAsync = 69;
                }
            }
            
            // if (isAsync === 69) evaled = await require("../../utilities").avatar(code);
            if (isAsync === 2) evaled = await eval(`(async()=>{${code}})()`);
            else if (isAsync === 1) evaled = await eval(`(async()=>{return ${code};})()`);
            else evaled = eval(code);
            //console.log(evaled);

            if (isAsync === 69) {
                return interaction.createFollowup({
                    content: "", components: components(), files: [{
                        name: "img.png",
                        contents: evaled
                    }]
                })
            }
        
            if (typeof evaled !== "string") evaled = inspect(evaled);

            // Filter evaled content to hide any sensitive information

            // if (evaled.includes(process.env.ERROR_LOG_WEBHOOK_TOKEN)) evaled = evaled.split(process.env.ERROR_LOG_WEBHOOK_TOKEN).join("***");
            // if (evaled.includes(process.env.NOTE_LOG_WEBHOOK_TOKEN)) evaled = evaled.split(process.env.NOTE_LOG_WEBHOOK_TOKEN).join("***");
            if (evaled.includes(Config.botToken)) evaled = evaled.split(Config.botToken).join("***");
            // if (evaled.includes(process.env.DATABASE_URL)) evaled = evaled.split(process.env.DATABASE_URL).join("***");
            if (evaled.includes(Config.edBotEmail)) evaled = evaled.split(Config.edBotEmail).join("***");
            if (evaled.includes(Config.edBotPass)) evaled = evaled.split(Config.edBotPass).join("***");
            // if (evaled.includes(epicduel.user.session)) evaled = evaled.split(epicduel.user.session).join("***");

            if (evaled.length + 15 > 2000) {
                interaction.createFollowup({content: "", components: components(), files: [{
                    name: "output.xl",
                    contents: clean(evaled)
                }]}).catch((err) => {});
            } else interaction.createFollowup({content: "```xl\n" + clean(evaled) + "```", components: components()}).catch(console.log);
        //msg.channel.send(clean(evaled), {code:"xl"});
        } catch (err) {
            console.log(err);
            interaction.createFollowup({content: "`ERROR` ```xl\n" + clean(err) + "```", components: components()}).catch(console.log);//{content: "```xl\n" + clean(err) + "```"});
            //msg.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
        }
    })