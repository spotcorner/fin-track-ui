/**
 * Column mapping utilities — orchestrates mapper registry and provides
 * shared helpers for the ColumnMappingTable component.
 *
 * Mapper interface: { isComplete(state, col, mappedValues, transactions), resolve(target, amount, raw, context) }
 */
import simpleMapper from "@utils/mappers/simpleMapper";
import suffixMapper, { getUniqueSuffixes } from "@utils/mappers/suffixMapper";
import descKeywordMapper from "@utils/mappers/descKeywordMapper";
import balanceInferMapper from "@utils/mappers/balanceInferMapper";
export { getUniqueSuffixes };

/** Maps each column target to its mapper implementation. */
export const MAPPER_REGISTRY = {
    debit: simpleMapper,
    credit: simpleMapper,
    balance: simpleMapper,
    use_suffix: suffixMapper,
    use_desc_keyword: descKeywordMapper,
    infer_from_balance: balanceInferMapper,
};

export const DATE_TARGETS = [
    { value: "", label: "—" },
    { value: "date", label: "Date" },
    { value: "ignore", label: "Ignore" },
];

export const AMOUNT_TARGETS = [
    { value: "", label: "—" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
    { value: "use_suffix", label: "Use suffix" },
    { value: "use_desc_keyword", label: "Use desc keyword" },
    { value: "infer_from_balance", label: "Amount (infer from balance)" },
    { value: "balance", label: "Balance" },
    { value: "ignore", label: "Ignore" },
];

export const TYPE_OPTIONS = [
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
];

/** Parses a numeric amount from a raw string like "1,058.05 CR". Returns the number or null. */
export function parseAmount(raw) {
    const m = String(raw).match(/^([\d,]+\.\d{2})/);
    return m ? parseFloat(m[1].replace(/,/g, "")) : null;
}

/** Extracts the suffix after the amount value, e.g. "1,058.05 CR" → "CR". */
export function extractSuffix(raw) {
    const m = String(raw).match(/^[\d,]+\.\d{2}\s*(.*)$/);
    return m ? m[1].trim().toUpperCase() : "";
}

/** Returns available mapping targets for a column based on its prefix. */
export function getTargets(col) {
    if (col.startsWith("date_")) return DATE_TARGETS;
    if (col.startsWith("amount_")) return AMOUNT_TARGETS;
    return null;
}

/** Checks if all columns have valid and complete mappings (date + at least one amount type). */
export function isMappingComplete(state, columns, transactions) {
    const { columnMapping } = state;
    const mappedValues = Object.values(columnMapping);
    const hasDate = mappedValues.includes("date");
    const AMOUNT_TYPES = Object.keys(MAPPER_REGISTRY).filter(k => k !== "balance");
    const hasAmount = AMOUNT_TYPES.some(t => mappedValues.includes(t));
    if (!hasDate || !hasAmount) return false;

    for (const col of columns) {
        const target = columnMapping[col];
        const mapper = MAPPER_REGISTRY[target];
        if (!mapper) continue;
        if (!mapper.isComplete(state, col, mappedValues, transactions)) return false;
    }
    return true;
}

/** Counts transactions that have no value in any date column. */
export function noDateCount(transactions, columns) {
    return transactions.filter(txn =>
        !columns.some(col => col.startsWith("date_") && txn[col])
    ).length;
}

/** Filters out the page column unless showPageNumbers is enabled. */
export function getVisibleColumns(columns, showPageNumbers) {
    return showPageNumbers ? columns : columns.filter(c => c !== "page");
}

/** Filters transactions based on whether to include rows without dates. */
export function getFilteredTransactions(transactions, columns, showNoDateRows) {
    if (showNoDateRows) return transactions;
    return transactions.filter(txn =>
        columns.some(col => col.startsWith("date_") && txn[col])
    );
}

/**
 * Returns a default columnMapping based on column structure and data patterns.
 * - 1 date column → Date
 * - 1 amount: has suffix → Use suffix, no suffix → Use desc keyword
 * - 2+ amounts: two sparse (mutually exclusive) → Debit/Credit
 * - 2 amounts, both present: Infer from balance/Balance
 */
export function getDefaultMapping(columns, transactions) {
    const mapping = {};
    const dateCols = columns.filter(c => c.startsWith("date_"));
    const amountCols = columns.filter(c => c.startsWith("amount_"));

    if (dateCols.includes("date_1")) mapping["date_1"] = "date";

    if (amountCols.length === 1) {
        const col = amountCols[0];
        const suffixes = getUniqueSuffixes(transactions, col);
        const hasSuffix = suffixes.some(s => s.length > 0);
        mapping[col] = hasSuffix ? "use_suffix" : "use_desc_keyword";
    } else if (amountCols.length >= 2) {
        const counts = amountCols.map(col => ({
            col,
            present: transactions.filter(txn => parseAmount(txn[col]) > 0).length,
        }));
        const sparse = counts.filter(c => c.present != transactions.length);
        if (sparse.length === 2) {
            mapping[sparse[0].col] = "debit";
            mapping[sparse[1].col] = "credit";
        } else if (amountCols.length === 2) {
            mapping[amountCols[0]] = "infer_from_balance";
            mapping[amountCols[1]] = "balance";
        }
    }

    return mapping;
}
