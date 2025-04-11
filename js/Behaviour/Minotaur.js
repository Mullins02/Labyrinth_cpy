import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';
import { Character } from './Character.js';
import { Enemy, DeadState, WanderState } from './Enemy.js';
import { State } from './State.js';

export class Minotaur extends Enemy {

    constructor(health = 5, color) {
        super(health, color);

        this.topChargeSpeed = 50;
        this.maxForce = 150;
        this.maxAccel = 150;
        this.topWanderSpeed = this.topSpeed;
        this.chaseDistance = 1;
        this.collisionThreshold = 12;

        // Start in wander state
        this.state = new MinotaurWanderState();
        this.state.enterState(this);
    }

    update(deltaTime, bounds, gameMap, player) {
        this.state.updateState(this, gameMap, player, deltaTime);
        super.update(deltaTime, bounds, gameMap, player);

        if (this.velocity.length() > 5) {
            let angle = Math.atan2(this.velocity.x, this.velocity.z);
            this.gameObject.rotation.y = angle + Math.PI;
        }
    }
}

/**
 * 
 * Enemy wander state
 * - Picks a random direction every few frames
 * - Switches to chase or evade if player is nearby
 * 
 */
export class MinotaurWanderState extends WanderState {

    enterState(enemy) {
        // console.log("WANDERING");
        enemy.topSpeed = enemy.topWanderSpeed;
    }

    updateState(enemy, gameMap, player, deltaTime) {
        const playerNode = gameMap.quantize(player.location);
        const enemyNode = gameMap.quantize(enemy.location);
        const distance = gameMap.getMazeDistance(enemyNode, playerNode);

        // If player is defeated, switch to dead state
        if (enemy.health <= 0) {
            enemy.switchState(new DeadState());
            return;
        }

        // If player is within set units, switch state
        if (distance < enemy.detectionDistance) {
            enemy.switchState(new ChargeState());
            return;
        }

        // Wander
        enemy.applyForce(enemy.wander(gameMap));
    }
}

/**
 * 
 * Enemy Idle state
 * - idles for enemy.idleTime 
 * 
 */
export class IdleState extends State {
    enterState(enemy) {
        // console.log("IDLING");
    }

    updateState(enemy, gameMap, player, deltaTime) {

        // If enemy is defeated, switch to dead state
        if (enemy.health <= 0) {
            enemy.switchState(new DeadState());
            return;
        }
        enemy.idleTime -= deltaTime;
        // If idle time over
        if (enemy.idleTime <= 0) {
            enemy.idleTime = 0;
            const playerNode = gameMap.quantize(player.location);
            const enemyNode = gameMap.quantize(enemy.location);
            const distance = gameMap.getMazeDistance(enemyNode, playerNode);

            // If player is out of range, switch to wander state
            if (distance > enemy.chaseDistance) {
                enemy.switchState(new MinotaurWanderState());
                return;
            }
            else {
                enemy.switchState(new ChargeState());
                return;
            }
        }
        else {
            if (enemy.idleTime <= 1) {
                enemy.applyForce(enemy.applyBrakes());
            }
            return;
        }
    }
}

/**
 * 
 * Enemy chase state
 * - Follows shortest path to player using A*
 * 
 */
export class ChargeState extends State {

    enterState(enemy) {
        // console.log("CHASING");
        enemy.topSpeed = enemy.topChargeSpeed;

        // Reset path and cooldown
        enemy.currentPath = [];
        enemy.pathCooldown = 0;
    }

    updateState(enemy, gameMap, player, deltaTime) {
        const playerNode = gameMap.quantize(player.location);
        const enemyNode = gameMap.quantize(enemy.location);
        const distance = gameMap.getMazeDistance(enemyNode, playerNode);

        // If enemy is defeated, switch to dead state
        if (enemy.health <= 0) {
            enemy.switchState(new DeadState());
            return;
        }

        // // If player is out of range, switch to wander state
        // else if (distance > enemy.chaseDistance) {
        //     enemy.switchState(new MinotaurWanderState());
        //     return;
        // }

        // Charge at player
        enemy.applyForce(enemy.seek(player.location));
        if (enemy.velocity.length() > 25) {
            enemy.idleTime = 4;
            enemy.switchState(new IdleState());
            return;
        }
    }
}