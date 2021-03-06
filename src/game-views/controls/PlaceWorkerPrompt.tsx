import "./PlaceWorkerPrompt.css";
import cx from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { GameAction } from "../../game-data/gameActions";
import PromptStructure from "./PromptStructure";
import ChoiceButton from "./ChoiceButton";
import { WorkerType, WorkerPlacementTurn, WorkerPlacement, PlayerColor, Worker } from "../../game-data/GameState";
import WorkerIcon from "../icons/Worker";
import { summerActions, winterActions, yearRoundActions } from "../../game-data/board/boardPlacements";
import { placeWorker } from "../../game-data/prompts/promptActions";
import { AppState } from "../../store/AppState";

interface Props {
    color: PlayerColor;
    workers: Worker[];
    placements: {
        type: WorkerPlacement | null;
        label: React.ReactNode;
        disabledReason: string | undefined;
        hasSpace: boolean;
    }[];
    defaultWorkerType: WorkerType;
    onPlaceWorker: (placement: WorkerPlacement | null, workerType: WorkerType) => void;
}

const PlaceWorkerPrompt: React.FunctionComponent<Props> = ({
    color,
    workers,
    placements,
    defaultWorkerType,
    onPlaceWorker
}) => {
    const [selectedWorkerType, setWorkerType] = React.useState<WorkerType>(defaultWorkerType);
    React.useEffect(() => {
        if (workers.filter(({ type }) => type === selectedWorkerType).every(w => !w.available)) {
            setWorkerType(defaultWorkerType);
        }
    }, [workers, selectedWorkerType, setWorkerType, defaultWorkerType]);

    return <PromptStructure title="Place a worker">
        <div className="PlaceWorkerPrompt-body">
            <div className="PlaceWorkerPrompt-workerTypeSelector">
                Choose worker type:
                {["grande" as const, "normal" as const].map(workerType =>
                    <button
                        key={workerType}
                        className={cx({
                            "PlaceWorkerPrompt-workerTypeButton": true,
                            "PlaceWorkerPrompt-workerTypeButton--selected":
                                workerType === selectedWorkerType,
                        })}
                        disabled={
                            workers
                                .filter(({ type }) => type === workerType)
                                .every(w => !w.available)
                        }
                        onClick={() => setWorkerType(workerType)}>
                        {workers.filter(({ type }) => type === workerType)
                            .map((w, i) =>
                                <WorkerIcon
                                    key={i}
                                    workerType={w.type}
                                    color={color}
                                    disabled={!w.available}
                                    isTemp={w.isTemp}
                                />
                            )}
                    </button>
                )}
            </div>
            <ul className="PlaceWorkerPrompt-choices">
                {placements.map((placement, i) => {
                    const requiresGrande = !placement.hasSpace && selectedWorkerType !== "grande";
                    return <li className="PlaceWorkerPrompt-choice" key={i}>
                        <ChoiceButton
                            className="PlaceWorkerPrompt-choiceButton"
                            disabledReason={placement.disabledReason ||
                                (requiresGrande ? "No space. Use a grande worker?" : undefined)}
                            onClick={() => onPlaceWorker(placement.type, selectedWorkerType)}
                        >
                            {placement.label}
                        </ChoiceButton>
                        {!placement.disabledReason && requiresGrande
                            ? <WorkerIcon
                                className="PlaceWorkerPrompt-choiceNeedsGrande"
                                workerType="grande"
                            />
                            : null}
                    </li>;
                })}
            </ul>
        </div>
    </PromptStructure>;
};

const mapStateToProps = (state: AppState, ownProps: { playerId: string; }) => {
    const game = state.game!;
    const numPlayers = Object.keys(game.players).length;
    const numSpots = Math.ceil(numPlayers / 2);
    const player = game.players[ownProps.playerId];
    return {
        color: player.color,
        workers: player.workers,
        placements: [
            ...(
                (game.currentTurn as WorkerPlacementTurn).season === "summer"
                    ? summerActions
                    : winterActions)
                .map(({ type, bonusLabel, title, disabledReason, }) => {
                    const placements = game.workerPlacements[type];
                    return {
                        type,
                        label: bonusLabel && numPlayers > 2 && !placements[0]
                            ? bonusLabel
                            : title,
                        disabledReason: disabledReason && disabledReason(game),
                        hasSpace: placements.length < numSpots ||
                            placements.slice(0, numSpots).some(w => !w),
                    };
                }
            ),
            ...yearRoundActions.map(({ type, title, disabledReason, }) => ({
                type,
                label: title,
                disabledReason: disabledReason && disabledReason(game),
                hasSpace: true,
            })),
            {
                type: null,
                label: "Pass",
                disabledReason: undefined,
                hasSpace: true,
            },
        ],
        defaultWorkerType:
            player.workers.filter(({ type }) => type === "normal").some(w => w.available)
                ? "normal" as const
                : "grande" as const,
    };
};

const mapDispatchToProps = (dispatch: Dispatch<GameAction>, ownProps: { playerId: string; }) => {
    return {
        onPlaceWorker: (placement: WorkerPlacement | null, workerType: WorkerType) =>
            dispatch(placeWorker(placement, workerType, ownProps.playerId))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(PlaceWorkerPrompt);
