import * as React from "react";
import GameState, { CardType, WakeUpPosition } from "../GameState";
import { SummerVisitorId, WinterVisitorId } from "../visitors/visitorCards";
import { promptForAction } from "../prompts/promptReducers";
import { SummerVisitor, WinterVisitor } from "../../game-views/icons/Card";

export const discardWine = (state: GameState, playerId: string, wine: unknown) => {
    return state;
};

const splitDeck = <T extends unknown>(deck: T[], n: number | undefined): [T[], T[]] => {
    return [n ? deck.slice(0, n) : [], n ? deck.slice(n) : deck];
};
export const drawCards = (
    state: GameState,
    playerId: string,
    numCards: { [K in CardType]?: number }
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
                    ...drawnVines.map(id => ({ type: "vine" as const, id })),
                    ...drawnSummerVisitors.map(id => ({ type: "summerVisitor" as const, id })),
                    ...drawnOrders.map(id => ({ type: "order" as const, id })),
                    ...drawnWinterVisitors.map(id => ({ type: "winterVisitor" as const, id })),
                ],
            }
        }
    };
};

export const endTurn = (state: GameState): GameState => {
    const { currentTurn, wakeUpOrder } = state;
    const compactWakeUpOrder = wakeUpOrder.filter(pos => pos !== null) as WakeUpPosition[];
    const activeWakeUpOrder = compactWakeUpOrder.filter(pos => !pos.passed);

    switch (currentTurn.type) {
        case "papaSetUp":
            return state;

        case "wakeUpOrder":
            return state;

        case "workerPlacement": {
            state = discardPendingCard(state);

            if (compactWakeUpOrder.every(p => p.passed)) {
                // If everyone passed, it's the end of the season
                if (currentTurn.season === "summer") {
                    return promptToDrawFallVisitor({
                        ...state,
                        // preserve wake-up order; just reset "passed" state
                        wakeUpOrder: wakeUpOrder.map(pos => {
                            return pos === null ? null : { ...pos, passed: false };
                        }) as GameState["wakeUpOrder"],
                        currentTurn: {
                            type: "fallVisitor",
                            playerId: compactWakeUpOrder[0].playerId,
                        }
                    });
                } else {
                    // TODO end of year stuff, and then reset wakeUpOrder
                    return {
                        ...state,
                        wakeUpOrder: wakeUpOrder.map(pos => {
                            return pos === null ? null : { ...pos, passed: false };
                        }) as GameState["wakeUpOrder"],
                        currentTurn: {
                            type: "workerPlacement",
                            playerId: compactWakeUpOrder[0].playerId,
                            season: "summer",
                            pendingAction: null,
                        },
                        players: Object.fromEntries(
                            Object.entries(state.players).map(([playerId, playerState]) => {
                                return [playerId, {
                                    ...playerState,
                                    // Mark all trained workers as available again
                                    trainedWorkers: playerState.trainedWorkers.map(w => ({
                                        ...w,
                                        available: true,
                                    })),
                                }];
                            })
                        ),
                    };
                }
            }
            const i = activeWakeUpOrder.findIndex(pos => pos.playerId === currentTurn.playerId);
            const nextPlayerId = activeWakeUpOrder[(i + 1) % activeWakeUpOrder.length].playerId;

            return {
                ...state,
                currentTurn: {
                    type: "workerPlacement",
                    playerId: nextPlayerId,
                    pendingAction: null,
                    season: currentTurn.season,
                },
            };
        }

        case "fallVisitor":
            const i = compactWakeUpOrder.findIndex(pos => pos.playerId === currentTurn.playerId);
            if (i === compactWakeUpOrder.length - 1) {
                // end of season
                return {
                    ...state,
                    currentTurn: {
                        type: "workerPlacement",
                        playerId: compactWakeUpOrder[0].playerId,
                        season: "winter",
                        pendingAction: null,
                    },
                };
            } else {
                const nextPlayerId = compactWakeUpOrder[(i + 1) % compactWakeUpOrder.length].playerId;
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

const discardPendingCard = (state: GameState): GameState => {
    const { currentTurn, players, discardPiles } = state;
    if (
        currentTurn.type !== "workerPlacement" ||
        currentTurn.pendingAction === null
    ) {
        return state;
    }
    const player = players[currentTurn.playerId];

    switch (currentTurn.pendingAction.type) {
        case "playVisitor":
            const visitorId = currentTurn.pendingAction.visitorId;
            return {
                ...state,
                // Filter out visitor card from current player's hand
                players: {
                    ...players,
                    [player.id]: {
                        ...player,
                        cardsInHand: player.cardsInHand.filter(({ id }) => id !== visitorId),
                    },
                },
                // And add it to the front of the appropriate discard pile
                discardPiles: {
                    ...discardPiles,
                    ...(currentTurn.season === "summer"
                        ? { summerVisitor: [visitorId as SummerVisitorId, ...discardPiles.summerVisitor] }
                        : { winterVisitor: [visitorId as WinterVisitorId, ...discardPiles.winterVisitor] })
                },
            }
        case "plantVine":
            const vineId = currentTurn.pendingAction.vineId!;
            return {
                ...state,
                players: {
                    ...players,
                    [player.id]: {
                        ...player,
                        cardsInHand: player.cardsInHand.filter(({ id }) => id !== vineId),
                    },
                },
                discardPiles: {
                    ...discardPiles,
                    vine: [vineId, ...discardPiles.vine],
                },
            };
        default:
            return state;
    }
};

const promptToDrawFallVisitor = (state: GameState) => {
    return promptForAction(state, [
        { id: "FALL_DRAW_SUMMER", label: <>Draw 1 <SummerVisitor /></> },
        { id: "FALL_DRAW_WINTER", label: <>Draw 1 <WinterVisitor /></> },
    ]);
};

export const gainVP = (state: GameState, playerId: string, numVP: number) => {
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

const editCoins = (state: GameState, playerId: string, numCoins: number) => {
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
export const payCoins = (state: GameState, playerId: string, numCoins: number) =>
    editCoins(state, playerId, -numCoins);

export const trainWorker = (state: GameState, playerId: string, cost: number): GameState => {
    state = payCoins(state, playerId, cost);
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
