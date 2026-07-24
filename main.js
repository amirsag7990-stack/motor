// main.js — bootstraps Phaser + the Engine, then composes the game by
// registering systems (core services) and plugins (game content).
//
// TO ADD A NEW FEATURE: write a new file in src/plugins/, then add one
// line here: engine.use(YourPlugin). That's the whole "linking" workflow.
import { Engine } from './core/Engine.js';
import { AssetManager, setupImageUploadUI } from './core/AssetManager.js';
import { SaveManager } from './core/SaveManager.js';
import { EntityManager } from './systems/EntityManager.js';
import { TileMapSystem } from './systems/TileMapSystem.js';
import { InputSystem } from './systems/InputSystem.js';
import { PlayerController } from './systems/PlayerController.js';
import { FarmingPlugin } from './plugins/FarmingPlugin.js';
import { DialoguePlugin } from './plugins/DialoguePlugin.js';

class MainScene extends Phaser.Scene {
    constructor() { super('MainScene'); }

    preload() {
        // If you have a real Tiled map, uncomment and point to your files:
        // this.tilemapSystem = new TileMapSystem();
        // this.tilemapSystem.preload(this, 'farm', 'assets/maps/farm.json', {
        //     'tileset_name_in_tiled': { key: 'tileset_img', imageUrl: 'assets/tilesets/farm.png' }
        // });
    }

    create() {
        const engine = new Engine(this);
        window.ENGINE = engine; // handy for debugging in the browser console

        // --- Core systems (order matters: input/entities/tilemap first) ---
        engine.registerSystem('entities', new EntityManager());
        engine.registerSystem('input', new InputSystem());
        engine.registerSystem('tilemap', new TileMapSystem());
        engine.registerSystem('assets', new AssetManager());
        engine.registerSystem('save', new SaveManager());

        // If a real map was preloaded above, build it now:
        // engine.getSystem('tilemap').build(this, 'farm',
        //     { 'tileset_name_in_tiled': { key: 'tileset_img' } },
        //     { collisionLayerName: 'Collision' });

        // --- Player ---
        engine.registerSystem('player', new PlayerController(400, 300));

        // --- Game content plugins: comment/uncomment or add your own ---
        engine.use(FarmingPlugin);
        engine.use(DialoguePlugin);

        // --- Optional: wire an "upload image" button if one exists in the page ---
        setupImageUploadUI(engine, document.getElementById('uploadBtn'));

        // --- Example: sample dialogue on start ---
        engine.bus.on('farming:tilled', ({ tx, ty }) => console.log('tilled', tx, ty));

        this.engine = engine;
    }

    update(time, delta) {
        this.engine?.update(time, delta);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 960,
    height: 600,
    backgroundColor: '#2b2b2b',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [MainScene],
};

new Phaser.Game(config);
