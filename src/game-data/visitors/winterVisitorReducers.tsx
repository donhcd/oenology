import * as React from "react";
import { default as VP } from "../../game-views/icons/VictoryPoints";
import Coins from "../../game-views/icons/Coins";
import Worker from "../../game-views/icons/Worker";
import { SummerVisitor } from "../../game-views/icons/Card";
import { drawCards, gainVP, endTurn, gainCoins, discardWine, trainWorker, makeWineFromGrapes, payCoins } from "../shared/sharedReducers";
import GameState from "../GameState";
import { promptForAction, promptToChooseWine, promptToMakeWine } from "../prompts/promptReducers";
import { GameAction } from "../gameActions";
import { WinterVisitorId } from "./visitorCards";
import { trainWorkerDisabledReason, needGrapesDisabledReason } from "../shared/sharedSelectors";
import WineGlass from "../../game-views/icons/WineGlass";

const mostValuableWine = (gameState: GameState) => {
    return 8;
};

export const winterVisitorReducers: Record<
    WinterVisitorId,
    (state: GameState, action: GameAction) => GameState
> = {
    judge: (state, action) => {
        switch (action.type) {
            case "CHOOSE_VISITOR":
                return promptForAction(state, [
                    { id: "JUDGE_DRAW", label: <>Draw 2 <SummerVisitor /></> },
                    {
                        id: "JUDGE_DISCARD",
                        label: <>Discard 1 <WineGlass /> of value 4 or more to gain <VP>3</VP></>,
                    },
                ]);
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "JUDGE_DRAW":
                        return endTurn(drawCards(state, { summerVisitor: 2 }));
                    case "JUDGE_DISCARD":
                        return promptToChooseWine(state, /* minValue */ 4);
                    default:
                        return state;
                }
            case "CHOOSE_WINE":
                return endTurn(gainVP(3, state));
            default:
                return state;
        }
    },
    politician: (state, action) => {
        switch (action.type) {
            case "CHOOSE_VISITOR":
                const { playerId } = state.currentTurn;
                if (state.players[playerId].victoryPoints < 0) {
                    return endTurn(gainCoins(6, state));
                } else {
                    return endTurn(drawCards(state, { vine: 1, summerVisitor: 1, order: 1, }));
                }
            default:
                return state;
        }
    },
    professor: (state, action) => {
        switch (action.type) {
            case "CHOOSE_VISITOR":
                const playerState = state.players[state.currentTurn.playerId];
                return promptForAction(state, [
                    {
                        id: "PROFESSOR_TRAIN",
                        label: <>Pay <Coins>2</Coins> to train 1 <Worker /></>,
                        disabledReason: trainWorkerDisabledReason(state, 2),
                    },
                    {
                        id: "PROFESSOR_GAIN",
                        label: <>Gain <VP>2</VP> if you have a total of 6 <Worker /></>,
                        disabledReason: playerState.trainedWorkers.length < 6
                            ? "You don't have enough workers."
                            : undefined,
                    },
                ]);
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "PROFESSOR_TRAIN":
                        return endTurn(trainWorker(payCoins(2, state)));
                    case "PROFESSOR_GAIN":
                        return endTurn(gainVP(2, state));
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    taster: (state, action) => {
        switch (action.type) {
            case "CHOOSE_VISITOR":
                return promptToChooseWine(state);
            case "CHOOSE_WINE":
                const currentTurnPlayerId = state.currentTurn.playerId;
                const stateAfterDiscard = discardWine(state, currentTurnPlayerId, action.wine);
                if (action.wine.value > mostValuableWine(stateAfterDiscard)) {
                    return endTurn(gainVP(2, stateAfterDiscard))
                } else {
                    return endTurn(stateAfterDiscard);
                }
            default:
                return state;
        }
    },
    teacher: (state, action) => {
        switch (action.type) {
            case "CHOOSE_VISITOR":
                return promptForAction(state, [
                    {
                        id: "TEACHER_MAKE",
                        label: <>Make up to 2 <WineGlass /></>,
                        disabledReason: needGrapesDisabledReason(state),
                    },
                    {
                        id: "TEACHER_TRAIN",
                        label: <>Pay <Coins>2</Coins> to train 1 <Worker /></>,
                        disabledReason: trainWorkerDisabledReason(state, 2),
                    },
                ]);
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "TEACHER_MAKE":
                        return promptToMakeWine(state, /* upToN */ 2);
                    case "TEACHER_TRAIN":
                        return endTurn(trainWorker(payCoins(2, state)));
                    default:
                        return state;
                }
            case "MAKE_WINE":
                return endTurn(makeWineFromGrapes(state, action.ingredients));
            default:
                return state;
        }
    },
}
