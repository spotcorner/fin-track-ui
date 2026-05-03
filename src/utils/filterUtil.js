"use strict";

import { ACCOUNT_TYPE_LABELS, TRANSACTION_TYPES } from "@config";
import { formatDateRange } from "@utils/datePresetUtil";
import labelUtil from "@utils/labelUtil";

export function getFilterLabels(filters, accountsMap = {}, tagsMap = {}) {
    const labels = [];
    const isAllTime = filters.datePreset === "allTime" && !filters.startDateFilter && !filters.endDateFilter;
    if (filters.startDateFilter || filters.endDateFilter || isAllTime) {
        labels.push(formatDateRange(filters.startDateFilter, filters.endDateFilter, filters.datePreset));
    }
    if (filters.transactionTypeFilter?.length) filters.transactionTypeFilter.forEach(v => labels.push(v === TRANSACTION_TYPES.DEBIT ? "Debit" : "Credit"));
    if (filters.excludeFromTotalsFilter?.length) filters.excludeFromTotalsFilter.forEach(v => labels.push(v === "1" ? "Excluded" : "Active"));
    if (filters.minAmountFilter) labels.push("Min: ₹" + filters.minAmountFilter);
    if (filters.maxAmountFilter) labels.push("Max: ₹" + filters.maxAmountFilter);
    if (filters.accountTypeFilter?.length) filters.accountTypeFilter.forEach(type => labels.push(ACCOUNT_TYPE_LABELS[type] || type));
    if (filters.accountIdFilter?.length) filters.accountIdFilter.forEach(id => labels.push(labelUtil.getAccountLabel(accountsMap[id]) || id));
    if (filters.tagFilter?.length) filters.tagFilter.forEach(id => labels.push(id === "__NONE__" ? "Untagged" : (tagsMap[id]?.name || id)));
    if (filters.searchFilter) labels.push(filters.searchFilter);
    if (filters.expandSplits === false) labels.push("Splits collapsed");
    return labels;
}
