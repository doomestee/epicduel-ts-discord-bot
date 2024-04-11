import { ButtonStyles, ComponentTypes, Embed, EmbedField, MessageActionRow } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import ItemSBox from "../../../game/box/ItemBox.js";
import Swarm from "../../../manager/epicduel.js";
import AchievementRecord from "../../../game/record/AchievementRecord.js";
import SkillsSMBox from "../../../game/box/SkillsBox.js";

let alignment = (id: number) => { return id == 0 ? "None" : id == 1 ? "Exile" : id == 2 ? "Legion" : "Unknown" };

/**
 * @param {import("../../server/structures/record/AchievementRecord")} cheevo
 */
let parseCheevo = (cheevo: AchievementRecord) => {
    return cheevo.achDetails;
}

let parseCore = (coreId: number) => {
    const allRec = SkillsSMBox.recordBySkillId("all", SkillsSMBox.recordById("core", coreId)?.skillId ?? -1);//box.recordBySkillId("all", box.recordById("core", coreId).skillId);

    if (!allRec) return "UNABLE TO GRAB SKILL DESCRIPTION";

    return Swarm.langCheck(allRec.skillDesc);
}

export default new Command(CommandType.Component, { custom_id: "tem_swf_links_<itemId>" })
    .attach('run', async ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        const itemId = parseInt(variables.itemId);

        if (ItemSBox.objMap.size === 0) return interaction.createMessage(SwarmError.noClient());

        const item = ItemSBox.objMap.get(itemId);

        if (!item) return interaction.createMessage({
            flags: 1 << 6, content: "The item isn't in the bot's items list, maybe retry again later or it doesn't exist anymore?"
        });

        let fields = [{ name: "SWF links", value: "" }];
        let assetPools = item.getAssetPool();

        if (typeof assetPools === "string") fields = [{
            name: "SWF Link (Stage)", value: `https://epicduelstage.artix.com/${assetPools}.swf`
        }, {
            name: "SWF Link (Dev)", value: `https://epicdueldev.artix.com/${assetPools}.swf`
        }]; else {
            let assets = Object.entries(assetPools);

            const vals = [[], []] as [string[], string[]];

            for (let i = 0; i < assets.length; i++) {
                vals[0].push(assets[i][0] + ": https://epicduelstage.artix.com/" + assets[i][1] + ".swf");
                vals[1].push(assets[i][0] + ": https://epicdueldev.artix.com/" + assets[i][1] + ".swf");
            }

            fields = [{
                name: "SWF Link (Stage)", value: vals[0].join("\n")
            }, {
                name: "SWF Link (Dev)", value: vals[1].join("\n")
            }]
        }

        return interaction.createMessage({
            embeds: [{
                title: "Extra for Item ID " + item.itemId,
                fields,
            }],
            flags: 1 << 6
        });
    });