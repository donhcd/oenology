import * as React from "react";
import { connect } from "react-redux";
import GameState, { PlayerState } from "../game-data/GameState";
import SidebarPlayer from "./SidebarPlayer";
import "./Sidebar.css";

interface Props {
    players: Record<string, PlayerState>;
}

const Sidebar: React.FunctionComponent<Props> = props => {
    return <div className="Sidebar">
        {Object.values(props.players).map(player => {
            return <SidebarPlayer key={player.id} player={player} />;
        })}
    </div>;
};


const mapStateToProps = (state: GameState) => {
    return { players: state.players };
};
export default connect(mapStateToProps)(Sidebar);
