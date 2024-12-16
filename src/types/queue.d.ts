import type Hydra from "../manager/discord.ts";
import type Swarm from "../manager/epicduel.ts";
import type Queue from "../structures/queue/GenericQueue.ts";

export interface QueueFuncParameters {
    hydra: Hydra;
}

export type QueueFuncResult = { queue: Queue, type: keyof Hydra["queues"] };

export type QueueFunc = function (params: QueueFuncParameters) : QueueFuncResult;