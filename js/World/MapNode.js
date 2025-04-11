export class MapNode {

  // Enum-like object
  static Type = Object.freeze({
      Ground: Symbol("ground")
  });

  // MapNode constructor
  constructor(id, i, j, type) {
    this.id = id;
    this.i = i;
    this.j = j;
    this.type = type;
    
    this.edges = [];
  }

  // add an edge to this node
  addEdge(node, cost) {
    this.edges.push({node: node, cost: cost});
  }

  // can this node be traversed?
  // For now, this will just check
  // if our node is of type Grass
  isTraversable() {
    return this.type === MapNode.Type.Ground;
  }

  // try and add an edge to this node
  tryAddEdge(node, cost) {
    if (node.isTraversable()) {
      this.addEdge(node, cost);
    }
  }

  // Checks if there is an edge to a node
  hasEdge(node) {
    return this.getEdge(node) !== undefined;
  }

  // Test if this node has an edge to the neighbour
  // It will return that edge
  getEdge(node) {
    return this.edges.find(x => x.node === node);
  }

  // Get an edge to a particular location i, j
  getEdgeTo(i, j) {
    return this.edges.find(e => (e.node.i === i) && (e.node.j === j));
  }

  // Test to see if there is an edge to a particular location i, j
  hasEdgeTo(i, j) {
    return this.getEdgeTo(i, j) !== undefined;
  }

}