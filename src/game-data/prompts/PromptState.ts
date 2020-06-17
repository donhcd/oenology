import { Coupon } from "../structures";
import { CardId } from "../GameState";

export type PromptState =
    | ChooseActionPromptState
    | ChooseCardPromptState
    | { type: "chooseField"; }
    | MakeWinePromptState
    | ChooseWinePromptState
    | BuildStructurePromptState;

export interface Choice {
    id: string;
    label: React.ReactNode;
    disabledReason?: string;
}
export interface ChooseActionPromptState {
    type: "chooseAction";
    title: string;
    playerId: string;
    choices: Choice[];
}

export interface ChooseCardPromptState {
    type: "chooseCard";
    title: string;
    cards: CardId[];
}

export interface MakeWinePromptState {
    type: "makeWine";
    upToN: number;
}

export interface ChooseWinePromptState {
    type: "chooseWine";
    minValue: number;
}

export interface BuildStructurePromptState {
    type: "buildStructure";
    coupon?: Coupon;
}
