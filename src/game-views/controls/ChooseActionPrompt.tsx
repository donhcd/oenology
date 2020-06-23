import "./ChooseActionPrompt.css";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { GameAction } from "../../game-data/gameActions";
import { ChooseActionPromptState } from "../../game-data/prompts/PromptState";
import { chooseAction } from "../../game-data/prompts/promptActions";
import PromptStructure from "./PromptStructure";
import ChoiceButton from "./ChoiceButton";
import VisitorCard from "../cards/VisitorCard";
import { visitorCards } from "../../game-data/visitors/visitorCards";

interface Props {
    prompt: ChooseActionPromptState;
    onSelectChoice: (choice: string, playerId: string) => void;
}

const ChooseActionPrompt: React.FunctionComponent<Props> = props => {
    const { prompt } = props;
    return <PromptStructure title={prompt.title}>
        <div className="ChooseActionPrompt-body">
            {prompt.contextVisitor
                ? <VisitorCard
                      className="ChooseActionPrompt-contextCard"
                      cardData={visitorCards[prompt.contextVisitor]}
                  />
                : null}
            <ul className="ChooseActionPrompt-choices">
                {prompt.choices.map((choice, i) => {
                    return <li className="ChooseActionPrompt-choice" key={i}>
                        <ChoiceButton
                            className="ChooseActionPrompt-choiceButton"
                            disabled={choice.disabledReason !== undefined}
                            onClick={() => props.onSelectChoice(choice.id, prompt.playerId)}
                        >
                            {choice.label}
                        </ChoiceButton>
                    </li>;
                })}
            </ul>
        </div>
    </PromptStructure>;
};

const mapDispatchToProps = (dispatch: Dispatch<GameAction>) => {
    return {
        onSelectChoice: (choice: string, playerId: string) => dispatch(chooseAction(choice, playerId))
    };
}

export default connect(null, mapDispatchToProps)(ChooseActionPrompt);