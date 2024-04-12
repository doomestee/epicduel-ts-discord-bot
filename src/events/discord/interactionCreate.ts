import { ActionRowBase, AnyCommandInteraction, AnyGuildInteraction, AnyPrivateInteraction, ApplicationCommandOptionTypes, ApplicationCommandTypes, ButtonStyles, CommandInteraction, ComponentTypes, InteractionOptionsSubCommand, InteractionOptionsSubCommandGroup, InteractionOptionsWithValue, InteractionOptionsWrapper, InteractionTypes, MessageActionRow, MessageComponent } from "oceanic.js";
import ClientEvent from "../../util/events/ClientEvent.js";
import CommandHandler from "../../handler/command.js";
import type Command from "../../util/Command.js";
import type Hydra from "../../manager/discord.js";
import { CommandType, AnyCommand } from "../../util/Command.js";
import Logger from "../../manager/logger.js";
import DatabaseManager from "../../manager/database.js";
import Swarm from "../../manager/epicduel.js";
import { map } from "../../util/Misc.js";

export function spitOptions(int: AnyCommandInteraction, cmdName?: string) {
    cmdName = int.data.name;
    let opts = int.data.options.raw;

    if (opts.length === 0) return `/${cmdName}`;

    // Checks if it is a group
    let group = opts.find(a => a.type === 2) as InteractionOptionsSubCommandGroup;
    let sub_cmd = (group) ? group.options?.find(a => a.type === 1) as InteractionOptionsSubCommand : opts.find(a => a.type === 1) as InteractionOptionsSubCommand;

    if (group && sub_cmd) return `/${cmdName} ${group.name} ${sub_cmd.name} ${(sub_cmd.options) ? map(sub_cmd.options as InteractionOptionsWithValue[], a => `${a.name}:${a.value}`).join(' ') : ''}`.trim();
    else if (sub_cmd)     return `/${cmdName} ${sub_cmd.name} ${(sub_cmd.options) ? map(sub_cmd.options as InteractionOptionsWithValue[], a => `${a.name}:${a.value}`).join(' ') : ''}`.trim();
    else                  return `/${cmdName} ${(opts.length) ? map(opts as InteractionOptionsWithValue[], a => `${a.name}:${a.value}`).join(' ') : ''}`.trim();
}

async function executeCommand(this: Hydra, int: AnyGuildInteraction | AnyPrivateInteraction, cmd: AnyCommand, variables: Record<string, string>, first = true) {
    // For type narrowing.
    if (int.isPingInteraction()) return;

    if (Date.now() > (int.createdAt.getTime() + 2800) && first) return;
    if (Date.now() > (int.createdAt.getTime() + (1000*60*14)) && !first) return;

    if (cmd.opts.permissionsMember && int.guildID !== null && first) {
        if (int.type === InteractionTypes.APPLICATION_COMMAND) {
            let bypass = false;

            if (cmd.opts.exceptionPermissionsCheck) {
                for (let i = 0; i < cmd.opts.exceptionPermissionsCheck.length; i++) {
                    let permCheckExecp = cmd.opts.exceptionPermissionsCheck[i];

                    if     (permCheckExecp[0] === -1 && this.isMaintainer(int.user.id)) bypass = true;
                    else if (permCheckExecp[0] === 0 && permCheckExecp[1] === int.user.id) bypass = true;
                    else if (permCheckExecp[0] === 1 && int.member?.roles.includes(permCheckExecp[1])) bypass = true;
                    else if (permCheckExecp[0] === 2 && int.channel && int.channel.id === permCheckExecp[1]) bypass = true;
                    else if (permCheckExecp[0] === 3 && int.guildID === permCheckExecp[1]) bypass = true;

                    if (bypass) break;
                }
            }

            let disallowedMember = [];
            for (let i = 0; i < cmd.opts.permissionsMember.length; i++) {
                let permission = cmd.opts.permissionsMember[i];

                if (Array.isArray(permission)) {
                    let subdisallowed = [];
                    for (let y = 0; y < permission.length; y++) {
                        int.member?.permissions.has(permission[y]) ? null : subdisallowed.push(permission[y]);
                    }

                    if (subdisallowed.length === permission.length) disallowedMember.push(permission.join(' or '));
                    continue;
                }

                int.member?.permissions.has(permission) ? null : disallowedMember.push(permission);
            }

            if (disallowedMember.length && !bypass) {
                return int.createMessage({content: `Sorry, you don't have the required permissions to execute the command.\nMissing permissions: \`${disallowedMember.join(', ')}\``, flags: 64}).catch(() => {/* cope */});
            }
        }
    }

    if (cmd.opts.permissionsBot && int.guildID !== null) {
        if (int.type === InteractionTypes.APPLICATION_COMMAND) {

            let disallowed = [];
            for (let i = 0; i < cmd.opts.permissionsBot.length; i++) {
                const permission = cmd.opts.permissionsBot[i];

                if (Array.isArray(permission)) {
                    let subdisallowed = [];
                    for (let y = 0; y < permission.length; y++) {
                        int.member?.permissions.has(permission[y]) ? null : subdisallowed.push(permission[y]);
                    }

                    if (subdisallowed.length === permission.length) disallowed.push(permission.join(' or '));
                    continue;
                }

                if (int.member?.guild.members.has(this.user.id)) int.member.guild.permissionsOf(this.user.id).has(permission) ? null : disallowed.push(permission);
                else int.member?.guild.clientMember.permissions.has(permission) ? null : disallowed.push(permission);
            }

            if (disallowed.length) {
                return int.createMessage({content: `Sorry, the bot don't have the required permissions to execute the command.\nMissing permissions: \`${disallowed.join(', ')}\``, flags: 64}).catch(() => {/* cope */});
            }
        }
    }

    // if (cmd.opts.usableEdRestricted === false) {// && epicduel.restrictedMode && epicduel.client.restrictedMode) {
        // if (int.type === InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE) return int.result([{ name: "Bot is in restricted mode.", value: "0" }]);

        // return int.createMessage({content: "Woop, the bot is currently in restricted mode. This command you're using won't work in that condition.", flags: 64});
    // }

    if (cmd.opts.gateVerifiedChar && first) {
        let components: MessageActionRow[] = [{
            type: ComponentTypes.ACTION_ROW, components: [{
                type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
                label: "Link a Character", customID: "character_link"
            }]
        }];

        if (cmd.opts.gateVerifiedChar < 3) {
            // 2 or 4, can't be 0 due to if check.
            let isEphemeral = cmd.opts.gateVerifiedChar % 2 === 0;

            if (cmd.opts.gateVerifiedCharUpdate && cmd.opts.gateVerifiedChar < 5) {
                if (int.type === InteractionTypes.APPLICATION_COMMAND) await int.defer(isEphemeral ? 64 : 0);
                else if (int.type === InteractionTypes.MESSAGE_COMPONENT) await int.deferUpdate(isEphemeral ? 64 : 0);
            }

            let wanked = await DatabaseManager.helper.getCharacterLinks(int.user.id);

            // if (wanked.error) return;// interaction.createFollowup({ content: "T" })
            // if (wanked.type !== 1) return; // for intellisense

            if (wanked.length === 0 || !wanked.some(v => v.exp > 35922)) {
                if (cmd.opts.gateVerifiedChar < 3) return (int.type === InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE) ? int.result([{ name: "Command is for users with linked characters (over level 40).", value: "ok" }]): int.deleteOriginal().then(() => { int.reply({ content: "This command is strictly available to users that have linked a level 40 character.", components, flags: 64 }) })
                /*if (int.gateVerifiedChar > 2 && int.gateVerifiedChar < 5) {
                    // TODO: set database value once
                    if (client.warned === undefined) client.warned = [];
                    else if (!client.warned.includes(interaction.user.id)) {
                        client.warned.push(interaction.user.id)

                        return client.safeSend(interaction, 1)({ content: "" })
                    }
                }*/
            }
        } else if (cmd.opts.gateVerifiedChar === 69) {
            let wanked = await DatabaseManager.helper.getCharacterLinks(int.user.id);

            // if (wanked.error) return;
            // if (wanked.type !== 1) return;

            if (wanked.length === 0 || !wanked.some(v => v.exp > 35922)) {
                return (int.type === InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE) ? int.result([{ name: "Command is for users with linked characters (over level 40).", value: "ok" }]): int.reply({ content: "This command is strictly available to users that have linked a level 40 character!", components, flags: 64 });
            }
        }
    }

    const appropReturn = () => {
        // i fucking hate ts for this, im relatively new to this so pls
        if (int.type === InteractionTypes.APPLICATION_COMMAND && cmd.isAppCmd()) return cmd.func({ client: this, interaction: int });
        if (int.type === InteractionTypes.MESSAGE_COMPONENT && cmd.isCompCmd()) return cmd.func({ client: this, interaction: int, variables: variables });
        if (int.type === InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE && cmd.isAutoCmd()) return cmd.func({ client: this, interaction: int });
        if (int.type === InteractionTypes.MODAL_SUBMIT && cmd.isModalCmd()) return cmd.func({ client: this, interaction: int, variables: variables });
    }

    if (!cmd.opts.waitFor) return appropReturn();
    else {
        const pass = cmd.opts.waitFor.filter(load => {
            switch (load) {
                case "DATABASE": return false; // !database.initialised;
                case "DESIGNNOTE": return false; // !designnote.initialised;
                case "EPICDUEL": return Swarm.getClient(v => v.connected) === undefined;//false; // !(epicduel.initialised && epicduel.client.smartFox.connected);
                case "LOBBY": return Swarm.getClient(v => v.connected && v.lobbyInit) === undefined;//false; // !(epicduel.client && epicduel.client.lobbyInit);
                default: return false;
            }
        })
        
        if (Date.now() > (int.createdAt.getTime() + 2800) && first) return;
        if (Date.now() > (int.createdAt.getTime() + (1000*60*14)) && !first) return;

        if (!pass.length) return appropReturn();
        if (int.type === InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE) return; // no.

        // if (first && (cmd.opts.waitFor.includes("EPICDUEL") || cmd.opts.waitFor.includes("LOBBY"))) {//  && !(epicduel.initialised && epicduel.client.smartFox.connected) && !epicduel.reconnectable) {
        //     // let content = (epicduel.reasonForOffline && epicduel.reasonForOffline != '') ? "Woop, the bot isn't connected to an EpicDuel instance, due to the following reason from the developer:\n" + epicduel.reasonForOffline : "Woop, the bot isn't connected to an EpicDuel instance, this may be due to the fact that it has attempted to reconnect so many times, or the developer has manually shut it off so it can't reconnect. If there's another reason for this, the developer being a dumbo forgot to give it.";

        //     // return client.safeSend(interaction, 1)({content, flags: 64});
        // }

        if (first) int.reply({ content: `The bot has just connected, it's currently loading up the following manager/s or module/s: ${pass.map(a => '`' + a + '`').join(', ')}.\nThis command will be executed once they're done.`, flags: 64 });

        setTimeout(() => {
            executeCommand.bind(this)(int, cmd, variables, false);
        }, 1000);
    }
}

/**
 * @param customIds This will be the list of custom id for `customID` to be tested with.
 * @param customId 
 * 
 * Does not return ID and variables if match is false.
 */
function matchCustomID(customIds: string[] | string, customId: string) {
    function returnResult(match:boolean=false, id:string='', variables: Record<string, string> = {}) {
        return {match, variables, id};
    }

    if (!Array.isArray(customIds) || !customIds.length) return returnResult();
    if (customId === '') return returnResult();

    const cum = customId.split("_");

    for (let i = 0; i < customIds.length; i++) {
        if (customIds[i] === customId) return returnResult(true, customIds[i]);

        const cums = customIds[i].split("_");

        if (cums.length === cum.length) {
            const result = {} as Record<string, string>; let bust = false;

            for (let y = 0, len = cums.length; y < len; y++) {
                if (bust) continue;
                if (cums[y] === cum[y]) continue;

                const match = cums[y].match(/\<.{0,}\>/g);

                if (match) {
                    result[match[0].slice(1, -1)] = cum[y];
                } else bust = true;
            }

            if (!bust) return returnResult(true, customIds[i], result);
            else continue;
        } else continue;
    }

    return returnResult();
}

export default new ClientEvent("interactionCreate", function (int) {

    let cmd: Command | undefined;
    let vars: Record<string, string> | undefined;
    
    let commandName: string | undefined;

    switch (int.type) {
        case InteractionTypes.APPLICATION_COMMAND:
            // TODO: function or w/e instead of copy pasting this line ish
            commandName = (int.data.type === ApplicationCommandTypes.CHAT_INPUT && int.data.options.raw.length ? int.data.name + " " + (
                int.data.options.raw[0].type === ApplicationCommandOptionTypes.SUB_COMMAND || int.data.options.raw[0].type === ApplicationCommandOptionTypes.SUB_COMMAND_GROUP ? int.data.options.getSubCommand()?.join(" ") : ""
            ) : int.data.name).trimEnd();

            switch (int.data.type) {
                case ApplicationCommandTypes.CHAT_INPUT:
                    cmd = CommandHandler.appCmdMap[commandName];
                    break;
                case ApplicationCommandTypes.USER:
                    const alias = CommandHandler.aliasesMapCmdName[commandName];

                    if (alias) {
                        cmd = CommandHandler.appCmdMap[alias];
                    }
                    break;
                default:
                    Logger.getLogger("Discord").warn("Unrecognised application command was used: " + commandName);
                    return int.createMessage({ content: "You've used a type of command not recognised by the bot!", flags: 64 });
            }
            break;
        case InteractionTypes.MESSAGE_COMPONENT:
            switch (int.data.componentType) {
                case ComponentTypes.BUTTON: case ComponentTypes.STRING_SELECT:
                    let coomId = matchCustomID(CommandHandler.compKeys, int.data.customID);

                    if (!coomId.match) {
                        Logger.getLogger("Discord").warn("Unrecognised component was invoked: " + int.data.customID);
                        return int.createMessage({content: "The bot does not recognise this component, sorry! :c", flags: 64});
                    }

                    cmd = CommandHandler.componentCmdMap[coomId.id];
                    vars = coomId.variables;

                    break;
                default:
                    Logger.getLogger("Discord").warn("Unrecognised component type was invoked: " + int.data.customID + ", type: " + int.data.componentType);
                    return int.createMessage({ content: "You've used a type of component not recognised by the bot!", flags: 64 });
            }
            break;
        case InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE:
            // Autocomplete has only one response type, well as far as ik, result not createmessage so exceptionally will return here.
            commandName = (int.data.type === ApplicationCommandTypes.CHAT_INPUT && int.data.options.raw.length ? int.data.name + " " + (
                int.data.options.raw[0].type === ApplicationCommandOptionTypes.SUB_COMMAND || int.data.options.raw[0].type === ApplicationCommandOptionTypes.SUB_COMMAND_GROUP ? int.data.options.getSubCommand()?.join(" ") : ""
            ) : int.data.name).trimEnd();

            cmd = CommandHandler.autocompleteCmdMap[commandName + " " + int.data.options.getFocused(true).name];
                // default:
                //     return;// int.createMessage({ content: "You've used a type of command not recognised by the bot!", flags: 64 });

            return cmd ? executeCommand.bind(this)(int, cmd, {}, true) : undefined;

            // return int.result([{ name: "meow", value: "1234" }]);
        case InteractionTypes.MODAL_SUBMIT:
            // I'm not simplifying this with component because of the exclusion of .componentType... yes I could simplify further but i cba
            let coomId = matchCustomID(CommandHandler.compKeys, int.data.customID);

            if (!coomId.match) {
                Logger.getLogger("Discord").warn("Unrecognised component was invoked: " + int.data.customID);
                return int.createMessage({content: "The bot does not recognise this component, sorry! :c", flags: 64});
            }

            cmd = CommandHandler.componentCmdMap[coomId.id];
            vars = coomId.variables;

            break;
    }

    if (!cmd) {
        return int.createMessage({ content: "The bot don't have a response for that command you've used.", flags: 64});
    }

    // We have a functional command, now let's check for everything before using.
    executeCommand.bind(this)(int, cmd, vars ?? {}, true);
});