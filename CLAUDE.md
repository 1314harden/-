# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a tower defense game called "Starfall Defense" (星际防线) - a web-based game built with HTML5 Canvas and vanilla JavaScript. The game features multiple tower types, enemy waves, resource management, and real-time combat mechanics.

## Project Structure

- `index.html` - Main entry point, contains game canvas and UI structure
- `css/style.css` - Game styling and responsive layout
- `js/main.js` - Game entry point and initialization
- `js/game.js` - Core Game class managing game state and main loop
- `js/map.js` - GameMap class for level layout and pathfinding
- `js/tower.js` - Tower classes with different attack types
- `js/enemy.js` - Enemy classes with varying attributes
- `js/projectile.js` - Projectile physics and collision
- `js/wave.js` - WaveManager for enemy spawning patterns
- `js/ui.js` - UI management including menus and controls
- `js/utils.js` - Utility functions for math, colors, and helpers

## Architecture

The game follows an entity-component style architecture:

1. **Game Loop**: Managed by `Game.gameLoop()` using requestAnimationFrame for smooth 60fps updates
2. **Entity Management**: Arrays track active towers, enemies, projectiles, and particles
3. **State Machine**: GameState enum controls menu/playing/paused states
4. **Event-Driven Input**: Mouse/keyboard events handled through centralized input system

Key constants are defined in individual files (e.g., `CANVAS_WIDTH`, `CANVAS_HEIGHT` in game.js). Game objects communicate through the Game instance rather than direct references.

## Development Commands

### Local Development
- Open `index.html` directly in a browser or use a local HTTP server:
  ```bash
  # Python 3
  python -m http.server 8000
  # or with Node.js
  npx serve .
  ```
- Access at `http://localhost:8000`

### Testing
- The game includes console logging for debugging (`console.log` statements throughout)
- No formal test framework; test by playing the game and checking browser console

### GitHub Pages Deployment
- Repository is configured for GitHub Pages deployment
- Main branch deploys to `https://1314harden.github.io/-/`
- `.nojekyll` file is present to disable Jekyll processing
- After pushing changes, GitHub Pages automatically rebuilds (may take 1-2 minutes)

### Building & Optimization
- No build step required - pure HTML/CSS/JS
- All assets are inline or local files
- For production: consider minifying JS/CSS and optimizing images (though none currently)

## Key Constants & Configuration

- Canvas size: 800x600 pixels (defined in game.js)
- Game tick rate: 60fps via requestAnimationFrame
- Resource system: Gold for towers, Lives for health
- Wave system: 20 waves with increasing difficulty
- Tower types: Guardian (basic), Photon (laser), Cryo (slow), Rocket (AoE), Shield (support)

## File Conventions

- Chinese comments used throughout for documentation
- Game objects use ES6 classes with clear separation of concerns
- Constants use UPPER_SNAKE_CASE
- Methods use camelCase
- Event handlers prefixed with "handle" (e.g., `handleClick`, `handleKeyPress`)

## Git & Deployment

- Main branch: `main`
- Remote: `git@github.com:1314harden/-.git`
- GitHub Pages enabled for root directory deployment
- Commit messages in English for technical consistency, Chinese comments in code