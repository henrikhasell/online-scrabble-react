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
import GridModel from '../Grid/GridModel';
import LoginDetails from './LoginDetails';
import PlayerInfo from './PlayerInfo';

interface Placement {
  horizontal: boolean;
  letters: {value: string; wild: boolean}[];
  x: number;
  y: number;
};

interface ScoredPlacement extends Placement {
  score: number;
};

interface GetGameResponse {
  grid: GridModel;
  players: {name: string, score: number}[];
  previous_placement?: {placement: ScoredPlacement; player: string;};
  state: "waiting_to_start" | "in_progress" |  "completed";
  turn?: string;
};

const getGame = async (game: string) => {
  const response = await fetch(`/game/${game}`, {method: "GET"});

  if (!response.ok) {
    throw Error("Unexpected response from server.");
  }

  return await response.json() as GetGameResponse;
}

const createGame = async (game: string) => {
  const response = await fetch(`/game/${game}`, {method: "POST"});
  const responseJson = await response.json();

  return responseJson.message;
};

const joinGame = async (game: string) => {
  const response = await fetch(`/game/${game}/join`, {method: "PUT"});
  const responseJson = await response.json();

  return responseJson.message;
};

const startGame = async (game: string) => {
  const response = await fetch(`/game/${game}/start`, {method: "PUT"});
  const responseJson = await response.json();

  return responseJson.message;
};

const App: React.FC = () => {
  const [loginDetails, setLoginDetails] = useState<LoginDetails | null>(null);
  const [draggedTile, setDraggedTile] = useState<DraggedTileProps | null>(null);
  const [grid, setGrid] = useState<GridModel>(empty_grid);
  const [placements, setPlacements] = useState<GridOverlayProps['placements']>({});
  const [rack, setRack] = useState<string[] | null>(null);
  const [players, setPlayers] = useState<{name: string, score: number}[]>([]);
  const [turn, setTurn] = useState<string | undefined>();

  const grid_ref = useRef<HTMLDivElement>(null);
  const rack_ref = useRef<HTMLDivElement>(null);

  const removeFromRack = (index: number, x: number, y: number) => {
    if (draggedTile !== null || rack === null) {
      return;
    }

    setDraggedTile({x, y, origin: {location: "rack", index: index}, value: rack[index]});
    setRack([...rack.slice(0, index), ...rack.slice(index + 1)]);
  };

  useEffect(() => {
    if (!loginDetails) {
      return;
    }
  
    const {game} = loginDetails;

    createGame(game);

    const myInterval = setInterval(async () => {
      console.info(`Fetching ${game}`);
      const response: GetGameResponse = await getGame(game);
      setPlayers(response.players);
      setGrid(response.grid);
      setTurn(response.turn);
    }, 1000);

    return () => clearInterval(myInterval);
  }, [loginDetails]);

  useEffect(() => {

    const _getGridCoordinate = (screenX: number, screenY: number) => {
      const {current} = grid_ref;
  
      if(!current) {
        return null;
      }
  
      return getGridCoordinate(current, grid.height, grid.width, screenX, screenY);
    };

    const _getRackIndex = (screenX: number, screenY: number) => {
      const {current} = rack_ref;

      if(!current || !rack) {
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
      const coordinate = _getGridCoordinate(event.x, event.y);

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
      else if (rack !== null) {
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

      const coordinate = _getGridCoordinate(event.x, event.y);
      const index = _getRackIndex(event.x, event.y);

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
      else if (index !== null && rack !== null) {
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
  }, [draggedTile, grid, placements, rack]);

  const hover = draggedTile !== null;

  return (
    <div className="app">
      <Navbar loginDetails={loginDetails} setLoginDetails={setLoginDetails}/>
      <Container fluid>
        <Row>
  
          <Col xl={3} className="bg-light">
            <PlayerInfo players={players} turn={turn}/>
          </Col>
  
          <Col xl={6} className="app-col mt-2">
            <div className="rectangle">
              <div className="rectangle-content">
                <GridDisplay {...grid} hover={hover} grid_ref={grid_ref}/>
                <GridOverlay {...grid} hover={hover} placements={placements}/>
                {rack !== null ? <Rack hover={draggedTile !== null} items={rack} rack_ref={rack_ref} removeFromRack={removeFromRack}/> : null}
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
