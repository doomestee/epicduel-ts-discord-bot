type SwarmErrorType = "LOGIN_FAILED" | "RATELIMITED";

export class SwarmError extends Error {
    constructor(public type: SwarmErrorType, message: string, public extra?: any) {
        super(message)
    }
}