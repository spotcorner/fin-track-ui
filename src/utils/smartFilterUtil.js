"use strict";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTHS_FULL = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/**
 * Parses search input and returns a smart filter action if matched.
 * Returns { type, ...params } or null if no match.
 */
export function parseSmartFilter(input) {
    // amount: >1000, <500, 1000-5000
    const gtMatch = input.match(/^>\s*(\d+\.?\d*)$/);
    if (gtMatch) return { type: "amount", min: gtMatch[1] };
    const ltMatch = input.match(/^<\s*(\d+\.?\d*)$/);
    if (ltMatch) return { type: "amount", max: ltMatch[1] };
    const rangeMatch = input.match(/^(\d+\.?\d*)\s*-\s*(\d+\.?\d*)$/);
    if (rangeMatch) return { type: "amount", min: rangeMatch[1], max: rangeMatch[2] };

    // date keywords
    const lower = input.toLowerCase();
    if (lower === "today") {
        const d = moment().format("YYYY-MM-DD");
        return { type: "date", start: d, end: d, preset: "custom" };
    }
    if (lower === "yesterday") {
        const d = moment().subtract(1, "day").format("YYYY-MM-DD");
        return { type: "date", start: d, end: d, preset: "custom" };
    }
    if (lower === "this week") {
        return { type: "date", start: moment().startOf("isoWeek").format("YYYY-MM-DD"), end: moment().endOf("isoWeek").format("YYYY-MM-DD"), preset: "weekly" };
    }
    if (lower === "last month") {
        return { type: "date", start: moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD"), end: moment().subtract(1, "month").endOf("month").format("YYYY-MM-DD"), preset: "monthly" };
    }
    if (lower === "this month") {
        return { type: "date", start: moment().startOf("month").format("YYYY-MM-DD"), end: moment().endOf("month").format("YYYY-MM-DD"), preset: "currentMonth" };
    }

    // year: "2024"
    const yearMatch = input.match(/^(20\d{2})$/);
    if (yearMatch) {
        const y = moment(yearMatch[1], "YYYY");
        return { type: "date", start: y.startOf("year").format("YYYY-MM-DD"), end: y.clone().endOf("year").format("YYYY-MM-DD"), preset: "yearly" };
    }

    // month + year: "jan 2024", "january 2024"
    const monthYearMatch = lower.match(/^(\w+)\s+(20\d{2})$/);
    if (monthYearMatch) {
        const idx = getMonthIndex(monthYearMatch[1]);
        if (idx >= 0) {
            const m = moment().year(parseInt(monthYearMatch[2])).month(idx);
            return { type: "date", start: m.startOf("month").format("YYYY-MM-DD"), end: m.clone().endOf("month").format("YYYY-MM-DD"), preset: "monthly" };
        }
    }

    // month only: "jan", "january" → current year
    const monthIdx = getMonthIndex(lower);
    if (monthIdx >= 0) {
        const m = moment().month(monthIdx);
        return { type: "date", start: m.startOf("month").format("YYYY-MM-DD"), end: m.clone().endOf("month").format("YYYY-MM-DD"), preset: "monthly" };
    }

    return null;
}

function getMonthIndex(str) {
    const idx = MONTHS.indexOf(str.slice(0, 3));
    if (idx >= 0 && (MONTHS.includes(str) || MONTHS_FULL.includes(str))) return idx;
    return -1;
}
