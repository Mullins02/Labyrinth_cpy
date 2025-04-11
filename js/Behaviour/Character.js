import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil';

/**
 * 
 * The Character class will be used for:
 * NPC movement and Player movement
 *
 **/
export class Character {

  constructor() {

    // Create a cone mesh
    let coneGeo = new THREE.ConeGeometry(1, 2, 10);
    let coneMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    let mesh = new THREE.Mesh(coneGeo, coneMat);
    mesh.rotation.x = Math.PI / 2;

    this.gameObject = new THREE.Group();
    this.gameObject.add(mesh);


    // Instance variables
    this.location = new THREE.Vector3(0, 5, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.topSpeed = 15;

    this.mass = 1;
    this.maxForce = 15;
    this.maxAccel = 250;

    this.wanderAngle = Math.random() * (Math.PI * 2);
  }

  // Set a model for our character
  setModel(model, size) {
    const group = new THREE.Group();
    model.children.forEach(child => group.add(child));

    let bbox = new THREE.Box3().setFromObject(group);

    // The depth of our object
    let dz = bbox.max.z - bbox.min.z;

    // Scale the object based on 
    // how large we want it to be
    let scale = size / dz;

    group.scale.set(scale, scale, scale);
    group.updateMatrixWorld(true);

    this.gameObject = group;
  }

  setModelScale(model, scale) {
    model.scale.set(scale, scale, scale);
    model.updateMatrixWorld(true); // Ensure transforms are up to date
    if (model.children.length != 0) {
      model.children.forEach(m => {
        this.setModelScale(m, scale);
      });
    }
  }

  // Wrap around the scene
  checkBounds(bounds) {
    this.location.x = THREE.MathUtils.euclideanModulo(
      this.location.x - bounds.min.x,
      bounds.max.x - bounds.min.x
    ) + bounds.min.x;

    this.location.z = THREE.MathUtils.euclideanModulo(
      this.location.z - bounds.min.z,
      bounds.max.z - bounds.min.z
    ) + bounds.min.z;

  }

  // To update our character
  update(deltaTime, bounds, gameMap, controller = { debug: false }) {

    // Trickle down approach:
    // Add acceleration to velocity
    this.velocity.addScaledVector(this.acceleration, deltaTime);

    // Limit the magnitude of the vector
    // by the character's top speed
    if (this.velocity.length() > this.topSpeed) {
      this.velocity.setLength(this.topSpeed);
    }

    if (this.velocity.length() < 1) {
      this.stop();
    }

    // If debug is active, just move without checking path edges
    if (controller.debug) {
      this.location.addScaledVector(this.velocity, deltaTime);
    }
    else {
      let charNode = gameMap.quantize(this.location);

      let locClone = this.location.clone();
      let nextLocNode = gameMap.quantize(locClone.addScaledVector(this.velocity, deltaTime));

      if (nextLocNode !== undefined) {
        // Add velocity to location
        if (charNode === nextLocNode || charNode.hasEdge(nextLocNode)) {
          this.location.addScaledVector(this.velocity, deltaTime);
        }
      }
    }

    this.checkBounds(bounds);

    if (this.velocity.length() > 7.5) {
      let angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.gameObject.rotation.y = angle;
    }




    // Set the position of our character's gameObject
    // to the instance variable location
    this.gameObject.position.copy(this.location);
  }

  // Seek steering behaviour
  seek(target) {

    // Calculate desired velocity
    let desired = new THREE.Vector3();
    desired.subVectors(target, this.location);
    desired.setLength(this.topSpeed);

    // Calculate steering force
    let steer = new THREE.Vector3();
    steer.subVectors(desired, this.velocity);

    // Limit our steering force
    // by our maximum force
    if (steer.length() > this.maxForce) {
      steer.setLength(this.maxForce);
    }

    return steer;

  }


  // Flee steering behaviour
  flee(target) {

    let desired = new THREE.Vector3();
    desired.subVectors(target, this.location);
    desired.setLength(this.topSpeed);

    // This is the only change compared
    // to our seek steering behaviour
    desired.multiplyScalar(-1);

    let steer = new THREE.Vector3();
    steer.subVectors(desired, this.velocity);


    if (steer.length() > this.maxForce) {
      steer.setLength(this.maxForce);
    }

    return steer;

  }


  // Pursue steering behaviour
  pursue(character, lookAhead) {

    let prediction = new THREE.Vector3();
    prediction.addScaledVector(character.velocity, lookAhead);

    let predictedTarget = new THREE.Vector3();
    predictedTarget.addVectors(prediction, character.location);

    return this.seek(predictedTarget);
  }


  // Evade steering behaviour
  evade(character, lookAhead) {

    let prediction = new THREE.Vector3();
    prediction.addScaledVector(character.velocity, lookAhead);

    let predictedTarget = new THREE.Vector3();
    predictedTarget.addVectors(prediction, character.location);

    return this.flee(predictedTarget);


  }

  // Arrive steering behaviour
  arrive(target, radius) {

    let desired = new THREE.Vector3();
    desired.subVectors(target, this.location);

    let distance = desired.length();

    // If we are close enough to
    // the target, stop
    if (distance < 0.01) {
      this.velocity.setLength(0);

      // Slow down if we are within
      // a specified radius to the target
    } else if (distance < radius) {
      let speed = (distance / radius) * this.topSpeed;
      desired.setLength(speed);

      // Otherwise, proceed as seek
    } else {
      desired.setLength(this.topSpeed);

    }

    // Apply our steering formula
    let steer = new THREE.Vector3();
    steer.subVectors(desired, this.velocity);

    if (steer.length() > this.maxForce) {
      steer.setLength(this.maxForce);
    }

    return steer;

  }

  // Wander steering behaviour
  wander(gameMap) {

    let distance = 5;
    let radius = 6;
    let angleOffset = 0.075;

    let futureLocation = this.velocity.clone();
    futureLocation.setLength(distance);
    futureLocation.add(this.location);

    let target = new THREE.Vector3(radius * Math.sin(this.wanderAngle), 0, radius * Math.cos(this.wanderAngle));
    let targetClone = target.clone().add(futureLocation);
    let targetNode = gameMap.quantize(targetClone);
    let charNode = gameMap.quantize(this.location);

    let change = Math.random() * (angleOffset * 2) - angleOffset;
    this.wanderAngle = this.wanderAngle + change;

    let count = 0

    angleOffset = 0.1;
    while (targetNode === undefined || (!charNode.hasEdge(targetNode) && charNode !== targetNode)) {
      if (++count > 200) {
        angleOffset = angleOffset * 1.05;
      }
      target = new THREE.Vector3(radius * Math.sin(this.wanderAngle), 0, radius * Math.cos(this.wanderAngle));
      change = Math.random() * (angleOffset * 2) - angleOffset;
      this.wanderAngle = this.wanderAngle + change;
      targetClone = target.clone().add(futureLocation);
      targetNode = gameMap.quantize(targetClone);
    }

    let steer = this.seek(targetClone);


    return steer;
  }

  // Go to method to accelerate to the position argument
  goTo(position) {
    let direction = new THREE.Vector3().subVectors(position, this.location);
    direction.setLength(15);
    this.acceleration = direction;
  }

  // Apply force to our character
  applyForce(force) {
    force.divideScalar(this.mass);
    this.acceleration.add(force);
    if (this.acceleration.length() > this.maxAccel) {
      this.acceleration.setLength(this.maxAccel);
    }
  }

  // If you just want to stop
  stop() {
    this.velocity.setLength(0);
  }

  // Apply brakes steering behaviour  
  applyBrakes() {
    let brakeFactor = 0.2; // Adjust this to control braking strength

    // Instead of flipping velocity, we reduce it gradually per component
    this.velocity.x *= (1 - brakeFactor);
    this.velocity.z *= (1 - brakeFactor);
    let brake = VectorUtil.multiplyScalar(this.velocity, -1);

    if (brake.length() > this.maxForce) {
      brake.setLength(this.maxForce);
    }
    if (this.velocity.length() === 0) {
      brake.setLength(0);
    }
    return brake;
  }


}