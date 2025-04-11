import * as THREE from 'three';
import { MathUtil } from '../Util/MathUtil.js';
import { MapGraph } from './MapGraph.js';
import { MapNode } from './MapNode.js';
import { MapRenderer } from './MapRenderer.js';
import { MazeGenerator } from './MazeGenerator.js';
import { HierarchicalGraph } from './HPAStar/HierarchicalGraph.js';



export class GameMap {

  // Constructor for our GameMap class
  constructor() {
  
    // Initialize bounds in here!
    this.bounds = new THREE.Box3(
      new THREE.Vector3(-105,0,-105), // scene min
      new THREE.Vector3(105,0,105) // scene max
    );

    // worldSize is a Vector3 with 
    // the dimensions of our bounds
    this.worldSize = new THREE.Vector3();
    this.bounds.getSize(this.worldSize);

    // Let's define a tile size
    // for our tile-based map
    this.tileSize = 15;

    // Columns and rows of our tile world
    this.cols = this.worldSize.x/this.tileSize;
    this.rows = this.worldSize.z/this.tileSize;


    // Create our graph!
    this.mapGraph = new MapGraph(this.cols, this.rows);

    this.mapGraph.entrance = this.quantize(this.getEdgeNodeLocation());

    this.setExitNode();
    
    // Generate our maze here!
    this.mazeGenerator = new MazeGenerator(this.mapGraph);
    // this.mazeGenerator.dfsMaze(this.mapGraph.get(0));
    this.mazeGenerator.braidedMaze(this.mapGraph.get(0), 1);

    // Create our hierarchical graph
    this.hierarchicalGraph = new HierarchicalGraph(this.mapGraph, this.tileSize);


    // Create our map renderer
    this.mapRenderer = new MapRenderer(this);

    // Create our game object
    this.gameObject = this.mapRenderer.createRendering();
  }

  

  // Method to get from node to world location
  localize(node) {
    let x = this.bounds.min.x + (node.i * this.tileSize) + this.tileSize/2;
    let y = this.tileSize;
    let z = this.bounds.min.z + (node.j * this.tileSize) + this.tileSize/2;
    return new THREE.Vector3(x, y, z);
  }

  // Method to get from world location to node
  quantize(location) {
    let nodeI = Math.floor((location.x - this.bounds.min.x)/this.tileSize);
    let nodeJ = Math.floor((location.z - this.bounds.min.z)/this.tileSize);

    return this.mapGraph.getAt(nodeI, nodeJ);
  }

  getEdgeNodeLocation()
  {
    let location = new THREE.Vector3();
    let col = 0;
    let row = 0;
    // Get Random Edge
    let edge = MathUtil.getRandomInt(4);
    switch (edge)
    {
      case 0:
      {
        // Top Edge
        col = MathUtil.getRandomInt(this.mapGraph.cols);
        break;
      }
      case 1:
      {
        // Right Edge
        row = MathUtil.getRandomInt(this.mapGraph.rows);
        col = this.mapGraph.cols - 1;
        break;
      }
      case 2:
      {
        // Bot Edge
        col = MathUtil.getRandomInt(this.mapGraph.cols);
        row = this.mapGraph.rows - 1;
        break;
      }
      case 3:
      {
        // Left Edge
        row = MathUtil.getRandomInt(this.mapGraph.rows);
        break;
      }
      default:
      {
        // Top Edge
        col = MathUtil.getRandomInt(this.mapGraph.cols);
        break;
      }
    }
    let node = this.mapGraph.getAt(col, row);
    location = this.localize(node);
    return location;
  }

  regenerateLevel() {
    // Make new entrance same spot but opposite side of where exit was on last level
    let tempExit = this.mapGraph.exit;
    let tempEntrance = this.mapGraph.entrance;
    // Recreate our graph!
    this.mapGraph = new MapGraph(this.cols, this.rows);

    this.mapGraph.entrance = this.setNewEntranceNode(tempEntrance, tempExit);
    this.setExitNode();

    // Generate our maze here!
    this.mazeGenerator = new MazeGenerator(this.mapGraph);
    this.mazeGenerator.braidedMaze(this.mapGraph.get(0), 1);

    // Create our map renderer
    this.mapRenderer = new MapRenderer(this);

    // Create our game object
    let tempObj = this.gameObject;
    this.gameObject = this.mapRenderer.createRendering();
    return tempObj;
  }

  generateBossRoom() {
    // Make new entrance same spot but opposite side of where exit was on last level
    let tempExit = this.mapGraph.exit;
    let tempEntrance = this.mapGraph.entrance;

    // Recreate our graph!
    this.mapGraph = new MapGraph(this.cols, this.rows);

    this.mapGraph.entrance = this.setNewEntranceNode(tempEntrance, tempExit);
    this.mapGraph.exit = null;

    // Generate our maze here!
    this.mazeGenerator = new MazeGenerator(this.mapGraph);
    this.mazeGenerator.emptyRoom();

    // Create our map renderer
    this.mapRenderer = new MapRenderer(this);

    // Create our game object
    let tempObj = this.gameObject;
    this.gameObject = this.mapRenderer.createRendering();
    return tempObj;
  }

  setNewEntranceNode(entrance, exit) {
    if (exit.i === 0) {
      entrance = this.mapGraph.getAt(this.cols - 1, exit.j);
    }
    else if (exit.i === this.cols - 1) {
      entrance = this.mapGraph.getAt(0, exit.j);
    }
    else if (exit.j === 0) {
      entrance = this.mapGraph.getAt(exit.i, this.rows - 1);
    }
    else if (exit.j === this.rows - 1) {
      entrance = this.mapGraph.getAt(exit.i, 0);
    }
    return entrance;
  }

  setExitNode() {
    this.mapGraph.exit = this.quantize(this.getEdgeNodeLocation());
    
    // Ensure the exit node is different than starting node
    while (this.mapGraph.entrance.i == this.mapGraph.exit.i || this.mapGraph.entrance.j == this.mapGraph.exit.j)
    {
      this.mapGraph.exit = this.quantize(this.getEdgeNodeLocation());
    }
  }

  /**
 * 
 * Get the maze distance between two nodes
 * - Uses the hierarchical graph for faster pathfinding
 * - Returns the length of the path as an integer
 * 
 */
  getMazeDistance(start, goal) {
    const path = this.hierarchicalGraph.hpastar(start, goal);
    return path.length;
  }
}