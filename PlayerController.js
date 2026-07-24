// PlayerController.js — a system that owns the player entity, its physics
// sprite, and translates input into movement. Kept separate from the
// generic movement so game-specific rules (speed, animations) live here.
export class PlayerController {
    constructor(spawnX, spawnY, textureKey = 'player_placeholder') {
        this.spawnX = spawnX;
        this.spawnY = spawnY;
        this.textureKey = textureKey;
        this.speed = 180; // px/sec
    }

    init(engine) {
        this.engine = engine;
        const scene = engine.scene;

        // Fallback placeholder texture if no real sprite sheet is loaded yet,
        // so the game is always playable even before art is added.
        if (!scene.textures.exists(this.textureKey)) {
            const g = scene.add.graphics();
            g.fillStyle(0xE6C85A, 1).fillRect(0, 0, 24, 32);
            g.generateTexture(this.textureKey, 24, 32);
            g.destroy();
        }

        this.sprite = scene.physics.add.sprite(this.spawnX, this.spawnY, this.textureKey);
        this.sprite.setCollideWorldBounds(true);

        const tilemapSystem = engine.systems.get('tilemap');
        tilemapSystem?.addColliderFor(scene, this.sprite);

        this.entityId = engine.getSystem('entities').create('player');
        engine.getSystem('entities').addComponent(this.entityId, 'transform', this.sprite);

        scene.cameras.main.startFollow(this.sprite, true, 0.15, 0.15);
        engine.set('player', { entityId: this.entityId, sprite: this.sprite });
    }

    update(dt) {
        const input = this.engine.getSystem('input');
        input.update();

        let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
        const len = Math.hypot(dx, dy);
        if (len > 0) { dx /= len; dy /= len; }

        this.sprite.setVelocity(dx * this.speed, dy * this.speed);

        if (input.consumeActionPress()) {
            this.engine.bus.emit('player:action', {
                x: this.sprite.x, y: this.sprite.y,
                facing: { dx, dy },
            });
        }
    }
}
