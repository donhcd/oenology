import "./SidebarPlayer.css";
import * as React from "react";
import { PlayerState, CardId } from "../game-data/GameState";
import VictoryPoints from "./icons/VictoryPoints";
import Residuals from "./icons/Residuals";
import Coins from "./icons/Coins";
import { Vine, SummerVisitor, Order, WinterVisitor } from "./icons/Card";
import Worker from "./icons/Worker";
import Grape from "./icons/Grape";
import WineGlass from "./icons/WineGlass";
import { fieldYields } from "../game-data/shared/sharedSelectors";

interface Props {
    player: PlayerState;
}

const SidebarPlayer: React.FunctionComponent<Props> = props => {
    const { player } = props;
    return <div className={`SidebarPlayer SidebarPlayer--${player.color}`}>
        <div className="SidebarPlayer-header">
            <span className="SidebarPlayer-playerName">{player.id}</span>
            <ul className="SidebarPlayer-cards">
                {player.cardsInHand.map(card =>
                    <li key={card.id} className="SidebarPlayer-card">
                        {renderCard(card)}
                    </li>
                )}
            </ul>
            <Residuals className="SidebarPlayer-residualPayments">{player.residuals}</Residuals>
            <Coins className="SidebarPlayer-coins">{player.coins}</Coins>
            <VictoryPoints className="SidebarPlayer-victoryPoints">{player.victoryPoints}</VictoryPoints>
        </div>
        <ul className="SidebarPlayer-structures">
            <li className="SidebarPlayer-structure">Tr</li>
            <li className="SidebarPlayer-structure">Irr</li>
            <li className="SidebarPlayer-structure">Yo</li>
            <li className="SidebarPlayer-structure">Wi</li>
            <li className="SidebarPlayer-structure">Co</li>
            <li className="SidebarPlayer-structure">Ta</li>
        </ul>
        <ul className="SidebarPlayer-fields">
            {Object.values(player.fields).map(field => {
                const { red, white } = fieldYields(field);
                return <li key={field.id} className="SidebarPlayer-field">
                    {field.sold ? <span className="SidebarPlayer-fieldSold">SOLD</span> : <>
                        {red > 0 ? <Grape color="red">{red}</Grape> : null}
                        {white > 0 ? <Grape color="white">{white}</Grape> : null}
                    </>}
                </li>;
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
                    {player.cellar.blush.map((hasWine, i) => {
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
            </div>
        </div>
        <ul className="SidebarPlayer-workers">
            {player.trainedWorkers.map((worker, i) =>
                <li key={i} className="SidebarPlayer-worker">
                    <Worker worker={worker} />
                </li>
            )}
        </ul>
    </div>;
};

const renderCard = ({ type }: CardId): React.ReactNode => {
    switch (type) {
        case "order":
            return <Order />;
        case "summerVisitor":
            return <SummerVisitor />;
        case "vine":
            return <Vine />;
        case "winterVisitor":
            return <WinterVisitor />;
    }
};

export default SidebarPlayer;

