import tagUtil from "./tagUtil";

export default {
    applyFilters: (transactions, filters, accountsMap, tags) => {
        return _.filter(transactions, (transaction) => {
            if (!_.isEmpty(filters.minAmountFilter) && transaction.amount < filters.minAmountFilter) return false;
            if (!_.isEmpty(filters.maxAmountFilter) && transaction.amount > filters.maxAmountFilter) return false;
            if (!_.isEmpty(filters.excludeFromTotalsFilter) && transaction.excludeFromTotals != filters.excludeFromTotalsFilter) return false;
            const account = accountsMap && accountsMap[transaction.accountId] || {};
            transaction.account = account;
            if (!_.isEmpty(filters.accountTypeFilter) && account.type != filters.accountTypeFilter) return false;
            if (!_.isEmpty(filters.accountIdFilter) && transaction.accountId != filters.accountIdFilter) return false;
            if (!_.isEmpty(filters.transactionTypeFilter) && transaction.type != filters.transactionTypeFilter) return false;
            tagUtil.applyTags(transaction, tags);
            if (!_.isEmpty(filters.tagFilter)) {
                if (filters.tagFilter == "__NONE__") {
                    if (_.some(transaction.appliedTags, v => v >= 1)) {
                        return false;
                    }
                } else if (!transaction.appliedTags[filters.tagFilter]) {
                    return false;
                }
            }
            if (!_.isEmpty(filters.searchFilter) && !_.includes(_.toLower(transaction.description), _.toLower(filters.searchFilter))) return false;
            return true;
        });
    }
}