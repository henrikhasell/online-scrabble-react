import React from 'react';

interface Player {
    name: string;
    score: number;
}

interface PlayerInfoProps {
    players: Player[];
    turn?: string;
};

const Item: React.FC<Player & {turn: boolean}> = ({name, score, turn}) => {
    const classNames = [
        "flex-grow-1",
        "text-truncate"
    ];

    if (turn) {
        classNames.push("fw-bolder", "text-decoration-underline");
    }

    return (
        <div className="bg-secondary d-flex rounded mt-2 p-2 text-white w-100 mx-1">
            <div className={classNames.join(" ")}>{name}</div>
            <div className="fw-bolder mx-2">{score}</div>
        </div>
    )
}

const playerInfo: React.FC<PlayerInfoProps> = ({players, turn}) => (
    <div className="d-flex flex-xl-column">
        {players.map(player => <Item {...player} turn={player.name === turn}/>)}
    </div>
);

export default playerInfo;