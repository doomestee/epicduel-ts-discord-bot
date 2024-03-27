import { AnyAutocompleteInteraction, AnyCommandInteraction, AnyComponentInteraction, AnyModalSubmitInteraction, AutocompleteInteraction, CommandInteraction, ComponentInteraction, Interaction, ModalSubmitInteraction, PermissionName } from "oceanic.js";
import type Hydra from "../manager/discord.js";
import { ExtractThans } from "./types.js";

/**
 * NOTE: application ALSO include user command (in case of a slash command with alternative user dropdown command) and message command.
 */
export enum CommandType {
    Application = "application",
    Component = "component",
    Autocomplete = "autocomplete",
    Modal = "modal",
}

//export type CommandType = "application" | "component" | "autocomplete" | "modal";

type InteractionFromCmdType<T extends CommandType>
    = T extends "application" ? AnyCommandInteraction
    : T extends "component" ? AnyComponentInteraction
    : T extends "autocomplete" ? AnyAutocompleteInteraction
    : T extends "modal" ? AnyModalSubmitInteraction : never;
    

export interface BaseCommandOptions<T extends CommandType> {
    /**
     * Default: undefined. How long is the cooldown upon execution of the command? Note if the command did not start, the cooldown will only be couned when the command is resumed. Millisecond. Put 0 for no cooldown. If the command is autocomplete, this won't be used.
     */
    cooldown?: number;
    /**
     * The command's description.
     */
    description?: string;
    /**
     * NOTE: this isn't sub command group or whatever, just for grouping in /help at least.
     * 
     * The category of the command, for eg it **could** be "Moderation" if it's a ban command. If the command is autocomplete, this won't be used.
     */
    category?: string;
    /**
     * Checks if the **member** has ALL of the permissions passed. If an element of the array is an array, it will be checked if the member has ANY of the permissions in the array.
     */
    permissionsMember?: (PermissionName | PermissionName[])[];
    /**
     * Checks if the **bot** has ALL of the permissions passed. If an element of the array is an array, it will be checked if the bot has ANY of the permissions in the array.
     */
    permissionsBot?: (PermissionName | PermissionName[])[];
    /**
     * If the type is 0, user. If the type is 1, role. If the type is 2, channel. If the type is 3, guild. If the type is -1, maintainers. NOTE this is the members permission check, the bot's permission check is not affected by this.
     */
    exceptionPermissionsCheck?: [-1|0|1|2|3, string][];
    /**
     * Whether if the command can be used even if ED client is in restricted mode. Default is true.
     */
    usableEdRestricted?: boolean;
    /**
     * Whether if the command can be used only by those that have linked a character, note that by doing so this will defer the message (1, or 2 for ephemeral), or should notify the user once that the command will soon be gated, note that by doing so this will defer the message (3, or 4 for ephemeral). If set to none, or 0, it'll allow all. You can set to 69 or 70 and either will not defer, but will either restrict to verified or warn respectively.
     */
    gateVerifiedChar?: 0|1|2|3|4 | 69 | 70;
    gateVerifiedCharUpdate?: boolean;
    /**
     * Whether if the command should be ignored, so it won't be executed as it won't be added to the handler at start up.
     */
    ignore?: boolean;
    /**
     * If set to true, this command will not be uploaded if the bot instance is production.
     */
    debugOnly?: boolean;
    waitFor?: ("EPICDUEL" | "LOBBY" | "DATABASE" | "DESIGNNOTE")[];
}

export interface ApplicationCommandOptions extends BaseCommandOptions<CommandType.Application> {
    cmd: [string] | [string, string] | [string, string, string];
    /**
     * List of the name for user commands.
     */
    aliases?: string[];
}

export interface ComponentCommandOptions extends BaseCommandOptions<CommandType.Component | CommandType.Modal> {
    /**
     * MUST BE USED if the command is a component and has a custom id. If the custom ID is dynamic, wrap the identifier in <> so something like "player_search_\<id\>" would work if it's "player_search_483975193475194". If array, it must be of string, each element being the custom id. The custom id that was used will be sent in variables._customId
     */
    custom_id: string | string[];
}

export interface AutocompleteCommandOptions extends BaseCommandOptions<CommandType.Autocomplete> {
    cmd: [string] | [string, string] | [string, string, string];
    value: string;
}

export type AnyCommand = Command<CommandType.Application|CommandType.Component|CommandType.Autocomplete|CommandType.Modal>;

type CommandFromType<T extends CommandType>
    = T extends "application" ? ApplicationCommandOptions
    : T extends "component" ? ComponentCommandOptions
    : T extends "autocomplete" ? AutocompleteCommandOptions
    : T extends "modal" ? ComponentCommandOptions : BaseCommandOptions<T>;

export type AnyCommandOptions = ApplicationCommandOptions | ComponentCommandOptions | AutocompleteCommandOptions;

type CmdRunCallback<T extends CommandType> = T extends CommandType.Component | CommandType.Modal ?
    (arg0: { client: Hydra, interaction: InteractionFromCmdType<T>, variables: Record<string, string> }) => any
    : (arg0: { client: Hydra, interaction: InteractionFromCmdType<T> }) => any;

export default class Command<T extends CommandType = CommandType> {
    func!: CmdRunCallback<T>;

    type: T;

    opts: CommandFromType<T>;

    constructor(type: T, opts: CommandFromType<T>, func?: CmdRunCallback<T>) {
        this.opts = opts;
        this.type = type;

        if (!opts.permissionsBot) opts.permissionsBot = [];
        if (!opts.permissionsMember) opts.permissionsMember = [];

        if (!opts.exceptionPermissionsCheck) opts.exceptionPermissionsCheck = [];
        if (opts.cooldown === undefined) opts.cooldown = 0;
        if (opts.gateVerifiedChar === undefined) opts.gateVerifiedChar = 0;
        if (opts.gateVerifiedCharUpdate === undefined) opts.gateVerifiedCharUpdate = false;

        if (func) this.func = func;
    }

    /**
     * I cba throwing error if the listener isn't actually a listener.
     * @param {CmdRunCallback<T>} func The code will assume that this is async so use with discretion.
     */
    attach(type: "run", func: CmdRunCallback<T>) {
        if (typeof(func) !== 'function') return this;// || !['run'].some(tyop => tyop === type)) return this;

        if (type === 'run') {
            this.func = func;
            return this;
        }

        return this;
    }

    isAppCmd() : this is Command<CommandType.Application> {
        return this.type === CommandType.Application;
    }

    isCompCmd() : this is Command<CommandType.Component> {
        return this.type === CommandType.Component;
    }

    isAutoCmd() : this is Command<CommandType.Autocomplete> {
        return this.type === CommandType.Autocomplete;
    }

    isModalCmd() : this is Command<CommandType.Modal> {
        return this.type === CommandType.Modal;
    }
}