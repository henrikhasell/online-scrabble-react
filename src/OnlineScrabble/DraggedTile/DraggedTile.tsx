import React, { useEffect, useRef } from 'react';
import TileDisplay from '../Tile/TileDisplay';

interface GridOrigin {
  location: "grid";
  x: number;
  y: number;
};

interface RackOrigin {
  location: "rack";
  index: number;
};

export interface DraggedTileProps {
  origin: GridOrigin | RackOrigin;
  value: string;
  x: number;
  y: number;
};

const DraggedTile: React.FC<DraggedTileProps> = ({value, x, y}) => {
  const dragged_tile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const {current} = dragged_tile;

    const updatePosition = (_x: number, _y: number) => {
      if (!current || !current.parentElement) {
        return;
      }
    
      const {x, y} = current.parentElement.getBoundingClientRect();
      const {width, height} = current.getBoundingClientRect();
    
      _x -= x + (width / 2);
      _y -= y + (height / 2);
    
      current.style.left = `${_x}px`;
      current.style.top = `${_y}px`;
    };

    const mouseMove = (event: MouseEvent) => {
      const {x, y} = event;
      updatePosition(x, y);
    };

    const touchMove = (event: TouchEvent) => {
      const {clientX, clientY} = event.touches[0];
      updatePosition(clientX, clientY);
    };

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('touchmove', touchMove);

    updatePosition(x, y);

    return () => {
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('touchmove', touchMove);
    }
  }, [x, y]);

  return (
    <div className="dragged-tile" ref={dragged_tile}>
      <div className="content">
        <TileDisplay value={value} type="normal" cross_check={false} wild={false}/>
      </div>
    </div>
  );
};

export default DraggedTile;
