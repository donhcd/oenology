import Coins from "../../game-views/icons/Coins";
import * as React from "react";
import GameState, { PlayVisitorPendingAction, WorkerPlacementTurn, WorkerPlacement, WorkerType } from "../GameState";
import {
    promptForAction,
    promptToBuildStructure,
    promptToChooseVineCard,
    promptToHarvest,
    promptToMakeWine,
    promptToPlant,
    promptToChooseCard,
    promptToUproot,
    promptToChooseGrape,
    promptToChooseWine,
    promptToSwitchVines,
} from "../prompts/promptReducers";
import { GameAction } from "../gameActions";
import { SummerVisitorId } from "./visitorCards";
import {
    buildStructure,
    gainCoins,
    gainVP,
    loseVP,
    payCoins,
    plantVineInField,
    uprootVineFromField,
    uprootVinesFromFields,
    gainResiduals,
    updatePlayer,
} from "../shared/sharedReducers";
import {
    buildStructureDisabledReason,
    harvestFieldDisabledReason,
    moneyDisabledReason,
    needGrapesDisabledReason,
    plantVinesDisabledReason,
    numCardsDisabledReason,
    uprootDisabledReason,
    needWineDisabledReason,
    needCardOfTypeDisabledReason,
    switchVines,
} from "../shared/sharedSelectors";
import Card, { Vine, Order, WinterVisitor, SummerVisitor } from "../../game-views/icons/Card";
import Grape from "../../game-views/icons/Grape";
import { default as VP } from "../../game-views/icons/VictoryPoints";
import { maxStructureCost, structures, Coupon, StructureId } from "../structures";
import { VineId, vineCards } from "../vineCards";
import WineGlass from "../../game-views/icons/WineGlass";
import {
    WakeUpChoiceData,
    chooseWakeUp,
    endVisitor,
    passToNextSeason,
    promptForWakeUpOrder,
    setPendingAction,
    endTurn,
    makeEndVisitorAction,
} from "../shared/turnReducers";
import { drawCards, discardCards } from "../shared/cardReducers";
import { placeGrapes, makeWineFromGrapes, harvestField, discardGrapes, discardWines } from "../shared/grapeWineReducers";
import Residuals from "../../game-views/icons/Residuals";
import Worker from "../../game-views/icons/Worker";
import { allPlacements } from "../board/boardPlacements";
import { Choice } from "../prompts/PromptState";

export const summerVisitorReducers: Record<
    SummerVisitorId,
    (state: GameState, action: GameAction, pendingAction: PlayVisitorPendingAction) => GameState
> = {
    agriculturist: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return promptToChooseVineCard(state);
                    case "vine":
                        return promptToPlant(state, card.id);
                    default:
                        return state;
                }
            case "CHOOSE_FIELD":
                state = plantVineInField(action.fields[0], state);
                const vinesByName: { [vineName: string]: boolean; } = {};
                state.players[state.currentTurn.playerId].fields[action.fields[0]].vines.forEach(
                    v => vinesByName[vineCards[v].name] = true
                );
                return endVisitor(Object.keys(vinesByName).length >= 3 ? gainVP(2, state) : state);
            default:
                return state;
        }
    },
    architect: (state, action) => {
        const coupon = { kind: "discount", amount: 3, } as const;
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptForAction(state, {
                    choices: [
                        {
                            id: "ARCHITECT_BUILD",
                            label: <>Build a structure at a <Coins>3</Coins> discount</>,
                            disabledReason: buildStructureDisabledReason(state, coupon),
                        },
                        {
                            id: "ARCHITECT_GAIN",
                            label: <>Gain <VP>1</VP> for each <Coins>4</Coins> structure you have built</>,
                        },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "ARCHITECT_BUILD":
                        return promptToBuildStructure(state, coupon);
                    case "ARCHITECT_GAIN":
                        const player = state.players[state.currentTurn.playerId];
                        const num4Built = Object.entries(structures).filter(([id, { cost }]) =>
                            cost === 4 && player.structures[id as StructureId]
                        ).length;
                        return endVisitor(gainVP(num4Built, state));
                    default:
                        return state;
                }
            case "BUILD_STRUCTURE":
                const { cost } = structures[action.structureId];
                return endVisitor(
                    buildStructure(payCoins(cost - coupon.amount, state), action.structureId)
                );
            default:
                return state;
        }
    },
    artisan: (state, action, pendingAction) => {
        const artisanAction = pendingAction as PlayVisitorPendingAction & {
            secondPlant: boolean;
        };
        const buildCoupon: Coupon = { kind: "discount", amount: 1 };

        switch (action.type) {
            case "CHOOSE_CARDS":
                if (!action.cards) {
                    // pass on second plant
                    return endVisitor(state);
                }
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return promptForAction(state, {
                            choices: [
                                { id: "ARTISAN_GAIN", label: <>Gain <Coins>3</Coins></>, },
                                {
                                    id: "ARTISAN_BUILD",
                                    label: <>Build a structure at a <Coins>1</Coins> discount</>,
                                    disabledReason: buildStructureDisabledReason(state, buildCoupon),
                                },
                                {
                                    id: "ARTISAN_PLANT",
                                    label: <>Plant up to 2 <Vine /></>,
                                    disabledReason: plantVinesDisabledReason(state),
                                },
                            ],
                        });
                    case "vine":
                        return promptToPlant(state, card.id);
                    default:
                        return state;
                }
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "ARTISAN_GAIN":
                        return endVisitor(gainCoins(3, state));
                    case "ARTISAN_BUILD":
                        return promptToBuildStructure(state, buildCoupon);
                    case "ARTISAN_PLANT":
                        return promptToChooseVineCard(state);
                    default:
                        return state;
                }
            case "BUILD_STRUCTURE":
                const structure = structures[action.structureId];
                return endVisitor(buildStructure(payCoins(structure.cost - 1, state), action.structureId));

            case "CHOOSE_FIELD":
                state = plantVineInField(action.fields[0], state);
                const canPlantAgain = !artisanAction.secondPlant &&
                    plantVinesDisabledReason(state) === undefined;

                return canPlantAgain
                    ? promptToChooseVineCard(
                        setPendingAction({ ...artisanAction, secondPlant: true }, state),
                        { optional: true }
                    )
                    : endVisitor(state);

            default:
                return state;
        }
    },
    auctioneer: (state, action) => {
        const player = state.players[state.currentTurn.playerId];

        switch (action.type) {
            case "CHOOSE_CARDS":
                switch (action.cards!.length) {
                    case 1:
                        return promptForAction(state, {
                            choices: [
                                {
                                    id: "AUCTIONEER_2",
                                    label: <>Discard 2 <Card /> to gain <Coins>4</Coins></>,
                                    disabledReason: numCardsDisabledReason(state, 2),
                                },
                                {
                                    id: "AUCTIONEER_4",
                                    label: <>Discard 4 <Card /> to gain <VP>3</VP></>,
                                    disabledReason: numCardsDisabledReason(state, 4),
                                },
                            ],
                        });
                    case 2:
                        return endVisitor(gainCoins(4, discardCards(action.cards!, state)));
                    case 4:
                        return endVisitor(gainVP(3, discardCards(action.cards!, state)));
                    default:
                        return state;
                }
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "AUCTIONEER_2":
                        return promptToChooseCard(state, {
                            title: "Discard 2 cards",
                            cards: player.cardsInHand.map(id => ({ id })),
                            numCards: 2,
                        });
                    case "AUCTIONEER_4":
                        return promptToChooseCard(state, {
                            title: "Discard 4 cards",
                            cards: player.cardsInHand.map(id => ({ id })),
                            numCards: 4,
                        });
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    banker: (state, action) => {
        const endVisitorAction = makeEndVisitorAction("opponents", (s, playerId) => {
            return promptForAction(s, {
                playerId,
                choices: [
                    { id: "BANKER_GAIN", label: <>Lose <VP>1</VP> to gain <Coins>3</Coins>.</> },
                    { id: "BANKER_PASS", label: <>Pass</> },
                ],
            });
        });
        switch (action.type) {
            case "CHOOSE_CARDS":
                return endVisitorAction(gainCoins(5, state));

            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "BANKER_GAIN":
                        return endVisitorAction(
                            gainCoins(3, loseVP(1, state, action.playerId), action.playerId),
                            action.playerId
                        );
                    case "BANKER_PASS":
                        return endVisitorAction(state, action.playerId);
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    blacksmith: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptToBuildStructure(state, { kind: "discount", amount: 2, });
            case "BUILD_STRUCTURE":
                const { cost } = structures[action.structureId];
                return endVisitor(
                    buildStructure(
                        payCoins(cost - 2, cost === 5 || cost === 6 ? gainVP(1, state) : state),
                        action.structureId
                    )
                );
            default:
                return state;
        }
    },
    broker: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptForAction(state, {
                    choices: [
                        { id: "BROKER_GAIN", label: <>Pay <Coins>9</Coins> to gain <VP>3</VP></>, },
                        { id: "BROKER_LOSE", label: <>Lose <VP>2</VP> to gain <Coins>6</Coins></>, },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "BROKER_GAIN":
                        return endVisitor(gainVP(3, payCoins(9, state)));
                    case "BROKER_LOSE":
                        return endVisitor(gainCoins(6, loseVP(2, state)));
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    buyer: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptForAction(state, {
                    choices: [
                        {
                            id: "BUYER_PLACE_RED",
                            label: <>Pay <Coins>2</Coins> to place a <Grape color="red">1</Grape> on your crush pad</>,
                            disabledReason: moneyDisabledReason(state, 2),
                        },
                        {
                            id: "BUYER_PLACE_WHITE",
                            label: <>Pay <Coins>2</Coins> to place a <Grape color="white">1</Grape> on your crush pad</>,
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
                    case "BUYER_PLACE_RED":
                        return endVisitor(payCoins(2, placeGrapes(state, { red: 1 })));
                    case "BUYER_PLACE_WHITE":
                        return endVisitor(payCoins(2, placeGrapes(state, { white: 1 })));
                    case "BUYER_DISCARD":
                        return promptToChooseGrape(state);
                    default:
                        return state;
                }
            case "CHOOSE_GRAPE":
                return endVisitor(gainVP(1, gainCoins(2, discardGrapes(state, action.grapes))));
            default:
                return state;
        }
    },
    contractor: (state, action, pendingAction) => {
        type ChoiceId = "CONTRACTOR_GAIN" | "CONTRACTOR_BUILD" | "CONTRACTOR_PLANT";
        interface ContractorAction extends PlayVisitorPendingAction {
            usedChoices: { [K in ChoiceId]?: true };
        }
        const promptContractorAction = (state2: GameState, contractorAction: ContractorAction): GameState => {
            return promptForAction(
                state2,
                {
                    choices: [
                        { id: "CONTRACTOR_GAIN", label: <>Gain <VP>1</VP></>, },
                        {
                            id: "CONTRACTOR_BUILD",
                            label: <>Build 1 structure</>,
                            disabledReason: buildStructureDisabledReason(state2),
                        },
                        {
                            id: "CONTRACTOR_PLANT",
                            label: <>Plant 1 <Vine /></>,
                            disabledReason: plantVinesDisabledReason(state2),
                        },
                    ].filter(choice => !contractorAction.usedChoices[choice.id as ChoiceId]),
                }
            );
        };
        const maybeEndVisitor = (state2: GameState): GameState => {
            const contractorAction =
                (state2.currentTurn as WorkerPlacementTurn).pendingAction as ContractorAction;

            return Object.keys(contractorAction.usedChoices).length === 2
                ? endVisitor(state2)
                : promptContractorAction(state2, contractorAction);
        };

        switch (action.type) {
            case "CHOOSE_CARDS":
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        const contractorAction: ContractorAction = {
                            ...pendingAction,
                            usedChoices: {},
                        };
                        return promptContractorAction(
                            setPendingAction(contractorAction, state),
                            contractorAction
                        );
                    case "vine":
                        return promptToPlant(state, card.id);
                    default:
                        return state;
                }
            case "CHOOSE_ACTION":
                const contractorAction = pendingAction as ContractorAction;
                state = setPendingAction({
                    ...contractorAction,
                    usedChoices: {
                        ...contractorAction.usedChoices,
                        [action.choice]: true,
                    },
                }, state);
                switch (action.choice) {
                    case "CONTRACTOR_GAIN":
                        return maybeEndVisitor(gainVP(1, state));
                    case "CONTRACTOR_BUILD":
                        return promptToBuildStructure(state);
                    case "CONTRACTOR_PLANT":
                        return promptToChooseVineCard(state);
                    default:
                        return state;
                }
            case "BUILD_STRUCTURE":
                const structure = structures[action.structureId];
                return maybeEndVisitor(
                    buildStructure(payCoins(structure.cost, state), action.structureId)
                );
            case "CHOOSE_FIELD":
                return maybeEndVisitor(plantVineInField(action.fields[0], state));
            default:
                return state;
        }
    },
    cultivator: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return promptToChooseVineCard(state, { bypassFieldLimit: true });
                    case "vine":
                        return promptToPlant(state, card.id, { bypassFieldLimit: true });
                    default:
                        return state;
                }
            case "CHOOSE_FIELD":
                return endVisitor(plantVineInField(action.fields[0], state));
            default:
                return state;
        }
    },
    entertainer: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                const cards = action.cards!;
                switch (cards.length) {
                    case 1:
                        return promptForAction(state, {
                            choices: [
                                {
                                    id: "ENTERTAINER_DRAW",
                                    label: <>Pay <Coins>4</Coins> to draw 3 <WinterVisitor /></>,
                                    disabledReason: moneyDisabledReason(state, 4),
                                },
                                {
                                    id: "ENTERTAINER_DISCARD",
                                    label: <>Discard 1 <WineGlass /> and 3 visitor cards to gain <VP>3</VP></>,
                                    disabledReason: needWineDisabledReason(state) ||
                                        needCardOfTypeDisabledReason(state, "visitor", { numCards: 3 }),
                                },
                            ],
                        });
                    case 3:
                        return endVisitor(gainVP(3, discardCards(cards, state)));
                    default:
                        return state;
                }
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "ENTERTAINER_DRAW":
                        return endVisitor(drawCards(payCoins(4, state), action._key!, { winterVisitor: 3 }));
                    case "ENTERTAINER_DISCARD":
                        return promptToChooseWine(state);
                    default:
                        return state;
                }
            case "CHOOSE_WINE":
                return promptToChooseCard(discardWines(state, action.wines), {
                    title: "Discard 3 visitors",
                    cards: state.players[state.currentTurn.playerId].cardsInHand
                        .filter(({ type }) => type === "visitor")
                        .map(id => ({ id })),
                    numCards: 3,
                });
            default:
                return state;
        }
    },
    grower: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return promptToChooseVineCard(state);
                    case "vine":
                        return promptToPlant(state, card.id);
                    default:
                        return state;
                }
            case "CHOOSE_FIELD":
                state = plantVineInField(action.fields[0], state);
                const numVinesPlanted = Object.values(state.players[state.currentTurn.playerId].fields)
                    .reduce((numVines, field) => numVines + field.vines.length, 0);
                return endVisitor(numVinesPlanted >= 6 ? gainVP(2, state) : state);
            default:
                return state;
        }
    },
    handyman: (state, action) => {
        const coupon = { kind: "discount", amount: 2, } as const;

        const endVisitorAction = makeEndVisitorAction("allPlayers", (s, playerId) => {
            const playerName = s.players[s.currentTurn.playerId].name;
            return promptForAction(s, {
                playerId,
                choices: [
                    {
                        id: "HANDYMAN_BUILD",
                        label: <>
                            Build 1 structure at a <Coins>2</Coins> discount
                            {playerId !== s.currentTurn.playerId
                                ? <> (<strong>{playerName}</strong> gains <VP>1</VP>)</>
                                : null}
                        </>,
                        disabledReason: buildStructureDisabledReason(s, coupon, playerId),
                    },
                    {
                        id: "HANDYMAN_PASS",
                        label: <>Pass</>,
                    },
                ],
            });
        });
        switch (action.type) {
            case "CHOOSE_CARDS":
                return endVisitorAction(state);

            case "BUILD_STRUCTURE":
                const { cost } = structures[action.structureId];
                state = buildStructure(
                    payCoins(cost - coupon.amount, state, action.playerId),
                    action.structureId,
                    action.playerId
                );
                return endVisitorAction(
                    action.playerId !== state.currentTurn.playerId ? gainVP(1, state) : state,
                    action.playerId
                );

            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "HANDYMAN_BUILD":
                        return promptToBuildStructure(state, coupon, action.playerId);
                    case "HANDYMAN_PASS":
                        return endVisitorAction(state, action.playerId);
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    homesteader: (state, action, pendingAction) => {
        const homesteaderAction = pendingAction as PlayVisitorPendingAction & {
            doBoth: boolean;
            secondPlant: boolean;
        };
        const buildCoupon: Coupon = { kind: "discount", amount: 3 };

        switch (action.type) {
            case "CHOOSE_CARDS":
                if (!action.cards) {
                    // pass on second plant
                    return endVisitor(state);
                }
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return promptForAction(state, {
                            choices: [
                                {
                                    id: "HOMESTEADER_BUILD",
                                    label: <>Build 1 structure at a <Coins>3</Coins> discount</>,
                                    disabledReason: buildStructureDisabledReason(state, buildCoupon),
                                },
                                {
                                    id: "HOMESTEADER_PLANT",
                                    label: <>Plant up to 2 <Vine /></>,
                                    disabledReason: plantVinesDisabledReason(state),
                                },
                                {
                                    id: "HOMESTEADER_BOTH",
                                    label: <>Do both (lose <VP>1</VP>)</>,
                                    // Don't check if planting is possible yet because
                                    // building a structure may change that
                                    disabledReason: buildStructureDisabledReason(state, buildCoupon),
                                },
                            ],
                        });
                    case "vine":
                        return promptToPlant(state, card.id);
                    default:
                        return state;
                }
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "HOMESTEADER_BUILD":
                        return promptToBuildStructure(state, buildCoupon);
                    case "HOMESTEADER_PLANT":
                        return promptToChooseVineCard(state);
                    case "HOMESTEADER_BOTH":
                        return promptToBuildStructure(
                            setPendingAction({ ...homesteaderAction, doBoth: true }, state),
                            buildCoupon
                        );
                    default:
                        return state;
                }
            case "BUILD_STRUCTURE":
                const structure = structures[action.structureId];
                state = buildStructure(payCoins(structure.cost - 3, state), action.structureId);

                return homesteaderAction.doBoth && plantVinesDisabledReason(state) === undefined
                    ? promptToChooseVineCard(loseVP(1, state))
                    : endVisitor(state);

            case "CHOOSE_FIELD":
                state = plantVineInField(action.fields[0], state);
                const canPlantAgain = !homesteaderAction.secondPlant &&
                    plantVinesDisabledReason(state) === undefined;

                return canPlantAgain
                    ? promptToChooseVineCard(
                        setPendingAction({ ...homesteaderAction, secondPlant: true }, state),
                        { optional: true }
                    )
                    : endVisitor(state);

            default:
                return state;
        }
    },
    horticulturist: (state, action, pendingAction) => {
        const horticulturistAction = pendingAction as PlayVisitorPendingAction & {
            isDiscarding?: boolean;
        };
        switch (action.type) {
            case "CHOOSE_CARDS":
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return promptForAction(state, {
                            choices: [
                                {
                                    id: "HORTICULTURIST_PLANT",
                                    label: <>Plant 1 <Vine /></>,
                                    disabledReason: plantVinesDisabledReason(state, { bypassStructures: true })
                                },
                                {
                                    id: "HORTICULTURIST_UPROOT",
                                    label: <>Uproot and discard 2 <Vine /> to gain <VP>3</VP></>,
                                    disabledReason: uprootDisabledReason(state, { numVines: 2 })
                                }
                            ]
                        });
                    case "vine":
                        return horticulturistAction.isDiscarding
                            ? endVisitor(gainVP(3, discardCards(action.cards!, state)))
                            : promptToPlant(state, card.id);
                    default:
                        return state;
                }
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "HORTICULTURIST_PLANT":
                        return promptToChooseVineCard(state, { bypassStructures: true });
                    case "HORTICULTURIST_UPROOT":
                        return promptToUproot(state, 2);
                    default:
                        return state;
                }
            case "CHOOSE_VINE":
                state = uprootVinesFromFields(action.vines, state);
                return promptToChooseCard(setPendingAction({
                    ...horticulturistAction,
                    isDiscarding: true
                }, state), {
                    title: "Discard 2 vines",
                    cards: state.players[state.currentTurn.playerId].cardsInHand
                        .filter(({ type }) => type === "vine")
                        .map(id => ({ id })),
                    numCards: 2
                });
            case "CHOOSE_FIELD":
                return endVisitor(plantVineInField(action.fields[0], state));
            default:
                return state;
        }
    },
    landscaper: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                if (!action.cards) {
                    return endVisitor(state); // pass on optional vine planting
                }
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return promptForAction(state, {
                            choices: [
                                { id: "LANDSCAPER_DRAW_PLANT", label: <>Draw 1 <Vine /> and plant up to 1 <Vine /></> },
                                {
                                    id: "LANDSCAPER_SWITCH",
                                    label: <>Switch 2 <Vine /> on your fields</>
                                },
                            ],
                        });
                    case "vine":
                        return promptToPlant(state, card.id);
                    default:
                        return state;
                }
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "LANDSCAPER_DRAW_PLANT":
                        return promptToChooseVineCard(
                            drawCards(state, action._key!, { vine: 1 }),
                            { optional: true }
                        );
                    case "LANDSCAPER_SWITCH":
                        return promptToSwitchVines(state);
                    default:
                        return state;
                }
            case "CHOOSE_FIELD":
                return endVisitor(plantVineInField(action.fields[0], state));
            case "CHOOSE_VINE":
                const player = state.players[state.currentTurn.playerId];
                return endVisitor(updatePlayer(state, player.id, {
                    fields: switchVines(action.vines, player.fields)
                }));
            default:
                return state;
        }
    },
    negotiator: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptForAction(state, {
                    choices: [
                        {
                            id: "NEGOTIATOR_GRAPE",
                            label: <>Discard 1 <Grape /> to gain <Residuals>1</Residuals></>,
                            disabledReason: needGrapesDisabledReason(state)
                        },
                        {
                            id: "NEGOTIATOR_WINE",
                            label: <>Discard 1 <WineGlass /> to gain <Residuals>2</Residuals></>,
                            disabledReason: needWineDisabledReason(state)
                        }
                    ]
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "NEGOTIATOR_GRAPE":
                        return promptToChooseGrape(state, 1);
                    case "NEGOTIATOR_WINE":
                        return promptToChooseWine(state);
                    default:
                        return state;
                }
            case "CHOOSE_GRAPE":
                return endVisitor(gainResiduals(1, discardGrapes(state, action.grapes)));
            case "CHOOSE_WINE":
                return endVisitor(gainResiduals(2, discardWines(state, action.wines)));
            default:
                return state;
        }
    },
    noviceGuide: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptForAction(state, {
                    choices: [
                        { id: "NGUIDE_GAIN", label: <>Gain <Coins>3</Coins></>, },
                        { id: "NGUIDE_MAKE", label: <>Make up to 2 <WineGlass /></>, },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "NGUIDE_GAIN":
                        return endVisitor(gainCoins(3, state));
                    case "NGUIDE_MAKE":
                        return promptToMakeWine(state, /* upToN */ 2);
                    default:
                        return state;
                }
            case "MAKE_WINE":
                return endVisitor(makeWineFromGrapes(state, action.ingredients));
            default:
                return state;
        }
    },
    organizer: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptForWakeUpOrder(state);

            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "WAKE_UP":
                        return passToNextSeason(
                            chooseWakeUp(action.data as WakeUpChoiceData, action._key!, {
                                ...state,
                                // Clear the previous wake-up position
                                wakeUpOrder: state.wakeUpOrder.map(
                                    pos => pos && pos.playerId === state.currentTurn.playerId ? null : pos
                                ) as GameState["wakeUpOrder"],
                            })
                        );
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    overseer: (state, action, pendingAction) => {
        const overseerAction = pendingAction as PlayVisitorPendingAction & { vineId: VineId; };

        switch (action.type) {
            case "CHOOSE_CARDS":
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return promptToBuildStructure(state);
                    case "vine":
                        return promptToPlant(state, card.id);
                    default:
                        return state;
                }
            case "BUILD_STRUCTURE":
                return promptToChooseVineCard(
                    buildStructure(payCoins(structures[action.structureId].cost, state), action.structureId)
                );
            case "CHOOSE_FIELD":
                state = plantVineInField(action.fields[0], state);
                const { red, white } = vineCards[overseerAction.vineId].yields;
                return endVisitor((red || 0) + (white || 0) === 4 ? gainVP(1, state) : state);
            default:
                return state;
        }
    },
    patron: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptForAction(state, {
                    choices: [
                        { id: "PATRON_GAIN", label: <>Gain <Coins>4</Coins></> },
                        { id: "PATRON_DRAW", label: <>Draw 1 <Order /> and 1 <WinterVisitor /></> },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "PATRON_GAIN":
                        return endVisitor(gainCoins(4, state));
                    case "PATRON_DRAW":
                        return endVisitor(drawCards(state, action._key!, { order: 1, winterVisitor: 1, }));
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    peddler: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                if (action.cards!.length === 1) {
                    return promptToChooseCard(state, {
                        title: "Discard 2 cards",
                        cards: state.players[state.currentTurn.playerId].cardsInHand.map(id => ({ id })),
                        numCards: 2,
                    });
                } else {
                    return endVisitor(
                        drawCards(discardCards(action.cards!, state), action._key!, {
                            vine: 1,
                            summerVisitor: 1,
                            order: 1,
                            winterVisitor: 1
                        })
                    );
                }
            default:
                return state;
        }
    },
    // planner: s => endVisitor(s),
    planter: (state, action, pendingAction) => {
        const planterAction = pendingAction as PlayVisitorPendingAction & {
            isDiscarding?: boolean;
            secondPlant?: boolean;
        };
        switch (action.type) {
            case "CHOOSE_CARDS":
                if (!action.cards) {
                    // pass on second plant
                    return endVisitor(gainCoins(1, state));
                }
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return promptForAction(state, {
                            choices: [
                                {
                                    id: "PLANTER_PLANT",
                                    label: <>Plant up to 2 <Vine /> and gain <Coins>1</Coins></>,
                                    disabledReason: plantVinesDisabledReason(state)
                                },
                                {
                                    id: "PLANTER_UPROOT",
                                    label: <>Uproot and discard 1 <Vine /> to gain <VP>2</VP></>,
                                    disabledReason: uprootDisabledReason(state)
                                }
                            ]
                        });
                    case "vine":
                        return planterAction.isDiscarding
                            ? endVisitor(gainVP(2, discardCards(action.cards!, state)))
                            : promptToPlant(state, card.id);
                    default:
                        return state;
                }
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "PLANTER_PLANT":
                        return promptToChooseVineCard(state);
                    case "PLANTER_UPROOT":
                        return promptToUproot(state);
                    default:
                        return state;
                }
            case "CHOOSE_VINE":
                state = uprootVineFromField(action.vines[0], state);
                return promptToChooseCard(setPendingAction({
                    ...planterAction,
                    isDiscarding: true
                }, state), {
                    title: "Discard a vine",
                    cards: state.players[state.currentTurn.playerId].cardsInHand
                        .filter(({ type }) => type === "vine")
                        .map(id => ({ id }))
                });
            case "CHOOSE_FIELD":
                state = plantVineInField(action.fields[0], state);
                const canPlantAgain = !planterAction.secondPlant &&
                    plantVinesDisabledReason(state) === undefined;
                return canPlantAgain
                    ? promptToChooseVineCard(
                        setPendingAction({ ...planterAction, secondPlant: true }, state),
                        { optional: true }
                    )
                    : endVisitor(gainCoins(1, state));
            default:
                return state;
        }
    },
    producer: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                const playerId = state.currentTurn.playerId;
                const hasBonus = state.tableOrder.length > 2;
                return promptForAction(state, {
                    upToN: 2,
                    title: "Retrieve up to 2 workers",
                    choices: allPlacements
                        .map(({ type, bonusLabel, title }) => {
                            if (type === "playSummerVisitor") {
                                // Must retrieve from *other* actions
                                return [];
                            }
                            return state.workerPlacements[type]
                                .map((w, i) => w && w.playerId === playerId
                                    ? {
                                        id: `${type}_${i}`,
                                        label: <>
                                            <Worker color={w.color} workerType={w.type} isTemp={w.isTemp} />
                                            &nbsp;{bonusLabel && hasBonus ? bonusLabel : title}
                                        </>,
                                    } as Choice
                                    : null
                                )
                                .filter((c: Choice | null): c is Choice => !!c);
                        })
                        .flat(),
                });
            case "CHOOSE_ACTION_MULTI":
                const workers: (WorkerType | "temp")[] = [];
                action.choices.forEach(id => {
                    const parts = id.split("_");
                    const placement = parts[0] as WorkerPlacement;
                    const index = parseInt(parts[1], 10);

                    state = {
                        ...state,
                        workerPlacements: {
                            ...state.workerPlacements,
                            [placement]: state.workerPlacements[placement].map((w, i) => {
                                if (!w || i !== index) {
                                    return w;
                                }
                                workers.push(w.isTemp ? "temp" : w.type);
                                return null;
                            }),
                        },
                    };
                });
                const player = state.players[state.currentTurn.playerId];
                const playerWorkers = player.workers.slice();
                workers.forEach(type => {
                    const i = playerWorkers.findIndex(
                        w => !w.available && ((type === "temp" && w.isTemp) || w.type === type)
                    );
                    playerWorkers[i] = { ...playerWorkers[i], available: true };
                });
                return endVisitor(updatePlayer(payCoins(2, state), player.id, { workers: playerWorkers, }));
            default:
                return state;
        }
    },
    sharecropper: (state, action, pendingAction) => {
        const sharecropperAction = pendingAction as PlayVisitorPendingAction & {
            isDiscarding?: boolean;
        };
        switch (action.type) {
            case "CHOOSE_CARDS":
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return promptForAction(state, {
                            choices: [
                                {
                                    id: "SHARECROPPER_PLANT",
                                    label: <>Plant 1 <Vine /></>,
                                    disabledReason: plantVinesDisabledReason(state, { bypassStructures: true })
                                },
                                {
                                    id: "SHARECROPPER_UPROOT",
                                    label: <>Uproot and discard 1 <Vine /> to gain <VP>2</VP></>,
                                    disabledReason: uprootDisabledReason(state)
                                }
                            ]
                        });
                    case "vine":
                        return sharecropperAction.isDiscarding ?
                            endVisitor(gainVP(2, discardCards(action.cards!, state))) :
                            promptToPlant(state, card.id);
                    default:
                        return state;
                }
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "SHARECROPPER_PLANT":
                        return promptToChooseVineCard(state, { bypassStructures: true });
                    case "SHARECROPPER_UPROOT":
                        return promptToUproot(state);
                    default:
                        return state;
                }
            case "CHOOSE_VINE":
                state = uprootVineFromField(action.vines[0], state);
                return promptToChooseCard(setPendingAction({
                    ...sharecropperAction,
                    isDiscarding: true
                }, state), {
                    title: "Discard a vine",
                    cards: state.players[state.currentTurn.playerId].cardsInHand
                        .filter(({ type }) => type === "vine")
                        .map(id => ({ id }))
                });
            case "CHOOSE_FIELD":
                return endVisitor(plantVineInField(action.fields[0], state));
            default:
                return state;
        }
    },
    surveyor: (state, action) => {
        const fields = Object.values(state.players[state.currentTurn.playerId].fields);
        let numEmptyAndOwned = 0;
        let numPlantedAndOwned = 0;
        fields.forEach(f => {
            if (f.sold) {
                return;
            }
            if (f.vines.length === 0) {
                numEmptyAndOwned++;
            } else {
                numPlantedAndOwned++;
            }
        });
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptForAction(state, {
                    choices: [
                        { id: "SURVEYOR_EMPTY", label: <>Gain <Coins>2</Coins> for each empty field you own</>, },
                        { id: "SURVEYOR_PLANTED", label: <>Gain <VP>1</VP> for each planted field you own</>, },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "SURVEYOR_EMPTY":
                        return endVisitor(gainCoins(2 * numEmptyAndOwned, state));
                    case "SURVEYOR_PLANTED":
                        return endVisitor(gainVP(numPlantedAndOwned, state));
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    sponsor: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptForAction(state, {
                    choices: [
                        { id: "SPONSOR_DRAW", label: <>Draw 2 <Vine /></>, },
                        { id: "SPONSOR_GAIN", label: <>Gain <Coins>3</Coins></>, },
                        { id: "SPONSOR_BOTH", label: <>Do both (lose <VP>1</VP>)</>, },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "SPONSOR_DRAW":
                        return endVisitor(drawCards(state, action._key!, { vine: 2 }));
                    case "SPONSOR_GAIN":
                        return endVisitor(gainCoins(3, state));
                    case "SPONSOR_BOTH":
                        return endVisitor(
                            gainCoins(3, drawCards(loseVP(1, state), action._key!, { vine: 2 }))
                        );
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    swindler: (state, action) => {
        const endVisitorAction = makeEndVisitorAction("opponents", (s, playerId) => {
            const playerName = <strong>{s.players[s.currentTurn.playerId].name}</strong>;
            return promptForAction(s, {
                playerId,
                choices: [
                    {
                        id: "SWINDLER_GIVE",
                        label: <>Give {playerName} <Coins>2</Coins>.</>,
                        disabledReason: moneyDisabledReason(s, 2, playerId),
                    },
                    { id: "SWINDLER_PASS", label: <>Pass ({playerName} gains <VP>1</VP>)</> },
                ],
            });
        });
        switch (action.type) {
            case "CHOOSE_CARDS":
                return endVisitorAction(state);

            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "SWINDLER_GIVE":
                        return endVisitorAction(
                            gainCoins(2, payCoins(2, state, action.playerId)),
                            action.playerId
                        );
                    case "SWINDLER_PASS":
                        return endVisitorAction(gainVP(1, state), action.playerId);
                    default:
                        return state;
                }
            default:
                return state;
        }

    },
    tourGuide: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
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
                        return endVisitor(gainCoins(4, state));
                    case "TOUR_HARVEST":
                        return promptToHarvest(state);
                    default:
                        return state;
                }
            case "CHOOSE_FIELD":
                return endVisitor(harvestField(state, action.fields[0]));
            default:
                return state;
        }
    },
    uncertifiedArchitect: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
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
                return endVisitor(buildStructure(state, action.structureId));
            default:
                return state;
        }
    },
    uncertifiedBroker: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
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
                        return endVisitor(gainCoins(9, loseVP(3, state)));
                    case "UBROKER_GAIN_VP":
                        return endVisitor(gainVP(2, payCoins(6, state)));
                    default:
                        return state;
                }
            default:
                return state;
        }
    },
    vendor: (state, action) => {
        const endVisitorAction = makeEndVisitorAction("opponents", (s, playerId) => {
            return promptForAction(s, {
                playerId,
                choices: [
                    { id: "VENDOR_DRAW", label: <>Draw 1 <SummerVisitor /></> },
                    { id: "VENDOR_PASS", label: <>Pass</> },
                ],
            });
        });
        switch (action.type) {
            case "CHOOSE_CARDS":
                state = drawCards(state, action._key!, { vine: 1, order: 1, winterVisitor: 1, });
                return endVisitorAction(state);

            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "VENDOR_DRAW":
                        return endVisitorAction(
                            drawCards(state, action._key!, { summerVisitor: 1 }, action.playerId),
                            action.playerId
                        );
                    case "VENDOR_PASS":
                        return endVisitorAction(state, action.playerId);
                    default:
                        return state;
                }
            default:
                return state;
        }

    },
    volunteerCrew: (state, action) => {
        const endVisitorAction = makeEndVisitorAction("allPlayers", (s, playerId) => {
            const playerName = s.players[s.currentTurn.playerId].name;
            return promptForAction(s, {
                playerId,
                choices: [
                    {
                        id: "VCREW_PLANT",
                        label: <>
                            Plant 1 <Vine />
                            {playerId !== s.currentTurn.playerId
                                ? <> (<strong>{playerName}</strong> gains <Coins>2</Coins>)</>
                                : null}
                        </>,
                        disabledReason: plantVinesDisabledReason(s, { playerId })
                    },
                    {
                        id: "VCREW_PASS",
                        label: <>Pass</>,
                    },
                ],
            });
        });
        switch (action.type) {
            case "CHOOSE_CARDS":
                const card = action.cards![0];
                switch (card.type) {
                    case "visitor":
                        return endVisitorAction(state);
                    case "vine":
                        return promptToPlant(state, card.id, { playerId: action.playerId });
                    default:
                        return state;
                }
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "VCREW_PLANT":
                        return promptToChooseVineCard(state, { playerId: action.playerId });
                    case "VCREW_PASS":
                        return endVisitorAction(state, action.playerId);
                    default:
                        return state;
                }
            case "CHOOSE_FIELD":
                state = plantVineInField(action.fields[0], state, action.playerId);
                return endVisitorAction(
                    action.playerId !== state.currentTurn.playerId ? gainCoins(2, state) : state,
                    action.playerId
                );
            default:
                return state;
        }
    },
    wineCritic: (state, action) => {
        switch (action.type) {
            case "CHOOSE_CARDS":
                return promptForAction(state, {
                    choices: [
                        { id: "WCRITIC_DRAW", label: <>Draw 2 <WinterVisitor /></>, },
                        {
                            id: "WCRITIC_DISCARD",
                            label: <>Discard 1 <WineGlass /> of value 7 or more to gain <VP>4</VP></>,
                            disabledReason: needWineDisabledReason(state, /* minValue */ 7),
                        },
                    ],
                });
            case "CHOOSE_ACTION":
                switch (action.choice) {
                    case "WCRITIC_DRAW":
                        return endVisitor(drawCards(state, action._key!, { winterVisitor: 2 }));
                    case "WCRITIC_DISCARD":
                        return promptToChooseWine(state, { minValue: 7 });
                    default:
                        return state;
                }
            case "CHOOSE_WINE":
                return endTurn(gainVP(4, discardWines(state, action.wines)));
            default:
                return state;
        }
    },
};
