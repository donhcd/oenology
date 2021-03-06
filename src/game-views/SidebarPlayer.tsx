import "./SidebarPlayer.css";
import * as React from "react";
import cx from "classnames";
import { PlayerState, CardId, StructureState, FieldId, Field } from "../game-data/GameState";
import VictoryPoints from "./icons/VictoryPoints";
import Residuals from "./icons/Residuals";
import Coins from "./icons/Coins";
import { Vine, SummerVisitor, Order, WinterVisitor } from "./icons/Card";
import Worker from "./icons/Worker";
import Grape from "./icons/Grape";
import GrapeToken from "./icons/GrapeToken";
import WineGlass from "./icons/WineGlass";
import { fieldYields } from "../game-data/shared/sharedSelectors";
import { visitorCards } from "../game-data/visitors/visitorCards";
import { StructureId, structures } from "../game-data/structures";
import { AnchorSide, useTooltip } from "./shared/useTooltip";
import { vineCards } from "../game-data/vineCards";

interface Props {
    player: PlayerState;
    hasGrape?: boolean;
}

const SidebarPlayer: React.FunctionComponent<Props> = props => {
    const { player } = props;
    const playerStructures = player.structures;
    const hasMediumCellar = playerStructures["mediumCellar"];
    const hasLargeCellar = playerStructures["largeCellar"];
    return <div className={`SidebarPlayer SidebarPlayer--${player.color}`}>
        <div className="SidebarPlayer-header">
            <span className="SidebarPlayer-playerName">{player.name}</span>
            <ul className="SidebarPlayer-cards">
                {player.cardsInHand.map(card =>
                    <li key={card.id} className="SidebarPlayer-card">
                        {renderCard(card)}
                    </li>
                )}
            </ul>
            {props.hasGrape && <GrapeToken />}
            <Residuals className="SidebarPlayer-residualPayments">{player.residuals}</Residuals>
            <Coins className="SidebarPlayer-coins">{player.coins}</Coins>
            <VictoryPoints className="SidebarPlayer-victoryPoints">{player.victoryPoints}</VictoryPoints>
        </div>
        <div className="SidebarPlayer-contents">
            <ul className="SidebarPlayer-workers">
                {player.workers.map((worker, i) =>
                    <li key={i} className="SidebarPlayer-worker">
                        <Worker
                            workerType={worker.type}
                            color={player.color}
                            isTemp={worker.isTemp}
                            disabled={!worker.available}
                        />
                    </li>
                )}
            </ul>
            <ul className="SidebarPlayer-fields">
                {Object.keys(player.fields).sort().map(fieldId => {
                    const field = player.fields[fieldId as FieldId];
                    const { red, white } = fieldYields(field);
                    return <FieldTooltip field={field} key={field.id}>
                        {anchorRef => <li
                            ref={anchorRef as React.RefObject<HTMLLIElement>}
                            className={cx({
                                "SidebarPlayer-field": true,
                                "SidebarPlayer-field--harvested": field.harvested,
                                "SidebarPlayer-field--sold": field.sold,
                            })}
                        >
                            {red > 0 ? <Grape color="red">{red}</Grape> : null}
                            {white > 0 ? <Grape color="white">{white}</Grape> : null}
                        </li>}
                    </FieldTooltip>;
                })}
            </ul>
            <div className="SidebarPlayer-grapesAndWine">
                <div className="SidebarPlayer-crushPad">
                    <div className="SidebarPlayer-grapes">
                        {player.crushPad.red.map((hasGrape, i) =>
                            <div key={i} className="SidebarPlayer-grape">
                                {hasGrape
                                    ? <Grape color="red">{i + 1}</Grape>
                                    : i + 1}
                            </div>
                        )}
                    </div>
                    <div className="SidebarPlayer-grapes">
                        {player.crushPad.white.map((hasGrape, i) =>
                            <div key={i} className="SidebarPlayer-grape">
                                {hasGrape
                                    ? <Grape color="white">{i + 1}</Grape>
                                    : i + 1}
                            </div>
                        )}
                    </div>
                </div>
                <div className="SidebarPlayer-cellar">
                    <div className="SidebarPlayer-wines">
                        {player.cellar.red.map((hasWine, i) =>
                            <div className="SidebarPlayer-wine" key={i}>
                                {hasWine
                                    ? <WineGlass color="red">{i + 1}</WineGlass>
                                    : i + 1}
                            </div>
                        )}
                    </div>
                    <div className="SidebarPlayer-wines">
                        {player.cellar.white.map((hasWine, i) =>
                            <div className="SidebarPlayer-wine" key={i}>
                                {hasWine
                                    ? <WineGlass color="white">{i + 1}</WineGlass>
                                    : i + 1}
                            </div>
                        )}
                    </div>
                    <div className="SidebarPlayer-wines">
                        {player.cellar.blush.map((hasWine, i) => {
                            if (i < 3) {
                                return null;
                            }
                            return <div className="SidebarPlayer-wine" key={i}>
                                {hasWine
                                    ? <WineGlass color="blush">{i + 1}</WineGlass>
                                    : i + 1}
                            </div>;
                        })}
                    </div>
                    <div className="SidebarPlayer-wines">
                        {player.cellar.sparkling.map((hasWine, i) => {
                            if (i < 6) {
                                return null;
                            }
                            return <div className="SidebarPlayer-wine" key={i}>
                                {hasWine
                                    ? <WineGlass color="sparkling">{i + 1}</WineGlass>
                                    : i + 1}
                            </div>;
                        })}
                    </div>
                    {hasMediumCellar
                        ? null
                        : <StructureTooltip id="mediumCellar" side="top">
                            {ref =>
                                <div
                                    ref={ref as React.RefObject<HTMLDivElement>}
                                    className="SidebarPlayer-mediumCellarOverlay"
                                />}
                        </StructureTooltip>}
                    {hasLargeCellar
                        ? null
                        : <StructureTooltip id="largeCellar" side="top">
                            {ref =>
                                <div
                                    ref={ref as React.RefObject<HTMLDivElement>}
                                    className="SidebarPlayer-largeCellarOverlay"
                                />}
                        </StructureTooltip>}
                </div>
            </div>
            <ul className="SidebarPlayer-structures">
                {Object.entries(structures).map(([structureId, structure]) => {
                    if (structureId === "mediumCellar" || structureId === "largeCellar") {
                        return null;
                    }
                    const isUsed = playerStructures[structureId as StructureId] === StructureState.Used;
                    return <StructureTooltip key={structureId} id={structureId as StructureId}>
                        {anchorRef =>
                            <li ref={anchorRef as React.RefObject<HTMLLIElement>}
                                className={cx("SidebarPlayer-structure", {
                                    "SidebarPlayer-structure--built": playerStructures[structureId as StructureId],
                                    "SidebarPlayer-structure--used": isUsed
                                })}
                            >
                                {structure.name}&nbsp;
                                {structureId === "yoke" && isUsed && <Worker color={player.color} />}
                            </li>}
                    </StructureTooltip>;
                })}
            </ul>
        </div>
    </div>;
};

const FieldTooltip: React.FunctionComponent<{
    field: Field;
    children: (anchorRef: React.RefObject<HTMLElement>) => React.ReactNode;
}> = ({ field, children }) => {
    const tooltip = React.useMemo(() => {
        return <>
            Field value: {field.value}
            {field.vines.length === 0
                ? null
                : <>
                    <hr />
                    <ul>
                        {field.vines.map(id => {
                            const vine = vineCards[id];
                            const { red, white } = vine.yields;
                            return <li key={id}>
                                {vine.name}{" "}
                                {(red || 0) > 0 ? <Grape color="red">{red}</Grape> : null}
                                {(white || 0) > 0 ? <Grape color="white">{white}</Grape> : null}
                            </li>
                        })}
                    </ul>
                </>}
        </>;
    }, [field]);
    const [anchorRef, maybeTooltip] = useTooltip("right", tooltip);
    return <>
        {children(anchorRef)}
        {maybeTooltip}
    </>;
};

const StructureTooltip: React.FunctionComponent<{
    id: StructureId;
    children: (anchorRef: React.RefObject<HTMLElement>) => React.ReactNode;
    side?: AnchorSide
}> = ({ id, children, side = "left" }) => {
    const structure = structures[id];
    const [anchorRef, maybeTooltip] = useTooltip(
        side,
        `${structure.description} Costs ${structure.cost}.`
    );

    return <>
        {children(anchorRef)}
        {maybeTooltip}
    </>;
};

const renderCard = (card: CardId): React.ReactNode => {
    switch (card.type) {
        case "vine":
            return <Vine />;
        case "order":
            return <Order />;
        case "visitor":
            switch (visitorCards[card.id].season) {
                case "summer":
                    return <SummerVisitor />;
                case "winter":
                    return <WinterVisitor />;
            }
    }
};

export default SidebarPlayer;

