// FarmingPlugin.js — EXAMPLE of a self-contained content plugin.
// This is the pattern for "هر قسمتی بخوام بتونم لینک کنم": copy this file,
// change the logic, register it with engine.use(YourPlugin) in main.js.
//
// This plugin listens for the player's action button near dirt tiles and
// tills them, then (after a delay) "grows" a crop.
export function FarmingPlugin(engine) {
    const plugin = {
        name: 'farming',
        crops: new Map(), // tileKey "tx,ty" -> { plantedAt, stage }

        init(engine) {
            this.engine = engine;
            this.tilemap = engine.getSystem('tilemap');

            engine.bus.on('player:action', ({ x, y }) => this.onAction(x, y));
        },

        onAction(playerX, playerY) {
            if (!this.tilemap.map) return;
            const { tx, ty } = this.tilemap.worldToTile(playerX, playerY);
            const key = `${tx},${ty}`;
            const groundLayer = this.tilemap.getLayer('Ground');
            if (!groundLayer) return;

            const tile = groundLayer.getTileAt(tx, ty);
            if (!tile) return;

            // Convention: tile index 1 = dirt (tillable), 2 = tilled soil.
            // Replace with your own tileset indices / properties.
            if (tile.index === 1) {
                groundLayer.putTileAt(2, tx, ty);
                this.engine.bus.emit('farming:tilled', { tx, ty });
            } else if (tile.index === 2 && !this.crops.has(key)) {
                this.plant(tx, ty, key);
            }
        },

        plant(tx, ty, key) {
            this.crops.set(key, { plantedAt: Date.now(), stage: 0 });
            this.engine.bus.emit('farming:planted', { tx, ty });
        },

        update(dt) {
            const GROW_TIME_MS = 5000; // demo: 5s per stage, tune per crop type
            for (const [key, crop] of this.crops) {
                const elapsed = Date.now() - crop.plantedAt;
                const newStage = Math.min(3, Math.floor(elapsed / GROW_TIME_MS));
                if (newStage !== crop.stage) {
                    crop.stage = newStage;
                    const [tx, ty] = key.split(',').map(Number);
                    this.engine.bus.emit('farming:grew', { tx, ty, stage: newStage });
                }
            }
        },
    };
    return plugin;
}
