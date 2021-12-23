import React, {ReactNode} from 'react';
import GridModel from './GridModel';
import TileDisplay from '../Tile/TileDisplay';

export interface GridDisplayProps extends GridModel {
  grid_ref?: React.RefObject<HTMLDivElement>;
  hover: boolean;
};

const GridDisplay: React.FC<GridDisplayProps> = ({grid_ref, hover, tiles, width, height}) => {
  const rows: ReactNode[] = [];

  for (let y = 0; y < height; y++) {
    const row: ReactNode[] = [];

    for (let x = 0; x < width; x++) {
      row.push(
        <TileDisplay key={x} {...tiles[width * y + x]}/>
      );
    }

    rows.push(
      <div className="grid-row" key={y}>
        {row}
      </div>
    );
  }
  return (
    <div className="grid" ref={grid_ref}>
      <div className="grid-content">
        {rows}
      </div>
    </div>
  )
}

export default GridDisplay;