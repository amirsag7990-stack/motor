// SaveManager.js — versioned save/load so future engine updates don't
// silently corrupt old saves.
const SAVE_VERSION = 1;
const STORAGE_PREFIX = 'game_save_';

export class SaveManager {
    init(engine) {
        this.engine = engine;
    }

    save(slot, extraData = {}) {
        const payload = {
            version: SAVE_VERSION,
            savedAt: Date.now(),
            engineData: Object.fromEntries(this.engine.data),
            ...extraData,
        };
        try {
            localStorage.setItem(STORAGE_PREFIX + slot, JSON.stringify(payload));
            this.engine.bus.emit('save:complete', { slot });
            return true;
        } catch (err) {
            console.error('[SaveManager] save failed:', err);
            this.engine.bus.emit('save:error', { slot, err });
            return false;
        }
    }

    load(slot) {
        const raw = localStorage.getItem(STORAGE_PREFIX + slot);
        if (!raw) return null;
        try {
            const payload = JSON.parse(raw);
            if (payload.version !== SAVE_VERSION) {
                console.warn(`[SaveManager] save slot "${slot}" is an older version (${payload.version}), attempting best-effort load`);
            }
            for (const [k, v] of Object.entries(payload.engineData ?? {})) this.engine.set(k, v);
            this.engine.bus.emit('save:loaded', { slot, payload });
            return payload;
        } catch (err) {
            console.error('[SaveManager] load failed (corrupt save?):', err);
            return null;
        }
    }

    listSlots() {
        const slots = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith(STORAGE_PREFIX)) slots.push(k.slice(STORAGE_PREFIX.length));
        }
        return slots;
    }

    delete(slot) {
        localStorage.removeItem(STORAGE_PREFIX + slot);
    }
}
