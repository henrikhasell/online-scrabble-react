import React, { PropsWithChildren, ReactNode } from 'react';
import GrabbableTile, { GrabbableTileOrigin } from './GrabbableTile';


type TileType = "normal"
              | "double_letter"
              | "double_word"
              | "triple_letter"
              | "triple_word"
              | "start";

export interface Tile {
  type: TileType;
  cross_check: boolean;
  value: string | null;
  wild: boolean;
}

export interface Grid {
  tiles: Tile[];
  width: number;
  height: number;
}

export interface Player {
    name: string;
    score: number;
}

export type PlayerState = {
  rack: string[],
  score: number
};

type GameState = "waiting_to_start"
               | "in_progress"
               | "completed";

export type PreviousPlacement = {
  placement: ScoredPlacement;
  player: string
};

export interface Game {
    grid: Grid;
    players: Player[];
    state: GameState;
    turn?: string;
    previous_placement: PreviousPlacement | null;
}

export type Character = {
  value: string;
  wild: boolean;
};

export type OverlayTile = Character & {
  x: number;
  y: number;
}

export type Placement = {
  horizontal: boolean;
  letters: Character[];
  x: number;
  y: number;
};

export type ScoredPlacement = Placement & {
  score: number;
};

export const TileSize: number = 32;

export const tileScores: {[key: string]: number | undefined} = {
  'A': 1,
  'B': 4,
  'C': 4,
  'D': 2,
  'E': 1,
  'F': 4,
  'G': 3,
  'H': 3,
  'I': 1,
  'J': 10,
  'K': 5,
  'L': 2,
  'M': 4,
  'N': 2,
  'O': 1,
  'P': 4,
  'Q': 10,
  'R': 1,
  'S': 1,
  'T': 1,
  'U': 2,
  'V': 5,
  'W': 4,
  'X': 8,
  'Y': 3,
  'Z': 10
};

const blankTileText: {[i in TileType]: ReactNode} = {
  "double_letter": "DL",
  "double_word": "DW",
  "normal": null,
  "start": null,
  "triple_letter": "TL",
  "triple_word": "TW"
};

export const TileDisplay: React.FC<Tile> = (props) => {
  if (props.value === null) {
    return (
      <div className={`tile ${props.type}`}>
        {blankTileText[props.type]}
      </div>
    );
  }
  return (
    <div className={`tile placement${props.cross_check ? " cross-check" : ""}`}>
      {props.value}
      {props.wild ? null : <span className="score">{tileScores[props.value]}</span>}
    </div>
  )
};

type GridOverlayProps = PropsWithChildren<{
  width: number;
  height: number;
  overlayReference: React.MutableRefObject<HTMLDivElement>;
  tiles: OverlayTile[];
  selectedCol: number | null;
  selectedRow: number | null;
  tileMovementCallback: (x :number, y :number) => any;
  tilePickUpCallback: () => any;
  tilePutDownCallback: (origin: GrabbableTileOrigin, id: number) => any;
}>;

export const GridOverlay: React.FC<GridOverlayProps> = (props) => {
  const rows: ReactNode[] = [];

  if (props.selectedCol !== null && props.selectedRow !== null) {
    for (let y = 0; y < props.height; y++) {
      const row: ReactNode[] = [];
  
      for (let x = 0; x < props.width; x++) {
        const selected: boolean = x === props.selectedCol || y === props.selectedRow;

        row.push(
          <div className={`tile${selected ? ' selected' : ''}`} key={x}/>
        );
      }
  
      rows.push(
        <div className="row" key={y}>
          {row}
        </div>
      );
    }
  }

  return (
    <div className="relative" ref={props.overlayReference}>
      {props.children}
      <div className="overlay">
          {rows}
          {props.tiles.map((placement, index) =>
            <GrabbableTile
              index={index}
              key={`${placement.x} ${placement.y}`}
              origin={GrabbableTileOrigin.Overlay}
              tileMovementCallback={props.tileMovementCallback}
              tilePickUpCallback={props.tilePickUpCallback}
              tilePutDownCallback={props.tilePutDownCallback}
              value={placement.value}
              x={placement.x}
              y={placement.y}/>
          )}
      </div>
    </div>
  );
}

export const GridDisplay: React.FC<Grid> = (props) => {
    const rows: ReactNode[] = [];

    for (let y = 0; y < props.height; y++) {
      const row: ReactNode[] = [];

      for (let x = 0; x < props.width; x++) {
        row.push(
          <TileDisplay key={x} {...props.tiles[props.width * y + x]}/>
        );
      }

      rows.push(
        <div className="row" key={y}>
          {row}
        </div>
      );
    }
    return (
      <div className="grid">
        {rows}
      </div>
    )
}
