# Apex Engine

> [!IMPORTANT]  
> The engine is very much in alpha stage and is actively being worked on. Features and API's can change drastically or even be removed. In it's current stage I would not recommend using it in production.

The Apex Engine is a multiplatform game engine that allows you to create 3D games with TypeScript. It's focus is on lowering (or removing) the entry barrier for web developers who want to get into game development.

### Features
- **Cross-Platform**
    - Compile your game for the browser, desktop or NodeJS
- **Multithreading**
    - Renderer and Physics run in separate threads
- **Actor-Component Framework**
    - Objects in your world are represented as actors and come with a wide-rand of functionality
    - Use components to enhance the actor's capabilities and reduce redundancy
- **Multiplayer support**
    - planned
- **Audio**
    - planned
- **AI**
    - in development
- **Physics**
    - Uses [Rapier](https://rapier.rs/docs/) physics engine
    - Neatly integrated into our components, enabled by default

## Preview
<img src="https://private-user-images.githubusercontent.com/706852/324191575-6cfec2ae-6938-400a-99c5-ac10b8b55457.gif?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTM2MzE0MDcsIm5iZiI6MTcxMzYzMTEwNywicGF0aCI6Ii83MDY4NTIvMzI0MTkxNTc1LTZjZmVjMmFlLTY5MzgtNDAwYS05OWM1LWFjMTBiOGI1NTQ1Ny5naWY_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQwNDIwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MDQyMFQxNjM4MjdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0zNDEyYTUyNGU0NDkxMDIyMTBmYjkyNzAzOTQ2NmVmNjE4N2I0NjlhNzc1OTFlMjlkNzU5ZTc3MTMzYmI1YTFlJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZhY3Rvcl9pZD0wJmtleV9pZD0wJnJlcG9faWQ9MCJ9.xW9mWCpsKV0P4H1NyV8_sZozu5X8eqwx-P3NW4_wdt4" />

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

### Building your game

## Development

## Release
