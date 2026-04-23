/**
 * Suffix mapper — determines debit/credit based on the suffix after the amount value.
 * e.g. "1,058.05 CR" → suffix is "CR", user maps CR → Credit.
 *
 * Requires: user maps each unique suffix to debit or credit.
 */

/** Extracts unique suffixes from amount values in a column across all transactions. */
export function getUniqueSuffixes(transactions, col) {
    const suffixes = new Set();
    transactions.forEach(txn => {
        const val = txn[col];
        if (!val) return;
        const str = Array.isArray(val) ? val.join(" ") : String(val);
        const m = str.match(/^[\d,]+\.\d{2}\s*(.*)$/);
        if (m) suffixes.add(m[1].trim().toUpperCase() || "");
    });
    return [...suffixes].sort();
}

export default {
    isComplete(state, col, _mappedValues, transactions) {
        const suffixes = getUniqueSuffixes(transactions, col);
        return !suffixes.some(s => !state.suffixMapping[`${col}:${s}`]);
    },

    resolve(_target, amount, raw, { col, suffixMapping }) {
        const suffixMatch = String(raw).match(/^[\d,]+\.\d{2}\s*(.*)$/);
        const suffix = suffixMatch ? suffixMatch[1].trim().toUpperCase() : "";
        if (suffixMapping[`${col}:${suffix}`] === "credit") return { debit: 0, credit: amount };
        return { debit: amount, credit: 0 };
    },
};
