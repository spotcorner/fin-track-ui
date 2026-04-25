/**
 * Suffix mapper — determines debit/credit based on the suffix after the amount value.
 * e.g. "1,058.05 CR" → suffix is "CR", user maps CR → Credit.
 *
 * Requires: user maps each unique suffix to debit or credit.
 */
import { extractSuffix } from "@utils/columnMappingUtil";

/** Extracts unique suffixes from amount values in a column across all transactions. */
export function getUniqueSuffixes(transactions, col) {
    const suffixes = new Set();
    transactions.forEach(txn => {
        const val = txn[col];
        if (!val) return;
        const str = Array.isArray(val) ? val.join(" ") : String(val);
        const suffix = extractSuffix(str);
        if (str.match(/^[\d,]+\.\d{2}/)) suffixes.add(suffix);
    });
    return [...suffixes].sort();
}

export default {
    isComplete(state, col, _mappedValues, transactions) {
        const suffixes = getUniqueSuffixes(transactions, col);
        const suffixMapping = state.suffixMapping || {};
        return !suffixes.some(s => !suffixMapping[`${col}:${s}`]);
    },

    resolve(_target, amount, raw, { col, suffixMapping }) {
        const suffix = extractSuffix(raw);
        if (suffixMapping[`${col}:${suffix}`] === "credit") return { debit: 0, credit: amount };
        return { debit: amount, credit: 0 };
    },
};
