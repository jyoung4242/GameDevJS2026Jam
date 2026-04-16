// MapGenerator.ts
import { TileMap, vec, Color, Rectangle, SpriteSheet, Graph, PositionNode, Vector } from "excalibur";

export enum TileType {
  Grass = "grass",
  Dirt = "dirt",
  Cliff = "cliff",
}

export const TILE_META: Record<TileType, { walkable: boolean; movementCost: number; color: string }> = {
  [TileType.Grass]: { walkable: true, movementCost: 2, color: "#5a8a3c" },
  [TileType.Dirt]: { walkable: true, movementCost: 1, color: "#9b7435" },
  [TileType.Cliff]: { walkable: false, movementCost: Infinity, color: "#5c6b73" },
};

export interface MapData {
  tiles: TileType[][];
  cols: number;
  rows: number;
}

export interface MapGenOptions {
  cols?: number;
  rows?: number;
  tileSize?: number;
  seed?: number;
  cliffDensity?: number;
  dirtPathiness?: number;
  clearZone?: {
    cols: number; // width of the clear area in tiles
    rows: number; // height of the clear area in tiles
    type?: TileType; // what to fill it with, default Grass
  };
}

// ---------------------------------------------------------------------------
// Bitmask autotiling
// ---------------------------------------------------------------------------
//
// 4-bit cardinal mask:  N=8  E=4  S=2  W=1   (0..15, 16 variants per type)
//
//       N(8)
//        |
//  W(1)--+--E(4)
//        |
//       S(2)
//
// A neighbor contributes its bit only if it is the SAME tile type.
// The resulting 0-15 index maps to a sprite column in your spritesheet row.
//
// Expected spritesheet layout (one row per TileType, 16 columns):
//
//  col:  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
//  mask: 0000 0001 0010 0011 0100 0101 0110 0111 1000 1001 1010 1011 1100 1101 1110 1111
//        lone  W    S   SW    E   EW   SE  SEW   N   NW   NS  NSW  NE  NEW  NES  ALL
//
// If you want an 8-bit (corner-aware) mask later, bump to 256 variants —
// the computeBitmask function below accepts a `useCorners` flag for that path.

const NORTH = 8;
const EAST = 4;
const SOUTH = 2;
const WEST = 1;

/** Spritesheet row index for each TileType */
const TILE_SHEET_ROW: Record<TileType, number> = {
  [TileType.Grass]: 0,
  [TileType.Dirt]: 1,
  [TileType.Cliff]: 2,
};

/**
 * Compute the 4-bit cardinal bitmask for tile at (col, row).
 * A neighbor adds its bit only when it shares the same TileType.
 * Out-of-bounds neighbors are treated as matching (so edges blend inward).
 */
function computeBitmask(tiles: TileType[][], col: number, row: number, cols: number, rows: number): number {
  const self = tiles[row][col];

  const match = (c: number, r: number): boolean => {
    if (c < 0 || r < 0 || c >= cols || r >= rows) return true; // treat OOB as same
    return tiles[r][c] === self;
  };

  let mask = 0;
  if (match(col, row - 1)) mask |= NORTH;
  if (match(col + 1, row)) mask |= EAST;
  if (match(col, row + 1)) mask |= SOUTH;
  if (match(col - 1, row)) mask |= WEST;

  return mask; // 0..15
}

/**
 * Pre-compute bitmasks for the entire map.
 * Returns a parallel 2D array of 0-15 values.
 */
export function computeAllBitmasks(mapData: MapData): number[][] {
  const { tiles, cols, rows } = mapData;
  return tiles.map((row, r) => row.map((_, c) => computeBitmask(tiles, c, r, cols, rows)));
}

// ---------------------------------------------------------------------------
// Core generator
// ---------------------------------------------------------------------------

// export function generateMapData(opts: MapGenOptions = {}): MapData {
//   const { cols = 24, rows = 18, seed = Math.random(), cliffDensity = 0.22, dirtPathiness = 0.3 } = opts;

//   const tiles: TileType[][] = Array.from({ length: rows }, (_, r) =>
//     Array.from({ length: cols }, (_, c) => classifyTile(c, r, cols, rows, seed, cliffDensity, dirtPathiness)),
//   );

//   enforcePassability(tiles, cols, rows);

//   return { tiles, cols, rows };
// }
export function generateMapData(opts: MapGenOptions = {}): MapData {
  const { cols = 24, rows = 18, seed = Math.random(), cliffDensity = 0.22, dirtPathiness = 0.3, clearZone } = opts;

  const tiles: TileType[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => classifyTile(c, r, cols, rows, seed, cliffDensity, dirtPathiness)),
  );

  enforcePassability(tiles, cols, rows);

  // Stamp the clear zone last so it always wins over generation + passability
  if (clearZone) {
    const fillType = clearZone.type ?? TileType.Grass;
    const startCol = Math.floor((cols - clearZone.cols) / 2);
    const startRow = Math.floor((rows - clearZone.rows) / 2);

    for (let r = startRow; r < startRow + clearZone.rows; r++) {
      for (let c = startCol; c < startCol + clearZone.cols; c++) {
        tiles[r][c] = fillType;
      }
    }
  }

  return { tiles, cols, rows };
}

// ---------------------------------------------------------------------------
// Build and configure an Excalibur TileMap from MapData
// ---------------------------------------------------------------------------

export interface TileMapOptions {
  tileSize?: number;
  spriteSheet?: SpriteSheet; // 3 rows × 16 cols — provide to use sprites
}

export function buildTileMap(mapData: MapData, opts: TileMapOptions = {}): TileMap {
  const { cols, rows, tiles } = mapData;
  const { tileSize = 32, spriteSheet } = opts;

  const tileMap = new TileMap({
    pos: vec(0, 0),
    tileWidth: tileSize,
    tileHeight: tileSize,
    columns: cols,
    rows,
  });

  const bitmasks = computeAllBitmasks(mapData);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = tileMap.getTile(c, r);
      const type = tiles[r][c];
      const meta = TILE_META[type];
      const maskIdx = bitmasks[r][c]; // 0..15 → spritesheet column
      if (!tile) continue;
      if (spriteSheet) {
        const sheetRow = TILE_SHEET_ROW[type];
        tile.addGraphic(spriteSheet.getSprite(maskIdx, sheetRow));
      } else {
        // Placeholder: tint darker for isolated tiles (mask=0), lighter when fully connected (mask=15)
        const brightness = 0.75 + (maskIdx / 15) * 0.25;
        const base = Color.fromHex(meta.color);
        tile.addGraphic(
          new Rectangle({
            width: tileSize,
            height: tileSize,
            color: new Color(
              Math.min(255, base.r * brightness),
              Math.min(255, base.g * brightness),
              Math.min(255, base.b * brightness),
            ),
          }),
        );
      }

      if (!meta.walkable) tile.solid = true;

      tile.data.set("type", type);
      tile.data.set("bitmask", maskIdx);
      tile.data.set("movementCost", meta.movementCost);
    }
  }

  return tileMap;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyTile(
  col: number,
  row: number,
  cols: number,
  rows: number,
  seed: number,
  cliffDensity: number,
  dirtPathiness: number,
): TileType {
  const n = smoothNoise(col, row, seed);

  const onEdge = col === 0 || row === 0 || col === cols - 1 || row === rows - 1;
  if (onEdge) return TileType.Cliff;
  if (n > 1 - cliffDensity) return TileType.Cliff;
  if (n < dirtPathiness) return TileType.Dirt;

  return TileType.Grass;
}

function smoothNoise(col: number, row: number, seed: number): number {
  const s = seed * 1000;
  const a = Math.sin(col * 0.6 + s) * Math.cos(row * 0.4 + s * 0.7);
  const b = Math.sin(col * 1.3 + s * 1.3) * Math.cos(row * 0.9 + s * 0.5);
  const c = Math.sin(col * 0.3 + s * 0.4) * Math.cos(row * 1.2 + s * 1.1);
  return (a * 0.5 + b * 0.3 + c * 0.2 + 1) / 2;
}

function enforcePassability(tiles: TileType[][], cols: number, rows: number) {
  for (let r = 1; r < rows - 1; r++) {
    const fullyBlocked = tiles[r].every((t, c) => c === 0 || c === cols - 1 || t === TileType.Cliff);
    if (fullyBlocked) {
      const mid = Math.floor(cols / 2);
      tiles[r][mid] = TileType.Dirt;
      tiles[r][mid + 1] = TileType.Dirt;
    }
  }

  for (let c = 1; c < cols - 1; c++) {
    const fullyBlocked = tiles.every((row, r) => r === 0 || r === rows - 1 || row[c] === TileType.Cliff);
    if (fullyBlocked) {
      const mid = Math.floor(rows / 2);
      tiles[mid][c] = TileType.Dirt;
      tiles[mid + 1][c] = TileType.Dirt;
    }
  }
}

export type PositionNodeData = {
  x: number;
  y: number;
  pos: Vector;
};

export function buildTileGraph(tileMap: TileMap) {
  const graph = new Graph<PositionNodeData>();
  const lookup = new Map<string, PositionNode<PositionNodeData>>();

  const key = (x: number, y: number) => `${x},${y}`;

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];

  for (let x = 0; x < tileMap.columns; x++) {
    for (let y = 0; y < tileMap.rows; y++) {
      const tile = tileMap.getTile(x, y);
      if (!tile || tile.solid) continue;

      const worldPos = new Vector(x * tileMap.tileWidth + tileMap.tileWidth / 2, y * tileMap.tileHeight + tileMap.tileHeight / 2);

      let nodeData: PositionNodeData = {
        x,
        y,
        pos: worldPos,
      };

      let node = graph.addNode(nodeData, worldPos);

      lookup.set(key(x, y), node as PositionNode<PositionNodeData>);
    }
  }
  // PASS 2 — connect neighbors
  for (let x = 0; x < tileMap.columns; x++) {
    for (let y = 0; y < tileMap.rows; y++) {
      const node = lookup.get(key(x, y));
      if (!node) continue;

      for (const [dx, dy] of dirs) {
        const neighbor = lookup.get(key(x + dx, y + dy));
        if (!neighbor) continue;

        graph.addEdge(node, neighbor);
      }
    }
  }

  return { graph, lookup };
}
