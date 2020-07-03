import { Coupon } from "../structures";
import { CardId, FieldId } from "../GameState";
import { OrderId } from "../orderCards";
import { VisitorId } from "../visitors/visitorCards";
import { VineId } from "../vineCards";

export type PromptState =
    | ChooseActionPromptState
    | ChooseCardPromptState
    | ChooseWinePromptState
    | FillOrderPromptState
    | ChooseFieldPromptState
    | MakeWinePromptState
    | PlaceWorkerPromptState
    | BuildStructurePromptState;

export interface Choice<DataT = unknown> {
    id: string;
    label: React.ReactNode;
    data?: DataT;
    disabledReason?: string;
}
export interface ChooseActionPromptState {
    type: "chooseAction";
    title: string;
    description: React.ReactNode;
    playerId: string;
    contextVisitor?: VisitorId;
    choices: Choice[];
}

export interface ChooseCardPromptState {
    type: "chooseCard";
    title: React.ReactNode;
    style: "selector" | "oneClick";
    cards: {
        id: CardId;
        disabledReason?: string | undefined;
    }[];
    optional?: boolean;
    numCards: number;
}

export interface ChooseWinePromptState {
    type: "chooseWine";
    minValue: number;
    limit: number;
}

export interface FillOrderPromptState {
    type: "fillOrder";
    orderIds: OrderId[];
}

export interface ChooseFieldPromptState {
    type: "chooseField";
    disabledReasons: Record<FieldId, string | undefined>;
}

export interface MakeWinePromptState {
    type: "makeWine";
    upToN: number;
}

export interface PlaceWorkerPromptState {
    type: "placeWorker";
}

export interface BuildStructurePromptState {
    type: "buildStructure";
    coupon?: Coupon;
}
