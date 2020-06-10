import * as React from "react";
import { PlayerState, CardType } from "../game-data/GameState";
import "./SidebarPlayer.css";
import VictoryPoints from "./icons/VictoryPoints";
import Residuals from "./icons/Residuals";
import Coins from "./icons/Coins";
import { Vine, SummerVisitor, Order, WinterVisitor } from "./icons/Card";
import Worker from "./icons/Worker";
import Grape from "./icons/Grape";
import WineGlass from "./icons/WineGlass";

interface Props {
    player: PlayerState;
}

const SidebarPlayer: React.FunctionComponent<Props> = props => {
    const { player } = props;
    return <div className={`SidebarPlayer SidebarPlayer--${player.color}`}>
        <div className="SidebarPlayer-header">
            <span className="SidebarPlayer-playerName">{player.id}</span>
            <ul className="SidebarPlayer-cards">
                {Object.entries(player.cardsInHand).map(([type, cards]) =>
                    <React.Fragment key={type}>
                        {(cards as unknown[]).map((_, i) =>
                            <li key={i} className="SidebarPlayer-card">
                                {renderCard(type as CardType)}
                            </li>
                        )}
                    </React.Fragment>
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
            <li className="SidebarPlayer-field">
                <Grape color="red">1</Grape>
                <Grape color="white">1</Grape>
            </li>
            <li className="SidebarPlayer-field"></li>
            <li className="SidebarPlayer-field"></li>
        </ul>
        <div className="SidebarPlayer-grapesAndWine">
            <div className="SidebarPlayer-crushPad">
                <div className="SidebarPlayer-redGrapes">
                    {new Array(9).fill(0).map((_, i) =>
                        <div className="SidebarPlayer-grape" key={i}>{i + 1}</div>
                    )}
                </div>
                <div className="SidebarPlayer-redGrapes">
                    {new Array(9).fill(0).map((_, i) =>
                        <div className="SidebarPlayer-grape" key={i}>{i + 1}</div>
                    )}
                </div>
            </div>
            <div className="SidebarPlayer-cellar">
                <div className="SidebarPlayer-wines">
                    {new Array(9).fill(0).map((_, i) =>
                        <div className="SidebarPlayer-wine" key={i}>
                            <WineGlass color="red">{i + 1}</WineGlass>
                        </div>
                    )}
                </div>
                <div className="SidebarPlayer-wines">
                    {new Array(9).fill(0).map((_, i) =>
                        <div className="SidebarPlayer-wine" key={i}>
                            <WineGlass color="white">{i + 1}</WineGlass>
                        </div>
                    )}
                </div>
                <div className="SidebarPlayer-wines">
                    {new Array(6).fill(0).map((_, i) =>
                        <div className="SidebarPlayer-wine" key={i}>
                            <WineGlass color="blush">{i + 4}</WineGlass>
                        </div>
                    )}
                </div>
                <div className="SidebarPlayer-wines">
                    {new Array(3).fill(0).map((_, i) =>
                        <div className="SidebarPlayer-wine" key={i}>
                            <WineGlass color="sparkling">{i + 7}</WineGlass>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <ul className="SidebarPlayer-workers">
            <li className="SidebarPlayer-worker"><Worker /></li>
            <li className="SidebarPlayer-worker"><Worker /></li>
            <li className="SidebarPlayer-worker"><Worker /></li>
            <li className="SidebarPlayer-worker"><Worker /></li>
            <li className="SidebarPlayer-worker"><Worker /></li>
            <li className="SidebarPlayer-worker"><Worker /></li>
        </ul>
    </div>;
};

const renderCard = (type: CardType) => {
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
}

export default SidebarPlayer;

