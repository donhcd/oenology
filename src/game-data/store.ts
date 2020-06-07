import { createStore } from "redux";
import GameState, { PlayerState, PlayerColor } from "./GameState";
import { GameAction } from "./actionCreators";
import { winterVisitorCards, WinterVisitorId } from "./winterVisitorCards";
import { summerVisitorCards, SummerVisitorId } from "./summerVisitorCards";
import { vineCards, VineId } from "./vineCards";

const initPlayer = (id: string, color: PlayerColor): PlayerState => {
    return {
        id,
        color,
        availableWorkers: {},
        cardsInHand: {
            vine: Object.keys(vineCards) as VineId[],
            summerVisitor: Object.keys(summerVisitorCards) as SummerVisitorId[],
            order: [],
            winterVisitor: Object.keys(winterVisitorCards) as WinterVisitorId[],
        },
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
const initGame = (): GameState => {
    return {
        currentTurn: {
            type: "workerPlacement",
            playerId: "viny",
            pendingAction: {
                type: "playSummerVisitor"
            },
        },
        players: {
            stfy: initPlayer("stfy", "purple"),
            viny: initPlayer("viny", "orange"),
            linz: initPlayer("linz", "yellow"),
            poofytoo: initPlayer("poofytoo", "green"),
            srir: initPlayer("srir", "blue"),
            thedrick: initPlayer("thedrick", "red"),
        }
    };
};

const oenologyGame = (state: GameState | undefined, action: GameAction) => {
    if (state === undefined) {
        return initGame();
    }
    switch (action.type) {
        case "CANCEL_VISITOR":
            return {
                ...state,
                currentTurn: {
                    ...state.currentTurn,
                    pendingAction: null
                },
            };
        case "DRAW_CARDS":
            return state;
        case "GAIN_COINS":
            return state;
        case "GAIN_VP":
            return state;
        case "PAY_COINS":
            return state;
        case "TRAIN_WORKER":
            return state;
        case "PLANT_VINE":
            return state;
    }
};

const store = createStore(oenologyGame);
export default store;