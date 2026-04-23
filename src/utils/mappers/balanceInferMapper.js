/**
 * Balance inference mapper — determines debit/credit by comparing consecutive balance values.
 * If balance increased → credit, decreased → debit.
 *
 * Requires: inferFirstTxn (debit/credit) for the first row, and a balance column mapped.
 * Uses a mutable prevBalance ref ({ value }) to track state across rows.
 */
import { parseAmount } from "@utils/columnMappingUtil";

export default {
    isComplete(state, _col, mappedValues) {
        return !!state.inferFirstTxn && mappedValues.includes("balance");
    },

    resolve(_target, amount, _raw, { txn, balanceCol, inferFirstTxn, prevBalance }) {
        const balance = parseAmount(txn[balanceCol]);
        if (balance === null) return { debit: 0, credit: 0 };
        let result;
        if (prevBalance.value !== null) {
            result = balance > prevBalance.value
                ? { debit: 0, credit: amount }
                : { debit: amount, credit: 0 };
        } else {
            result = inferFirstTxn === "credit"
                ? { debit: 0, credit: amount }
                : { debit: amount, credit: 0 };
        }
        prevBalance.value = balance;
        return result;
    },
};
