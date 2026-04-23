/**
 * Description keyword mapper — determines debit/credit by matching keywords in the description.
 * e.g. description contains "CR" → Credit, contains "BY" → Debit.
 *
 * Requires: at least one keyword (debit or credit).
 * Fallback: if only one keyword is provided, non-matching descriptions get the opposite type.
 */
export default {
    isComplete(state, col) {
        const kw = state.descKeywords[col] || {};
        return !!(kw.debit || kw.credit);
    },

    resolve(_target, amount, _raw, { col, descKeywords, description }) {
        const kw = descKeywords[col] || {};
        const descUpper = description.toUpperCase();
        if (kw.credit && descUpper.includes(kw.credit.toUpperCase())) return { debit: 0, credit: amount };
        if (kw.debit && descUpper.includes(kw.debit.toUpperCase())) return { debit: amount, credit: 0 };
        // Fallback: single keyword provided, non-match gets opposite type
        if (kw.credit && !kw.debit) return { debit: amount, credit: 0 };
        if (kw.debit && !kw.credit) return { debit: 0, credit: amount };
        return { debit: 0, credit: 0 };
    },
};
