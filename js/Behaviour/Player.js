import * as THREE from 'three';
import { Character } from './Character.js';
import { State } from './State';
import { VectorUtil } from '../Util/VectorUtil.js';
import { Item } from '../World/Item.js';
import { GameMap } from '../World/GameMap.js';
import { Enemy } from './Enemy.js';
import { DeadState } from './Enemy.js';



export class Player extends Character {

  constructor(rooms = 1, color) {
    super(color);

    this.maxForce = 50;

    this.lastVelocity = null;

    this.ammo = 5;
    this.rooms = rooms;
    this.roomsCleared = 0;
    this.gameOver = false;
    this.won = false;
    this.hasKey = false;

    this.hitByEnemy = false;
    this.powerUp = false;
    this.invTimeHit = 1;
    this.invTimePower = 10;
    this.remainingInvTime = 0;
    this.maxHealth = 3;
    this.health = 3;
    this.points = 0;
    this.arrowIndex = 0;

    this.collisionThreshold = 6

    this.shield;


    this.arrows = [];
    for (let i = 0; i < 5; i++) {
      const arrow = new Character();
      arrow.isActive = false;
      this.arrows.push(arrow);
    }

    this.state = new IdleState();
    this.state.enterState(this);
  }

  switchState(state) {
    this.state = state;
    this.state.enterState(this);
  }

  // Method to avoid multiple collisions
  collidingWithItem(items, lookAhead) {

    let center = VectorUtil.multiplyScalar(this.velocity, lookAhead);
    let a = 0.5;
    let whisker1 = new THREE.Vector3(this.velocity.x * Math.cos(a) - this.velocity.z * Math.sin(a), 0,
      this.velocity.x * Math.sin(a) + this.velocity.z * Math.cos(a));
    let whisker2 = new THREE.Vector3(this.velocity.x * Math.cos(-a) - this.velocity.z * Math.sin(-a), 0,
      this.velocity.x * Math.sin(-a) + this.velocity.z * Math.cos(-a));

    whisker1.setLength(2);
    whisker2.setLength(2);

    // Obtain the relative vector from character to obstacle
    let characterToObstacle = VectorUtil.sub(items[0].gameObject.position, this.location);
    let item = items[0];
    items.forEach(i => {
      let diffVec = VectorUtil.sub(i.gameObject.position, this.location);
      if (characterToObstacle.length() > diffVec.length()) {
        characterToObstacle = diffVec;
        item = i;
      }
    });
    let rayScalarProjection = VectorUtil.scalarProjectOnVector(characterToObstacle, center);
    let whisker1ScalarProjection = VectorUtil.scalarProjectOnVector(characterToObstacle, whisker1);
    let whisker2ScalarProjection = VectorUtil.scalarProjectOnVector(characterToObstacle, whisker2);
    let collision = this.detectCollision(item, center, rayScalarProjection)
      || this.detectCollision(item, whisker1, whisker1ScalarProjection)
      || this.detectCollision(item, whisker2, whisker2ScalarProjection);

    // If there is a collision
    if (collision)
      return item
    return null;
  }

  // Detects the collision between our obstacle 
  // and our character to ray end vector
  detectCollision(item, ray, scalarProjection) {
    // clamp our scalar projection to the extents
    // character to ray end
    let clampedSP = THREE.MathUtils.clamp(scalarProjection, 0, ray.length());

    // Closest point is our character's location 
    // + current ray at a length of the clamped SP
    let closestPoint = VectorUtil.setLength(ray, clampedSP);
    closestPoint.add(this.location);

    // return whether or not our closest point is <= the obstacle radius
    return closestPoint.distanceTo(item.location) <= item.radius;
  }

  update(deltaTime, bounds, gameMap, controller, items, enemies) {
    this.state.updateState(this, controller, items);
    super.update(deltaTime, bounds, gameMap, controller);


    // If shooting return arrow
    if (controller.shooting() && this.ammo > 0) {
      let arrow;
      if (controller.debug) {
        arrow = this.arrows[this.arrowIndex];
        this.arrowIndex = (this.arrowIndex + 1) % this.arrows.length;
      } else {
        arrow = this.arrows[this.ammo - 1];
        this.arrowIndex = 0;
      }
      arrow.isActive = true;
      arrow.location = VectorUtil.add(this.location.clone().add(new THREE.Vector3(0, 5, 0)), this.velocity.clone().divideScalar(10));

      // If moving or no last velocity, use controller direction
      if (controller.moving() || !this.lastVelocity) {
        let steer = controller.direction();
        arrow.velocity = VectorUtil.multiplyScalar(steer, 50);
      }
      // If not moving, use last velocity
      else if (this.lastVelocity) {
        arrow.velocity = VectorUtil.multiplyScalar(this.lastVelocity, 50);
      }

      // Remove arrows unless debug mode is on
      if (!controller.debug) {
        this.ammo--;
      }
    }

    // update arrows
    this.arrows.forEach(a => {
      a.update(deltaTime, bounds, gameMap);
      // fix rotation
      a.gameObject.rotation.y = 0;
      let angle = Math.atan2(a.velocity.x, a.velocity.z);
      a.gameObject.rotation.z = -angle;
    });

    // Invincibility time check
    if (this.hitByEnemy || this.powerUp) {
      if (this.powerUp) {
        if (controller.moving() && this.velocity.length() > 7.5) {
          this.shield.setLocation(this.location.clone().add(this.velocity.clone().divideScalar(4)).add(new THREE.Vector3(0, 3, 0)));
        }
        if (this.velocity.length() > 7.5) {
          let angle = Math.atan2(this.velocity.x, this.velocity.z);
          this.shield.gameObject.rotation.y = (Math.PI / 2) + angle;
        }
      }
      this.remainingInvTime -= deltaTime;
      if (this.remainingInvTime <= 0) {
        this.powerUp = false;
        this.hitByEnemy = false;
        this.shield.setLocation(new THREE.Vector3(0, -10, 0));
      }
    }

    // Check for collisions with enemies, if not invincible
    else if (!controller.debug) {
      if (!this.hitByEnemy || this.remainingInvTime <= 0) {
        // Check for collisions with living enemies
        enemies.forEach(enemy => {
          if (enemy.health <= 0) return;
          const distance = this.location.distanceTo(enemy.location);
          if (distance < this.collisionThreshold) {
            // console.log("Player hit by enemy!");
            this.health--;
            this.hitByEnemy = true;
            this.remainingInvTime = this.invTimeHit;

          }
        });
      }
    }

    items.forEach(item => {
      // Check for collisions with powerups
      if (item.type === Item.Type.Shield) {
        const distance = this.location.distanceTo(item.location);
        if (distance < item.radius && !this.powerUp && !controller.debug) {
          this.powerUp = true;
          this.remainingInvTime = this.invTimePower;
          item.setLocation(new THREE.Vector3(item.location.x, -5, item.location.z));
          this.shield.setLocation(this.location.clone().add(this.velocity.clone().divideScalar(3)));
        }
      }
      // Check for collisions with health packs
      else if (item.type === Item.Type.Potion) {
        const distance = this.location.distanceTo(item.location);
        if (distance < item.radius && this.health !== this.maxHealth) {
          this.health++;
          item.setLocation(new THREE.Vector3(item.location.x, -5, item.location.z));
        }
      }
    });

    // Check if player is moving and update last velocity
    if (controller.moving()) {
      this.lastVelocity = this.velocity.clone();
    }

    // Check if player is dead
    if (this.health <= 0 && !this.gameOver) {
      this.gameOver = true
      console.log("Game Over");
    }
  }
}


export class IdleState extends State {

  enterState(player) {
    //console.log("IDLE!");
  }

  updateState(player, controller, items) {
    if (controller.moving()) {
      player.switchState(new MovingState());
    }
    // Apply brakes smoothly
    let brakeForce = player.applyBrakes();
    player.applyForce(brakeForce);

    // Stop completely if velocity is low enough
    if (player.velocity.length() < 0.75) {
      player.velocity.set(0, 0, 0);
      player.acceleration.setLength(0);
    }
  }

}

export class MovingState extends State {

  enterState(player) {
    //console.log("MOVING!");
  }

  updateState(player, controller, items) {
    if (!controller.moving()) {
      player.switchState(new IdleState());
      return;
    }
    let steer = controller.direction();
    steer.setLength(player.maxForce / 3);
    player.applyForce(steer);

    // Check for collision with arrows laid about
    let collisionItem = player.collidingWithItem(items, 0.1);
    if (collisionItem !== null) {
      if (collisionItem.type === Item.Type.Arrow) {
        // Check if the player ammo is full
        if (player.ammo !== 5) {
          player.ammo++;
          collisionItem.setLocation(new THREE.Vector3(collisionItem.location.x, -5, collisionItem.location.z));
        }
      }
      else if (collisionItem.type === Item.Type.Chest && player.hasKey) {
        // console.log("CHEST!!")
        player.won = true;
        player.gameOver = true;
      }
      else if (collisionItem.type === Item.Type.Key) {
        // console.log("KEYY!!")
        player.hasKey = true;
        collisionItem.setLocation(new THREE.Vector3(0, -10, 0));
      }
    }
  }

} 