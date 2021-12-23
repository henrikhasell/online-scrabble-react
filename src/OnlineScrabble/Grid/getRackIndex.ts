function getRackIndex(element: HTMLElement, rack_count: number, x: number, y: number): number | null {
  const rect = element.getBoundingClientRect();

  if (y < rect.y || y > rect.y + rect.height) {
    return null;
  }

  const tile_width = rect.width / 15;
  const center_point = rect.x + rect.width / 2;
  const left = center_point - (rack_count * tile_width) / 2

  return Math.max(0, Math.min(rack_count, Math.round((x - left) / tile_width)));
}

export default getRackIndex;