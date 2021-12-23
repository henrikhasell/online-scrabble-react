export interface Coordinate {
    x: number;
    y: number;
};

function getGridCoordinate(element: HTMLElement, rows: number, cols: number, x: number, y: number): Coordinate | null {
  const rect = element.getBoundingClientRect();

  const newX = Math.floor((x - rect.x) / (rect.width / cols));
  const newY = Math.floor((y - rect.y) / (rect.height / rows));

  if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) {
    return null;
  }

  return {x: newX, y: newY}
}

export default getGridCoordinate;