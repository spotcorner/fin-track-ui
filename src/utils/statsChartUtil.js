import { Bar } from "react-chartjs-2";
import statsUtil from "./statsUtil";

const getBalanceTrendData = (filteredTransactions, accountsMap, timeFilter) => {
    let cumulativeBalance = statsUtil.getCummulativeBalance(filteredTransactions, accountsMap);
    const trendData = {};
    filteredTransactions.forEach(txn => {
        const date = statsUtil.formatDate(timeFilter, txn.date);
        if (!trendData[date]) {
            trendData[date] = cumulativeBalance;
        }
        if (txn.type === "CREDIT") {
            cumulativeBalance += txn.amount;
        } else {
            cumulativeBalance += -txn.amount;
        }
        trendData[date] = cumulativeBalance;
    });
    const labels = Object.keys(trendData);
    const data = labels.map(date => trendData[date]);
    return { labels, data };
};

const getTransactionTypeTrendData = (filteredTransactions, accountsMap, timeFilter) => {
    const trendData = {};
    filteredTransactions.forEach(txn => {
        const date = statsUtil.formatDate(timeFilter, txn.date);
        if (!trendData[date]) {
            trendData[date] = 0;
        }
        trendData[date] += txn.amount;
    });
    const labels = Object.keys(trendData);
    const data = labels.map(date => trendData[date]);
    return { labels, data };
};

const getTransactionCountTrendData = (filteredTransactions, accountsMap, timeFilter) => {
    const trendData = {};
    filteredTransactions.forEach(txn => {
        const date = statsUtil.formatDate(timeFilter, txn.date);
        if (!trendData[date]) {
            trendData[date] = 0;
        }
        trendData[date] += 1;
    });
    const labels = Object.keys(trendData);
    const data = labels.map(date => trendData[date]);
    return { labels, data };
};

const getTransactionAmountTrendData = (filteredTransactions, accountsMap, timeFilter) => {
    const counts = statsUtil.getTransactionAmountRange().map(({ label, min, max }) => {
        const count = filteredTransactions.filter(txn => txn.amount >= min && txn.amount <= max).length;
        return { label, count };
    });
    const labels = counts.map(g => g.label);
    const data = counts.map(g => g.count);
    return { labels, data };
};

const getTransactionAmountSumTrendData = (filteredTransactions, accountsMap, timeFilter) => {
    const sums = statsUtil.getTransactionAmountRange().map(({ label, min, max }) => {
        const txns = filteredTransactions.filter(txn => txn.amount >= min && txn.amount <= max);
        return { label, sum: _.sumBy(txns, "amount") };
    });
    const labels = sums.map(g => g.label);
    const data = sums.map(g => g.sum);
    return { labels, data };
};

const getTransactionTagCountTrendData = (filteredTransactions, accountsMap, timeFilter, tags) => {
    let counts = tags.map(({ _id, name }) => {
        const txns = filteredTransactions.filter(txn => txn.appliedTags[_id] == 1);
        return { label: name, count: txns.length };
    });
    counts.push({
        label: "Untagged",
        count: filteredTransactions.filter(txn => txn.tagNames.length == 0).length,
    });
    counts = counts.filter(c => c.count > 0);
    const labels = counts.map(g => g.label);
    const data = counts.map(g => g.count);
    return { labels, data };
};

const getTransactionTagAmountSumTrendData = (filteredTransactions, accountsMap, timeFilter, tags) => {
    let sums = tags.map(({ _id, name }) => {
        const txns = filteredTransactions.filter(txn => txn.appliedTags[_id] == 1);
        return { label: name, sum: _.sumBy(txns, "amount") };
    });
    sums.push({
        label: "Untagged",
        sum: _.sumBy(filteredTransactions.filter(txn => txn.tagNames.length == 0), "amount"),
    });
    sums = sums.filter(c => c.sum > 0);
    const labels = sums.map(g => g.label);
    const data = sums.map(g => g.sum);
    return { labels, data };
};

export const charts = [
    {
        title: "Balance Trends Over Time",
        Chart: Bar,
        getData: getBalanceTrendData,
        getDatasets: (data) => [{
            label: "Balance (INR)",
            data: data,
            backgroundColor: "rgb(0, 123, 255)",
            fill: true
        }],
        filters: { "account.type": "bank" },
        groupBy: [],
        className: "col-sm-12 col-md-6 col-lg-4 mb-3",
    },
    {
        title: "Debit Over Time",
        Chart: Bar,
        getData: getTransactionTypeTrendData,
        getDatasets: (data) => [{
            label: "Debit Transactions (INR)",
            data: data,
            backgroundColor: "rgb(220, 53, 70)",
            fill: true
        }],
        filters: { "type": "DEBIT" },
        groupBy: [],
        className: "col-sm-12 col-md-6 col-lg-4 mb-3",
    },
    {
        title: "Credit Over Time",
        Chart: Bar,
        getData: getTransactionTypeTrendData,
        getDatasets: (data) => [{
            label: "Credit Transactions (INR)",
            data: data,
            backgroundColor: "rgb(40, 167, 70)",
            fill: true
        }],
        filters: { "type": "CREDIT" },
        groupBy: [],
        className: "col-sm-12 col-md-6 col-lg-4 mb-3",
    },
    {
        title: "Transaction Count Over Time",
        Chart: Bar,
        getData: getTransactionCountTrendData,
        getDatasets: (data) => [{
            label: "Transaction Count",
            data: data,
            backgroundColor: "rgb(0, 204, 255)",
            fill: true
        }],
        filters: { "account.type": "bank" },
        groupBy: [],
        className: "col-sm-12 col-md-6 col-lg-4 mb-3",
        showDatalabels: true,
    },
    {
        title: "Transaction Count by Amount Range",
        Chart: Bar,
        getData: getTransactionAmountTrendData,
        getDatasets: (data) => [{
            label: "No. of Transactions",
            data: data,
            backgroundColor: "rgb(255, 162, 0)",
            fill: true
        }],
        filters: { "account.type": "bank" },
        groupBy: [],
        className: "col-sm-12 col-md-6 col-lg-4 mb-3",
        showDatalabels: true,
    },
    {
        title: "Total Amount by Transaction Range",
        Chart: Bar,
        getData: getTransactionAmountSumTrendData,
        getDatasets: (data) => [{
            label: "Total Amount (INR)",
            data: data,
            backgroundColor: "rgb(40, 167, 131)",
            fill: true
        }],
        filters: { "account.type": "bank" },
        groupBy: [],
        className: "col-sm-12 col-md-6 col-lg-4 mb-3",
    },
    {
        title: "Transaction Count by Tags",
        Chart: Bar,
        getData: getTransactionTagCountTrendData,
        getDatasets: (data) => [{
            label: "No. of Transactions",
            data: data,
            backgroundColor: "rgb(140, 167, 40)",
            fill: true
        }],
        filters: { "account.type": "bank" },
        groupBy: [],
        className: "col-sm-12 col-md-6 col-lg-4 mb-3",
        showDatalabels: true,
    },
    {
        title: "Total Amount by Tags",
        Chart: Bar,
        getData: getTransactionTagAmountSumTrendData,
        getDatasets: (data) => [{
            label: "Total Amount (INR)",
            data: data,
            backgroundColor: "rgb(140, 167, 40)",
            fill: true
        }],
        filters: { "account.type": "bank" },
        groupBy: [],
        className: "col-sm-12 col-md-6 col-lg-4 mb-3",
    },
];