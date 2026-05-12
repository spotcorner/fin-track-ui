import tagUtil from "./tagUtil";

function matchesSearchTerms(transaction, searchTerms) {
    return searchTerms.every(term => {
        const matchText = (text) => {
            if (term.regex) {
                try { return new RegExp(term.value, term.caseSensitive ? "" : "i").test(text); }
                catch (e) { return false; }
            }
            return term.caseSensitive ? _.includes(text, term.value) : _.includes(_.toLower(text), _.toLower(term.value));
        };
        return matchText(transaction.description || "") || matchText(transaction.comments || "");
    });
}

export function matchesTransaction(transaction, filters, accountsMap, { skip } = {}) {
    if (skip !== "amount") {
        if (filters.minAmountFilter && transaction.amount < filters.minAmountFilter) return false;
        if (filters.maxAmountFilter && transaction.amount > filters.maxAmountFilter) return false;
    }
    if (skip !== "excludeFromTotals" && filters.skipExcluded && transaction.excludeFromTotals) return false;
    const account = accountsMap?.[transaction.accountId] || {};
    if (skip !== "accountType" && filters.accountTypeFilter.length && !filters.accountTypeFilter.includes(account.type)) return false;
    if (skip !== "accountId" && filters.accountIdFilter.length && !filters.accountIdFilter.includes(transaction.accountId)) return false;
    if (skip !== "transactionType" && filters.transactionTypeFilter.length && !filters.transactionTypeFilter.includes(transaction.type)) return false;
    if (skip !== "tag" && filters.tagFilter.length) {
        const hasUntagged = filters.tagFilter.includes("__NONE__");
        const tagIds = filters.tagFilter.filter(id => id !== "__NONE__");
        const isUntagged = !_.some(transaction.appliedTags, v => v >= 1);
        const matchesTag = tagIds.length && _.some(tagIds, id => transaction.appliedTags[id] >= 1);
        if (!(hasUntagged && isUntagged) && !matchesTag) return false;
    }
    if (skip !== "search" && filters.searchTerms.length) {
        if (!matchesSearchTerms(transaction, filters.searchTerms)) return false;
    }
    return true;
}

export default {
    applyFilters: (transactions, filters, accountsMap, tags) => {
        return _.filter(transactions, (transaction) => {
            if (transaction.childIds?.length) return false;
            tagUtil.applyTags(transaction, tags);
            transaction.account = accountsMap?.[transaction.accountId] || {};
            return matchesTransaction(transaction, filters, accountsMap);
        });
    }
}
