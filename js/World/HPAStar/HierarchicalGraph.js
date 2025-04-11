import { Cluster } from './Cluster.js';
import { HierNode } from './HierNode.js';
import { MinHeap } from '../../Util/MinHeap.js';

export class HierarchicalGraph {


  constructor(graph, tileSize) {

    this.clusterSize = tileSize * 3;

    this.cols = graph.cols/this.clusterSize;
    this.rows = graph.rows/this.clusterSize;

    // Clusters
    this.clusters = [];

    // Hierarchical Graph Nodes
    this.nodes = [];

    // Need our graph
    this.graph = graph;

    // Method to preprocess the graph
    this.preprocess(this.graph);
  }


  // Give a particular node,
  // get the cluster it is a part of
  getCluster(node) {
    // Given the node i and j coordinates
    // Quantize in the Hierarchical graph
    let i = Math.floor(node.i / this.clusterSize);
    let j = Math.floor(node.j / this.clusterSize);

    return this.clusters[j * this.cols + i];
  }


  preprocess() {
    this.createClusters();
    this.createBorders();
    this.createTransitions();
    this.createEdges();
  }

  // First step of our preprocessing
  // Create our clusters!
  createClusters() {
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        this.clusters.push(new Cluster(this.clusters.length));
      }
    }
  }

  // Second step of our preprocessing
  // Create our borders and identify border nodes
  createBorders() {
    // Iterate over nodes and their edges
    for (let node of this.graph.nodes) {
      // Figure out which cluster the node is in
      let from = this.getCluster(node);

      for (let edge of node.edges) {
        // Figure out which cluster the edge node is in
        let to = this.getCluster(edge.node);

        // if from != to
        // then we add the border node to our cluster
        if (from !== to) {
          from.addBorderNode(to, node);
        }
      }
    }
  }

  // Third step is to create entrances and transitions
  createTransitions() {
    // Iterate over clusters
    for (let cluster of this.clusters) {
      // Iterate over the borders
      for (let [, border] of cluster.borders) {

        // Define our entrance
        let entrance = [];
        for (let i = 0; i < border.length; i++) {

          // Get the current node and next node
          let current = border[i];
          let next = border[i + 1];

          // Push our current node to the entrance
          entrance.push(current);

          // If there is no next node
          // OR if there is a gap
          // Finalize our entrance
          if (!next
            || Math.abs(current.i - next.i) > 1
            || Math.abs(current.j - next.j) > 1) {

            // Get the middle element in our entrance
            let transitionNode = entrance[Math.floor(entrance.length / 2)];
            let hierNode = new HierNode(transitionNode);

            // Add to our hierarchical graph
            this.nodes.push(hierNode);

            // Add a reference to our transition node in our cluster
            cluster.addTransition(hierNode);

            entrance = [];

          }
        }
      }
    }
  }

  // Create edges
  createEdges() {
    for (let fromNode of this.nodes) {
      let from = this.getCluster(fromNode.mapNode);

      for (let toNode of this.nodes) {
        let to = this.getCluster(toNode.mapNode);

        // If not in the same cluster
        if (from !== to) {
          this.createInterEdge(fromNode, toNode);

          // If YES in the same cluster
        } else {
          this.createIntraEdge(fromNode, toNode);
        }

      }

    }
  }

  // Create inter edges between clusters
  createInterEdge(fromNode, toNode) {
    let edge = fromNode.mapNode.getEdge(toNode.mapNode);
    // If this edge exists
    if (edge) {
      // Create a hierarchical edge
      fromNode.addEdge(toNode, edge.cost);
    }
  }

  // Create intra edges within clusters
  createIntraEdge(fromNode, toNode) {
    // Run mod A*, staying within the cluster (pass in true!!!!)
    let result = this.modifiedAStar(fromNode.mapNode, toNode.mapNode, true)
    if (result.path.length > 0) {
      fromNode.addEdge(toNode, result.cost);
    }
  }



  hpastar(start, end) {

    // Find our start and end node clusters
    let startCluster = this.getCluster(start);
    let endCluster = this.getCluster(end);

    // Try to get our hierStart node
    let hierStart = startCluster.getTransition(start);
    if (!hierStart) {
      // Creating a new hierStart node
      hierStart = new HierNode(start);

      // Add our intra edges from the start node
      // to each transition node
      for (let t of startCluster.transitions) {
        this.createIntraEdge(hierStart, t);
      }
    }

    // Try to get our hierEnd node
    let hierEnd = endCluster.getTransition(end);
    if (!hierEnd) {
      // Creating a new hierEnd node
      hierEnd = new HierNode(end);

      // Add our intra edges from each 
      // transition node to our end node
      for (let t of endCluster.transitions) {
        this.createIntraEdge(t, hierEnd);
      }
    }

    // Special case: if our start and end nodes
    // are in the same cluster, then we need
    // to create an intra edge between them
    // OR we can just run A* without restricting which 
    // cluster we are in and return that as the path
    if (startCluster === endCluster) {
      this.createIntraEdge(hierStart, hierEnd);
    }

    // // High level A*
    let result = this.modifiedAStar(hierStart, hierEnd);
    return this.convertToLowLevelPath(result.path);
  }

  // Converts our hierarchical path to
  // a low level path
  convertToLowLevelPath(hierPath) {
    let path = [];

    // Iterate over each node in the hierarchical path
    // and gets the path between those two nodes
    for (let i = 0; i < hierPath.length - 1; i++) {
      let current = hierPath[i].mapNode;
      let next = hierPath[i + 1].mapNode;

      // If they are already connected in the lower
      // level graph, we can just add the node
      if (current.getEdge(next)) {
        path.push(next);

      } else {
        // Otherwise, we have to find the path between them
        // while staying in the same cluster
        // ** This would be more efficient if we store our paths
        let subPath = this.modifiedAStar(current, next, true).path;
        for (let node of subPath) {
          path.push(node);
        }
      }
    }
    return path;
  }


  /**
   * Modified A* Pathfinding Algorithm
   * 
   * This function implements a modified version of the A* algorithm
   * 
   * start - The starting node
   * end - The target node
   * onlySameCluster - If true, restricts pathfinding to nodes in the same cluster
   * heuristic - The heuristic function (default: Manhattan distance)
   * 
   * New: returns an object literal { path, cost }
   * 
   */
  modifiedAStar(start, end, onlySameCluster = false, heuristic = this.graph.manhattanDistance) {

    // Keep track of open nodes, costs, and parents
    let open = new MinHeap();
    let costs = new Map();
    let parents = new Map();

    // Add the start node to our open, costs, and parents
    open.enqueue(start, 0);
    costs.set(start.id, 0);
    parents.set(start.id, null);

    // While open still has nodes to traverse
    while (!open.isEmpty()) {

      // Get the lowest F cost node
      let current = open.dequeue();

      // If we've reached the end,
      // we know this is the lowest cost
      // Reconstruct the path
      if (current === end) {
        return { path: this.graph.backtrack(end, parents), cost: costs.get(current.id) };
      }

      // Look at current's neighbours
      for (let edge of current.edges) {

        let neighbour = edge.node;

        // New, check if not in the same cluster
        if (onlySameCluster && this.getCluster(neighbour) !== this.getCluster(start)) {
          continue;
        }

        // gCost is our original cost
        let gCost = edge.cost + costs.get(current.id);
        // hCost is our cost based on the heuristic
        let hCost = heuristic(neighbour, end);
        // fCost is combining the two
        let fCost = gCost + hCost;

        // If costs does not have our neighbour OR
        // It's cost is > than the current gCost
        if (!costs.has(neighbour.id) || (costs.get(neighbour.id) > gCost)) {
          // Add neighbour to our costs, parents, and open
          costs.set(neighbour.id, gCost);
          parents.set(neighbour.id, current);

          open.enqueue(neighbour, fCost);
        }

      }

    }
    // We haven't found a path
    return { path: [], cost: -1 };
  }
}