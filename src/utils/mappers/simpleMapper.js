/**
 * Simple mapper for direct debit/credit/balance column assignments.
 * No additional config needed — selecting the target is sufficient.
 */
export default {
    isComplete() { return true; },

    resolve(target, amount) {
        if (target === "debit") return { debit: amount, credit: 0 };
        if (target === "credit") return { debit: 0, credit: amount };
        return { debit: 0, credit: 0 };
    },
};
