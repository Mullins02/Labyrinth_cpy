export class Cluster {

  constructor(id) {

    this.id = id;
    // this will store the borders
    // that connects to each cluster
    // key will be the connected cluster id
    // value will be a border
    this.borders = new Map();

    // this will store transition nodes
    this.transitions = [];

  }

  // Get the border connected to
  // a particular cluster
  getBorder(cluster) {
    return this.borders.get(cluster.id);
  }

  // Takes in other cluster that our
  // border node is connected to
  addBorderNode(cluster, node) {

    if (!this.borders.has(cluster.id)) {
      // Set to a new cluster  
      this.borders.set(cluster.id, []);
    }
    // Add our node to the border nodes 
    // connecting to that particular cluster
    this.borders.get(cluster.id).push(node);
  }

  // get a particular transition from a MapNode
  getTransition(mapNode) {
    return this.transitions.find(x => x.mapNode === mapNode);
  }

  // add a transition node to the list of transitions
  addTransition(node) {
    this.transitions.push(node);
  }

}