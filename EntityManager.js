// EntityManager.js — lightweight ECS. Entities are just numeric IDs;
// components are plain objects stored in per-type Maps. This scales fine
// to thousands of entities (crops, NPCs, dropped items, etc.).
export class EntityManager {
    constructor() {
        this._nextId = 1;
        this.components = new Map(); // componentType -> Map<entityId, data>
        this.entityTypes = new Map(); // entityId -> tag string (for debugging/queries)
    }

    init(engine) { this.engine = engine; }

    create(tag = 'entity') {
        const id = this._nextId++;
        this.entityTypes.set(id, tag);
        return id;
    }

    destroy(entityId) {
        for (const store of this.components.values()) store.delete(entityId);
        this.entityTypes.delete(entityId);
        this.engine?.bus.emit('entity:destroyed', { entityId });
    }

    addComponent(entityId, type, data) {
        if (!this.components.has(type)) this.components.set(type, new Map());
        this.components.get(type).set(entityId, data);
        return data;
    }

    getComponent(entityId, type) {
        return this.components.get(type)?.get(entityId) ?? null;
    }

    removeComponent(entityId, type) {
        this.components.get(type)?.delete(entityId);
    }

    has(entityId, type) {
        return this.components.get(type)?.has(entityId) ?? false;
    }

    /**
     * Iterate all entities that have ALL of the given component types.
     * Usage: for (const [id, pos, vel] of entities.query('position', 'velocity')) { ... }
     */
    *query(...types) {
        if (types.length === 0) return;
        const [first, ...rest] = types;
        const firstStore = this.components.get(first);
        if (!firstStore) return;

        for (const [entityId, firstData] of firstStore) {
            const data = [firstData];
            let ok = true;
            for (const t of rest) {
                const store = this.components.get(t);
                const d = store?.get(entityId);
                if (d === undefined) { ok = false; break; }
                data.push(d);
            }
            if (ok) yield [entityId, ...data];
        }
    }
}
