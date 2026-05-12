"use strict";

import { ACCOUNT_TYPE_LABELS, TRANSACTION_TYPES } from "@config";
import labelUtil from "@utils/labelUtil";
import { getDateRange, DATE_PRESETS } from "@utils/datePresetUtil";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTHS_FULL = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/**
 * Returns array of smart filter suggestions for the given input.
 * Each suggestion: { type, label, icon, ...params }
 */
export function getSmartSuggestions(input, { tags = [], accounts = [] } = {}) {
    const suggestions = [];
    if (!input) return suggestions;

    const lower = input.toLowerCase();

    // amount: >1000, <500, 1000-5000
    const gtMatch = input.match(/^>\s*(\d+\.?\d*)$/);
    if (gtMatch) suggestions.push({ type: "amount", label: `Min ₹${gtMatch[1]}`, min: gtMatch[1] });
    const ltMatch = input.match(/^<\s*(\d+\.?\d*)$/);
    if (ltMatch) suggestions.push({ type: "amount", label: `Max ₹${ltMatch[1]}`, max: ltMatch[1] });
    const rangeMatch = input.match(/^(\d+\.?\d*)\s*-\s*(\d+\.?\d*)$/);
    if (rangeMatch) suggestions.push({ type: "amount", label: `Min ₹${rangeMatch[1]}, Max ₹${rangeMatch[2]}`, min: rangeMatch[1], max: rangeMatch[2] });

    // date
    const dateSuggestion = parseDateFilter(input, lower);
    if (dateSuggestion) suggestions.push(dateSuggestion);

    // tags
    if ("untagged".startsWith(lower)) {
        suggestions.push({ type: "tag", label: "Untagged", icon: "bi-tag", value: "__NONE__" });
    }
    tags.forEach(tag => {
        if (tag.name.toLowerCase().includes(lower)) {
            suggestions.push({ type: "tag", label: tag.name, icon: "bi-tag", value: tag._id });
        }
    });

    // transaction type: "debit", "credit"
    if ("debit".startsWith(lower)) suggestions.push({ type: "transactionType", label: "Debit", icon: "bi-arrow-down-circle", value: TRANSACTION_TYPES.DEBIT });
    if ("credit".startsWith(lower) && !lower.startsWith("credit c")) suggestions.push({ type: "transactionType", label: "Credit", icon: "bi-arrow-up-circle", value: TRANSACTION_TYPES.CREDIT });

    // account type
    Object.entries(ACCOUNT_TYPE_LABELS).forEach(([key, label]) => {
        if (label.toLowerCase().startsWith(lower)) {
            suggestions.push({ type: "accountType", label: `${label} (Account Type)`, icon: "bi-wallet2", value: key });
        }
    });

    // account
    accounts.forEach(acc => {
        const accLabel = labelUtil.getAccountLabel(acc);
        if (accLabel.toLowerCase().includes(lower)) {
            suggestions.push({ type: "account", label: accLabel, icon: "bi-bank", value: acc._id });
        }
    });

    return suggestions;
}

function parseDateFilter(input, lower) {
    for (const p of DATE_PRESETS) {
        if (p.searchKeys?.some(k => k.startsWith(lower))) {
            const range = getDateRange(p.key) || { start: "", end: "" };
            return { type: "date", label: p.label, icon: "bi-calendar", start: range.start, end: range.end, preset: p.key };
        }
    }

    // date range: "march - may", "jan to mar", "march - may 2024", "jan to mar 2024", "dec 2025 to jan 2026"
    const rangeMatch = lower.match(/^(\w+)(?:\s+(20\d{2}))?\s*(?:-|to)\s*(\w+)(?:\s+(20\d{2}))?$/);
    if (rangeMatch) {
        const startIdx = getMonthIndex(rangeMatch[1]);
        const endIdx = getMonthIndex(rangeMatch[3]);
        if (startIdx >= 0 && endIdx >= 0) {
            const currentYear = moment().year();
            const startYear = rangeMatch[2] ? parseInt(rangeMatch[2]) : (rangeMatch[4] ? parseInt(rangeMatch[4]) : currentYear);
            const endYear = rangeMatch[4] ? parseInt(rangeMatch[4]) : startYear;
            const start = moment().year(startYear).month(startIdx).startOf("month");
            const end = moment().year(endYear).month(endIdx).endOf("month");
            const startLabel = MONTHS_FULL[startIdx].charAt(0).toUpperCase() + MONTHS_FULL[startIdx].slice(1);
            const endLabel = MONTHS_FULL[endIdx].charAt(0).toUpperCase() + MONTHS_FULL[endIdx].slice(1);
            const showStartYear = startYear !== endYear || rangeMatch[2];
            const label = `${startLabel}${showStartYear ? " " + startYear : ""} – ${endLabel} ${endYear}`;
            return { type: "date", label, icon: "bi-calendar", start: start.format("YYYY-MM-DD"), end: end.format("YYYY-MM-DD"), preset: "custom" };
        }
    }

    // year: "2024"
    const yearMatch = input.match(/^(20\d{2})$/);
    if (yearMatch) {
        const y = moment(yearMatch[1], "YYYY");
        return { type: "date", label: yearMatch[1], icon: "bi-calendar", start: y.startOf("year").format("YYYY-MM-DD"), end: y.clone().endOf("year").format("YYYY-MM-DD"), preset: "yearly" };
    }

    // month + year: "jan 2024", "january 2024"
    const monthYearMatch = lower.match(/^(\w+)\s+(20\d{2})$/);
    if (monthYearMatch) {
        const idx = getMonthIndex(monthYearMatch[1]);
        if (idx >= 0) {
            const m = moment().year(parseInt(monthYearMatch[2])).month(idx);
            return { type: "date", label: `${MONTHS_FULL[idx].charAt(0).toUpperCase() + MONTHS_FULL[idx].slice(1)} ${monthYearMatch[2]}`, icon: "bi-calendar", start: m.startOf("month").format("YYYY-MM-DD"), end: m.clone().endOf("month").format("YYYY-MM-DD"), preset: "monthly" };
        }
    }

    // month only: "jan", "january" → current year
    const monthIdx = getMonthIndex(lower);
    if (monthIdx >= 0) {
        const m = moment().month(monthIdx);
        const label = MONTHS_FULL[monthIdx].charAt(0).toUpperCase() + MONTHS_FULL[monthIdx].slice(1);
        return { type: "date", label, icon: "bi-calendar", start: m.startOf("month").format("YYYY-MM-DD"), end: m.clone().endOf("month").format("YYYY-MM-DD"), preset: "monthly" };
    }

    return null;
}

function getMonthIndex(str) {
    const idx = MONTHS.indexOf(str.slice(0, 3));
    if (idx >= 0 && (MONTHS.includes(str) || MONTHS_FULL.includes(str))) return idx;
    return -1;
}
