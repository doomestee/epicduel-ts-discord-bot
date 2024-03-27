import { readdir } from "fs/promises";
import Config from "../config/index.js";
import type Hydra from "../manager/discord.js";
import Command, { AnyCommand, CommandType } from "../util/Command.js";
import { ImportResult } from "../util/types.js";
import { glob } from "glob";
import Logger from "../manager/logger.js";
import { ApplicationCommandOptionTypes, ApplicationCommandOptionsSubCommand, ApplicationCommandOptionsSubCommandGroup, ApplicationCommandTypes, CreateApplicationCommandOptions, CreateApplicationCommandOptionsBase, CreateChatInputApplicationCommandOptions } from "oceanic.js";
import CmdsInfo from "../cmds.json" assert { type: "json" };

export default class CommandHandler {
    static aliasesMapCmdName: Record<string, string> = {};

    /**
     * This is equivalent to Object.keys() of componentCmdMap;
     * This is useful as we don't need to then use object.keys every single time for comp map.
     */
    static compKeys: string[] = [];

    static appCmdMap: Record<string, Command<CommandType.Application>> = {};
    static componentCmdMap: Record<string, Command<CommandType.Component | CommandType.Modal>> = {};
    static autocompleteCmdMap: Record<string, Command<CommandType.Autocomplete>> = {};

    static registerCommand(cmd: AnyCommand) {
        switch (cmd.type) {
            case CommandType.Application:
                if (!cmd.isAppCmd()) return;

                const fullCmdName = cmd.opts.cmd.join(" ");

                this.appCmdMap[fullCmdName] = cmd;

                if (cmd.opts.aliases?.length) {
                    for (let i = 0, len = cmd.opts.aliases.length; i < len; i++) {
                        this.aliasesMapCmdName[cmd.opts.aliases[i]] = fullCmdName;
                    }
                }
                
                break;
            case CommandType.Component: case CommandType.Modal:
                if (!cmd.isCompCmd()) return;

                const cId: string[] = typeof cmd.opts.custom_id === "string" ? [cmd.opts.custom_id] : cmd.opts.custom_id;

                for (let i = 0, len = cId.length; i < len; i++) {
                    this.componentCmdMap[cId[i]] = cmd;
                    this.compKeys.push(cId[i]);
                }
                break;
            case CommandType.Autocomplete:
                if (!cmd.isAutoCmd()) return;

                this.autocompleteCmdMap[cmd.opts.cmd.join(" ") + " " + cmd.opts.value] = cmd;
                break;
            default:
                throw Error("Unknown Command type: " + cmd.type + ".");
                break;
        }
    }

    static async loadCommands() {
        const files = await glob("**/*.js", { cwd: Config.commandsDirectory, withFileTypes: false });

        let countApp = 0;
        let countComp = 0;
        let countAuto = 0;

        for (let i = 0, len = files.length; i < len; i++) {
            const path = `${Config.commandsDirectory}/${files[i]}`
            // const { path } = files[i];

            // // Traverse downwards to interactions folder

            // let parent = files[i].parent;

            // for (let i = 0; i < 5; i++) {
            //     // A maximum of 4 traversals.

            //     if (files[i].name === "interactions") break;

            //     parent = files[i].name
            // }

            // if (files[i].parent)

            let cmd = await import(path) as ImportResult<Command>;

            if ("default" in cmd) {
                cmd = cmd.default;
            }

            if (!(cmd instanceof Command)) {
                throw new TypeError(`Export of event file "${path}" is not an instance of Command.`);
            }

            if (cmd.opts.ignore === true) continue;

            this.registerCommand(cmd);

            if (cmd.type === CommandType.Application) countApp++;
            if (cmd.type === CommandType.Component || cmd.type === CommandType.Modal) countComp++;
            if (cmd.type === CommandType.Modal) countAuto++;
        }

        Logger.getLogger("Events").debug(`Successfully loaded ${countApp} application command(s), ${countComp} component(s) and ${countAuto} autocomplete(s).`);
    }

    // static async uploadCommands(cli: Hydra, applicationId?: string) {
    //     applicationId = applicationId ?? cli.application.id;

    //     // cli.rest.applications.bulkEditGlobalCommands(applicationId, )

    //     const commands: Record<string, CreateApplicationCommandOptions> = {};

    //     let keys:string[] = Object.keys(this.appCmdMap);

    //     for (let i = 0, len = keys.length; i < len; i++) {
    //         const key = keys[i];
    //         const cmd = this.appCmdMap[key];

    //         const frags = key.split(" ");

    //         if (commands[frags[0]] === undefined) {
    //             commands[frags[0]] = {
    //                 name: frags[0],
    //                 type: ApplicationCommandTypes.CHAT_INPUT,
    //                 description: CmdsInfo[frags[0] as "war"].cmd.description,
    //             }
    //         }

    //         const command = commands[frags[0]] as CreateChatInputApplicationCommandOptions;

    //         let stack: ApplicationCommandOptionsSubCommandGroup | ApplicationCommandOptionsSubCommand;

    //         if (frags[1] || frags[2]) {
    //             stack = {
    //                 type: ApplicationCommandOptionTypes.SUB_COMMAND,
    //                 description: CmdsInfo[frags[0] as "war"].[frags[1] as "current"].cmd.description
    //             }
    //         }

    //         command.options?.push({
    //             type: ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
    //             options: [{
    //                 type: ApplicationCommandOptionTypes.SUB_COMMAND,
    //                 options: [{
    //                     type: ApplicationCommandOptionTypes.STRING
    //                 }]
    //             }]
    //         })

    //     }

    //     console.log(Object.keys(this.appCmdMap));
    //     console.log(Object.keys(this.aliasesMapCmdName));
    //     process.exit();
    // }
}