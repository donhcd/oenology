import * as React from "react";
import { CardType } from "../../game-data/GameState";
import "./Card.css"; 

interface Props {
    className?: string;
    type?: CardType; 
}

const Card: React.FunctionComponent<Props> = props => {
   return <span className={`Card Card--${props.type}`}>{props.children}</span>;
};

export default Card;
export const Vine: React.FunctionComponent<Omit<Props, "type">> = props => <Card {...props} type="vine" />;
export const SummerVisitor: React.FunctionComponent<Omit<Props, "type">> = props => <Card {...props} type="summerVisitor" />;
export const Order: React.FunctionComponent<Omit<Props, "type">> = props => <Card {...props} type="order" />;
export const WinterVisitor: React.FunctionComponent<Omit<Props, "type">> = props => <Card {...props} type="winterVisitor" />;
