import Coins from "../../game-views/icons/Coins";
import * as React from "react";
import GameState, { PlayVisitorPendingAction } from "../GameState";
import { promptForAction, promptToChooseField, promptToBuildStructure } from "../prompts/promptReducers";
import { GameAction } from "../gameActions";
import { SummerVisitorId } from "./visitorCards";
import {
    buildStructure,
    drawCards,
    endTurn,
    gainCoins,
    gainVP,
    harvestField,
    loseVP,
    payCoins,
    placeGrapes,
    promptForWakeUpOrder,
    setPendingAction,
    passToNextSeason
} from "../shared/sharedReducers";
import { harvestFieldDisabledReason, moneyDisabledReason, needGrapesDisabledReason } from "../shared/sharedSelectors";
import { Vine, Order, WinterVisitor } from "../../game-views/icons/Card";
import Grape from "../../game-views/icons/Grape";
import { default as VP } from "../../game-views/icons/VictoryPoints";
import { maxStructureCost } from "../structures";

export const summerVisitorReducers: Record<
    SummerVisitorId,
    (state: GameState, action: GameAction, pendingAction: PlayVisitorPendingAction) => GameState
> = {
    banker: (state, action, pendingAction) => {
        interface BankerPendingAction extends PlayVisitorPendingAction {
            // list of players who have yet to decide whether to lose VP / gain coins
            mainActions: string[];
        }
        const bankerAction = pendingAction as BankerPendingAction;
        const maybeEndTurn = (state2: GameState, playerId: string) => {
            const mainActions = bankerAction.mainActions.filter(id => id !== playerId);
            state2 = setPendingAction({ ...bankerAction, mainActions }, state2);
            return mainActions.length === 0 ? endTurn(state2) : state2;
        };
        switch (action.type) {
            case "CHOOSE_CARD":
                const currentTurnPlayerId = state.currentTurn.playerId
                state = setPendingAction({
                    ...bankerAction,
                    mainActions: Object.keys(state.players).filter(id => id !== currentTurnPlayerId),
                }, gainCoins(5, state));
                return currentTurnPlayerId === state.playerId
                    ? state
                    : promptForAction(state, {
                        playerId: state.playerId!,
                        choices: [
                            { id: "BANKER_GAIN", label: <>Lose <VP>1</VP> to gain <Coins>3</Coins>.</> },
                            { id: "BANKER_PASS", label: <>Pass</> },
                        ],
                    });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "BANKER_GAIN":
                        return maybeEndTurn(
                            gainCoins(3, loseVP(1, state, action.playerId), action.playerId),
                            action.playerId
                        );
                    case "BANKER_PASS":
                        return maybeEndTurn(state, action.playerId);
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    buyer: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARD":
                return promptForAction(state, {
                    choices: [
                        {
                            id: "BUYER_PLACE",
                            label: <>Pay <Coins>2</Coins> to place a <Grape>1</Grape> on your crush pad</>,
                            disabledReason: moneyDisabledReason(state, 2),
                        },
                        {
                            id: "BUYER_DISCARD",
                            label: <>Discard 1 <Grape /> to gain <Coins>2</Coins> and <VP>1</VP></>,
                            disabledReason: needGrapesDisabledReason(state),
                        },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "BUYER_PLACE":
                        return endTurn(payCoins(2, placeGrapes(state, { red: 1, white: 1 })));
                    case "BUYER_DISCARD":
                        return endTurn(state); // TODO
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    // contractor: s => endTurn(s),
    // entertainer: s => endTurn(s),
    // handyman: s => endTurn(s),
    landscaper: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARD":
                return promptForAction(state, {
                    choices: [
                        { id: "LANDSCAPER_DRAW_PLANT", label: <>Draw 1 <Vine /> and plant up to 1 <Vine /></> },
                        {
                            id: "LANDSCAPER_SWITCH",
                            label: <>Switch 2 <Vine /> on your fields</>,
                            disabledReason: "Not implemented yet", // TODO
                        },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "LANDSCAPER_DRAW_PLANT":
                        // TODO prompt to pick vine to plant, or pass
                        return endTurn(drawCards(state, { vine: 1 }));
                    case "LANDSCAPER_SWITCH":
                        return endTurn(state); // TODO
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    // negotiator: s => endTurn(s),
    organizer: (state, action, pendingAction) => {
        interface OrganizerPendingAction extends PlayVisitorPendingAction {
            currentWakeUpPos: number;
        }
        const organizerAction = pendingAction as OrganizerPendingAction;

        switch (action.type) {
            case "CHOOSE_CARD":
                return promptForWakeUpOrder(
                    setPendingAction({
                        ...organizerAction,
                        currentWakeUpPos: state.wakeUpOrder.findIndex(
                            pos => pos && pos.playerId === state.currentTurn.playerId
                        ),
                    }, state),
                );
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "WAKE_UP_1":
                    case "WAKE_UP_2":
                    case "WAKE_UP_3":
                    case "WAKE_UP_4":
                    case "WAKE_UP_DRAW_SUMMER":
                    case "WAKE_UP_DRAW_WINTER":
                    case "WAKE_UP_6":
                    case "WAKE_UP_7":
                        return passToNextSeason({
                            ...state,
                            // Clear the previous wake-up position
                            wakeUpOrder: state.wakeUpOrder.map(
                                (pos, i) => i === organizerAction.currentWakeUpPos ? null : pos
                            ) as GameState["wakeUpOrder"],
                        });
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    patron: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARD":
                return promptForAction(state, {
                    choices: [
                        { id: "PATRON_GAIN", label: <>Gain <Coins>4</Coins></> },
                        { id: "PATRON_DRAW", label: <>Draw 1 <Order /> and 1 <WinterVisitor /></> },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "PATRON_GAIN":
                        return endTurn(gainCoins(4, state));
                    case "PATRON_DRAW":
                        return endTurn(drawCards(state, { order: 1, winterVisitor: 1, }));
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    // planner: s => endTurn(s),
    // planter: s => endTurn(s),
    // producer: s => endTurn(s),
    sponsor: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARD":
                return promptForAction(state, {
                    choices: [
                        { id: "SPONSOR_DRAW", label: <>Draw 2 <Vine /></>, },
                        { id: "SPONSOR_GAIN", label: <>Gain <Coins>3</Coins></>, },
                        { id: "SPONSOR_BOTH", label: <>Lose <VP>1</VP> to do both</>, },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "SPONSOR_DRAW":
                        return endTurn(drawCards(state, { vine: 2 }));
                    case "SPONSOR_GAIN":
                        return endTurn(gainCoins(3, state));
                    case "SPONSOR_BOTH":
                        return endTurn(gainCoins(3, drawCards(state, { vine: 2 })));
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    tourGuide: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARD":
                return promptForAction(state, {
                    choices: [
                        { id: "TOUR_GAIN_4", label: <>Gain <Coins>4</Coins></> },
                        {
                            id: "TOUR_HARVEST",
                            label: <>Harvest 1 field</>,
                            disabledReason: harvestFieldDisabledReason(state),
                        },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "TOUR_GAIN_4":
                        return endTurn(gainCoins(4, state));
                    case "TOUR_HARVEST":
                        return promptToChooseField(state);
                    default:
                        return state;
                }
            case "CHOOSE_FIELD":
                return endTurn(harvestField(state, action.fieldId));
            default:
                return state;
        }
    },
    uncertifiedArchitect: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARD":
                return promptForAction(state, {
                    choices: [
                        { id: "UARCHITECT_LOSE_1_VP", label: <>Lose <VP>1</VP> to build a <Coins>2</Coins> or <Coins>3</Coins> structure</> },
                        { id: "UARCHITECT_LOSE_2_VP", label: <>Lose <VP>2</VP> to build any structure</> }
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "UARCHITECT_LOSE_1_VP":
                        return promptToBuildStructure(loseVP(1, state), { kind: "voucher", upToCost: 3 });
                    case "UARCHITECT_LOSE_2_VP":
                        return promptToBuildStructure(loseVP(2, state), { kind: "voucher", upToCost: maxStructureCost });
                    default:
                        return state;
                }
            case "BUILD_STRUCTURE":
                return endTurn(buildStructure(state, action.structureId));
            default:
                return state;
        }
    },
    uncertifiedBroker: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARD":
                return promptForAction(state, {
                    choices: [
                        { id: "UBROKER_LOSE_VP", label: <>Lose <VP>3</VP> to gain <Coins>9</Coins></> },
                        {
                            id: "UBROKER_GAIN_VP",
                            label: <>Pay <Coins>6</Coins> to gain <VP>2</VP></>,
                            disabledReason: moneyDisabledReason(state, 6),
                        },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "UBROKER_LOSE_VP":
                        return endTurn(gainCoins(9, loseVP(3, state)));
                    case "UBROKER_GAIN_VP":
                        return endTurn(gainVP(2, payCoins(6, state)));
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    // volunteerCrew: s => endTurn(s),
};