# Labyrinth

A 3D dungeon crawler built with **Three.js**. Escape the maze, defeat enemies, and claim your freedom by slaying the Minotaur.

## Project Overview

Labyrinth is a procedurally generated maze-crawling game inspired by Greek mythology. You play as a condemned soul navigating Daedalus' Labyrinth, fending off enemies and collecting resources. Your ultimate goal is to reach the heart of the maze and defeat the Minotaur.

## How to Run the Game

### Requirements
- A modern web browser

### Steps to Run
```bash
git clone https://github.com/Ian-Mac-G/Labyrinth.git
cd Labyrinth
npx vite
```
Then visit the provided `localhost` URL in your browser (usually `http://localhost:3000`).

## Controls

| Key | Action |
|-----|--------|
| `W` `A` `S` `D` | Move the player |
| `Space` | Fire an arrow |
| `~` (Tilde) | Toggle Debug Mode |
| Mouse | Rotate the camera |

## Topics Implemented

| Category | Description |
|----------|-------------|
| **Complex Movement Algorithms (Path Following & Collision Avoidance)** | Enemies navigate the maze and avoid walls while wondering or evading/chasing the player. 
| **Decision Making (State Machines)** | Enemies switch between idle, chase, and attack states. The boss also switches between wander, charge and idle states. The player also changes states between idle and moving (also used less defined states to monitor invisibility frames and shield power-up). |
| **Pathfinding (HPA\*)** | Enemies use Hierarchical A* to navigate the maze toward the player. |
| **Procedural Generation** | Mazes are created using a braided DFS algorithm, ensuring new paths each level. |
| **Other (LCG)** | Items like arrows, potions, and shields are limited and randomly placed across each level. |

## How to View Each Topic

- **Complex Movement Algorithms**: Observe enemies as they dynamically navigate the maze and avoid walls, particularly during chase or evade states.
- **Decision Making (State Machines)**:
  - Enemies: Begin idle, switch to chase when spotting the player if not in power-up mode. If the player is powered-up they will evade instead.
  - Minotaur: Displays custom behavior like charging, idling, and wandering.
  - Player: Switches between idle and moving states, special conditions handle shield activation and invincibility frames.
- **Pathfinding (HPA\*)**: Enemies will find and follow optimal paths toward the player when in chase state. Watch how they choose turns "intelligently" to get to you.
- **Procedural Generation**: Each level features a unique maze generated using a braided DFS algorithm. You can notice different corridor layouts, dead ends, loops, as well as exists (entrances are the same as they align with the ext of the prior level).
- **Other (LCG)**: Item locations such as potions, arrows, and shields change each level thanks to a Linear Congruential Generator, which offers controlled randomness.

## Notes
- Debug mode (`~`) allows for easy game testing as the player takes no damage, can no-clip through walls, and has unlimited ammo.
- The final version includes a win screen, HUD for health/items/level, and an exposition intro for narrative.
