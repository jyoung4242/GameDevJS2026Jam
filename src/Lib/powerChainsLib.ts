import { Graph, Actor, CollisionType, Circle, Color, vec, Canvas, Engine, Vector, G_UUID } from "excalibur";
import { OtherTower, PowerPlantTower, Tower } from "../Actors/towers";
import { MainScene } from "../Scenes/main";

// ── Constants ─────────────────────────────────────────────────────────────────
const TILE = 40;
const COLS = 20;
const ROWS = 15;
const W = COLS * TILE;
const H = ROWS * TILE;
const SEG_R = 5;
const SEG_COUNT = 14;

const C = {
  bg: Color.fromHex("#0a0d14"),
  tile: Color.fromHex("#0e1320"),
  tileAlt: Color.fromHex("#0c1019"),
  wall: Color.fromHex("#1a2035"),
  wallEdge: Color.fromHex("#2a3555"),
  power: Color.fromHex("#7c85ff"),
  powerDim: Color.fromHex("#3d4280"),
  powerGlow: Color.fromHex("#a8b0ff"),
  powerFull: Color.fromHex("#ef4444"),
  utility: Color.fromHex("#34d399"),
  utilityOff: Color.fromHex("#1a5540"),
  segActive: Color.fromHex("#dff823"),
  segDead: Color.fromHex("#374151"),
  enemy: Color.fromHex("#f97316"),
  enemyHigh: Color.fromHex("#fcd34d"),
};

//── PowerGraph ────────────────────────────────────────────────────────────────

// Wraps ex.Graph<Tower> with directed-edge semantics for the power network.
//
// Side-maps we maintain alongside ex.Graph:
//   _actorToNode  — Tower actor  → ex.Node  (for O(1) lookup by reference)
//   _parentEdge   — ex.Node      → ex.Edge  (single incoming edge; lets us
//                                             walk upstream for findRoot)
//   _cableToEdge  — CableActor   → ex.Edge  (so we can deleteEdge on break
//                                             and re-addEdge on repair)
//
// FIX: ex.Graph.bfs() does not respect edge direction — it walks the entire
// connected component. All "downstream" traversals now use _directedBfs(),
// which follows only outgoing edges by consulting _cableToEdge directly.

export class PowerGraph {
  _g: Graph<any>;
  _actorToNode: Map<Tower, any>;
  _parentEdge: Map<any, any>;
  _cableToEdge: Map<CableActor, any>;

  constructor() {
    this._g = new Graph();
    this._actorToNode = new Map();
    this._parentEdge = new Map();
    this._cableToEdge = new Map();
  }

  reset() {
    this._g = new Graph();
    this._actorToNode = new Map();
    this._parentEdge = new Map();
    this._cableToEdge = new Map();
  }

  // ── Node registration ───────────────────────────────────────────────────────

  registerNode(towerActor: Tower): void {
    if (this._actorToNode.has(towerActor)) return;
    const node = this._g.addNode(towerActor);
    this._actorToNode.set(towerActor, node);
  }

  // ── Directed BFS (replaces ex.Graph.bfs for all downstream queries) ─────────

  /**
   * Walk only OUTGOING directed edges from startTower, returning every
   * reachable Tower actor (including startTower itself).
   *
   * This is the single source of truth for "downstream" traversal.
   * ex.Graph.bfs() is intentionally NOT used here because it ignores edge
   * direction and will walk the entire connected component, causing cables
   * on sibling branches to be incorrectly dimmed/powered.
   */
  private _directedBfs(startTower: Tower): Tower[] {
    const startNode = this._actorToNode.get(startTower);
    if (!startNode) return [];

    const result: Tower[] = [];
    const visited = new Set<string>();
    const queue: any[] = [startNode];

    while (queue.length) {
      const node = queue.shift();
      if (!node || visited.has(node.id)) continue;
      visited.add(node.id);
      result.push(node.data as Tower);

      // Follow only outgoing directed edges by scanning _cableToEdge.
      // This is O(cables) per level but keeps correctness without requiring
      // ex.Graph to expose per-node directed neighbour lists.
      for (const [cable] of this._cableToEdge) {
        const fromNode = this._actorToNode.get(cable.fromTower);
        const toNode = this._actorToNode.get(cable.toTower);
        if (fromNode?.id === node.id && toNode && !visited.has(toNode.id)) {
          queue.push(toNode);
        }
      }
    }

    return result;
  }

  // ── Edge management ─────────────────────────────────────────────────────────

  /**
   * Add a directed edge for a cable (fromTower → toTower).
   * Called on initial placement and again on repair.
   */
  addCableEdge(cable: CableActor): void {
    const fromNode = this._actorToNode.get(cable.fromTower);
    const toNode = this._actorToNode.get(cable.toTower);
    if (!fromNode || !toNode) return;

    const [edge] = this._g.addEdge(fromNode, toNode, { directed: true, weight: 1 });
    this._cableToEdge.set(cable, edge);
    this._parentEdge.set(toNode, edge);
  }

  /**
   * Remove the directed edge for a broken cable.
   * Called during propagatePowerLoss. Does NOT kill segments — that is the
   * CableActor's responsibility.
   */
  removeCableEdge(cable: CableActor): void {
    const edge = this._cableToEdge.get(cable);
    if (!edge) return;

    this._g.deleteEdge(edge);
    this._cableToEdge.delete(cable);

    const toNode = this._actorToNode.get(cable.toTower);
    if (toNode && this._parentEdge.get(toNode) === edge) {
      this._parentEdge.delete(toNode);
    }
  }

  /**
   * Re-register the directed edge for a repaired cable and cascade power
   * downstream to every OtherTower that is now reachable again.
   *
   * This is the mirror of propagatePowerLoss.
   */
  restoreCableEdge(cable: CableActor): void {
    // Re-add the directed edge in ex.Graph and update the side-maps.
    this.addCableEdge(cable);

    // Directed BFS downstream from the repaired cable's destination.
    const downstreamActors = this._directedBfs(cable.toTower);

    for (const actor of downstreamActors) {
      if (actor instanceof OtherTower) {
        actor.status = "powered";
      }
    }

    // Re-enable any downstream CableActors whose both endpoints are now powered.
    for (const [downCable] of this._cableToEdge) {
      if (downstreamActors.includes(downCable.fromTower) && !downCable.isPowered) {
        downCable.isPowered = true;
        downCable.restoreSegments();
      }
    }
  }

  // ── Graph queries ───────────────────────────────────────────────────────────

  /**
   * Walk upstream via _parentEdge until we reach a PowerPlantTower or hit a
   * gap (severed cable, no edge registered).
   * Returns the root PowerPlantTower, or null if this node is unpowered.
   */
  findRoot(towerActor: Tower): PowerPlantTower | null {
    const visited = new Set<string>();
    let node = this._actorToNode.get(towerActor);

    while (node) {
      const actor = node.data;
      if (actor instanceof PowerPlantTower) return actor;
      if (visited.has(node.id)) return null; // cycle guard
      visited.add(node.id);

      const parentEdge = this._parentEdge.get(node);
      if (!parentEdge) return null; // chain is broken here
      node = parentEdge.source;
    }
    return null;
  }

  /**
   * Count active downstream cable connections rooted at a PowerPlantTower.
   *
   * FIX: previously used ex.Graph.bfs() + getNeighbors() which both ignore
   * direction. Now uses _directedBfs() + counts cables whose fromTower is in
   * the downstream set — each such cable is exactly one unit of load.
   */
  countLoad(powerTower: PowerPlantTower): number {
    const downstream = this._directedBfs(powerTower);
    let load = 0;
    for (const [cable] of this._cableToEdge) {
      if (downstream.includes(cable.fromTower)) load++;
    }
    return load;
  }

  /**
   * Returns true if the root of fromTower has headroom for one more cable.
   */
  canAcceptLoad(fromTower: Tower): boolean {
    const root = fromTower instanceof PowerPlantTower ? fromTower : this.findRoot(fromTower);
    if (!root) return false;
    return this.countLoad(root) < root.getNumTowerCapacity();
  }

  /**
   * Uses ex.Graph.areNodesConnected for O(1) duplicate-edge detection.
   */
  areTowersConnected(actorA: Actor, actorB: Actor): boolean {
    const nodeA = this._actorToNode.get(actorA as Tower);
    const nodeB = this._actorToNode.get(actorB as Tower);
    if (!nodeA || !nodeB) return false;
    return this._g.areNodesConnected(nodeA, nodeB);
  }

  /**
   * Returns every Tower actor reachable downstream from towerActor
   * (including towerActor itself) via directed edges only.
   *
   * FIX: was previously using ex.Graph.bfs() which walks undirected,
   * causing the entire connected component to be treated as "downstream".
   */
  getDownstreamActors(towerActor: Tower): Tower[] {
    return this._directedBfs(towerActor);
  }

  /**
   * Cascade power loss downstream from a broken cable.
   *
   * Order matters:
   *   1. BFS downstream BEFORE removing the edge (so the graph still reflects
   *      the full topology and the walk reaches all affected nodes).
   *   2. Mark downstream OtherTowers as unpowered.
   *   3. Dim downstream CableActors — only cables whose fromTower is in the
   *      downstream set, NOT every cable touching those towers.
   *   4. Remove the broken cable's graph edge last.
   *
   * FIX: step 3 previously iterated all _cableToEdge entries and dimmed any
   * cable whose fromTower appeared in the downstream set. Because ex.Graph.bfs()
   * was undirected, sibling branches (cables branching off a shared tower but
   * upstream of the break) were incorrectly included in downstreamActors and
   * therefore wrongly dimmed. _directedBfs() fixes the root cause.
   */
  propagatePowerLoss(brokenCable: CableActor): void {
    // Collect downstream actors BEFORE removing the edge.
    const downstreamActors = this._directedBfs(brokenCable.toTower);

    // Mark downstream towers as unpowered.
    for (const actor of downstreamActors) {
      if (actor instanceof OtherTower) {
        actor.status = "unpowered";
      }
    }

    // Dim only cables that are strictly downstream of the break point.
    // A cable is downstream if its fromTower is in the downstream set.
    for (const [cable] of this._cableToEdge) {
      if (cable === brokenCable) continue; // handled by CableActor.onSegmentBroken
      if (downstreamActors.includes(cable.fromTower) && cable.isPowered) {
        cable.isPowered = false;
        cable._dimAllSegments();
      }
    }

    // Remove the broken cable's graph edge last so the BFS above still works.
    this.removeCableEdge(brokenCable);
  }

  /**
   * Cycle check: walk upstream from sourceActor; if we encounter targetActor
   * before reaching a root, the proposed edge would form a loop.
   */
  wouldCreateCycle(sourceActor: Actor, targetActor: Actor): boolean {
    const visited = new Set<string>();
    let node = this._actorToNode.get(sourceActor as Tower);

    while (node) {
      if (node.data === targetActor) return true;
      if (visited.has(node.id)) break;
      visited.add(node.id);
      const parentEdge = this._parentEdge.get(node);
      node = parentEdge ? parentEdge.source : null;
    }
    return false;
  }

  getPowerTowers(): PowerPlantTower[] {
    return [...this._actorToNode.keys()].filter((a): a is PowerPlantTower => a instanceof PowerPlantTower);
  }
}

// ── CableSegment ──────────────────────────────────────────────────────────────

export class CableSegment extends Actor {
  segIndex: number;
  isAlive: boolean;
  health: number;
  maxHealth: number;
  cableOwner: CableActor | null;

  constructor(index: number, pos: Vector) {
    super({ pos, radius: SEG_R, collisionType: CollisionType.Passive, z: 3 });
    this.segIndex = index;
    this.isAlive = true;
    this.health = 3;
    this.maxHealth = 3;
    this.cableOwner = null;
  }

  onInitialize(): void {
    this.addTag("cable-segment");
    this._draw();
  }

  _draw(): void {
    this.graphics.use(
      new Circle({
        radius: SEG_R,
        color: this.isAlive ? C.segActive : C.segDead,
        strokeColor: this.isAlive ? Color.fromHex("#c4b5fd") : Color.fromHex("#374151"),
        lineWidth: 1,
      }),
    );
  }

  takeDamage(dmg = 1): void {
    if (!this.isAlive) return;
    this.health -= dmg;
    this.graphics.use(new Circle({ radius: SEG_R, color: C.enemy }));
    if (this.health <= 0) {
      this.breakSegment();
    } else {
      this.actions.delay(120).callMethod(() => this._draw());
    }
  }

  /**
   * Restore this segment to full health and alive state.
   * Called by CableActor.restoreSegments() during a repair.
   */
  repair(): void {
    if (this.isAlive) return;
    this.isAlive = true;
    this.health = this.maxHealth;
    this._draw();
  }

  breakSegment(): void {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.graphics.use(new Circle({ radius: SEG_R + 4, color: Color.fromHex("#ef4444") }));
    this.actions.delay(200).callMethod(() => this._draw());
    if (this.cableOwner) this.cableOwner.onSegmentBroken(this);
  }
}

// ── CableActor ────────────────────────────────────────────────────────────────

export class CableActor extends Actor {
  fromTower: Tower;
  toTower: Tower;
  _graph: PowerGraph;
  _scene: MainScene;
  segments: CableSegment[];
  isPowered: boolean;
  _lineCanvas: Canvas | null;

  constructor(fromTower: Tower, toTower: Tower, graph: PowerGraph, scene: MainScene) {
    super({ collisionType: CollisionType.PreventCollision, z: 2 });
    this.fromTower = fromTower;
    this.toTower = toTower;
    this._graph = graph;
    this._scene = scene;
    this.segments = [];
    this.isPowered = true;
    this._lineCanvas = null;
  }

  onInitialize(engine: Engine): void {
    this._buildSegments(engine);
    this._buildLineGraphic();
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  _lerp(t: number): Vector {
    const f = this.fromTower.pos.add(vec(0, 32));
    const to = this.toTower.pos.add(vec(0, 32));
    return vec(f.x + (to.x - f.x) * t, f.y + (to.y - f.y) * t + Math.sin(t * Math.PI) * 18);
  }

  _buildSegments(engine: Engine): void {
    for (let i = 0; i < SEG_COUNT; i++) {
      const seg = new CableSegment(i, this._lerp(i / (SEG_COUNT - 1)));
      seg.cableOwner = this;
      this.segments.push(seg);
      engine.currentScene.add(seg);
    }
  }

  _buildLineGraphic(): void {
    this._lineCanvas = new Canvas({
      width: W,
      height: H,
      cache: false,
      draw: ctx => {
        ctx.clearRect(0, 0, W, H);
        if (this.segments.length < 2) return;
        const brokenIdx = this.segments.findIndex(s => !s.isAlive);
        const ox = -this.pos.x + W / 2;
        const oy = -this.pos.y + H / 2;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        for (let i = 0; i < this.segments.length - 1; i++) {
          const alive = brokenIdx === -1 || i < brokenIdx;
          ctx.strokeStyle = alive ? (this.isPowered ? "#a78bfa" : "#4b5563") : "#2d3748";
          ctx.globalAlpha = alive ? 0.75 : 0.25;
          ctx.beginPath();
          ctx.moveTo(this.segments[i].pos.x + ox, this.segments[i].pos.y + oy);
          ctx.lineTo(this.segments[i + 1].pos.x + ox, this.segments[i + 1].pos.y + oy);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      },
    });
    this.pos = vec(W / 2, H / 2);
    this.graphics.use(this._lineCanvas);
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  onPreUpdate(): void {
    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i].isAlive) {
        this.segments[i].pos = this._lerp(i / (this.segments.length - 1));
      }
    }
    this._lineCanvas?.flagDirty();
  }

  // ── Damage ──────────────────────────────────────────────────────────────────

  /** Called by PowerGraph.propagatePowerLoss for cables caught in the cascade. */
  _dimAllSegments(): void {
    for (const seg of this.segments) {
      if (seg.isAlive) {
        seg.isAlive = false;
        seg._draw();
      }
    }
    this._lineCanvas?.flagDirty();
  }

  /** Called by a CableSegment when its health reaches zero. */
  onSegmentBroken(seg: CableSegment): void {
    if (!this.isPowered) return;
    this.isPowered = false;

    // Dim everything from the break point onward on THIS cable only.
    const idx = this.segments.indexOf(seg);
    for (let i = idx; i < this.segments.length; i++) {
      if (this.segments[i].isAlive) {
        this.segments[i].isAlive = false;
        this.segments[i]._draw();
      }
    }
    this._lineCanvas?.flagDirty();

    // Cascade through the graph (only touches strictly downstream nodes),
    // then let the scene re-evaluate power state.
    this._graph.propagatePowerLoss(this);
    console.log("⚡ cable severed — downstream chain lost power");
    this._scene._refreshPowerState();
  }

  // ── Repair ──────────────────────────────────────────────────────────────────

  /**
   * Attempt to repair this cable.
   *
   * Returns true if the repair succeeded, false if the cable is already alive
   * or if its upstream source is no longer powered (you can't repair a cable
   * that has nothing feeding into it).
   *
   * Repair sequence:
   *   1. Guard — bail if already powered or if source is unpowered.
   *   2. Restore all dead segments to full health via CableSegment.repair().
   *   3. Mark this cable as powered.
   *   4. Call PowerGraph.restoreCableEdge() which re-adds the graph edge and
   *      cascades the power-restore BFS downstream.
   *   5. Notify the scene to re-evaluate overall power state.
   */
  repairCable(): boolean {
    // Already live — nothing to do.
    if (this.isPowered) return false;

    // The source tower must itself be powered (or be a PowerPlantTower) for
    // the repair to make sense.
    const sourceIsRoot = this.fromTower instanceof PowerPlantTower;
    const sourceIsPowered = sourceIsRoot || this._graph.findRoot(this.fromTower) !== null;

    if (!sourceIsPowered) {
      console.log("⚠ cannot repair: source tower is not powered");
      return false;
    }

    // Restore every dead segment on this cable.
    this.restoreSegments();

    // Mark cable as live before restoreCableEdge so downstream cables that
    // check cable.isPowered in the BFS loop see the correct state.
    this.isPowered = true;

    // Re-add the graph edge and cascade power to downstream towers/cables.
    this._graph.restoreCableEdge(this);

    console.log("🔧 cable repaired — downstream chain restored");
    this._scene._refreshPowerState();
    (this.toTower as OtherTower).status = "powered";
    return true;
  }

  /**
   * Restore all dead segments to alive + full health.
   * Also called by PowerGraph.restoreCableEdge for downstream cables caught
   * in the restore cascade.
   */
  restoreSegments(): void {
    for (const seg of this.segments) {
      seg.repair();
    }
    this._lineCanvas?.flagDirty();
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  disconnect(): void {
    for (const seg of this.segments) seg.kill();
    this.kill();
  }
}
