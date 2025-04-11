import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameMap } from './World/GameMap.js';
import { Player } from './Behaviour/Player.js';
import { Controller } from './Behaviour/Controller.js';
import { Enemy } from './Behaviour/Enemy.js';
import { Minotaur } from './Behaviour/Minotaur.js';
import { Resources } from './Util/Resources.js';
import { Item } from './World/Item.js';
import { MathUtil } from './Util/MathUtil.js';


// Create Scene
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(window.innerWidth / - 9.25, window.innerWidth / 9.25, window.innerHeight / 9.25, window.innerHeight / - 9.25, 1, 1000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

// Declare our GameMap
let gameMap;

// Default game variables
const totalRooms = 2;
const defaultEnemies = 5;
let bossRoom = false;
const expoDelay = 15000;
const bossHealthDefault = 10;

// A clock for obtaining change in time
const clock = new THREE.Clock();

// Create controller
const controller = new Controller(document, camera);


// Load in our resources
let files = [{ name: "adventurer", url: "/models/adventurer_boy_flat.glb" },
{ name: "arrow", url: "/models/Arrow.glb" },
{ name: "enemy1", url: "/models/Ghost.glb" },
{ name: "minoatur", url: "/models/Minotaur.glb" },
{ name: "chest", url: "/models/Chest.glb" },
{ name: "key", url: "/models/Key.glb" },
{ name: "shield", url: "/models/Shield.glb" },
{ name: "potion", url: "/models/Potion.glb" }
];
const resources = new Resources(files);
await resources.loadAll();


// Create player
let player = new Player(totalRooms);
player.setModel(resources.get("adventurer"), 1.25);


// Create list of items
function createItems() {
  let itemList = [];
  // Add 10 arrows
  for (let i = 0; i < 10; i++) {
    itemList.push(new Item(Item.Type.Arrow, resources));
  }
  // Add 3 potions
  for (let i = 0; i < 3; i++) {
    itemList.push(new Item(Item.Type.Potion, resources));
  }
  // Add 3 shields
  for (let i = 0; i < 3; i++) {
    itemList.push(new Item(Item.Type.Shield, resources));
  }

  return itemList;
}
let items = createItems();


// Set locations of items
function setItemsLocations() {
  items.forEach(i => {
    let location = new THREE.Vector3();
    let node;
    if (i.type === Item.Type.Arrow || i.type === Item.Type.Potion || i.type === Item.Type.Shield) {
      // Get random node to spawn items in, that is not the entrance or exit
      do {
        let col = MathUtil.getRandomInt(gameMap.mapGraph.cols);
        let row = MathUtil.getRandomInt(gameMap.mapGraph.rows);
        node = gameMap.mapGraph.getAt(col, row);
      } while (node === gameMap.mapGraph.entrance || node === gameMap.mapGraph.exit);
      location = gameMap.localize(node);
      // Set y location based on item type
      if (i.type === Item.Type.Potion) {
        location.y = 12;
      }
      if (i.type === Item.Type.Arrow) {
        location.y = 7.5;
      }
      if (i.type === Item.Type.Shield) {
        location.y = 12.5;
      }
      i.setLocation(location);
    }
    // Special Cases for chest and key
    else if (i.type === Item.Type.Chest) {
      location = new THREE.Vector3(0, 12.5, 0);
      i.setLocation(location);
    }
    else if (i.type === Item.Type.Key) {
      location = new THREE.Vector3(0, 10, 0);
      i.setLocation(location);
    }
  });
}


// Create a list of enemies
function createEnemies(numOfEnemies = 5) {
  let enemyList = [];

  // Add enemies to random node, that is not the entrance, exit and not too close to the player
  for (let i = 0; i < numOfEnemies; i++) {
    const enemy = new Enemy();
    let node;

    do {
      let col = MathUtil.getRandomInt(gameMap.mapGraph.cols);
      let row = MathUtil.getRandomInt(gameMap.mapGraph.rows);
      node = gameMap.mapGraph.getAt(col, row);
    } while (node === gameMap.mapGraph.entrance || node === gameMap.mapGraph.exit ||
      gameMap.hierarchicalGraph.hpastar(node, gameMap.mapGraph.entrance).length < 10);

    enemy.location = gameMap.localize(node);
    enemy.location.y = 7.5;

    // set enemy healkth from 1-3
    enemy.health = MathUtil.getRandomInt(3) + 1;
    enemyList.push(enemy);
  }
  enemyList.forEach(a => {
    const model = resources.get("enemy1").clone();

    // Change enemy color to match health
    model.traverse(child => {
      if (child.isMesh) {
        if (a.health === 1) {
          child.material.color.set(0x00ff00);
        }
        else if (a.health === 2) {
          child.material.color.set(0xffff00);
        }
        else if (a.health === 3) {
          child.material.color.set(0xff0000);
        }
        else {
          child.material.color.set(0x0000ff);
          console.log("Error: Enemy health not set correctly!");
        }
        child.material = child.material.clone();

        const randomColor = Math.random() * 0xffffff;
        child.material.color.set(randomColor);
      }
    });
    a.gameObject.scale.set(5, 1.5, 3);
    a.location.y = 7.5;
    a.topSpeed = 15;
    a.setModel(model, 1.25);
    scene.add(a.gameObject);
  })
  return enemyList;
}
let enemies = [];


// Update display
function updateHUD(player) {
  const healthText = document.getElementById("health-text");
  const arrowsText = document.getElementById("arrows-text");
  const shieldText = document.getElementById("shield-text");
  const pointsDisplay = document.getElementById("points-display");
  const levelIndicator = document.getElementById("level-display");

  // Update health
  if (healthText) {
    healthText.textContent = `Health: ${player.health}`;
  }

  // Update arrows count
  if (arrowsText) {
    const max = player.ammo >= 5 ? " (max)" : "";
    arrowsText.textContent = `Arrows: ${player.ammo}${max}`;
  }

  // Update points
  if (pointsDisplay) {
    pointsDisplay.textContent = `Points: ${player.points}`;
  }

  // Update shield timer
  if (shieldText) {
    if (player.powerUp) {
      shieldText.style.display = "block";
      shieldText.textContent = `Shield: ${Math.ceil(player.remainingInvTime)}s`;
    } else {
      shieldText.style.display = "none";
    }
  }

  // Update the level indicator
  if (levelIndicator) {
    let circles = "";
    let completedRooms = player.roomsCleared;
    if (player.roomsCleared > totalRooms - 1) {
      completedRooms = totalRooms;
    }
    for (let i = 0; i < completedRooms; i++) {
      circles += "🟡";
    }
    for (let i = completedRooms; i < totalRooms - 1; i++) {
      circles += "⚫";
    }
    circles += "💀";
    levelIndicator.textContent = circles;
  }
}

function bossHUD(player, boss) {
  // Update the boss health bar
  const bossHealthBar = document.getElementById("boss-health-bar");
  bossHealthBar.style.display = "block";

  if (bossHealthBar) {
    let bossHealth = boss.health;
    let bossHealthCount = "";
    for (let i = 0; i < bossHealth; i++) {
      bossHealthCount += "❤";
    }
    for (let i = bossHealth; i < bossHealthDefault; i++) {
      bossHealthCount += "🖤";
    }
    bossHealthBar.textContent = bossHealthCount;
  }
}


// Setup our scene
function init() {
  const titleScreen = document.getElementById("title-screen");
  const playButton = document.getElementById("play-button");
  const expoScreen = document.getElementById("exposition-screen");
  const startButton = document.getElementById("skip-button");
  const overlay = document.getElementById("overlay");

  // Initial state
  titleScreen.style.display = "flex";
  expoScreen.style.display = "none";
  overlay.style.display = "none";

  // Move from title screen to exposition screen
  playButton.onclick = () => {
    titleScreen.style.display = "none";
    expoScreen.style.display = "flex";
    expoScreen.style.opacity = "1";
  };

  // start button behavior (immediately start game)
  startButton.onclick = () => {
    expoScreen.style.transition = "opacity 1s ease-in-out";
    expoScreen.style.opacity = "0";
    setTimeout(() => {
      expoScreen.style.display = "none";
      overlay.style.display = "flex";
      overlay.style.opacity = "1";
      startGame();
    }, 1000);
  };
}


// Setup and start the game
function startGame() {
  scene.background = new THREE.Color(0x808080);

  // Camera
  camera.position.y = 100;
  camera.position.z = 37.5;
  camera.lookAt(0, 0, 0);
  scene.add(camera);
  camera.position.z = 32.5;

  // Renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create Light
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 3);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  let directionalLight = new THREE.DirectionalLight(0xffffff, 10);
  directionalLight.position.set(0, 2, 10);
  scene.add(directionalLight);

  // Create our gameMap
  if (!gameMap) {
    gameMap = new GameMap();
    scene.add(gameMap.gameObject);
  }
  // Add player
  player.location = gameMap.localize(gameMap.mapGraph.entrance);
  player.location.y = 7.5;
  player.topSpeed = 20;
  player.shield = new Item(Item.Type.Shield, resources);
  player.shield.setLocation(new THREE.Vector3(0, -10, 0));
  scene.add(player.gameObject);
  scene.add(player.shield.gameObject);

  // Add enemies
  enemies = createEnemies(defaultEnemies);

  // Give arrows their models
  player.arrows.forEach(a => {
    a.setModel(resources.get("arrow"), 0.6);
    a.gameObject.scale.set(5, 1.5, 3);
    a.location = new THREE.Vector3(0, -30, 0);
    a.gameObject.rotation.x = -67.5;
    a.topSpeed = 45;
    scene.add(a.gameObject);
  });

  // Set location of all items and add to scene
  setItemsLocations();
  items.forEach(i => {
    scene.add(i.gameObject);
  });

  // First call to animate
  animate();
}


// animate loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // Loop until game is over
  if (!player.gameOver) {
    let deltaTime = clock.getDelta();
    player.update(deltaTime, gameMap.bounds, gameMap, controller, items, enemies);

    // Check if player has reached level exit
    if (gameMap.quantize(player.location) === gameMap.mapGraph.exit && gameMap.hierarchicalGraph.hpastar(gameMap.quantize(player.location), gameMap.mapGraph.exit).length < 2) {

      // Disable debug mode for position reset
      let debugSet = false;
      if (controller.debug) {
        debugSet = true;
        controller.debug = false;
      }

      // Remove enemies from scene
      enemies.forEach(enemy => {
        scene.remove(enemy.gameObject);
      });

      // Check if player is ready to fight boss
      if (totalRooms - 1 === player.roomsCleared) {
        bossRoom = true;

        // Generate boss maze level
        let oldMap = gameMap.generateBossRoom();
        scene.remove(oldMap);
        scene.add(gameMap.gameObject);

        // Add boss to scene
        const boss = new Minotaur(bossHealthDefault);
        boss.location = new THREE.Vector3(0, 7.5, 0);
        boss.topSpeed = 10;
        const model = resources.get("minoatur").clone();
        boss.setModel(model, 7.5);
        boss.gameObject.rotation.y = -Math.PI;
        scene.add(boss.gameObject);
        enemies = [boss];

        // Add chest and extra arrows to scene
        items.push(new Item(Item.Type.Chest, resources));
        for (let i = 0; i < 10; i++) {
          let newArrow = new Item(Item.Type.Arrow, resources)
          items.push(newArrow);
          scene.add(newArrow.gameObject);
        }
        scene.add(items[items.length - 1].gameObject);
      }
      else {

        // Generate next maze level
        let oldMap = gameMap.regenerateLevel();
        scene.remove(oldMap);
        scene.add(gameMap.gameObject);

        // Add new enemies to scene        
        enemies = createEnemies(4 + 2 * (player.roomsCleared));
      }

      // Add points for clearing level
      player.roomsCleared++;
      player.points += 1000;

      // Remove misfired arrows from scene
      player.arrows.forEach(a => {
        if (a.isActive) {
          scene.remove(a.gameObject);
          a.isActive = false;
          a.velocity.set(0, 0, 0);
          a.location.set(0, -30, 0);
          scene.add(a.gameObject);
        }
      });

      // Make players location the entrance to new room
      player.location = gameMap.localize(gameMap.mapGraph.entrance);
      player.location.y = 7.5;
      player.topSpeed = 20;

      // Replace items in new maze level
      setItemsLocations();

      // Enable debug mode for new room if Set
      if (debugSet) {
        controller.debug = true;
      }
    }

    // Update enemys
    enemies.forEach(enemy => {
      enemy.update(deltaTime, gameMap.bounds, gameMap, player);
      // Update boss health bar
      if (bossRoom) {
        bossHUD(player, enemy);
      }
      if (enemy.health <= 0) {
        scene.remove(enemy.gameObject);

        // Check if defeated boss
        if (bossRoom) {
          const alreadyHasKey = items.some(item => item.type === Item.Type.Key);

          // Spawn in the key if not already spawned
          if (!alreadyHasKey) {
            const key = new Item(Item.Type.Key, resources);
            key.setLocation(new THREE.Vector3(enemy.location.x, 10, enemy.location.z));
            items.push(key);
            scene.add(key.gameObject);
            console.log("Boss defeated — Key spawned!");
          }
        }
        return;
      }
    });

    // Update overlay
    updateHUD(player);

  }
  else if (player.gameOver) {
    // Remove player and objects from scene
    scene.remove(player.gameObject);
    enemies.forEach(enemy => scene.remove(enemy.gameObject));
    player.arrows.forEach(a => scene.remove(a.gameObject));

    // Show the Game Over screen
    player.points += player.won ? 5000 : 0;
    const gameOverScreen = player.won ? document.getElementById("game-won-screen") : document.getElementById("game-over-screen");
    const finalScore = player.won ? document.getElementById("final-score-win") : document.getElementById("final-score-loss");
    if (gameOverScreen.style.opacity !== "1") {
      finalScore.textContent = `Score: ${player.points}`;
      gameOverScreen.style.opacity = "1";
    }
  };
}

init();
