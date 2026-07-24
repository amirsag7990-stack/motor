// EventBus.js — decoupled communication between systems/plugins.
// Any part of the engine can emit/listen without knowing about each other.
export class EventBus {
    constructor() {
        this.listeners = new Map(); // eventName -> Set<callback>
    }

    on(eventName, callback) {
        if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
        this.listeners.get(eventName).add(callback);
        return () => this.off(eventName, callback); // returns unsubscribe fn
    }

    off(eventName, callback) {
        this.listeners.get(eventName)?.delete(callback);
    }

    emit(eventName, payload) {
        this.listeners.get(eventName)?.forEach(cb => {
            try { cb(payload); }
            catch (err) { console.error(`[EventBus] listener error on "${eventName}":`, err); }
        });
    }

    once(eventName, callback) {
        const off = this.on(eventName, (payload) => { off(); callback(payload); });
        return off;
    }
}
