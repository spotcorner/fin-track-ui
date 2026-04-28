"use strict";

/**
 * Persists user preferences to localStorage.
 * Each instance is scoped to a key (e.g. "cashflow", "draft.{id}").
 * Saved values are merged with defaults on get() — safe against schema changes.
 *
 * Usage:
 *   const store = new PreferenceStore("cashflow", { sortField: "date", sortDirection: "desc" });
 *   store.get()        // returns saved values merged with defaults
 *   store.set(value)   // saves to localStorage
 *   store.clear()      // removes from localStorage
 */
export default class PreferenceStore {
    constructor(key, defaults) {
        this.key = key;
        this.defaults = defaults;
    }

    get() {
        try {
            const saved = localStorage.getItem(this.key);
            if (!saved) return this.defaults;
            return { ...this.defaults, ...JSON.parse(saved) };
        } catch {
            return this.defaults;
        }
    }

    set(value) {
        try {
            localStorage.setItem(this.key, JSON.stringify(value));
        } catch {}
    }

    clear() {
        localStorage.removeItem(this.key);
    }
}
