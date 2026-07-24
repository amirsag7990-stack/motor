// Engine.js — the heart of the engine. Everything else "plugs into" this.
//
// Design goal: you should be able to build a huge game by composing many
// small, independent files (systems + plugins) instead of one giant file.
import { EventBus } from './EventBus.js';

export class Engine {
    /**
     * @param {Phaser.Scene} scene - the active Phaser scene (created in main.js)
     */
    constructor(scene) {
        this.scene = scene;
        this.bus = new EventBus();

        this.systems = new Map();   // name -> system instance (core services: input, tilemap, entities...)
        this.plugins = new Map();   // name -> plugin instance (game content: farming, dialogue, quests...)
        this.data = new Map();      // shared key/value state accessible engine-wide

        this._updateOrder = [];     // systems + plugins that implement update(dt)
    }

    // ---- Systems: core engine services (usually one instance, low-level) ----
    registerSystem(name, system) {
        if (this.systems.has(name)) throw new Error(`System "${name}" already registered`);
        this.systems.set(name, system);
        if (typeof system.init === 'function') system.init(this);
        if (typeof system.update === 'function') this._updateOrder.push(system);
        console.log(`[Engine] system registered: ${name}`);
        return system;
    }

    getSystem(name) {
        const s = this.systems.get(name);
        if (!s) throw new Error(`System "${name}" not found — did you register it?`);
        return s;
    }

    // ---- Plugins: game content modules — this is how you "link" a new
    // piece of the game without touching engine core code. ----
    use(pluginFactory, options = {}) {
        const plugin = typeof pluginFactory === 'function' ? pluginFactory(this, options) : pluginFactory;
        const name = plugin.name || pluginFactory.name || `plugin_${this.plugins.size}`;
        if (this.plugins.has(name)) throw new Error(`Plugin "${name}" already registered`);
        this.plugins.set(name, plugin);
        if (typeof plugin.init === 'function') plugin.init(this);
        if (typeof plugin.update === 'function') this._updateOrder.push(plugin);
        console.log(`[Engine] plugin linked: ${name}`);
        return plugin;
    }

    getPlugin(name) {
        return this.plugins.get(name) ?? null;
    }

    // ---- Shared state helpers ----
    set(key, value) { this.data.set(key, value); this.bus.emit(`data:${key}`, value); }
    get(key) { return this.data.get(key); }

    // ---- Called every frame from the Phaser scene's update() ----
    update(time, delta) {
        const dt = delta / 1000; // seconds
        for (const obj of this._updateOrder) obj.update(dt, time);
    }

    destroy() {
        for (const s of this.systems.values()) s.destroy?.();
        for (const p of this.plugins.values()) p.destroy?.();
        this.systems.clear();
        this.plugins.clear();
    }
}
