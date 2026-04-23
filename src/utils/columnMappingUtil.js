/**
 * Column mapping utilities — orchestrates mapper registry and provides
 * shared helpers for the ColumnMappingTable component.
 *
 * Mapper interface: { isComplete(state, col, mappedValues, transactions), resolve(target, amount, raw, context) }
 */
import simpleMapper from "@utils/mappers/simpleMapper";
import suffixMapper from "@utils/mappers/suffixMapper";
import descKeywordMapper from "@utils/mappers/descKeywordMapper";
import balanceInferMapper from "@utils/mappers/balanceInferMapper";

export { getUniqueSuffixes } from "@utils/mappers/suffixMapper";

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
