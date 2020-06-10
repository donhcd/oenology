import { SummerVisitorId, VisitorId, WinterVisitorId } from "./visitors/visitorCards";
import { PromptState } from "./prompts/PromptState";
import { VineId } from "./vineCards";
import { OrderId } from "./orderCards";

export default interface GameState {
    // shared state
    currentTurn: CurrentTurn;
    players: Record<string, PlayerState>;
    tableOrder: string[];
    grapeIndex: number; // index into tableOrder. picks wakeUpOrder first this year.
    wakeUpOrder: [
        PlayerWakeUpOrder, // -
        PlayerWakeUpOrder, // vine
        PlayerWakeUpOrder, // order
        PlayerWakeUpOrder, // coin
        PlayerWakeUpOrder, // visitor
        PlayerWakeUpOrder, // victory point
        PlayerWakeUpOrder, // temp worker
    ];
    drawPiles: CardsByType;
    discardPiles: CardsByType;

    // local state
    playerId: string | null;
    actionPrompt: PromptState;
}

type PlayerWakeUpOrder = null | {
    playerId: string;
    passed?: true;
};

export type CurrentTurn =
    | { type: "papaSetUp"; playerId: string; }
    | { type: "wakeUpOrder"; playerId: string; }
    | WorkerPlacementTurn
    | { type: "fallVisitor"; playerId: string; };

export interface WorkerPlacementTurn {
    type: "workerPlacement";
    playerId: string;
    season: "summer" | "winter";

    // Non-null if the player has chosen to play a worker in a position
    // but is pending further action before completing their turn
    // (eg. needs to pick a visitor card to play).
    pendingAction:
        | null
        | { type: "playVisitor"; visitorId?: VisitorId; }
        | { type: "buySell"; } // sell grape OR sell field OR buy field, then choose grape or choose field
        | { type: "plant"; } // choose vine card
        | { type: "build"; } // choose structure
        | { type: "harvest"; } // choose field
        | { type: "makeWine"; } // choose grape
        | { type: "fillOrder"; }; // choose order card
}

export type CardType = "vine" | "summerVisitor" | "order" | "winterVisitor";
export type GrapeColor = "red" | "white";
export type PlayerColor = "blue" | "green" | "orange" | "yellow" | "purple" | "red";
export type Structure = "trellis" | "irrigation" | "yoke" | "windmill" | "cottage" | "tastingRoom";
export type TokenMap = [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
export type WineColor = "red" | "white" | "blush" | "sparkling";

export interface PlayerState {
    id: string;
    color: PlayerColor;
    coins: number;
    residuals: number;
    victoryPoints: number;
    availableWorkers: {
        grande: boolean;
        other: number;
    };
    cardsInHand: CardId[];
    fields: Field[];
    crushPad: Record<"red" | "white", TokenMap>;
    cellar: Record<"red" | "white" | "rose" | "sparkling", TokenMap>;
}

export type CardId =
    | { type: "vine"; id: VineId }
    | { type: "summerVisitor"; id: SummerVisitorId }
    | { type: "order"; id: OrderId }
    | { type: "winterVisitor"; id: WinterVisitorId };

export interface CardsByType {
    vine: VineId[];
    summerVisitor: SummerVisitorId[];
    order: OrderId[];
    winterVisitor: WinterVisitorId[];
}

interface Field {
    value: number;
    vines: VineId[];
    sold: boolean;
}
