import GameState, { PlayerColor, PlayerState, CardsByType } from "./GameState";
import { GameAction } from "./gameActions";
import { board } from "./board/boardReducer";
import { visitor } from "./visitors/visitorReducer";

export const game = (state: GameState | undefined, action: GameAction): GameState => {
    if (state === undefined) {
        return initGame();
    }
    return board(visitor(state, action), action);
};

const EMPTY_CARD_PILES: CardsByType = {
    vine: [],
    summerVisitor: [],
    order: [],
    winterVisitor: [],
};
export const initGame = (
    playerId: string | null = null,
    shuffledCards: CardsByType = EMPTY_CARD_PILES
): GameState => {
    return {
        currentTurn: {
            type: "workerPlacement",
            playerId: "viny",
            pendingAction: null,
        },
        drawPiles: shuffledCards,
        discardPiles: EMPTY_CARD_PILES,
        players: {
            stfy: initPlayer("stfy", "purple"),
            viny: initPlayer("viny", "orange"),
            // linz: initPlayer("linz", "yellow"),
            // poofytoo: initPlayer("poofytoo", "green"),
            // srir: initPlayer("srir", "blue"),
            // thedrick: initPlayer("thedrick", "red"),
        },
        tableOrder: ["stfy", "viny"],
        grapeIndex: 1,
        wakeUpOrder: [null, { playerId: "stfy" }, null, null, null, null, { playerId: "viny" }],
        playerId,
        actionPrompt: null,
    };
};

const initPlayer = (id: string, color: PlayerColor): PlayerState => {
    return {
        id,
        color,
        coins: 0,
        residuals: 0,
        victoryPoints: 0,
        availableWorkers: {
            grande: true,
            other: 2,
        },
        cardsInHand: {
            vine: [],
            summerVisitor: ["tourGuide"],
            order: [],
            winterVisitor: ["judge", "politician"],
        },
        fields: [
            { value: 5, vines: [], sold: false },
            { value: 6, vines: [], sold: false },
            { value: 7, vines: [], sold: false },
        ],
        crushPad: {
            red: [false, false, false, false, false, false, false, false, false],
            white: [false, false, false, false, false, false, false, false, false],
        },
        cellar: {
            red: [false, false, false, false, false, false, false, false, false],
            white: [false, false, false, false, false, false, false, false, false],
            rose: [false, false, false, false, false, false, false, false, false],
            sparkling: [false, false, false, false, false, false, false, false, false],
        },
    };
};
