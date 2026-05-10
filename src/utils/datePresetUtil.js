"use strict";

const FY_START_MONTH = 3; // April (0-indexed)

// Shift config per preset: { amount, unit } for moment add/subtract
// shiftPreset: what preset to switch to on shift (for quick presets)
const PRESET_CONFIG = {
    currentMonth:  { shift: { amount: 1, unit: "month" },  shiftPreset: "monthly" },
    lastMonth:     { shift: { amount: 1, unit: "month" },  shiftPreset: "monthly" },
    currentYear:   { shift: { amount: 1, unit: "year" },   shiftPreset: "yearly" },
    lastYear:      { shift: { amount: 1, unit: "year" },   shiftPreset: "yearly" },
    currentFY:     { shift: { amount: 1, unit: "year" },   shiftPreset: "_fyYearly" },
    lastFY:        { shift: { amount: 1, unit: "year" },   shiftPreset: "_fyYearly" },
    weekly:        { shift: { amount: 1, unit: "week" } },
    monthly:       { shift: { amount: 1, unit: "month" } },
    quarterly:     { shift: { amount: 3, unit: "months" } },
    halfYearly:    { shift: { amount: 6, unit: "months" } },
    yearly:        { shift: { amount: 1, unit: "year" } },
    _fyYearly:     { shift: { amount: 1, unit: "year" } },
};

export const DATE_PRESETS = [
    { key: "currentMonth", label: "Current Month", group: "quick", searchKeys: ["current month", "this month"] },
    { key: "lastMonth", label: "Last Month", group: "quick", searchKeys: ["last month"] },
    { key: "currentYear", label: "Current Year", group: "quick", searchKeys: ["current year", "this year"] },
    { key: "lastYear", label: "Last Year", group: "quick", searchKeys: ["last year"] },
    { key: "currentFY", label: "Current FY", group: "quick", searchKeys: ["current fy", "this fy"] },
    { key: "lastFY", label: "Last FY", group: "quick", searchKeys: ["last fy"] },
    { key: "weekly", label: "Weekly", group: "window" },
    { key: "monthly", label: "Monthly", group: "window" },
    { key: "quarterly", label: "Quarterly", group: "window" },
    { key: "halfYearly", label: "Half-Yearly", group: "window" },
    { key: "yearly", label: "Yearly", group: "window" },
    { key: "allTime", label: "All Time", group: "other", searchKeys: ["all time"] },
    { key: "custom", label: "Custom", group: "other" },
];

function getFYStart(date) {
    return date.month() >= FY_START_MONTH
        ? date.clone().month(FY_START_MONTH).startOf("month")
        : date.clone().subtract(1, "year").month(FY_START_MONTH).startOf("month");
}

function getQuarterStart(date) {
    const q = Math.floor(date.month() / 3) * 3;
    return date.clone().month(q).startOf("month");
}

function getHalfStart(date) {
    const h = date.month() < 6 ? 0 : 6;
    return date.clone().month(h).startOf("month");
}

function snapToWindow(preset, refDate) {
    const ref = refDate ? moment(refDate) : moment();
    switch (preset) {
        case "weekly": {
            const s = ref.clone().startOf("isoWeek");
            return { start: s.format("YYYY-MM-DD"), end: s.clone().endOf("isoWeek").format("YYYY-MM-DD") };
        }
        case "monthly": {
            return { start: ref.clone().startOf("month").format("YYYY-MM-DD"), end: ref.clone().endOf("month").format("YYYY-MM-DD") };
        }
        case "quarterly": {
            const s = getQuarterStart(ref);
            return { start: s.format("YYYY-MM-DD"), end: s.clone().add(3, "months").subtract(1, "day").format("YYYY-MM-DD") };
        }
        case "halfYearly": {
            const s = getHalfStart(ref);
            return { start: s.format("YYYY-MM-DD"), end: s.clone().add(6, "months").subtract(1, "day").format("YYYY-MM-DD") };
        }
        case "yearly": {
            return { start: ref.clone().startOf("year").format("YYYY-MM-DD"), end: ref.clone().endOf("year").format("YYYY-MM-DD") };
        }
        case "_fyYearly": {
            const s = getFYStart(ref);
            return { start: s.format("YYYY-MM-DD"), end: s.clone().add(1, "year").subtract(1, "day").format("YYYY-MM-DD") };
        }
        default:
            return null;
    }
}

export function getDateRange(preset, refDate) {
    const now = moment();
    switch (preset) {
        case "currentMonth":
            return { start: now.clone().startOf("month").format("YYYY-MM-DD"), end: now.clone().endOf("month").format("YYYY-MM-DD") };
        case "lastMonth":
            return { start: now.clone().subtract(1, "month").startOf("month").format("YYYY-MM-DD"), end: now.clone().subtract(1, "month").endOf("month").format("YYYY-MM-DD") };
        case "currentYear":
            return { start: now.clone().startOf("year").format("YYYY-MM-DD"), end: now.clone().endOf("year").format("YYYY-MM-DD") };
        case "lastYear":
            return { start: now.clone().subtract(1, "year").startOf("year").format("YYYY-MM-DD"), end: now.clone().subtract(1, "year").endOf("year").format("YYYY-MM-DD") };
        case "currentFY": {
            const s = getFYStart(now);
            return { start: s.format("YYYY-MM-DD"), end: s.clone().add(1, "year").subtract(1, "day").format("YYYY-MM-DD") };
        }
        case "lastFY": {
            const s = getFYStart(now).subtract(1, "year");
            return { start: s.format("YYYY-MM-DD"), end: s.clone().add(1, "year").subtract(1, "day").format("YYYY-MM-DD") };
        }
        case "allTime":
            return { start: "", end: "" };
        default:
            return snapToWindow(preset, refDate);
    }
}

export function shiftDateRange(start, end, direction, preset) {
    if (!start || !end) return { start, end, preset };
    const config = PRESET_CONFIG[preset];
    const dir = direction === "prev" ? -1 : 1;

    // Preset-aware shift
    if (config) {
        const newPreset = config.shiftPreset || preset;
        const s = moment(start).add(dir * config.shift.amount, config.shift.unit);
        const snapped = snapToWindow(newPreset, s);
        if (snapped) return { ...snapped, preset: newPreset };
        // For quick presets that shift to a window preset
        const newConfig = PRESET_CONFIG[newPreset];
        if (newConfig) {
            const ws = snapToWindow(newPreset, s);
            if (ws) return { ...ws, preset: newPreset };
        }
        return { start: s.format("YYYY-MM-DD"), end: moment(end).add(dir * config.shift.amount, config.shift.unit).format("YYYY-MM-DD"), preset: newPreset };
    }

    // Duration-based for custom
    const days = moment(end).diff(moment(start), "days") + 1;
    return {
        start: moment(start).add(dir * days, "days").format("YYYY-MM-DD"),
        end: moment(end).add(dir * days, "days").format("YYYY-MM-DD"),
        preset: "custom",
    };
}

export function formatDateRange(start, end, preset) {
    if (!start && !end) return "All Time";
    const s = start ? moment(start) : null;
    const e = end ? moment(end) : null;
    if (!s || !e) {
        if (s) return `From ${s.format("MMM D, YYYY")}`;
        if (e) return `Until ${e.format("MMM D, YYYY")}`;
        return "";
    }
    switch (preset) {
        case "monthly":
        case "currentMonth":
        case "lastMonth":
            return s.format("MMM YYYY");
        case "quarterly":
            return s.month() === e.clone().startOf("month").month() - 2 || (s.month() === 10 && e.month() === 0)
                ? `${s.format("MMM")} — ${e.format("MMM YYYY")}`
                : `${s.format("MMM D")} — ${e.format("MMM D, YYYY")}`;
        case "halfYearly":
            return `${s.format("MMM")} — ${e.format("MMM YYYY")}`;
        case "yearly":
        case "currentYear":
        case "lastYear":
            return s.format("YYYY");
        case "_fyYearly":
        case "currentFY":
        case "lastFY":
            return `FY ${s.format("YYYY")}—${e.format("YY")}`;
        case "weekly":
            return `${s.format("MMM D")} — ${e.format("MMM D, YYYY")}`;
        default: {
            const days = e.diff(s, "days") + 1;
            return `${s.format("MMM D, YYYY")} — ${e.format("MMM D, YYYY")} (${days}d)`;
        }
    }
}
