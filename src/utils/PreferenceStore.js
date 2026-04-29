"use strict";

/**
 * Persists user preferences to localStorage.
 * Each instance is scoped to a key (e.g. "cashflow.filters", "draft.{id}.stats.groupByPeriod").
 *
 * Usage:
 *   const store = new PreferenceStore("cashflow.filters", { sortField: "date" });
 *   store.getMap()     // returns saved values merged with defaults — safe against schema changes
 *   store.get()        // returns saved value as-is, or defaults (for strings, arrays, primitives)
 *   store.set(value)   // saves to localStorage
 *   store.clear()      // removes from localStorage
 */
export default class PreferenceStore {
    constructor(key, defaults) {
        this.key = key;
        this.defaults = defaults;
    }

    /** Returns parsed value or defaults. Use for strings, arrays, primitives. */
    get() {
        try {
            const saved = localStorage.getItem(this.key);
            return saved ? JSON.parse(saved) : this.defaults;
        } catch {
            return this.defaults;
        }
    }

    /** Returns saved values merged with defaults. Use for plain objects — safe against schema changes. */
    getMap() {
        try {
            const saved = localStorage.getItem(this.key);
            if (!saved) return this.defaults;
            return { ...this.defaults, ...JSON.parse(saved) };
        } catch {
            return this.defaults;
        }
    }

    /** Saves value to localStorage. Works for any JSON-serializable type. */
    set(value) {
        try {
            localStorage.setItem(this.key, JSON.stringify(value));
        } catch {}
    }

    /** Removes the key from localStorage. */
    clear() {
        localStorage.removeItem(this.key);
    }
}
