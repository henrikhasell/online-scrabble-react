import React from 'react';
import { TileDisplay, TileSize } from './Scrabble';

export enum GrabbableTileOrigin {
  Overlay,
  Rack
};
  
type GrabbableTilePropsCommon = {
  index: number;
  tileMovementCallback: (x :number, y :number) => any;
  tilePickUpCallback: () => any;
  tilePutDownCallback: (origin: GrabbableTileOrigin, id: number) => any;
  value: string;
};
  
type GrabbableTilePropsOverlay = GrabbableTilePropsCommon & {
  origin: GrabbableTileOrigin.Overlay,
  x: number,
  y: number
};
  
type GrabbableTilePropsRack = GrabbableTilePropsCommon & {
  origin: GrabbableTileOrigin.Rack
};

type GrabbableTileProps = GrabbableTilePropsOverlay | GrabbableTilePropsRack;
  
type GrabbableTileState = {
  style: null | {
    position: 'absolute'|'fixed',
    left: number
    top: number
  }
};

class GrabbaleTile extends React.Component<GrabbableTileProps, GrabbableTileState> {
  state = (this.props.origin === GrabbableTileOrigin.Overlay) ? {
    style: {
      position: 'absolute' as 'absolute',
      left: this.props.x * TileSize,
      top: this.props.y * TileSize
    }
  } : {style: null};

  onMouseDown = (event: React.MouseEvent) => {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    this.props.tilePickUpCallback();
  }

  onMouseMove = (event: MouseEvent) => {
    const {clientX, clientY} = event;

    let top = clientY - TileSize / 2;
    let left = clientX - TileSize / 2;

    this.setState({
      style: {
        'position': 'fixed',
        'top': top,
        'left': left
      }
    });

    this.props.tileMovementCallback(clientX, clientY);
  }

  onMouseUp = () => {
    switch(this.props.origin) {
      case GrabbableTileOrigin.Rack:
        this.setState({style: null});
        break;
      case GrabbableTileOrigin.Overlay:
        this.setState({
          style: {
            position: 'absolute',
            left: this.props.x * TileSize,
            top: this.props.y * TileSize
          }
        });
        break;
    }
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.props.tilePutDownCallback(this.props.index, this.props.origin);
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  render = () => (
    <div className="grabbable" onMouseDown={this.onMouseDown} style={this.state.style || undefined}>
      <TileDisplay cross_check={false} type="normal" value={this.props.value} wild={false}/>
    </div>
  )
}

export default GrabbaleTile;