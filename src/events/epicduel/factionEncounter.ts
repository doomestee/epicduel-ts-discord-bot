import DatabaseManager from "../../manager/database.js";
import EDEvent from "../../util/events/EDEvent.js";

export default new EDEvent("onFactionEncounter", async (hydra, { fact }) => {
    if (!fact || fact.id === 0) return;    
    
    await DatabaseManager.upsert("faction", fact as any, ["id"]);
    // let v = 
        // .catch(e => {return {error: e}});

    // if (v) {
    //     logger.error(v.error);
    // }
    
    // if (database.cache.faction[2]) {
    //     let index = database.cache.faction[2].findIndex(v => v.id === fct.id);

    //     if (index === -1) return database.cache.faction[2].push(obj);

    //     database.cache.faction[2][index] = obj;
    // }
});