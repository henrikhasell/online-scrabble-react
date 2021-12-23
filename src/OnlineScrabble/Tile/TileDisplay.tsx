import React, {PointerEventHandler, ReactNode} from 'react';
import TileModel, {TileType} from './TileModel';

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

interface TileDisplayProps extends TileModel{
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
};

const TileDisplay: React.FC<TileDisplayProps> = ({cross_check, onPointerDown, type, value}) => {
  const classNames = [
    "content"
  ];
  if (cross_check) {
    classNames.push("cross-check");
  }
  if (value === null) {
    classNames.push(type);
  }
  else {
    classNames.push("placement");
  }
  return (
    <div className="tile" onPointerDown={onPointerDown}>
      <div className={classNames.join(" ")}>
        {value ? value : blankTileText[type]}
      </div>
    </div>
  );
}

export default TileDisplay;