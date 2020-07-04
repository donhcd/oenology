import GameState, {
    FieldId,
    PlayerState,
    WorkerPlacementTurn,
    StructureState,
} from "../GameState";
import { ActivityLogEvent } from "../ActivityLog";
import { StructureId } from "../structures";
import { VineId } from "../vineCards";
import { addToDiscard, addCardsToHand } from "./cardReducers";

export const pushActivityLog = (event: ActivityLogEvent, state: GameState): GameState => {
    return { ...state, activityLog: [...state.activityLog, event], };
};

export const plantVineInField = (fieldId: FieldId, state: GameState): GameState => {
    const vineId = ((state.currentTurn as WorkerPlacementTurn).pendingAction as any).vineId as VineId;
    if (!vineId) {
        throw new Error("Unexpected state: should've chosen a vine before planting");
    }
    const player = state.players[state.currentTurn.playerId];
    const field = player.fields[fieldId];
    const windmillAvailable = player.structures["windmill"] === StructureState.Built;
    const vines: VineId[] = [...field.vines, vineId];
    return pushActivityLog(
        { type: "plant", playerId: player.id, vineId },
        addToDiscard(
            [{ type: "vine", id: vineId }],
            updatePlayer(windmillAvailable ? markStructureUsed("windmill", gainVP(1, state)) : state,
                player.id, {
                fields: {
                    ...player.fields,
                    [field.id]: { ...field, vines },
                }
            })
        )
    );
};

export const uprootVineFromField = (vineId: VineId, fieldId: FieldId, state: GameState): GameState => {
    const player = state.players[state.currentTurn.playerId];
    const field = player.fields[fieldId];
    const vines = [...field.vines];
    const vineIndex = vines.indexOf(vineId);
    if (vineIndex === -1) {
        throw new Error("Unxpected state: vine not found in field");
    }
    vines.splice(vineIndex, 1);

    return pushActivityLog(
        { type: "uproot", playerId: player.id, vineId },
        addCardsToHand(
            [{ type: "vine", id: vineId }],
            updatePlayer(state, player.id, {
                fields: {
                    ...player.fields,
                    [field.id]: { ...field, vines },
                }
            })
        )
    );
};

export const buildStructure = (state: GameState, structureId: StructureId): GameState => {
    const player = state.players[state.currentTurn.playerId];
    return pushActivityLog(
        { type: "build", playerId: player.id, structureId },
        updatePlayer(state, player.id, {
            structures: {
                ...player.structures,
                [structureId]: StructureState.Built,
            },
        })
    );
};

const editVP = (numVP: number, state: GameState, playerId = state.currentTurn.playerId) => {
    const playerState = state.players[playerId];
    return pushActivityLog(
        { type: "vp", playerId, delta: numVP },
        updatePlayer(state, playerId, { victoryPoints: playerState.victoryPoints + numVP, })
    );
};
export const gainVP = editVP;
export const loseVP = (numVP: number, state: GameState, playerId = state.currentTurn.playerId) =>
    editVP(-numVP, state, playerId);

const editCoins = (numCoins: number, state: GameState, playerId = state.currentTurn.playerId) => {
    if (numCoins === 0) {
        return state;
    }
    const playerState = state.players[playerId];
    return pushActivityLog(
        { type: "coins", playerId, delta: numCoins },
        updatePlayer(state, playerId, { coins: playerState.coins + numCoins, })
    );
};
export const gainCoins = editCoins;
export const payCoins = (numCoins: number, state: GameState, playerId = state.currentTurn.playerId) =>
    editCoins(-Math.max(0, numCoins), state, playerId);

const editResiduals = (
    numResiduals: number,
    state: GameState,
    playerId = state.currentTurn.playerId
) => {
    const playerState = state.players[playerId];
    return pushActivityLog(
        { type: "residuals", playerId, delta: numResiduals },
        updatePlayer(state, playerId, { residuals: playerState.residuals + numResiduals })
    );
};
export const gainResiduals = editResiduals;
export const loseResiduals = (numResiduals: number, state: GameState, playerId = state.currentTurn.playerId) =>
    editResiduals(-numResiduals, state, playerId);

export const trainWorker = (
    state: GameState,
    { playerId = state.currentTurn.playerId, availableThisYear = false }: {
        playerId?: string;
        availableThisYear?: boolean;
    } = {}
): GameState => {
    return pushActivityLog(
        { type: "trainWorker", playerId },
        updatePlayer(state, playerId, {
            workers: [
                ...state.players[playerId].workers,
                { type: "normal", available: availableThisYear },
            ],
        })
    );
};

export const markStructureUsed = (structureId: StructureId, state: GameState, playerId = state.currentTurn.playerId): GameState => {
    const player = state.players[playerId];

    return updatePlayer(state, playerId, {
        structures: {
            ...player.structures,
            [structureId]: StructureState.Used,
        },
    });
};

export const updatePlayer = (state: GameState, playerId: string, updates: Partial<PlayerState>): GameState => {
    const player = state.players[playerId];
    return {
        ...state,
        players: {
            ...state.players,
            [player.id]: {
                ...player,
                ...updates
            },
        },
    };
};
