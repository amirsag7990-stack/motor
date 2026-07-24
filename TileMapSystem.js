// TileMapSystem.js — loads maps made in the free Tiled editor (mapeditor.org)
// as JSON, so level design doesn't require touching code at all.
export class TileMapSystem {
    constructor() {
        this.map = null;
        this.layers = {};
        this.collisionLayer = null;
    }

    init(engine) { this.engine = engine; }

    /**
     * Call from a Phaser preload() before the scene starts, OR load
     * dynamically at runtime (e.g. when linking a new game area).
     * @param {string} key - unique map key
     * @param {string} tiledJsonUrl - path/URL to the Tiled-exported JSON
     * @param {Object} tilesets - { tiledName: {key, imageUrl} } mapping
     */
    preload(scene, key, tiledJsonUrl, tilesets) {
        scene.load.tilemapTiledJSON(key, tiledJsonUrl);
        for (const [, ts] of Object.entries(tilesets)) {
            scene.load.image(ts.key, ts.imageUrl);
        }
    }

    build(scene, key, tilesets, options = {}) {
        this.map = scene.make.tilemap({ key });
        const tilesetObjs = Object.entries(tilesets).map(([tiledName, ts]) =>
            this.map.addTilesetImage(tiledName, ts.key)
        );

        this.layers = {};
        this.map.layers.forEach((layerData) => {
            const layer = this.map.createLayer(layerData.name, tilesetObjs, 0, 0);
            this.layers[layerData.name] = layer;
            if (options.collisionLayerName === layerData.name) {
                layer.setCollisionByProperty({ collides: true });
                this.collisionLayer = layer;
            }
        });

        this.engine.bus.emit('map:built', { key, map: this.map });
        return this.map;
    }

    /** Register collision between the collision layer and a physics-enabled sprite */
    addColliderFor(scene, sprite) {
        if (this.collisionLayer) scene.physics.add.collider(sprite, this.collisionLayer);
    }

    getLayer(name) { return this.layers[name] ?? null; }

    worldToTile(x, y) {
        return { tx: Math.floor(x / this.map.tileWidth), ty: Math.floor(y / this.map.tileHeight) };
    }
}
