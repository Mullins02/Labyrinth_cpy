import * as THREE from 'three';
import { VectorUtil } from '../Util/VectorUtil.js';
import { Character } from './Character.js';
import { State } from './State.js';


/**
 * 
 * The Enemy class stores information and
 * behaviour only for enemy characters 
 * 
 */
export class Enemy extends Character {

    constructor(health = 1, color) {
        super(color);
        this.health = health;
        this.maxForce = 50;

        // Start in wander state
        this.state = new WanderState();
        this.state.enterState(this);

        this.detectionDistance = 6;
        this.chaseDistance = 7;
        this.evadeDistance = 6;
        this.playerNode;
        this.currentPath = [];
        this.targetNode;
        this.collisionThreshold = 6;
    }

    switchState(state) {
        this.state = state;
        this.state.enterState(this);
    }

    update(deltaTime, bounds, gameMap, player) {
        this.state.updateState(this, gameMap, player, deltaTime);
        super.update(deltaTime, bounds, gameMap);

        // Check for collisions with arrows
        player.arrows.forEach(arrow => {
            if (arrow.isActive) {
                const distance = this.location.distanceTo(arrow.location);
                if (distance < this.collisionThreshold) {
                    // console.log("Enemy hit by arrow!");
                    this.handleCollisionWithArrow(arrow);
                }
            }
        });
    }

    // Handle collision with an arroww
    handleCollisionWithArrow(arrow) {
        this.health--;
    
        // Remove the arrow from the scene
        arrow.velocity.set(0, 0, 0);
        arrow.location.y = -6;
        arrow.isActive = false;
    }
}

/**
 * 
 * Enemy wander state
 * - Picks a random direction every few frames
 * - Switches to chase or evade if player is nearby
 * 
 */
export class WanderState extends State {

    enterState(enemy) {
        // console.log("WANDERING");
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

            // If player has powerup, switch to evade state
            if (player.powerUp) {
                enemy.switchState(new EvadeState());
                return;
            }

            // If player is unarmed, switch to chase state
            else {
                enemy.switchState(new ChaseState());
                return;
            }
        }

        // If idling
        if (enemy.idle) {
            enemy.idleTime -= deltaTime;

            // If idle time over
            if (enemy.idleTime <= 0) {
                enemy.idle = false;
                enemy.idleTime = Math.random() * 2;
            }
            else {
                return;
            }
        }

        // Wander
        enemy.applyForce(enemy.wander(gameMap));
    }
}

/**
 * 
 * Enemy chase state
 * - Follows shortest path to player using A*
 * 
 */
export class ChaseState extends State {

    enterState(enemy) {
        // console.log("CHASING");

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

        // If player has powerup, switch to evade state
        if (player.powerUp) {
            enemy.switchState(new EvadeState());
            return;
        }

        // If player is out of range, switch to wander state
        else if (distance > enemy.chaseDistance) {
            enemy.switchState(new WanderState());
            return;
        }

        // Chase player
        if (playerNode !== enemy.playerNode) {
            // Only get new path if needed
            enemy.currentPath = gameMap.hierarchicalGraph.hpastar(enemyNode, playerNode);
            enemy.playerNode = playerNode;
            enemy.targetNode = enemy.currentPath.shift();
        }

        if (enemyNode === enemy.targetNode) {
            // Get next node in path
            enemy.targetNode = enemy.currentPath.shift();
        }
        
        if (enemyNode == playerNode) {
            enemy.applyForce(enemy.arrive(player.location, 5));
        }
        else if (enemy.targetNode !== undefined) {
            enemy.applyForce(enemy.seek(gameMap.localize(enemy.targetNode)));
        }
    }
}

/**
 * 
 * Enemy evade state
 * - Runs away from the player if they're 
 * 
 */
export class EvadeState extends State {

    enterState(enemy) {
        // console.log("EVADING");
        enemy.evadeTimer = 0;
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

        // If player runs out of ammo, switch to chase state
        if (player.ammo <= 0) {
            enemy.switchState(new ChaseState());
            return;
        }

        // If player is out of range, switch to wander state
        else if (distance > enemy.evadeDistance) {
            enemy.switchState(new WanderState());
            return;
        }

        // Evade player
        let pathToPlayer = gameMap.hierarchicalGraph.hpastar(enemyNode, playerNode);
        let betterEscapeNode = enemyNode.edges[0].node;
        enemyNode.edges.forEach(e => {
            if (e.node !== pathToPlayer[0] && gameMap.getMazeDistance(e.node, playerNode) > gameMap.getMazeDistance(betterEscapeNode, playerNode)) {
                betterEscapeNode = e.node;
            }
        })
        enemy.applyForce(enemy.seek(gameMap.localize(betterEscapeNode)));
    }
}

/**
 * 
 * Enemy dead state
 * - Removes enemy from scene
 * 
 */
export class DeadState extends State {

    enterState(enemy) {
        // console.log("DEAD!");
        enemy.pointsAwarded = false;
    }

    updateState(enemy, gameMap, player, deltaTime) {
        enemy.location.y = -6;
        if (!enemy.pointsAwarded) {
            player.points += 100;
            enemy.pointsAwarded = true;
        }
    }
}