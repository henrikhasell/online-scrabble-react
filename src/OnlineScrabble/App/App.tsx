import React, { useEffect, useRef, useState } from 'react';
import GridDisplay from '../Grid/GridDisplay';
import empty_grid from '../Grid/empty_grid';
import getGridCoordinate from '../Grid/getGridCoordinate';
import './styles/index.scss';
import Navbar from './Navbar';
import { Col, Container, Row } from 'react-bootstrap';
import Rack from '../Rack/Rack';
import DraggedTile, {DraggedTileProps} from '../DraggedTile/DraggedTile';
import GridOverlay, { GridOverlayProps } from '../Grid/GridOverlay';
import getRackIndex from '../Grid/getRackIndex';

const App: React.FC = () => {
  const [draggedTile, setDraggedTile] = useState<DraggedTileProps | null>(null);
  const [placements, setPlacements] = useState<GridOverlayProps['placements']>({"1_1": {value:"A", wild: false, x: 2, y: 1}});
  const [rack, setRack] = useState<string[]>(["B", "C", "D", "E", "F", "G", "H"]);

  const grid_ref = useRef<HTMLDivElement>(null);
  const rack_ref = useRef<HTMLDivElement>(null);

  const removeFromRack = (index: number, x: number, y: number) => {
    if (draggedTile !== null) {
      return;
    }

    setDraggedTile({x, y, origin: {location: "rack", index: index}, value: rack[index]});
    setRack([...rack.slice(0, index), ...rack.slice(index + 1)]);
  };

  useEffect(() => {
    const getCoordinate = (screenX: number, screenY: number) => {
      const {current} = grid_ref;

      if(!current) {
        return null;
      }

      return getGridCoordinate(current, empty_grid.height, empty_grid.width, screenX, screenY);
    };

    const getIndex = (screenX: number, screenY: number) => {
      const {current} = rack_ref;

      if(!current) {
        return null;
      }

      return getRackIndex(current, rack.length, screenX, screenY);
    };

    const deletePlacement = (x: number, y: number) => {
      const clone = {...placements};
      delete clone[`${x}_${y}`];
      setPlacements(clone);
    }

    const onPointerDown = (event: PointerEvent) => {
      const coordinate = getCoordinate(event.x, event.y);

      if (coordinate) {
        const {x, y} = coordinate;
        const placement = placements[`${x}_${y}`];

        if (!placement) {
          return;
        }
    
        setDraggedTile({
          origin: {
            location: "grid",
            x,
            y
          },
          value: placement.value,
          x: event.x,
          y: event.y
        });
        deletePlacement(x, y);
      }
    };

    const returnDraggedTile = (props: DraggedTileProps) => {
      const {origin, value} = props;

      if (origin.location === "grid") {
        const {x, y} = origin;
        setPlacements({
          ...placements,
          [`${x}_${y}`]: {
            value,
            wild: value === '*',
            x: props.x,
            y: props.y
          }
        });
      }
      else {
        const {index} = origin;
        setRack([
          ...rack.slice(0, index), value, ...rack.slice(index)
        ]);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!draggedTile) {
        return;
      }

      const coordinate = getCoordinate(event.x, event.y);
      const index = getIndex(event.x, event.y);

      if (coordinate !== null) {
        const {x, y} = coordinate;
        const index = `${x}_${y}`;
  
        if (index in placements) {
          returnDraggedTile(draggedTile);
        }
        else {
          const placmenet = {...draggedTile, wild: false}
          setPlacements({...placements, [index]: placmenet});
        }
      }
      else if (index !== null) {
        setRack([
          ...rack.slice(0, index), draggedTile.value, ...rack.slice(index)
        ]);
      }
      else {
        returnDraggedTile(draggedTile);
      }

      setDraggedTile(null);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggedTile, placements, rack]);

  const hover = draggedTile !== null;

  return (
    <div className="app">
      <Navbar/>
      <Container fluid>
        <Row>
  
          <Col xl={3} className="bg-light">
            Player List
          </Col>
  
          <Col xl={6} className="app-col mt-2">
            <div className="rectangle">
              <div className="rectangle-content">
                <GridDisplay {...empty_grid} hover={hover} grid_ref={grid_ref}/>
                <GridOverlay {...empty_grid} hover={hover} placements={placements}/>
                <Rack hover={draggedTile !== null} items={rack} rack_ref={rack_ref} removeFromRack={removeFromRack}/>
              </div>
              {draggedTile ? <DraggedTile {...draggedTile}/> : null}
            </div>
          </Col>
  
          <Col xl={3} className="bg-light">
            Player Conversation
          </Col>
  
        </Row>
      </Container>
    </div>
  );
};

export default App;
