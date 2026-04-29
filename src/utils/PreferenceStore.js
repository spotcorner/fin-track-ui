"use strict";

/**
 * Persists user preferences to localStorage.
 * Each instance is scoped to a key (e.g. "cashflow.filters", "draft.stats.groupByPeriod").
 *
 * Usage:
 *   const store = new PreferenceStore("cashflow.filters", { sortField: "date" });
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
    { key: "cashflow.filters", label: "Filters", icon: "bi-funnel", group: "Cashflow" },
    { key: "cashflow.filters.collapsed", label: "Filters Collapsed", icon: "bi-funnel", group: "Cashflow" },
    { key: "cashflow.filters.sticky", label: "Filters Sticky", icon: "bi-pin", group: "Cashflow" },
    { key: "cashflow.filters.showChips", label: "Filters Show Chips", icon: "bi-tags", group: "Cashflow" },
    { key: "cashflow.stats.visibleCharts", label: "Visible Charts", icon: "bi-bar-chart", group: "Cashflow" },
    { key: "cashflow.stats.groupByPeriod", label: "Group By Period", icon: "bi-calendar", group: "Cashflow" },
    { key: "cashflow.stats.sort.tags", label: "Tags Chart Sort", icon: "bi-sort-down", group: "Cashflow" },
    { key: "cashflow.transactionSort", label: "Transaction Sort", icon: "bi-sort-down", group: "Cashflow" },
    { key: "drafts.selection", label: "Selected Draft", icon: "bi-file-text", group: "Drafts" },
    { key: "draft.filters", label: "Filters", icon: "bi-funnel", group: "Drafts" },
    { key: "draft.filters.collapsed", label: "Filters Collapsed", icon: "bi-funnel", group: "Drafts" },
    { key: "draft.filters.sticky", label: "Filters Sticky", icon: "bi-pin", group: "Drafts" },
    { key: "draft.filters.showChips", label: "Filters Show Chips", icon: "bi-tags", group: "Drafts" },
    { key: "draft.stats.visibleCharts", label: "Visible Charts", icon: "bi-bar-chart", group: "Drafts" },
    { key: "draft.stats.groupByPeriod", label: "Group By Period", icon: "bi-calendar", group: "Drafts" },
    { key: "draft.stats.sort.tags", label: "Tags Chart Sort", icon: "bi-sort-down", group: "Drafts" },
    { key: "draft.transactionSort", label: "Transaction Sort", icon: "bi-sort-down", group: "Drafts" },
    { key: "accounts.sort", label: "Sort", icon: "bi-sort-down", group: "Accounts" },
    { key: "tags.sort", label: "Sort", icon: "bi-sort-down", group: "Tags" },
];

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

    /** Returns all stored preferences matching the registry, grouped. */
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
}
