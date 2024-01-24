# README

The Apex Engine is a multiplatform game engine that allows you to create 3D games with TypeScript. It's focus is on lowering (or removing) the entry barrier for web developers who want to get into game development.

### Features
- **Cross-Platform**
    - Compile your game for the browser, desktop or NodeJS.
- **Multithreading**
    - Rendering and physics run in their own thread
    - Provides services to offload work (jobs) to worker
- **Actor-Component Framework**
- **Multiplayer support**
    - Supports the two most commen multiplayer architectures: Dedidicated Server and Player-as-Host.
    - Can be adapted to any transport layer (TCP, UDP)
    - Replication system for synchronizing game state across networked devices.
- **Audio**
    - planned
- **AI**
    - planned
- **Physics**
    - planned

## Get started

### Setup
```bash
# Yarn
$ yarn create apex-game

# or with NPM
$ npm create apex-game@latest
```

Continue by following the prompt messages popping up.

You can also directly specify the project destination as arguments:

```bash
# Yarn
$ yarn create apex-game ~/myprojects/MyCoolGame

# npm
$ npm create apex-game@latest ~/myprojects/MyCoolGame
```

Additionally to the project destination, you can specify various options (see below).

### Building your game

## Development

## Release
