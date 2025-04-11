import { MapNode } from '../MapNode.js';

export class HierNode extends MapNode {

  constructor(mapNode) {
    // Hier node stores a low level node
    super(mapNode.id, mapNode.i, mapNode.j, mapNode.type);
    this.mapNode = mapNode;
  }

}