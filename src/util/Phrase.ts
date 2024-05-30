// THIS ONLY GENERATES CODE FOR VERIFICATION

import adj from "./phrase/adjectives.json" with { type: "json" };
import noun from "./phrase/nouns.json" with { type: "json" };

export function generatePhrase(adjs=2, nouns=1, separator=' ') {
    let result = '';

    for (let i = 0; i < adjs; i++) {
        result += adj[Math.floor(Math.random() * adj.length)] + separator;
    }

    for (let y = 0; y < nouns; y++) {
        result += noun[Math.floor(Math.random() * adj.length)] + separator;
    }

    return result.slice(0, -1).trim();
}