/* tslint:disable */
/* eslint-disable */

export class Game {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * difficulty: 0=easy, 1=medium, 2=hard, 3=expert, 4=master
     */
    ai_move(difficulty: number): any;
    current_player(): string;
    get_board(): any;
    get_winner(): any;
    is_draw(): boolean;
    move_count(): number;
    constructor();
    play_move(x: number, y: number): boolean;
    reset(): void;
    undo(): boolean;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_game_free: (a: number, b: number) => void;
    readonly game_ai_move: (a: number, b: number) => any;
    readonly game_current_player: (a: number) => [number, number];
    readonly game_get_board: (a: number) => any;
    readonly game_get_winner: (a: number) => any;
    readonly game_is_draw: (a: number) => number;
    readonly game_move_count: (a: number) => number;
    readonly game_new: () => number;
    readonly game_play_move: (a: number, b: number, c: number) => number;
    readonly game_reset: (a: number) => void;
    readonly game_undo: (a: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
