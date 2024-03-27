export type ImportResult<T> = Record<"default", T> | T;

// Thanks to @aquapi (github) for these, they were URI segments originally but adapted to taking <abc> from string

/**
 * Infer an URL segment parameter
 */
type Segment<T extends string> =
    T extends `<${infer Param}>` ? Param
    : string;

/**
 * Infer \<content\> from string
 */
export type ExtractThans<Str extends string> = Str extends `${infer Part}_${infer Rest}`
    ? Segment<Part> | ExtractThans<Rest> : Segment<Str>;