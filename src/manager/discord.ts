import { Client, Member, User, ActivityTypes, Permissions, ApplicationCommandTypes, ApplicationCommandOptionTypes, InteractionContextTypes, ApplicationIntegrationTypes, ChannelTypes } from "oceanic.js";
import type { AnyCommandInteraction, AnyComponentInteraction, CreateApplicationCommandOptions } from "oceanic.js";
import MessageStorage from "../structures/storage/MessageStorage.js";
import Config from "../config/index.js";
import { readdir } from "fs/promises";
import ClientEvent from "../util/ClientEvent.js";
import Logger from "./logger.js";
import { ImportResult } from "../util/types.js";
import CommandHandler from "../handler/command.js";

interface UserProcessState {
    refreshLb: boolean;
}

interface MainMessageStorage {
    track: { [characterId: string]: number },
    state: boolean,
    users: { [characterId: string]: string },
    whites: string[],
    aaa: boolean,
    autoBattle: { onPwHour: boolean, lastDone: number, left: number },
    haltSnipe: boolean
}

export default class Hydra extends Client {
    connectedAt = 0;
    constants = {
        emojiDumps: ['1145075233917784096', '1145075357494562856', '1145473576619753553'],
        maintainers: ["635231533137133589", "339050872736579589"],//['339050872736579589', '635231533137133589'],
        msgLogs: ["387423611406909440", "293099269064359936"],

        // If each and all votes in, they'll become maintainers.
        emergencyTacts: ['339050872736579589', '635231533137133589', '346018784101793793'],
        emergencyVotes: [] as string[]
    };

    messages = [] as unknown as [MessageStorage<MainMessageStorage>];

    cache = {
        /**
         * 1st index is the ID of the discord user, 2nd is the code, 3rd is the milliseconds of when the code's been created (plus 15 minutes) to indicate expiration, 4th is the interaction ID, 5th is the interaction token.
         */
        codes: [] as [string, string, number, string, string][],
        /**
         * Object of character id to an object with their chat content and time of posted, another property for when the user's muted, and for how long.
         */
        edChat: {} as { [charID: string|number]: { msg: {c: string, t: number}[], mutedUntil?: number, repeats: number, ignores: string[] }},
        war: {},
    }

    processing = {} as { [discordId: string]: UserProcessState };

    debug = process.env.DISCORD_DEBUG === "true" || false;

    constructor() {
        super({
            defaultImageFormat: "png",
            defaultImageSize: 4096,
            collectionLimits: {
                messages: 1,
                members: 5,
                users: 20
            },
            auth: `Bot ${Config.botToken}`,
            gateway: {
                intents: ["GUILDS"],
                presence: {
                    activities: [{
                        type: ActivityTypes.CUSTOM,
                        name: "Booting up..."
                    }],
                    status: "idle"
                }
            }
        });
    }

    async launch() {
        await this.loadEvents();
        await CommandHandler.loadCommands();
        await this.refreshCommands(await this.rest.applications.getClient().then(ap => ap.id));//CommandHandler.uploadCommands(this, await this.rest.applications.getClient().then(ap => ap.id));

        this.connectedAt = Date.now();
        return this.connect();
    }

    async loadEvents() {
        const events = (await readdir(Config.eventsDirectory + "/discord", { withFileTypes: true }));

        let suc = 0;

        for (let i = 0, len = events.length; i < len; i++) {
            const file = events[i];

            if (!file.isFile()) continue;

            const path = `${Config.eventsDirectory}/discord/${file.name}`;

            let ev = await import(path) as ImportResult<ClientEvent>;

            if ("default" in ev) {
                ev = ev.default;
            }

            if (!(ev instanceof ClientEvent)) {
                throw new TypeError(`Export of event file "${path}" is not an instance of ClientEvent.`);
            }

            this.on(ev.name, ev.listener.bind(this));
            suc++;
        }

        Logger.getLogger("Events").debug(`Loaded ${suc} event(s).`);
    }

    /**
     * It will check if userId exists on processing, if not then will create one for it.
     * Returns the process state for the user.
     */
    userStateCheck(userId: string) : UserProcessState {
        if (this.processing[userId]) return this.processing[userId];

        else return this.processing[userId] = { refreshLb: false };
    }

    isMaintainer(user: string | User | Member ) {
        const id = typeof user === "string" ? user : user instanceof User ? user.id : user.user.id;

        return this.constants.maintainers.includes(id);
    }

    /**
     * I honestly don't want to touch the returns type of this function.
     * @param type 1 for creating a message, 2 for editing original message (FOR COMPONENT)
     */
    safeSend(interaction: AnyCommandInteraction | AnyComponentInteraction, type: 1 | 2) {
        if (type === 1) return (interaction.acknowledged) ? interaction.createFollowup.bind(interaction) : interaction.createMessage.bind(interaction);
        if (type === 2) return (interaction.acknowledged || interaction.type != 3) ? interaction.editOriginal.bind(interaction) : interaction.editParent.bind(interaction);
        return (interaction.acknowledged) ? interaction.createFollowup.bind(interaction) : interaction.createMessage.bind(interaction);
    }

    /**
     * For storage/utilities (just useless ik)
     */
    async loadMessage<T extends Object>(channelID: string, messageID: string) {
        return this.rest.channels.getMessage(channelID, messageID)
            .then((msg) => new MessageStorage<T>(this, msg));
    }

    /**
     * @param {number[]} charIDs 
     * @param {string} discordID 
     */
    addIDs(charIDs: number[], discordID: string) {
        if (!Array.isArray(charIDs)) charIDs = [charIDs];

        for (let i = 0; i < charIDs.length; i++) {
            this.messages[0].value.users[charIDs[i]] = discordID;
        }

        return this.messages[0].save();
    }

    refreshCommands(applicationId?: string) {
        let lbs = [["1v1 Wins", "2v2 Wins", "Juggernaut Wins", "Personal Influence", "Fame", "Inventory Rarity", "Faction 1v1 Champions", "Faction 2v2 Champions", "Faction Juggernaut Champions", "World Dominations", "War Upgrades", "Faction Influence", "Code Redeems", "Player Rating"].map(v => 'All - ' + v), ["1v1 Wins (Default)", "2v2 Wins", "Juggernaut Wins", "Faction 1v1 Wins", "Faction 2v2 Wins", "Faction Juggernaut Wins", "Fame", "Code Redeems"].map(v => 'Daily - ' + v), "Custom (Bot) - Fame for Fame"];//['All - 1v1 Wins', 'All - 2v2 Wins', 'Daily - 1v1 Wins', 'Daily - 2v2 Wins', 'Daily - Faction 1v1 Wins', 'Daily - Faction 2v2 Wins', 'All - World Dominations', 'All - Faction 1v1 Champions', 'All - Faction 2v2 Champions', 'All - War Upgrades', 'All - Personal Influence', 'All - Faction Influence', 'All - Inventory Rarity', 'All - Fame', 'Daily - Fame', 'All - Juggernaut Wins', 'Daily - Juggernaut Wins', 'Daily - Faction Juggernaut Wins', 'All - Faction Juggernaut Champions', 'Daily - Code Redeems', 'All - Code Redeems', 'All - Player Rating'];
        let correspondingIndexes = [1, 2, 16, 11, 14, 13, 8, 9, 19, 7, 10, 12, 21, 22, 3, 4, 17, 5, 6, 18, 15, 20, 666] as const;

        const commands: CreateApplicationCommandOptions[] = [{
            name: "war", description: "War commands.", type: ApplicationCommandTypes.CHAT_INPUT,
            options: [{
                name: "current", description: "Shows the current status of the war.",
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
            }, {
                name: "leader", description: "Shows the current top 20 leaders of the war.",
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [{
                    name: "alignment", description: "See the leaders of the given alignment, DEFAULT: Exile.", required: false,
                    type: ApplicationCommandOptionTypes.INTEGER,
                    choices: [{ name: "Exile (default)", value: 1}, { name: "Legion", value: 2}],
                }, {
                    name: "mode", description: "The type of leaderboard. Daily is default, unless war has ended then Overall.", required: false,
                    type: ApplicationCommandOptionTypes.INTEGER,
                    choices: [{ name: "Daily", value: 1}, {name: "Overall", value: 2}]
                }, {
                    name: "region", description: "The region of the war to fetch leaders from. Default is the current war region.", required: false,
                    type: ApplicationCommandOptionTypes.INTEGER,
                    choices: [{
                        name: "Fortune City", value: 1
                    }, {
                        name: "Central Station", value: 2
                    }, {
                        name: "Naval Yard", value: 3
                    }, {
                        name: "Overlord Facility", value: 4
                    }, {
                        name: "Bio Preserve", value: 5
                    }, {
                        name: "Barrens Outpost", value: 6
                    }, {
                        name: "Wasteland", value: 7
                    }, {
                        name: "Frysteland", value: 8
                    }, {
                        name: "Infernal", value: 9
                    }, {
                        name: "Dread Plains", value: 10
                    }]
                }]
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "character", description: "ed character stuff", type: ApplicationCommandTypes.CHAT_INPUT,
            options: [{
                name: "link", description: "Links ED character in game to your discord user (UNOFFICIAL).",
                type: ApplicationCommandOptionTypes.SUB_COMMAND
            }, {
                name: "unlink", description: "Unlinks ED character.",
                type: ApplicationCommandOptionTypes.SUB_COMMAND
            }, { 
                name: "list", description: "Lists all of your characters linked.",
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [{
                    required: false, type: ApplicationCommandOptionTypes.USER, name: "user", description: "The user to get the linked characters from.",
                }]
            }, {
                name: "search", description: "Search for a character by their name!",
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                options: [{
                    required: true, type: ApplicationCommandOptionTypes.STRING, name: "name", description: "The exact, case-insensitive name of the character to find."
                }]
            }, {
                name: "manage", description: "Manage your linked characters.",
                type: ApplicationCommandOptionTypes.SUB_COMMAND
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "notification", description: "Notifying mummy", type: ApplicationCommandTypes.CHAT_INPUT,
            options: [{
                name: "rally", description: "Rally notifications",
                type: ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                options: [{
                    type: ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: "Creates a rally notification",
                    name: "create", options: [{
                        type: ApplicationCommandOptionTypes.STRING,
                        name: "type", description: "The type of the rally", required: true, choices: [{name: "Legion", value: "warRallyLegion"}, {name: "Exile", value: "warRallyExile"}]
                    }, {
                        type: ApplicationCommandOptionTypes.STRING,
                        name: "message", description: "Message to send when there's a rally.", required: true
                    }, {
                        type: ApplicationCommandOptionTypes.CHANNEL,
                        name: "channel", description: "Channel to send the message to. If not set, it'll be sent to the channel the command was used in.", required: false,
                        channelTypes: [ChannelTypes.GUILD_TEXT, ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD]
                    }]
                }, {
                    type: ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: "Removes a rally notification",
                    name: "delete", options: [{
                        type: ApplicationCommandOptionTypes.INTEGER,
                        name: "id", description: "The ID of the notification to delete.", required: true, autocomplete: true
                    }]
                }]
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "faction", description: "Fascism!", type: 1, options: [{
                type: 1, name: "view", description: "The faction to look up details for!", options: [{
                    type: 4, autocomplete: true,
                    name: "name", description: "The name of the faction (or ID).", required: true
                }]
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "battle-pass", description: "Battle pass stuff", type: 1, options: [{
                type: 1, name: "view", description: "Checks the battle pass and it's challenges etc.",
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "mission", description: "Mission", type: 1, options: [{
                type: 1, name: "daily", description: "Lists all of the daily mission chains."
            }, {
                type: 1, name: "recent", description: "Lists the newly added mission chains."
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "help", description: "Get the list of available (slash) commands.", type: 1,
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "note", description: "Design deez nu- i mean notes.", type: 1, options: [{
                name: "register",
                description: "This will register the channel to receive design notes notifications.",
                type: 1,
                options: [{
                    type: 7, name: 'channel', description: 'The channel to pool.', required: true, channelTypes: [0]
                }]
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            type: ApplicationCommandTypes.USER, name: "Linked Character(s)", nameLocalizations: {
                "tr": "Bağlantılı Karakterler",
                "hi": "जुड़े हुए पात्र"
            },
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "leaderboard", description: "leading the soldiers!", type: ApplicationCommandTypes.CHAT_INPUT,
            options: [{
                type: ApplicationCommandOptionTypes.SUB_COMMAND, name: "fetch", description: "Fetches the leaderboard.",
                options: [{
                    name: "type", description: "Type of leaders to fetch (DEFAULT: 1v1)", type: ApplicationCommandOptionTypes.INTEGER,
                    choices: lbs.flat(1).map((v, i) => {return {name: v, value: correspondingIndexes[i]}})//['All - 1v1 Wins', 'All - 2v2 Wins', 'Daily - 1v1 Wins', 'Daily - 2v2 Wins', 'Daily - Faction 1v1 Wins', 'Daily - Faction 2v2 Wins', 'All - World Dominations', 'All - Faction 1v1 Champions', 'All - Faction 2v2 Champions', 'All - War Upgrades', 'All - Personal Influence', 'All - Faction Influence', 'All - Inventory Rarity', 'All - Fame', 'Daily - Fame', 'All - Juggernaut Wins', 'Daily - Juggernaut Wins', 'Daily - Faction Juggernaut Wins', 'All - Faction Juggernaut Champions', 'Daily - Code Redeems', 'All - Code Redeems', 'All - Player Rating'].map((v, i) => { return { name: v, value: i + 1}; })
                }] 
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "tournament", description: "tourney time", type: ApplicationCommandTypes.CHAT_INPUT,
            options: [{
                type: ApplicationCommandOptionTypes.SUB_COMMAND, name: "fetch",
                description: "Fetches the current tournament leaders."
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "core", description: "Core stuff!", type: ApplicationCommandTypes.CHAT_INPUT,
            options: [{
                type: ApplicationCommandOptionTypes.SUB_COMMAND, description: "Search for details of a core.",
                name: "search", options: [{
                    type: ApplicationCommandOptionTypes.INTEGER, description: "Name of the core to search for.",
                    name: "name", autocomplete: true, required: true
                }]
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "item", description: "Item stuff!", type: ApplicationCommandTypes.CHAT_INPUT,
            options: [{
                type: ApplicationCommandOptionTypes.SUB_COMMAND, description: "See more information about an item!",
                name: "search", options: [{
                    type: ApplicationCommandOptionTypes.INTEGER, description: "Name of the item to search for.",
                    name: "name", autocomplete: true, required: true
                }]
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "npc", description: "NPC stuff...", type: ApplicationCommandTypes.CHAT_INPUT, options: [{
                type: ApplicationCommandOptionTypes.SUB_COMMAND, description: "See more information about a particular NPC!",
                name: "search", options: [{
                    type: ApplicationCommandOptionTypes.INTEGER, description: "ID of the NPC (name via autocomplete)",
                    name: "id", autocomplete: true, required: true,
                }]
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "gifting", description: "Gifting stuff...", type: ApplicationCommandTypes.CHAT_INPUT, options: [{
                type: ApplicationCommandOptionTypes.SUB_COMMAND_GROUP, description: "Grouppppp",
                name: "board", options: [{
                    type: ApplicationCommandOptionTypes.SUB_COMMAND, description: "Fetches the current top 10 gifting leaders.",
                    name: "fetch"
                }],
            }],
            contexts: [InteractionContextTypes.GUILD],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }, {
            name: "track", description: "MISC", type: ApplicationCommandTypes.CHAT_INPUT,
            contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.BOT_DM],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL],
        }];

        commands.splice(0);

        commands.push({
            name: "test",
            description: "test",
            type: ApplicationCommandTypes.CHAT_INPUT,
        }, {
            name: "testa",
            description: "testa",
            type: ApplicationCommandTypes.CHAT_INPUT,
            options: [{
                type: ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
                name: "bcd", description: "ok",
                options: [{
                    type: ApplicationCommandOptionTypes.SUB_COMMAND,
                    name: "efg", description: "nice"
                }]
            }]
        }, {
            name: "admin",
            description: "Administration stuff.",
            contexts: [InteractionContextTypes.GUILD],
            defaultMemberPermissions: "8",
            type: ApplicationCommandTypes.CHAT_INPUT,
            options: [{
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                name: "eval",
                description: "yes",
                options: [{
                    name: "msg",
                    description: "yeah",
                    type: ApplicationCommandOptionTypes.STRING,
                    required: true
                }, {
                    name: "async",
                    description: "yeah",
                    type: ApplicationCommandOptionTypes.INTEGER,
                    choices: [{
                        name: "True - Return",
                        value: 1
                    }, {
                        name: "True",
                        value: 2
                    }]
                }]
            }]
        }, {
            name: "character",
            type: ApplicationCommandTypes.CHAT_INPUT,
            description: "characterise",
            contexts: [InteractionContextTypes.BOT_DM, InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL, ApplicationIntegrationTypes.USER_INSTALL],
            options: [{
                name: "search",
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                description: "DEV",
                options: [{
                    type: ApplicationCommandOptionTypes.STRING,
                    description: "DEV", name: "name", required: true,
                    minLength: 1, maxLength: 50
                }]
            }, {
                name: "manage",
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                description: "DEV",
            }, {
                name: "list",
                type: ApplicationCommandOptionTypes.SUB_COMMAND,
                description: "DEV",
                options: [{
                    type: ApplicationCommandOptionTypes.USER,
                    description: "The user to get the linked characters from.", name: "user",
                    required: false
                }]
            }]
        }, {
            name: "youre-gay",
            type: ApplicationCommandTypes.CHAT_INPUT,
            description: "test",
            contexts: [InteractionContextTypes.BOT_DM, InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL],
            integrationTypes: [ApplicationIntegrationTypes.GUILD_INSTALL, ApplicationIntegrationTypes.USER_INSTALL],
            options: [{
                type: ApplicationCommandOptionTypes.STRING,
                description: "DEV", name: "a", required: true
            }]
        });

        if (commands.length !== 5) process.exit(1);

        return this.rest.applications.bulkEditGlobalCommands(applicationId ?? this.application.id, commands);
    }

    get emojis() {
        let result = [];

        for (let i = 0; i < this.constants.emojiDumps.length; i++) {
            const guild = this.guilds.get(this.constants.emojiDumps[i]);

            if (guild === undefined) throw Error("One of the emoji dump server isn't in cache.");

            const emojis = guild.emojis.toArray();

            for (let y = 0, length = emojis.length; y < length; y++) {
                result.push({id: emojis[y].id, name: emojis[y].name})
            }
        }; return result;
    }

    get emojiObjs() {
        const result: { [emojiId: string]: string } = {};

        for (let i = 0; i < this.constants.emojiDumps.length; i++) {
            const guild = this.guilds.get(this.constants.emojiDumps[i]);

            if (guild === undefined) throw Error("One of the emoji dump server isn't in cache.");

            const emojis = guild.emojis.toArray();

            for (let y = 0, length = emojis.length; y < length; y++) {
                result[emojis[y].name] = emojis[y].id;
            }
        }; return result;
    }
}