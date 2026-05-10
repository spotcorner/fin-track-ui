import tagUtil from "./tagUtil";

export default {
    applyFilters: (transactions, filters, accountsMap, tags) => {
        const filtered = _.filter(transactions, (transaction) => {
            if (transaction.childIds?.length) return false;
            if (!_.isEmpty(filters.minAmountFilter) && transaction.amount < filters.minAmountFilter) return false;
            if (!_.isEmpty(filters.maxAmountFilter) && transaction.amount > filters.maxAmountFilter) return false;
            if (filters.skipExcluded && transaction.excludeFromTotals) return false;
            const account = accountsMap && accountsMap[transaction.accountId] || {};
            transaction.account = account;
            if (filters.accountTypeFilter.length && !filters.accountTypeFilter.includes(account.type)) return false;
            if (filters.accountIdFilter.length && !filters.accountIdFilter.includes(transaction.accountId)) return false;
            if (filters.transactionTypeFilter.length && !filters.transactionTypeFilter.includes(transaction.type)) return false;
            tagUtil.applyTags(transaction, tags);
            if (filters.tagFilter.length) {
                const hasUntagged = filters.tagFilter.includes("__NONE__");
                const tagIds = filters.tagFilter.filter(id => id !== "__NONE__");
                const isUntagged = !_.some(transaction.appliedTags, v => v >= 1);
                const matchesTag = tagIds.length && _.some(tagIds, id => transaction.appliedTags[id] >= 1);
                if (!(hasUntagged && isUntagged) && !matchesTag) return false;
            }
            if (filters.searchTerms.length) {
                const matches = filters.searchTerms.every(term => {
                    if (term.regex) {
                        try { return new RegExp(term.value, term.caseSensitive ? "" : "i").test(transaction.description); }
                        catch (e) { return false; }
                    }
                    return term.caseSensitive ? _.includes(transaction.description, term.value) : _.includes(_.toLower(transaction.description), _.toLower(term.value));
                });
                if (!matches) return false;
            }
            return true;
        });
        return filtered;
    }
}
