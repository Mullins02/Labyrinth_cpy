export class MazeGenerator {

  constructor(graph) {
    this.graph = graph;
    this.visited = new Set();
  }

  // Get neighbours will get all neighbouring adjacent nodes
  // From an inputted node
  getNeighbours(node) {

    let neighbours = [];
    // We'll use these to add to our indices
    // To find our adjacent nodes
    let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (let dir of directions) {
      let nextI = node.i + dir[0];
      let nextJ = node.j + dir[1];

      if ((nextI >= 0 && nextI < this.graph.cols) &&
          (nextJ >= 0 && nextJ < this.graph.rows)) {

        let neighbour = this.graph.getAt(nextI, nextJ);
        neighbours.push(neighbour);
      }  
    }
    return neighbours;
  }

  // To shuffle our array
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = array[i];
      array[i] = array[j];
      array[j] = temp;  
    }
  }

  // DFS Maze Generation!
  dfsMaze(node) {
    this.visited.add(node.id);

    // Get our neighbours
    // and shuffle them
    let neighbours = this.getNeighbours(node);
    this.shuffle(neighbours);

    // Iterate over all neighbours
    for (let n of neighbours) {
      if (!this.visited.has(n.id)) {
        node.addEdge(n, 1);
        n.addEdge(node, 1);
        this.dfsMaze(n);
      }  
    }
  }

  // Braided Maze Generation!
  braidedMaze(node, probability) {
    
    // Start by running DFS Maze Gen
    this.dfsMaze(node);

    // Find all dead end nodes
    let deadEnds = this.graph.nodes.filter(node => node.edges.length === 1);

    // Iterate over dead ends
    for (let node of deadEnds) {
      if (Math.random() > probability) continue;

      // Get neighbours to/from dead end node
      let neighbours = this.getNeighbours(node);
      let unconnected = neighbours.filter(n => !node.hasEdge(n));

      let rand = unconnected[Math.floor(Math.random() * unconnected.length)];

      // Create a loop!
      node.addEdge(rand, 1);
      rand.addEdge(node, 1);

    }

  }
  
  // Empty room generation
  emptyRoom() {
    this.graph.nodes.forEach(n => {
      // Get our neighbours
      let neighbours = this.getNeighbours(n);

      // Iterate over all neighbours
      for (let node of neighbours) {
        n.addEdge(node, 1);
      }
    })
  }

}





