import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil';

export class Controller {

  // Controller Constructor
  constructor(doc, camera) {
    this.doc = doc;
    this.camera = camera;

    this.left = false;
    this.right = false;
    this.forward = false;
    this.backward = false;
    this.firing = false;

    this.debug = false

    this.doc.addEventListener('keydown', this);
    this.doc.addEventListener('keyup', this);
  }

  handleEvent(event) {
    if (event.type === 'keydown') {
      if (event.code === 'KeyW') { this.forward = true; }
      else if (event.code === 'KeyS') { this.backward = true; }
      else if (event.code === 'KeyA') { this.left = true; }
      else if (event.code === 'KeyD') { this.right = true; }
      else if (event.code === 'Backquote') {
        this.debug = !this.debug;
        console.log("Debug mode:", this.debug);
      }
    }

    else if (event.type === 'keyup') {
      if (event.code === 'KeyW') { this.forward = false; }
      else if (event.code === 'KeyS') { this.backward = false; }
      else if (event.code === 'KeyA') { this.left = false; }
      else if (event.code === 'KeyD') { this.right = false; }
      else if (event.code === 'Space') { this.firing = true; }
    }
  }

  // get angle offset 
  getInputAngle() {
    let a = 0;

    if (this.backward) {
      if (this.left) { a -= Math.PI / 4; }
      else if (this.right) { a += Math.PI / 4; }
    }
    else if (this.forward) {
      a = Math.PI;
      if (this.left) { a += Math.PI / 4; }
      else if (this.right) { a -= Math.PI / 4; }
    }
    else {
      if (this.left) { a = -Math.PI / 2; }
      else if (this.right) { a = Math.PI / 2; }
    }
    return a;
  }

  direction() {
    let worldDirection = new THREE.Vector3();
    this.camera.getWorldDirection(worldDirection);

    let directionAngle = Math.atan2(worldDirection.x, worldDirection.z);
    directionAngle += Math.PI;
    directionAngle += this.getInputAngle();

    let x = Math.sin(directionAngle);
    let z = Math.cos(directionAngle);

    z = Math.abs(z) < 0.0005 ? 0 : z;

    return new THREE.Vector3(x, 0, z);
  }

  // Checks whether our controller is moving
  moving() {
    return this.left || this.right || this.forward || this.backward;
  }

  // Checks if shooting
  shooting() {
    if (this.firing) {
      this.firing = false;
      return true;
    }
    return this.firing;
  }
}