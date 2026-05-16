"use strict";

/**
 * Persists user preferences to localStorage.
 * Each instance is scoped to a key (e.g. "moneyflow.filters.collapsed", "draft.stats.groupByPeriod").
 *
 * Usage:
 *   const store = new PreferenceStore("moneyflow.filters.collapsed", false);
 *   store.getMap()     // returns saved values merged with defaults — safe against schema changes
 *   store.get()        // returns saved value as-is, or defaults (for strings, arrays, primitives)
 *   store.set(value)   // saves to localStorage
 *   store.clear()      // removes from localStorage
 *
 * Static:
 *   PreferenceStore.getStored()  // returns all stored preferences matching the registry
 *   PreferenceStore.clearAll()   // removes all stored preferences
 */

const REGISTRY = [
    { key: "moneyflow.filters.collapsed", label: "Filters Collapsed", icon: "bi-funnel", group: "Moneyflow", subgroup: "Filters" },
    { key: "moneyflow.filters.sticky", label: "Filters Sticky", icon: "bi-pin", group: "Moneyflow", subgroup: "Filters" },
    { key: "moneyflow.filters.showChips", label: "Filters Show Chips", icon: "bi-tags", group: "Moneyflow", subgroup: "Filters" },
    { key: "moneyflow.stats.visibleCharts", label: "Visible Charts", icon: "bi-bar-chart", group: "Moneyflow", subgroup: "Stats" },
    { key: "moneyflow.stats.groupByPeriod", label: "Trends — Group By Period", icon: "bi-calendar", group: "Moneyflow", subgroup: "Stats" },
    { key: "moneyflow.stats.sort.tags", label: "Amount by Tags — Sort", icon: "bi-sort-down", group: "Moneyflow", subgroup: "Stats" },
    { key: "moneyflow.transactionSort", label: "Transaction Sort", icon: "bi-sort-down", group: "Moneyflow", subgroup: "Transactions" },
    { key: "drafts.selection", label: "Selected Draft", icon: "bi-file-text", group: "Drafts" },
    { key: "draft.filters.collapsed", label: "Filters Collapsed", icon: "bi-funnel", group: "Drafts", subgroup: "Filters" },
    { key: "draft.filters.sticky", label: "Filters Sticky", icon: "bi-pin", group: "Drafts", subgroup: "Filters" },
    { key: "draft.filters.showChips", label: "Filters Show Chips", icon: "bi-tags", group: "Drafts", subgroup: "Filters" },
    { key: "draft.stats.visibleCharts", label: "Visible Charts", icon: "bi-bar-chart", group: "Drafts", subgroup: "Stats" },
    { key: "draft.stats.groupByPeriod", label: "Trends — Group By Period", icon: "bi-calendar", group: "Drafts", subgroup: "Stats" },
    { key: "draft.stats.sort.tags", label: "Amount by Tags — Sort", icon: "bi-sort-down", group: "Drafts", subgroup: "Stats" },
    { key: "draft.transactionSort", label: "Transaction Sort", icon: "bi-sort-down", group: "Drafts", subgroup: "Transactions" },
    { key: "accounts.sort", label: "Sort", icon: "bi-sort-down", group: "Accounts" },
    { key: "tags.sort", label: "Sort", icon: "bi-sort-down", group: "Tags" },
];

const DISABLED_KEY = "preferences.disabled";

function getDisabledKeys() {
    try { return JSON.parse(localStorage.getItem(DISABLED_KEY)) || []; }
    catch { return []; }
}

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

    /** Saves value to localStorage. Skipped if key is disabled. */
    set(value) {
        try {
            if (getDisabledKeys().includes(this.key)) return;
            localStorage.setItem(this.key, JSON.stringify(value));
        } catch {}
    }

    /** Removes the key from localStorage. */
    clear() {
        localStorage.removeItem(this.key);
    }

    /** Returns the full registry with stored values and enabled status. */
    static getRegistry() {
        const disabled = getDisabledKeys();
        return REGISTRY.map(entry => ({
            ...entry,
            value: (() => { try { const s = localStorage.getItem(entry.key); return s ? JSON.parse(s) : null; } catch { return null; } })(),
            stored: localStorage.getItem(entry.key) !== null,
            enabled: !disabled.includes(entry.key),
        }));
    }

    /** Returns all stored preferences matching the registry. */
    static getStored() {
        return REGISTRY
            .filter(entry => localStorage.getItem(entry.key) !== null)
            .map(entry => ({ ...entry, value: JSON.parse(localStorage.getItem(entry.key)) }));
    }

    /** Removes all stored preferences in the registry. */
    static clearAll() {
        REGISTRY.forEach(entry => localStorage.removeItem(entry.key));
    }

    /** Removes a single preference by key. */
    static clearKey(key) {
        localStorage.removeItem(key);
    }

    /** Enables or disables caching for a key. Clears stored value when disabled. */
    static setEnabled(key, enabled) {
        const disabled = getDisabledKeys();
        const updated = enabled ? disabled.filter(k => k !== key) : [...new Set([...disabled, key])];
        localStorage.setItem(DISABLED_KEY, JSON.stringify(updated));
        if (!enabled) localStorage.removeItem(key);
    }
}
