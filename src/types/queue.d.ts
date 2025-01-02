import type Hydra from "../manager/discord.ts";
import type Swarm from "../manager/epicduel.ts";
import type Queue from "../structures/queue/GenericQueue.ts";
import type MultQueue from "../structures/queue/SubGenericQueue.ts";

export interface QueueFuncParameters {
    hydra: Hydra;
}

export type QueueFuncResult = { queue: Queue | MultQueue, type: keyof Hydra["queues"] };

export type QueueFunc = (params: QueueFuncParameters) => QueueFuncResult;