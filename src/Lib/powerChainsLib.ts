import { Graph, Actor, CollisionType, Circle, Color, vec, Canvas, Scene, Engine, Vector } from "excalibur";
import { OtherTower, PowerPlantTower, Tower } from "../Actors/towers";
import { MainScene } from "../Scenes/main";

// Constants
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

export class PowerGraph {
  _g: Graph<any>;
  _actorToNode: Map<any, any>;
  _parentEdge: Map<any, any>;
  _cableToEdge: Map<any, any>;

  constructor() {
    // The underlying Excalibur graph. T = tower actor (PowerTower | UtilityTower)
    this._g = new Graph();

    // Maps tower actor → ex.Node so we can look up nodes by actor reference
    this._actorToNode = new Map();

    // Maps ex.Node → incoming directed ex.Edge (the single upstream cable edge)
    // Used for upstream traversal (findRoot).
    this._parentEdge = new Map();

    // Maps CableActor → ex.Edge (the directed graph edge for that cable)
    this._cableToEdge = new Map();
  }

  // Register a tower actor as a graph node
  registerNode(towerActor: Tower) {
    if (this._actorToNode.has(towerActor)) return;
    const node = this._g.addNode(towerActor);
    this._actorToNode.set(towerActor, node);
  }

  // Add a directed edge for a cable (from.tower → to.tower)
  addCableEdge(cable: CableActor) {
    const fromNode = this._actorToNode.get(cable.fromTower);
    const toNode = this._actorToNode.get(cable.toTower);
    if (!fromNode || !toNode) return;

    // directed: true means ex.Graph only adds one edge (from → to), not a
    // reverse partner. weight=1 so Dijkstra would work if needed later.
    const [edge] = this._g.addEdge(fromNode, toNode, { directed: true, weight: 1 });

    this._cableToEdge.set(cable, edge);
    // Record the incoming edge for upstream traversal
    this._parentEdge.set(toNode, edge);
  }

  // Remove a cable's directed edge from the graph
  removeCableEdge(cable: CableActor) {
    const edge = this._cableToEdge.get(cable);
    if (!edge) return;
    this._g.deleteEdge(edge);
    this._cableToEdge.delete(cable);

    // Clear the parent edge for the destination node
    const toNode = this._actorToNode.get(cable.toTower);
    if (toNode && this._parentEdge.get(toNode) === edge) {
      this._parentEdge.delete(toNode);
    }
  }

  // Walk upstream via _parentEdge until we hit a PowerTower or a broken link.
  // Returns the root PowerTower, or null if this node isn't powered.
  findRoot(towerActor: Tower) {
    const visited = new Set();
    let node = this._actorToNode.get(towerActor);
    while (node) {
      const actor = node.data;
      if (actor instanceof PowerPlantTower) return actor;
      if (visited.has(node.id)) return null; // cycle guard
      visited.add(node.id);

      const parentEdge = this._parentEdge.get(node);
      // If the incoming cable was severed (not in _cableToEdge values) or missing, stop
      if (!parentEdge) return null;
      // Walk to the source node of the parent edge
      node = parentEdge.source;
    }
    return null;
  }

  // Count all active downstream cable connections from a PowerTower.
  // Uses ex.Graph.bfs() to get the reachable UUID set, then counts outgoing
  // edges (directed) from each visited node — each is one live cable.
  countLoad(powerTower: PowerPlantTower) {
    const startNode = this._actorToNode.get(powerTower);
    if (!startNode) return 0;

    // bfs returns UUIDs of all reachable nodes (following directed edges only)
    const visitedUUIDs = this._g.bfs(startNode);

    let load = 0;
    for (const uuid of visitedUUIDs) {
      const node = this._g.getNode(uuid);
      if (!node) continue;
      // Count directed outgoing edges from this node
      const neighbors = this._g.getNeighbors(node);
      load += neighbors.length;
    }
    return load;
  }

  // Does adding one more cable from fromTower stay within its root's capacity?
  canAcceptLoad(fromTower: Tower) {
    const root = fromTower instanceof PowerPlantTower ? fromTower : this.findRoot(fromTower);
    console.log(fromTower, root);

    if (!root) return false;

    return this.countLoad(root) < root.getNumTowerCapacity();
  }

  // Check if two tower actors are directly connected (either direction).
  // Used to prevent duplicate cables.
  areTowersConnected(actorA: Actor, actorB: Actor) {
    const nodeA = this._actorToNode.get(actorA);
    const nodeB = this._actorToNode.get(actorB);
    if (!nodeA || !nodeB) return false;
    // areNodesConnected checks both directions in the adjacency list
    return this._g.areNodesConnected(nodeA, nodeB);
  }

  // BFS downstream from a broken cable's destination, collecting all affected
  // nodes. Used by propagatePowerLoss to cascade the outage.
  getDownstreamActors(towerActor: Tower) {
    const startNode = this._actorToNode.get(towerActor);
    if (!startNode) return [];
    const uuids = this._g.bfs(startNode);
    // Include the start node itself
    return [startNode, ...uuids.map(id => this._g.getNode(id)).filter(Boolean)].map(n => n.data);
  }

  // After a cable breaks, cascade power loss to everything downstream.
  // Also removes the broken cable's edge so the graph reflects reality.
  propagatePowerLoss(brokenCable: CableActor) {
    const downstreamActors = this.getDownstreamActors(brokenCable.toTower);

    for (const actor of downstreamActors) {
      if (actor instanceof OtherTower) {
        actor.status = "unpowered";
      }
      // Kill the cable actors that live downstream
      for (const [cable, edge] of this._cableToEdge) {
        const fromNode = this._actorToNode.get(cable.fromTower);
        if (fromNode && downstreamActors.includes(cable.fromTower) && cable.isPowered) {
          cable.isPowered = false;
          cable._dimAllSegments();
        }
      }
    }

    // Remove the broken cable's edge from the graph
    this.removeCableEdge(brokenCable);
  }

  // Cycle check: would adding an edge source→target create a loop?
  // Walk upstream from source; if we reach target, it's a cycle.
  wouldCreateCycle(sourceActor: Actor, targetActor: Actor) {
    const visited = new Set();
    let node = this._actorToNode.get(sourceActor);
    while (node) {
      if (node.data === targetActor) return true;
      if (visited.has(node.id)) break;
      visited.add(node.id);
      const parentEdge = this._parentEdge.get(node);
      node = parentEdge ? parentEdge.source : null;
    }
    return false;
  }

  // Get all PowerTower actors registered in the graph
  getPowerTowers() {
    return [...this._actorToNode.keys()].filter(a => a instanceof PowerPlantTower);
  }
}

// ── CableSegment ──────────────────────────────────────────────────────────────
export class CableSegment extends Actor {
  segIndex: number;
  isAlive: boolean;
  health: number;
  cableOwner: CableActor | null;

  constructor(index: number, pos: Vector) {
    super({ pos, radius: SEG_R, collisionType: CollisionType.Passive, z: 3 });
    this.segIndex = index;
    this.isAlive = true;
    this.health = 3;
    this.cableOwner = null;
  }
  onInitialize() {
    this.addTag("cable-segment");
    this._draw();
  }
  _draw() {
    this.graphics.use(
      new Circle({
        radius: SEG_R,
        color: this.isAlive ? C.segActive : C.segDead,
        strokeColor: this.isAlive ? Color.fromHex("#c4b5fd") : Color.fromHex("#374151"),
        lineWidth: 1,
      }),
    );
  }
  takeDamage(dmg = 1) {
    if (!this.isAlive) return;
    this.health -= dmg;
    this.graphics.use(new Circle({ radius: SEG_R, color: C.enemy }));
    if (this.health <= 0) {
      this.breakSegment();
    } else {
      this.actions.delay(120).callMethod(() => this._draw());
    }
  }
  breakSegment() {
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
  onInitialize(engine: Engine) {
    this._buildSegments(engine);
    this._buildLineGraphic();
  }

  _lerp(t: number) {
    const f = this.fromTower.pos.add(vec(0, 32)),
      to = this.toTower.pos.add(vec(0, 32));
    return vec(f.x + (to.x - f.x) * t, f.y + (to.y - f.y) * t + Math.sin(t * Math.PI) * 18);
  }
  _buildSegments(engine: Engine) {
    for (let i = 0; i < SEG_COUNT; i++) {
      const seg = new CableSegment(i, this._lerp(i / (SEG_COUNT - 1)));
      seg.cableOwner = this;
      this.segments.push(seg);
      engine.currentScene.add(seg);
    }
  }
  _buildLineGraphic() {
    this._lineCanvas = new Canvas({
      width: W,
      height: H,
      cache: false,
      draw: ctx => {
        ctx.clearRect(0, 0, W, H);
        if (this.segments.length < 2) return;
        const brokenIdx = this.segments.findIndex(s => !s.isAlive);
        const ox = -this.pos.x + W / 2,
          oy = -this.pos.y + H / 2;
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
  onPreUpdate() {
    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i].isAlive) this.segments[i].pos = this._lerp(i / (this.segments.length - 1));
    }
    this._lineCanvas?.flagDirty();
  }
  _dimAllSegments() {
    for (const seg of this.segments) {
      if (seg.isAlive) {
        seg.isAlive = false;
        seg._draw();
      }
    }
    this._lineCanvas?.flagDirty();
  }
  onSegmentBroken(seg: CableSegment) {
    if (!this.isPowered) return;
    this.isPowered = false;
    const idx = this.segments.indexOf(seg);
    for (let i = idx; i < this.segments.length; i++) {
      if (this.segments[i].isAlive) {
        this.segments[i].isAlive = false;
        this.segments[i]._draw();
      }
    }
    this._lineCanvas?.flagDirty();

    // Delegate cascade to PowerGraph
    this._graph.propagatePowerLoss(this);

    console.log("⚡ cable severed — downstream chain lost power", "error");
    this._scene._refreshPowerState();
  }
  disconnect() {
    for (const seg of this.segments) seg.kill();
    this.kill();
  }
}
