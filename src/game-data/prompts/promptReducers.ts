import GameState from "../GameState";
import { GameAction } from "../gameActions";
import { Choice } from "./PromptState";
import { Coupon } from "../structures";

export const prompt = (state: GameState, action: GameAction) => {
    switch (action.type) {
        case "CHOOSE_ACTION":
        case "CHOOSE_FIELD":
        case "CHOOSE_WINE":
        case "MAKE_WINE":
        case "BUILD_STRUCTURE":
            return { ...state, actionPrompt: null };
        default:
            return state;
    }
};

export const promptForAction = (
    state: GameState,
    choices: Choice[]
): GameState => {
    if (state.playerId !== state.currentTurn.playerId) {
        return state;
    }
    return {
        ...state,
        actionPrompt: { type: "chooseAction", choices },
    };
};

export const promptToChooseField = (state: GameState): GameState => {
    if (state.playerId !== state.currentTurn.playerId) {
        return state;
    }
    return {
        ...state,
        actionPrompt: { type: "chooseField" },
    };
};

export const promptToChooseWine = (state: GameState, minValue = 1): GameState => {
    if (state.playerId !== state.currentTurn.playerId) {
        return state;
    }
    return {
        ...state,
        actionPrompt: { type: "chooseWine", minValue },
    };
};

export const promptToMakeWine = (state: GameState, upToN: number): GameState => {
    if (state.playerId !== state.currentTurn.playerId) {
        return state;
    }
    return {
        ...state,
        actionPrompt: { type: "makeWine", upToN },
    };
};

export const promptToBuildStructure = (state: GameState, coupon?: Coupon): GameState => {
    if (state.playerId !== state.currentTurn.playerId) {
        return state;
    }
    return {
        ...state,
        actionPrompt: { type: "buildStructure", coupon },
    };
};
