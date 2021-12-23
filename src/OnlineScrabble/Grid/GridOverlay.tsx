import React, {ReactNode, useEffect, useRef, useState} from 'react';
import TileDisplay from '../Tile/TileDisplay';

interface PlacementTileProps {
    value: string;
    wild: boolean;
    x: number;
    y: number;
}

export interface GridOverlayProps {
  hover: boolean;
  width: number;
  height: number;
  placements: {[i: string]: PlacementTileProps};
};

interface GridOverlayState {
  selectedRow: number | null;
  selectedCol: number | null;
};

const GridOverlay: React.FC<GridOverlayProps> = ({hover, width, height, placements}) => {
  const grid = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<GridOverlayState>({selectedRow: null, selectedCol: null});
  const {selectedRow, selectedCol} = state;

  useEffect(() => {
    if (!hover) {
      setState({selectedRow: null, selectedCol: null});
      return;
    }

    let timeout: number = 0;

    const updateGridState = (x: number, y: number) => {
      const {current} = grid;

      if (!current || timeout) {
        return;
      }
      const rect = current.getBoundingClientRect();

      const tileW = rect.width / width;
      const tileH = rect.height / height;

      let selectedCol: number | null = Math.floor((x - rect.x) / tileW);
      let selectedRow: number | null = Math.floor((y - rect.y) / tileH);

      if (selectedCol < 0 || selectedCol >= width || selectedRow < 0 || selectedRow >= height) {
        selectedCol = null;
        selectedRow = null;
      }

      setState({selectedRow, selectedCol});

      timeout = window.setTimeout(() => {
        timeout = 0;
      }, 1000 / 60);
    };

    const pointerMove = (event: PointerEvent) => {
      const {x, y} = event;
      updateGridState(x, y);
    };

    const touchMove = (event: TouchEvent) => {
      const {clientX, clientY} = event.touches[0];
      updateGridState(clientX, clientY);
    };

    document.addEventListener('pointermove', pointerMove);
    document.addEventListener('touchmove', touchMove);

    return () => {
      document.removeEventListener('pointermove', pointerMove);
      document.removeEventListener('touchmove', touchMove);
      window.clearTimeout(timeout);
    };
  }, [hover, width, height]);

  const rows: ReactNode[] = [];

  for (let y = 0; y < height; y++) {
    const row: ReactNode[] = [];

    for (let x = 0; x < width; x++) {
      const placement_props = placements[`${x}_${y}`];
      const selected = selectedRow === y || selectedCol === x;

      row.push(
        <div className="overlay-tile" key={x}>
          {placement_props ? <TileDisplay {...placement_props} cross_check={false} type="normal"/> : null}
          {selected ? <div className="selected"></div> : null}
        </div>
      );
    }

    rows.push(
      <div className="grid-row" key={y}>
        {row}
      </div>
    );
  }
  return (
    <div className="overlay-grid grid" ref={grid}>
      <div className="grid-content">
        {rows}
      </div>
    </div>
  )
}

export default GridOverlay;