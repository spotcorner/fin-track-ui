/**
 * Transaction grouping and mapping utilities for the upload flow.
 * Handles unmapped result grouping, flattening, column mapping application, and page sub-grouping.
 */
import { MAPPER_REGISTRY } from "@utils/columnMappingUtil";

/** Extracts and sorts column names from transactions in display order: page, date, description, amount. */
export function getUnmappedColumns(transactions) {
    const keys = new Set();
    transactions.forEach(txn => Object.keys(txn).forEach(k => keys.add(k)));
    const order = ["page", "date", "description", "amount"];
    return [...keys].sort((a, b) => {
        const ai = order.findIndex(p => a.startsWith(p));
        const bi = order.findIndex(p => b.startsWith(p));
        return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi) || a.localeCompare(b);
    });
}

/** Groups transactions by amount column count (e.g. "1 amount", "2 amounts"). */
export function getUnmappedGroups(transactions) {
    const buckets = {};
    transactions.forEach(txn => {
        const count = Object.keys(txn).filter(k => k.startsWith("amount_")).length;
        const label = `${count} amount${count !== 1 ? "s" : ""}`;
        (buckets[label] = buckets[label] || []).push(txn);
    });
    return Object.entries(buckets)
        .map(([label, txns]) => ({ label, transactions: txns }))
        .sort((a, b) => b.transactions.length - a.transactions.length);
}

/** Flattens extraction results into a list of displayable rows, splitting unmapped results by amount count and page range. */
export function getFlattenedResults(results, labels) {
    if (!results) return null;
    const flattened = [];
    results.forEach(result => {
        if (result.unmapped) {
            getUnmappedGroups(result.transactions).forEach(group => {
                getPageSubGroups(group.transactions).forEach(sub => {
                    flattened.push({
                        ...result,
                        label: `${labels[result.extractor] || result.extractor} - ${group.label} - ${sub.label}`,
                        transactions: sub.transactions,
                    });
                });
            });
        } else {
            flattened.push({
                ...result,
                label: labels[result.extractor] || result.extractor,
            });
        }
    });
    return flattened;
}

/**
 * Applies column mapping to raw transactions, producing { date, description, type, amount } output.
 * Skips excluded rows and rows without dates. Delegates amount resolution to mapper registry.
 */
export function applyMapping(transactions, mapping) {
    const { columnMapping, suffixMapping, descKeywords = {}, inferFirstTxn, manualDates = {}, excludedRows = {} } = mapping;
    const dateCol = Object.keys(columnMapping).find(k => columnMapping[k] === "date");
    const balanceCol = Object.keys(columnMapping).find(k => columnMapping[k] === "balance");
    const prevBalance = { value: null };
    const mapped = [];

    transactions.forEach((txn, idx) => {
        if (excludedRows[idx]) return;
        const date = txn[dateCol] || manualDates[idx] || "";
        if (!date) return;
        const desc = txn.description;
        const description = Array.isArray(desc) ? desc.join(" ") : (desc || "");
        let debit = 0, credit = 0;

        for (const [col, target] of Object.entries(columnMapping)) {
            if (!col.startsWith("amount_") || target === "ignore" || target === "balance") continue;
            const mapper = MAPPER_REGISTRY[target];
            if (!mapper) continue;
            const raw = txn[col];
            if (!raw) continue;
            const numMatch = String(raw).match(/^([\d,]+\.\d{2})/);
            if (!numMatch) continue;
            const amount = parseFloat(numMatch[1].replace(/,/g, ""));
            const context = { col, txn, suffixMapping, descKeywords, description, inferFirstTxn, balanceCol, prevBalance };
            const result = mapper.resolve(target, amount, raw, context);
            debit += result.debit;
            credit += result.credit;
        }

        mapped.push({
            date, description,
            type: credit > 0 ? "CREDIT" : "DEBIT",
            amount: credit > 0 ? credit : debit,
        });
    });
    return mapped;
}

/** Groups transactions into contiguous page ranges (e.g. "Pages 1-3", "Page 5"). */
export function getPageSubGroups(transactions) {
    const groups = [];
    let current = null;
    transactions.forEach(txn => {
        const page = txn.page;
        if (!current || (page !== current.endPage + 1 && page !== current.endPage)) {
            current = { startPage: page, endPage: page, transactions: [] };
            groups.push(current);
        }
        current.endPage = page;
        current.transactions.push(txn);
    });
    return groups.map(g => ({
        label: g.startPage === g.endPage ? `Page ${g.startPage}` : `Pages ${g.startPage}-${g.endPage}`,
        transactions: g.transactions,
    }));
}
