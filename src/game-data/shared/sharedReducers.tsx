import * as React from "react";
import GameState, {
    CardType,
    WakeUpPosition,
    FieldId,
    TokenMap,
    CardId,
    WorkerPlacementTurnPendingAction,
    WorkerPlacementTurn,
} from "../GameState";
import { visitorCards } from "../visitors/visitorCards";
import { promptForAction } from "../prompts/promptReducers";
import { SummerVisitor, WinterVisitor, Vine, Order } from "../../game-views/icons/Card";
import { fieldYields } from "./sharedSelectors";
import { WineIngredients } from "../prompts/promptActions";
import { StructureId } from "../structures";
import Coins from "../../game-views/icons/Coins";
import VictoryPoints from "../../game-views/icons/VictoryPoints";
import Worker from "../../game-views/icons/Worker";

export const discardWine = (state: GameState, playerId: string, wine: unknown) => {
    return state;
};

const devaluedIndex = (value: number, tokens: TokenMap) => {
    for (value--; value >= 0; --value) {
        if (!tokens[value]) {
            return value;
        }
    }
    return -1;
};

export const harvestField = (state: GameState, fieldId: FieldId): GameState => {
    const player = state.players[state.currentTurn.playerId];
    const yields = fieldYields(player.fields[fieldId]);
    return placeGrapes(state, yields);
};

export const placeGrapes = (
    state: GameState,
    values: { red: number; white: number }
): GameState => {
    const player = state.players[state.currentTurn.playerId];

    // devalue grapes if crush pad already contains the same value
    const red = devaluedIndex(values.red, player.crushPad.red);
    const white = devaluedIndex(values.white, player.crushPad.white);
    return {
        ...state,
        players: {
            ...state.players,
            [player.id]: {
                ...player,
                crushPad: {
                    red: player.crushPad.red.map((r, i) => i === red || r) as TokenMap,
                    white: player.crushPad.white.map((w, i) => i === white || w) as TokenMap,
                },
            },
        },
    };
};

export const makeWineFromGrapes = (
    state: GameState,
    wine: WineIngredients[],
    playerId = state.currentTurn.playerId
): GameState => {
    const player = state.players[playerId];

    let { cellar, crushPad } = player;
    wine.forEach(({ type, grapes }) => {
        const value = grapes.reduce((v, g) => v + g.value, 0);
        const newWineIdx = devaluedIndex(value, cellar[type]);
        cellar = {
            ...cellar,
            [type]: cellar[type].map((w, i) => w || i === newWineIdx),
        };
        crushPad = {
            red: crushPad.red.map(
                (r, i) => r && grapes.every(({ color, value }) => color !== "red" || value !== i + 1)
            ) as TokenMap,
            white: crushPad.white.map(
                (w, i) => w && grapes.every(({ color, value }) => color !== "white" || value !== i + 1)
            ) as TokenMap,
        };
    });

    return {
        ...state,
        players: {
            ...state.players,
            [player.id]: {
                ...player,
                crushPad,
                cellar,
            },
        },
    };
};

export const buildStructure = (state: GameState, structureId: StructureId): GameState => {
    const player = state.players[state.currentTurn.playerId];
    return {
        ...state,
        players: {
            ...state.players,
            [player.id]: {
                ...player,
                structures: {
                    ...player.structures,
                    [structureId]: true,
                },
            },
        },
    };
};

export const setPendingAction = <T extends WorkerPlacementTurnPendingAction>(
    pendingAction: T,
    state: GameState
): GameState => {
    return {
        ...state,
        currentTurn: {
            ...(state.currentTurn as WorkerPlacementTurn),
            pendingAction,
        },
    };
};

const splitDeck = <T extends unknown>(deck: T[], n: number | undefined): [T[], T[]] => {
    return [n ? deck.slice(0, n) : [], n ? deck.slice(n) : deck];
};
export const drawCards = (
    state: GameState,
    numCards: { [K in CardType]?: number },
    playerId = state.currentTurn.playerId
): GameState => {
    const drawPiles = state.drawPiles;
    const [drawnVines, vine] = splitDeck(drawPiles.vine, numCards.vine);
    const [drawnSummerVisitors, summerVisitor] = splitDeck(drawPiles.summerVisitor, numCards.summerVisitor);
    const [drawnOrders, order] = splitDeck(drawPiles.order, numCards.order);
    const [drawnWinterVisitors, winterVisitor] = splitDeck(drawPiles.winterVisitor, numCards.winterVisitor);

    return {
        ...state,
        drawPiles: { vine, summerVisitor, order, winterVisitor },
        players: {
            ...state.players,
            [playerId]: {
                ...state.players[playerId],
                cardsInHand: [
                    ...state.players[playerId].cardsInHand,
                    ...drawnVines.map((id) => ({ type: "vine" as const, id })),
                    ...drawnSummerVisitors.map((id) => ({ type: "visitor" as const, id })),
                    ...drawnOrders.map((id) => ({ type: "order" as const, id })),
                    ...drawnWinterVisitors.map((id) => ({ type: "visitor" as const, id })),
                ],
            },
        },
    };
};

export const discardCards = (cards: CardId[], state: GameState): GameState => {
    return addToDiscard(cards, removeCardsFromHand(cards, state));
};

export const removeCardsFromHand = (cards: CardId[], state: GameState): GameState => {
    const player = state.players[state.currentTurn.playerId];
    return {
        ...state,
        players: {
            ...state.players,
            [player.id]: {
                ...player,
                cardsInHand: player.cardsInHand.filter(({ id }) =>
                    cards.every((card) => card.id !== id)
                ),
            },
        },
    };
};

export const addToDiscard = (cards: CardId[], state: GameState): GameState => {
    let discardPiles = state.discardPiles;
    for (const card of cards) {
        const pileType =
            card.type === "visitor"
                ? visitorCards[card.id].season === "summer"
                    ? "summerVisitor"
                    : "winterVisitor"
                : card.type;
        discardPiles = {
            ...discardPiles,
            [pileType]: [card.id, ...discardPiles[pileType]],
        };
    }
    return { ...state, discardPiles };
};

export const passToNextSeason = (
    state: GameState,
    playerId = state.currentTurn.playerId
): GameState => {
    const wakeUpOrder = state.wakeUpOrder.map((pos) => {
        if (!pos || pos.playerId !== playerId) {
            return pos;
        }
        return { ...pos, passed: true };
    }) as GameState["wakeUpOrder"];

    return endWorkerPlacementTurn({ ...state, wakeUpOrder });
};

export const endTurn = (state: GameState): GameState => {
    const { currentTurn, wakeUpOrder } = state;
    const compactWakeUpOrder = wakeUpOrder.filter((pos) => pos !== null) as WakeUpPosition[];

    switch (currentTurn.type) {
        case "papaSetUp":
            return state;

        case "wakeUpOrder":
            return state;

        case "workerPlacement":
            return endWorkerPlacementTurn(movePendingCardToDiscard(state));

        case "fallVisitor":
            const i = compactWakeUpOrder.findIndex((pos) => pos.playerId === currentTurn.playerId);
            if (i === compactWakeUpOrder.length - 1) {
                // end of season
                return startWorkerPlacementTurn("winter", compactWakeUpOrder[0].playerId, state);
            } else {
                const nextPlayerId =
                    compactWakeUpOrder[(i + 1) % compactWakeUpOrder.length].playerId;
                return promptToDrawFallVisitor({
                    ...state,
                    currentTurn: {
                        ...state.currentTurn,
                        playerId: nextPlayerId,
                    },
                });
            }
    }
};

const endWorkerPlacementTurn = (state: GameState): GameState => {
    const { currentTurn, wakeUpOrder } = state;
    const season = (state.currentTurn as WorkerPlacementTurn).season;
    const compactWakeUpOrder = wakeUpOrder.filter((pos) => pos !== null) as WakeUpPosition[];
    const activeWakeUpOrder = compactWakeUpOrder.filter((pos) => !pos.passed);

    if (compactWakeUpOrder.every((p) => p.passed)) {
        // If everyone passed, it's the end of the season
        if (season === "summer") {
            return promptToDrawFallVisitor({
                ...state,
                // preserve wake-up order; just reset "passed" state
                wakeUpOrder: wakeUpOrder.map((pos) => {
                    return pos === null ? null : { ...pos, passed: false };
                }) as GameState["wakeUpOrder"],
                currentTurn: {
                    type: "fallVisitor",
                    playerId: compactWakeUpOrder[0].playerId,
                },
            });
        } else {
            // End of year
            // TODO discard too many cards
            const tableOrder = state.tableOrder;
            const grapeIndex = (tableOrder.length + state.grapeIndex - 1) % tableOrder.length;
            return promptForWakeUpOrder({
                ...state,
                grapeIndex,
                currentTurn: { type: "wakeUpOrder", playerId: tableOrder[grapeIndex] },
                wakeUpOrder: wakeUpOrder.map((pos) => null) as GameState["wakeUpOrder"],
                workerPlacements: (Object.fromEntries(
                    Object.entries(state.workerPlacements).map(([placement]) => [placement, []])
                ) as unknown) as GameState["workerPlacements"],
                players: Object.fromEntries(
                    Object.entries(state.players).map(([playerId, playerState]) => {
                        return [
                            playerId,
                            {
                                ...playerState,
                                coins: playerState.coins + playerState.residuals,
                                trainedWorkers: playerState.trainedWorkers.map((w) => ({
                                    ...w,
                                    available: true,
                                })),
                                crushPad: {
                                    red: age(playerState.crushPad.red),
                                    white: age(playerState.crushPad.white),
                                },
                                cellar: {
                                    red: age(playerState.cellar.red),
                                    white: age(playerState.cellar.white),
                                    blush: age(playerState.cellar.blush),
                                    sparkling: age(playerState.cellar.sparkling),
                                },
                            },
                        ];
                    })
                ),
            });
        }
    }
    const i = activeWakeUpOrder.findIndex((pos) => pos.playerId === currentTurn.playerId);
    const nextPlayerId = activeWakeUpOrder[(i + 1) % activeWakeUpOrder.length].playerId;

    return startWorkerPlacementTurn(season, nextPlayerId, state);
};

const startWorkerPlacementTurn = (
    season: "summer" | "winter",
    playerId: string,
    state: GameState
) => {
    state = {
        ...state,
        currentTurn: { type: "workerPlacement", playerId, pendingAction: null, season },
    };
    const player = state.players[playerId];
    if (player.trainedWorkers.filter((w) => w.available).length === 0) {
        // player is out of workers, auto-pass them
        return passToNextSeason(state, player.id);
    }
    return state;
};

const age = (tokens: TokenMap): TokenMap => {
    const newTokenMap = new Array(9).fill(false) as TokenMap;
    for (let i = tokens.length - 1; i >= 0; --i) {
        if (!tokens[i]) {
            continue;
        }
        if (i === tokens.length - 1 || newTokenMap[i + 1]) {
            // can't age
            newTokenMap[i] = true;
        } else {
            newTokenMap[i + 1] = true;
        }
    }
    return newTokenMap;
};

const movePendingCardToDiscard = (state: GameState): GameState => {
    const { currentTurn } = state;
    if (currentTurn.type !== "workerPlacement" || currentTurn.pendingAction === null) {
        return state;
    }
    switch (currentTurn.pendingAction.type) {
        case "playVisitor":
            const visitorId = currentTurn.pendingAction.visitorId!;
            return addToDiscard([{ type: "visitor", id: visitorId }], state);
        case "plantVine":
            const vineId = currentTurn.pendingAction.vineId!;
            return addToDiscard([{ type: "vine", id: vineId }], state);
        default:
            return state;
    }
};

export const chooseWakeUpIndex = (orderIndex: number, state: GameState) => {
    const { grapeIndex, tableOrder } = state;
    const playerId = state.currentTurn.playerId;
    const wakeUpOrder = state.wakeUpOrder.map((pos, i) =>
        i === orderIndex ? { playerId } : pos
    ) as GameState["wakeUpOrder"];

    state = { ...state, wakeUpOrder };

    if (state.currentTurn.type !== "wakeUpOrder") {
        // eg. organizer visitor
        return state;
    }
    const nextWakeUpIndex = (tableOrder.indexOf(playerId) + 1) % tableOrder.length;
    if (nextWakeUpIndex === grapeIndex) {
        const firstPlayerId = wakeUpOrder.filter((pos) => pos)[0]!.playerId;
        return startWorkerPlacementTurn("summer", firstPlayerId, state);
    }
    return promptForWakeUpOrder({
        ...state,
        currentTurn: {
            type: "wakeUpOrder",
            playerId: tableOrder[nextWakeUpIndex],
        },
    });
};

export const promptForWakeUpOrder = (state: GameState) => {
    return promptForAction(state, {
        title: "Choose wake-up order",
        choices: [
            { id: "WAKE_UP_1", label: <>1: No bonus</> },
            { id: "WAKE_UP_2", label: <>2: Draw <Vine /></>, },
            { id: "WAKE_UP_3", label: <>3: Draw <Order /></>, },
            { id: "WAKE_UP_4", label: <>4: Gain <Coins>1</Coins></>, },
            { id: "WAKE_UP_5", label: <>5: Draw <SummerVisitor /> or <WinterVisitor /></>, },
            { id: "WAKE_UP_6", label: <>6: Gain <VictoryPoints>1</VictoryPoints></>, },
            { id: "WAKE_UP_7", label: <>7: <Worker /> this year</>, },
        ].map((choice, i) =>
            state.wakeUpOrder[i]
                ? { ...choice, disabledReason: `Taken by ${state.wakeUpOrder[i]!.playerId}` }
                : choice
        ),
    });
};

export const promptToDrawWakeUpVisitor = (state: GameState) => {
    return promptForAction(state, {
        choices: [
            { id: "WAKE_UP_DRAW_SUMMER", label: <>Draw 1 <SummerVisitor /></>, },
            { id: "WAKE_UP_DRAW_WINTER", label: <>Draw 1 <WinterVisitor /></>, },
        ],
    });
};

const promptToDrawFallVisitor = (state: GameState) => {
    return promptForAction(state, {
        choices: [
            { id: "FALL_DRAW_SUMMER", label: <>Draw 1 <SummerVisitor /></>, },
            { id: "FALL_DRAW_WINTER", label: <>Draw 1 <WinterVisitor /></>, },
        ],
    });
};

const editVP = (numVP: number, state: GameState, playerId = state.currentTurn.playerId) => {
    const playerState = state.players[playerId];
    return {
        ...state,
        players: {
            ...state.players,
            [playerId]: {
                ...playerState,
                victoryPoints: playerState.victoryPoints + numVP,
            },
        },
    };
};
export const gainVP = editVP;
export const loseVP = (numVP: number, state: GameState, playerId = state.currentTurn.playerId) =>
    editVP(-numVP, state, playerId);

const editCoins = (numCoins: number, state: GameState, playerId = state.currentTurn.playerId) => {
    const playerState = state.players[playerId];
    return {
        ...state,
        players: {
            ...state.players,
            [playerId]: {
                ...playerState,
                coins: playerState.coins + numCoins,
            },
        },
    };
};
export const gainCoins = editCoins;
export const payCoins = (numCoins: number, state: GameState, playerId = state.currentTurn.playerId) =>
    editCoins(-numCoins, state, playerId);

const editResiduals = (
    numResiduals: number,
    state: GameState,
    playerId = state.currentTurn.playerId
) => {
    const playerState = state.players[playerId];
    return {
        ...state,
        players: {
            ...state.players,
            [playerId]: {
                ...playerState,
                residuals: playerState.residuals + numResiduals,
            },
        },
    };
};
export const gainResiduals = editResiduals;
export const loseResiduals = (numResiduals: number, state: GameState, playerId = state.currentTurn.playerId) =>
    editResiduals(-numResiduals, state, playerId);

export const trainWorker = (state: GameState, playerId = state.currentTurn.playerId): GameState => {
    return {
        ...state,
        players: {
            ...state.players,
            [playerId]: {
                ...state.players[playerId],
                trainedWorkers: [
                    ...state.players[playerId].trainedWorkers,
                    { type: "normal", available: false },
                ],
            },
        },
    };
};