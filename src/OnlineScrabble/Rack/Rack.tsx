import React, { useEffect, useState } from 'react';
import getRackIndex from '../Grid/getRackIndex';
import TileDisplay from '../Tile/TileDisplay';

interface RackItemProps {
  index: number;
  removeFromRack: (index: number, x: number, y: number) => void;
  value: string;
};

interface RackProps {
  hover: boolean;
  items: string[];
  rack_ref: React.RefObject<HTMLDivElement>;
  removeFromRack: (index: number, x: number, y: number) => void;
};

/*
function getCoordinateFromElement(element: HTMLElement, rows: number, cols: number, x: number, y: number): number | null {
  const rect = element.getBoundingClientRect();

  const newX = Math.floor((x - rect.x) / (rect.width / cols));
  const newY = Math.floor((y - rect.y) / (rect.height / rows));

  if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) {
    return null;
  }

  return 0;
}
*/

export const RackItem: React.FC<RackItemProps> = ({index, removeFromRack, value}) => {
  return <TileDisplay type="normal" cross_check={false} onPointerDown={(e) => removeFromRack(index, e.clientX, e.clientY)} value={value} wild={false}/>;
}

const Rack: React.FC<RackProps> = ({hover, items, rack_ref, removeFromRack}) => {
  // eslint-disable-next-line
  const [selectedIndex, setSelectedIndex] = useState<null|number>(null);

  useEffect(() => {
    if (!hover) {
      return;
    }

    let timeout: number = 0;

    const updateRackState = (x: number, y: number)  => {
      const {current} = rack_ref;

      if (!current || timeout) {
        return;
      }

      let index = getRackIndex(current, items.length, x, y);
      setSelectedIndex(index);


      timeout = window.setTimeout(() => {
        timeout = 0;
      }, 1000 / 10);
    }

    const pointerMove = (event: PointerEvent) => {
      const {x, y} = event;
      updateRackState(x, y);
    };

    const touchMove = (event: TouchEvent) => {
      const {clientX, clientY} = event.touches[0];
      updateRackState(clientX, clientY);
    };

    document.addEventListener('pointermove', pointerMove);
    document.addEventListener('touchmove', touchMove);

    return () => {
      document.removeEventListener('pointermove', pointerMove);
      document.removeEventListener('touchmove', touchMove);
      window.clearTimeout(timeout);
    };
  }, [hover, items.length, rack_ref]);

  return (
    <div className="rack-container" ref={rack_ref}>
      <div className={`rack-${items.length}`}>
        {items.map((value, index) => (
          <RackItem index={index} key={index} removeFromRack={removeFromRack} value={value}/>
        ))}
      </div>
    </div>
  );
}

export default Rack;
