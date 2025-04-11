import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MapNode } from './MapNode.js';
import { MathUtil } from '../Util/MathUtil.js';

export class MapRenderer {

  // MapRenderer constructor
  constructor(gameMap) {
    this.gameMap = gameMap;

    // Wall dimensions based on tile size
    this.wallDepth = this.gameMap.tileSize * 0.1;
    this.wallWidth = this.gameMap.tileSize + this.wallDepth;
    this.wallHeight = this.gameMap.tileSize;
  }
 
  // To create the actual game object
  // associated with our GameMap
  createRendering() {

    // Create material and geometry for the ground
    let groundMaterial = new THREE.MeshStandardMaterial({ color: 'lightgray' });
    let groundGeometry = new THREE.BoxGeometry(
      this.gameMap.worldSize.x, 
      this.gameMap.tileSize, 
      this.gameMap.worldSize.z
    );  

    // Create the mesh for the ground
    let ground = new THREE.Mesh(groundGeometry, groundMaterial);

    
    // Prepare material for the walls and a list to hold their geometries
    let wallMaterial = new THREE.MeshStandardMaterial({ color: 'black' });
    let wallGeometries = [];

    // Loop through all nodes in the map graph to build their walls
    for (let node of this.gameMap.mapGraph.nodes) {
      for (let wall of this.buildWalls(node)) {
        wallGeometries.push(wall);
      }
    }

    // Merge all wall geometries into one
    let mergedWalls = BufferGeometryUtils.mergeGeometries(wallGeometries);
    
    // Create the mesh for the merged walls
    let walls = new THREE.Mesh(mergedWalls, wallMaterial);

    // Create a container for the full map
    let gameObject = new THREE.Group();

    // Add both ground and walls to the game object
    gameObject.add(ground, walls);
 
    return gameObject;
  }

  // Helper method to create and return a single wall geometry
  buildWall(x, y, z, rotation) {
    let wall = new THREE.BoxGeometry(this.wallWidth, this.wallHeight, this.wallDepth);
    
    // Rotate the wall to face the correct direction
    wall.rotateY(rotation); 

    // Move the wall to the correct position
    wall.translate(x, y, z);
    return wall; 
  }

  // Build walls by node
  buildWalls(node) {
    
    let walls = []

    // Declare half here for clarity
    let half = this.gameMap.tileSize/2;

    // Get position of the center of our node
    let pos = this.gameMap.localize(node);

    // Raise the wall to be centered vertically
    pos.y = this.wallHeight/2 + half;

    // If there is no edge to i-1, j
    // Build a wall at:
    // x - half tileSize, z
    // Rotate our wall PI/2
    if (!((this.gameMap.mapGraph.exit === node || this.gameMap.mapGraph.entrance === node) && node.i === 0)) {
      if (!node.hasEdgeTo(node.i-1, node.j)) {
        let w = this.buildWall(pos.x - half, pos.y, pos.z, Math.PI/2);
        walls.push(w);
      }
    }


    // If there is no edge to i+1, j
    // Build a wall at:
    // x + half tileSize, z
    // Rotate our wall PI/2
    if (!((this.gameMap.mapGraph.exit === node || this.gameMap.mapGraph.entrance === node) && node.i === this.gameMap.mapGraph.cols - 1 && node.i !== node.j)) {
      if (!node.hasEdgeTo(node.i+1, node.j)) {
        let w = this.buildWall(pos.x + half, pos.y, pos.z, Math.PI/2);
        walls.push(w);
      }
    }


    // If there is no edge to i, j-1
    // Build a wall at:
    // x, z - half tileSize
    // Rotate our wall PI/2
    if (!((this.gameMap.mapGraph.exit === node || this.gameMap.mapGraph.entrance === node) && node.j === 0)) {
      if (!node.hasEdgeTo(node.i, node.j-1)) {
        let w = this.buildWall(pos.x, pos.y, pos.z - half, 0);
        walls.push(w);
      }
    }
    
    // If there is no edge to i1, j+1
    // Build a wall at:
    // x, z + half tileSize
    // Rotate our wall PI/2
    if (!((this.gameMap.mapGraph.exit === node || this.gameMap.mapGraph.entrance === node) && node.j === this.gameMap.mapGraph.rows - 1 && node.i !== node.j)) {
      if (!node.hasEdgeTo(node.i, node.j+1)) {
        let w = this.buildWall(pos.x, pos.y, pos.z + half, 0);
        walls.push(w);
      }
    }
    
    // return the walls around this node
    return walls;
  }


}