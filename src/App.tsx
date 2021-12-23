import React, { ReactNode, useState } from 'react';
import { Game, GridDisplay, GridOverlay, OverlayTile, Placement, Player, PlayerState, PreviousPlacement, ScoredPlacement, Tile, TileSize } from './Scrabble/Scrabble';
import GrabbaleTile, { GrabbableTileOrigin } from './Scrabble/GrabbableTile';
import './styles/index.scss';
type GameDisplayProps = {
  player: string;
  game: string;
};

type Message = {
  message: string[]
};

type GameDisplayState = {
  gameState: Game | null,
  overlayState: {
    selectedCol: number|null;
    selectedRow: number|null;
    tiles: OverlayTile[];
  },
  rackState: {
    letters: string[],
    selectedIndex: number|null;
  },
  placement?: ScoredPlacement | null;
}

type RackProps = {
  letters: string[];
  rackReference: React.RefObject<HTMLDivElement>;
  tileMovementCallback: (x: number, y: number) => any;
  tilePickUpCallback: () => any;
  tilePutDownCallback: (index : number, origin: GrabbableTileOrigin) => any;
}

const RackPadding = 5;

type PlayerDisplayTypeProps = {
  players: Player[],
  turn?: string
};

type PlayerDisplayType = React.FC<PlayerDisplayTypeProps> & {
  Item: React.FC<Player & {selected: boolean}>;
};

const PlayerDisplay: PlayerDisplayType = (props) => {
  return (
    <>
      <div className="players">
        {props.players.map(i => <PlayerDisplay.Item {...i} key={i.name} selected={props.turn === i.name}/>)}
      </div>
      {props.turn ? <p>It's currently <span className="emphasis">{props.turn}'s</span> turn.</p> : null}
    </>
  );
};

PlayerDisplay.Item = (props) => (
  <div className={`item${props.selected ? " selected" : ""}`}>
    <span className="name">{props.name}</span> <span className="score">({props.score})</span>
  </div>
);

const RackComponenet: React.FC<RackProps> = (props) => (
  <div className="rack" ref={props.rackReference}>
    {props.letters.map((value, index) =>
      <GrabbaleTile
        index={index}
        key={index}
        origin={GrabbableTileOrigin.Rack}
        tileMovementCallback={props.tileMovementCallback}
        tilePickUpCallback={props.tilePickUpCallback}
        tilePutDownCallback={props.tilePutDownCallback}
        value={value}/>
    )}
  </div>
);

type ScoredPlacementComponentProps = {
  placement?: ScoredPlacement|null;
  requestPlacement: (placment: ScoredPlacement) => Promise<any>;
};

type ScoredPlacementComponentType = React.FC<ScoredPlacementComponentProps>;

const ScoredPlacementComponent: ScoredPlacementComponentType = (props) => {
  const [ disabled, setDisabled ] = useState<boolean>(false);
  const { placement, requestPlacement } = props;

  if (placement === undefined) {
    return (
      <p>Calculating placement score...</p>
    );
  }

  if (placement === null) {
    return (
      <p>Placement is not valid.</p>
    );
  }

  const onClick = async() => {
    setDisabled(true);
    if ("message" in await requestPlacement(placement)) {
      setDisabled(false);
    }
  };

  return (
    <p>
      Placement scores {placement.score} points. <button disabled={disabled} onClick={onClick}>Submit</button>
    </p>
  );
}

type PreviousPlacementComponentType = React.FC<PreviousPlacement>;

const PreviousPlacementComponent: PreviousPlacementComponentType = (props) => {
  const {placement, player} = props;
  return (
    <p>{player} placed {placement.letters.reduce((i, j) => i + j.value, '')} for {placement.score} points.</p>
  );
}

class GameComponent extends React.Component<GameDisplayProps, GameDisplayState> {
  public state: Readonly<GameDisplayState> = {
    gameState: null,
    overlayState: {
      tiles: [],
      selectedCol: null,
      selectedRow: null
    },
    rackState: {
      letters: [],
      selectedIndex: null
    },
    placement: null
  };

  public componentDidMount(): void {
    this.startUpdateLoop();
  }

  public componentWillUnmount(): void {
    this.stopUpdateLoop();
  }

  protected fetchGame: () => Promise<Game|Message> = async() => {
    const response = await fetch(`/game/${this.props.game}`, {
      signal: this.mainLoopAbortController.signal
    });
    return await response.json();
  }

  protected startUpdateLoop: () => Promise<void> = async() => {
    const response_json = await this.fetchGame();
    if ("grid" in response_json) {
      this.setState({
        gameState: response_json
      });
      if (!this.state.rackState.letters.length && !this.state.overlayState.tiles.length) {
        await this.fetchPlayerState();
      }
    }
    else {
      this.setState({
        gameState: null
      });
      console.info(response_json.message);
    }

    this.updateLoopTimeout = setTimeout(this.startUpdateLoop, 200);
  };

  protected stopUpdateLoop(): void {
    if (this.updateLoopTimeout !== null) {
      clearTimeout(this.updateLoopTimeout);
    }
    this.mainLoopAbortController.abort();
    this.mainLoopAbortController = new AbortController();
  }

  protected fetchPlayerState: () => Promise<void> = async() => {
    const response = await fetch(`/game/${this.props.game}/player_state`, {
      headers: {
        'Authorization': btoa(`${this.props.player}:`)
      },
      method: 'PUT',
      signal: this.mainLoopAbortController.signal
    });

    const response_json: Message | PlayerState = await response.json();

    if ("rack" in response_json) {
      this.setState({
        rackState: {
          ...this.state.rackState,
          letters: response_json.rack
        }
      });
    }
    else {
      console.info(response_json.message);
    }
  }

  protected applyPlacement(placement: Readonly<Placement>): Game | null {
    if (!this.state.gameState) {
      return null;
    }

    const { grid } = this.state.gameState;

    const tiles = [...grid.tiles];
    const getTile = (x: number, y: number) => tiles[y * grid.width + x];

    let { x, y } = placement;
    let current_tile = getTile(x, y);

    for (let letter of placement.letters) {
      while(current_tile.value !== null) {
        if (placement.horizontal) {
          x += 1;
        }
        else {
          y += 1;
        }
        current_tile = getTile(x, y);
      }

      current_tile.value = letter.value;
      current_tile.wild = letter.wild;
    }

    return {
      ...this.state.gameState,
      grid: {
        ...grid,
        tiles
      }
    };
  }

  protected getGridTile(x: number, y: number): Tile | undefined {
    const { gameState } = this.state;

    if (gameState) {
      const { grid } = gameState;
      return grid.tiles[grid.width * y + x];
    }
  }

  protected getOverlayTile(x: number, y: number): OverlayTile | undefined {
    const { tiles } = this.state.overlayState;
    return tiles.find(i => i.x === x && i.y === y);
  }

  protected gridOccupied(x: number, y: number): boolean {
    const tile = this.getGridTile(x, y);
    return !tile || tile.value !== null;
  }

  protected overlayOccupied(x: number, y: number): boolean {
    return this.getOverlayTile(x, y) !== undefined;
  }

  protected occupied(x: number, y: number): boolean {
    return this.gridOccupied(x, y) || this.overlayOccupied(x, y);
  }

  protected placeLetterFromRack(index: number, x: number, y: number): void {
    if (this.occupied(x, y)) {
      return;
    }

    const letters: string[] = [...this.state.rackState.letters];
    const letter: string = letters.splice(index, 1)[0];

    const placements = [
      ...this.state.overlayState.tiles,
      {
        value: letter,
        wild: false,
        x: x,
        y: y
      }
    ];

    this.setState({
      rackState: {
        ...this.state.rackState,
        letters: letters
      },
      overlayState: {
        ...this.state.overlayState,
        tiles: placements
      }
    });
  }

  protected movePlacement(placementIndex: number, x: number, y: number): void {
    if (this.occupied(x, y)) {
      return;
    }

    const placements = [...this.state.overlayState.tiles];
    const placement = placements.splice(placementIndex, 1)[0];

    this.setState({
      overlayState: {
        ...this.state.overlayState,
        tiles: [
          ...placements,
          {
            ...placement,
            x: x,
            y: y
          }
        ]
      }
    });
  }

  protected moveRackItem(oldInxex: number, newIndex: number): void {
    const letters: string[] = [...this.state.rackState.letters];
    const letter: string = letters.splice(oldInxex, 1)[0];

    letters.splice(newIndex, 0, letter);

    this.setState({
      rackState: {
        ...this.state.rackState,
        letters: letters
      }
    });
  }

  protected returnPlacementToRack(placementIndex: number, rackIndex: number): void {
    const letters = [...this.state.rackState.letters];
    const placements = [...this.state.overlayState.tiles];
    const placement = placements.splice(placementIndex, 1)[0];

    letters.splice(rackIndex, 0, placement.value);

    this.setState({
      overlayState: {
        ...this.state.overlayState,
        tiles: placements
      },
      rackState: {
        ...this.state.rackState,
        letters: letters
      }
    });
  }

  protected calculateGridCrosshair(x: number, y: number): {selectedCol: number | null, selectedRow: number | null} {
    const {current} = this.overlayReference;
    
    if (!current) {
      return {
        selectedCol: null,
        selectedRow: null
      };
    }

    const {top, right, bottom, left} = current.getBoundingClientRect();

    if (x < left || x > right || y < top || y > bottom) {
      return {
        selectedCol: null,
        selectedRow: null
      };
    }

    return {
      selectedCol: Math.floor((x - left) / TileSize),
      selectedRow: Math.floor((y - top) / TileSize)
    }
  }

  protected calculateRackIndex(x: number, y: number): number | null {
    const {current} = this.rackReference;

    if (!current) {
      return null;
    }

    const {top, right, bottom, left} = current.getBoundingClientRect();
  
    if (x < left + RackPadding || x > right - RackPadding || y < top || y > bottom) {
      return null;
    }

    return Math.floor((x - left - RackPadding + TileSize / 2) / TileSize);
  }

  protected onTileMove = (x: number, y: number) => {
    this.setState({
      overlayState: {
        ...this.state.overlayState,
        ...this.calculateGridCrosshair(x, y)
      },
      rackState: {
        ...this.state.rackState,
        selectedIndex: this.calculateRackIndex(x, y)
      }
    });
  };

  protected onTilePickUp = () => {

  };

  protected onTilePutDown = (index: number, origin: GrabbableTileOrigin) => {
    
    const {selectedCol, selectedRow} = this.state.overlayState;
    const {selectedIndex} = this.state.rackState;

    switch(origin) {// todo: remove need for this switch case.
      case GrabbableTileOrigin.Overlay:
        if (selectedCol !== null && selectedRow !== null) {
          this.movePlacement(index, selectedCol, selectedRow);
          break;
        }
        if (selectedIndex !== null) {
          this.returnPlacementToRack(index, selectedIndex);
          break;
        }
        break;
      case GrabbableTileOrigin.Rack:
        if (selectedCol !== null && selectedRow !== null) {
          this.placeLetterFromRack(index, selectedCol, selectedRow);
          break;
        }
        if (selectedIndex !== null) {
          this.moveRackItem(index, selectedIndex);
          break;
        }
        break;
    }
    
    this.setState({
      overlayState: {
        ...this.state.overlayState,
        selectedCol: null,
        selectedRow: null
      },
      placement: undefined
    });

    this.updatePlacement();
  };

  protected cancelExistingPlacement() {
    this.placementAbortController.abort();
    this.placementAbortController = new AbortController();
  }

  protected requestPlacement: (placement: Placement) => Promise<Message|PlayerState> = async(placement) => {
    this.cancelExistingPlacement();

    const response = await fetch(`/game/${this.props.game}/placement`, {
      body: JSON.stringify(placement),
      headers: {
        'Authorization': btoa(`${this.props.player}:`),
        'Content-Type': 'application/json'
      },
      method: 'PUT',
      signal: this.placementAbortController.signal
    });

    const response_json: Message|PlayerState = await response.json();

    if ('rack' in response_json) {
      this.setState({
        gameState: this.applyPlacement(placement) || this.state.gameState,
        overlayState: {
          selectedCol: null,
          selectedRow: null,
          tiles: []
        },
        rackState: {
          ...this.state.rackState,
          letters: response_json.rack
        }
      });
    }
    else {
      console.info(response_json.message);
    }

    return response_json;
  };

  protected async updatePlacement(): Promise<void> {
    const placement = this.calculatePlacement();

    if(!placement) {
      this.setState({
        placement: null
      });
      return;
    }

    this.cancelExistingPlacement();

    const response = await fetch(`/game/${this.props.game}/score_placement`, {
      body: JSON.stringify(placement),
      headers: {
        'Authorization': btoa(`${this.props.player}:`),
        'Content-Type': 'application/json'
      },
      method: 'PUT',
      signal: this.placementAbortController.signal
    });

    const response_json: Message|ScoredPlacement = await response.json();

    if ('score' in response_json) {
      this.setState({
        placement: response_json
      });
    }
    else {
      this.setState({
        placement: null
      });
      console.info(response_json.message);
    }
  }

  protected calculatePlacement(): Placement | null {
    const { tiles } = this.state.overlayState;

    if (!tiles.length) {
      return null;
    }
  
    const sort = (i: OverlayTile) => 1000 * i.y + i.x;

    const sortedTiles = [...tiles].sort(
      (left, right) => sort(left) - sort(right)
    );

    const [first, second] = sortedTiles;
    const horizontal = !second || first.x !== second.x;

    let previous: OverlayTile = first;

    if (horizontal) {
      for(let i = 1; i < sortedTiles.length; i++) {
        const tile: OverlayTile = sortedTiles[i];
        if (tile.y !== first.y) {
          return null;
        }
        for (let j = previous.x + 1; j < tile.x; j++) {
          const gridTile = this.getGridTile(j, first.y);
          if (gridTile && !gridTile.value) {
            return null;
          }
        }
        previous = tile;
      }
    }
    else {
      for(let i = 1; i < sortedTiles.length; i++) {
        const tile: OverlayTile = sortedTiles[i];
        if (tile.x !== first.x) {
          return null;
        }
        for (let j = previous.y + 1; j < tile.y; j++) {
          const gridTile = this.getGridTile(first.x, j);
          if (gridTile && !gridTile.value) {
            return null;
          }
        }
        previous = tile;
      }
    }

    return {
      horizontal: horizontal,
      letters: sortedTiles.map(i => ({
        value: i.value,
        wild: false
      })),
      x: first.x,
      y: first.y
    };
  }

  protected mainLoopAbortController: AbortController = new AbortController();
  protected placementAbortController: AbortController = new AbortController();
  protected updateLoopTimeout: NodeJS.Timeout | null = null;
  protected rackReference = React.createRef<HTMLDivElement>();
  protected overlayReference = React.createRef<HTMLDivElement>();

  public joinGame = async() => {
    this.stopUpdateLoop();

    const response = await fetch(`/game/${this.props.game}/join`, {
      headers: {
        'Authorization': btoa(`${this.props.player}:`)
      },
      method: 'PUT',
      signal: this.mainLoopAbortController.signal
    });

    const response_json: Message|PlayerState = await response.json();

    if ('rack' in response_json) {
      this.setState({
        rackState: {
          ...this.state.rackState,
          letters: response_json.rack
        }
      });
    }
    else {
      console.info(response_json.message);
    }

    this.startUpdateLoop();
  };

  public startGame = async() => {
    this.stopUpdateLoop();

    const response = await fetch(`/game/${this.props.game}/start`, {
      headers: {
        'Authorization': btoa(`${this.props.player}:`)
      },
      method: 'PUT',
      signal: this.mainLoopAbortController.signal
    });

    const response_json: Game|Message = await response.json();

    if ('grid' in response_json) {
      this.setState({
        gameState: response_json
      });
    }
    else {
      console.info(response_json.message);
    }

    this.startUpdateLoop();
  };

  public render: () => ReactNode = () => {
    if (this.state.gameState === null) {
      return null;
    }

    const playerInGame = this.state.gameState.players.map(i => i.name).includes(this.props.player);

    return (
      <React.Fragment>
        <GridOverlay
          tileMovementCallback={this.onTileMove}
          tilePickUpCallback={this.onTilePickUp}
          tilePutDownCallback={this.onTilePutDown}
          height = {this.state.gameState.grid.height}
          overlayReference={this.overlayReference as any}
          width = {this.state.gameState.grid.width}
          {...this.state.overlayState}>
          <GridDisplay {...this.state.gameState.grid}/>
        </GridOverlay>
        <PlayerDisplay players={this.state.gameState.players} turn={this.state.gameState.turn}/>
        {this.state.overlayState.tiles.length > 0
          ? <ScoredPlacementComponent requestPlacement={this.requestPlacement} placement={this.state.placement}/>
          :  <p>Drag letters from the rack onto the grid.</p>}
        <RackComponenet
          letters={this.state.rackState.letters}
          rackReference={this.rackReference}
          tileMovementCallback={this.onTileMove}
          tilePickUpCallback={this.onTilePickUp}
          tilePutDownCallback={this.onTilePutDown}/>
          {this.state.gameState.state === "waiting_to_start"
            ? playerInGame
              ? <button onClick={this.startGame}>Start Game</button>
              : <button onClick={this.joinGame}>Join Game</button>
            : this.state.gameState.state === "completed"
              ? <p>The game was won by <strong>{this.state.gameState.turn}</strong>.</p>
              : null}

        {this.state.gameState.previous_placement !== null ? (
          <PreviousPlacementComponent {...this.state.gameState.previous_placement}/>
        ) : null}
      </React.Fragment>
    );
  }
}

type LoginDialogProps = {
  submitForm: (player: string, game: string) => any;
};

const LoginDialog: React.FC<LoginDialogProps> = (props) => {
  return (
    <div className="login">
      <table>
        <tbody>
          <tr>
            <td>
              <label>Name</label>:
            </td>
            <td>
              <input placeholder="For example: Adam" type="text"/>
            </td>
          </tr>
          <tr>
            <td>
              <label>Game</label>:
            </td>
            <td>
              <input placeholder="For example: game1" type="text"/>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <button>Submit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

      //{(!player || !game) ? <LoginDialog submitForm={submitForm}/> : <GameComponent player={player} game={game}/>}
const App: React.FC = () => {
  let [player, setPlayer] = useState<string>();
  let [game, setGame] = useState<string>();

  const submitForm = (player: string, game: string) => {
    setPlayer(player);
    setGame(game);
  };

  return (
    <div className="App">
      <h1>Scrabble Game</h1>
      <GameComponent player="Adam" game="game1"/>
    </div>
  );
}

export default App;
