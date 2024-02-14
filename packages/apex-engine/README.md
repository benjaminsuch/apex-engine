# `apex-engine`

> The engine is very much in alpha stage and is actively being worked on. Features and API's can change drastically or even be removed. In it's current stage I would not recommend using it in production.

The Apex Engine is a multiplatform game engine that allows you to create 3D games with TypeScript. It's focus is on lowering (or removing) the entry barrier for web developers who want to get into game development.

### Features
- **Cross-Platform**
    - Compile your game for the browser, desktop or NodeJS
- **Multithreading**
    - Renderer and Physics run in their own thread
- **Actor-Component Framework**
    - Objects in your world are represented as actors and come with a wide-rand of functionality
    - Use components to enhance the actor's capabilities and reduce redundancy
- **Multiplayer support**
    - planned
- **Audio**
    - planned
- **AI**
    - planned
- **Physics**
    - Uses [Rapier](https://rapier.rs/docs/) physics engine
    - Neatly integrated into our components, enabled by default

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