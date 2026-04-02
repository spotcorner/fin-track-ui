import { Bar, Line } from "react-chartjs-2";
import statsUtil from "./statsUtil";
import amountUtil from "./amountUtil";

const getBalanceDebitCreditTrendData = (filteredTransactions, accountsMap, timeFilter) => {
    let cumulativeBalance = statsUtil.getCummulativeBalance(filteredTransactions, accountsMap);
    const trendData = {};
    filteredTransactions.forEach(txn => {
        const date = statsUtil.formatDate(timeFilter, txn.date);
        if (!trendData[date]) trendData[date] = { balance: cumulativeBalance, debit: 0, credit: 0 };
        if (txn.type === "CREDIT") {
            cumulativeBalance += txn.amount;
            trendData[date].credit += txn.amount;
        } else {
            cumulativeBalance -= txn.amount;
            trendData[date].debit += txn.amount;
        }
        trendData[date].balance = cumulativeBalance;
    });
    const labels = Object.keys(trendData);
    return {
        labels,
        datasets: [
            { label: "Balance", data: labels.map(d => trendData[d].balance), borderColor: "rgb(0, 123, 255)", backgroundColor: "rgba(0, 123, 255, 0.1)", fill: true, tension: 0.3 },
            { label: "Debit", data: labels.map(d => trendData[d].debit), borderColor: "rgb(220, 53, 70)", backgroundColor: "rgba(220, 53, 70, 0.1)", fill: true, tension: 0.3 },
            { label: "Credit", data: labels.map(d => trendData[d].credit), borderColor: "rgb(40, 167, 70)", backgroundColor: "rgba(40, 167, 70, 0.1)", fill: true, tension: 0.3 },
        ],
    };
};

const COLORS = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
    "#FF9F40", "#7BC67E", "#E77C8E", "#A78BFA", "#F472B6",
    "#34D399", "#60A5FA", "#FBBF24", "#F87171", "#818CF8",
];

const getAmountByRangeData = (filteredTransactions) => {
    const ranges = statsUtil.getTransactionAmountRange();
    const results = ranges.map(({ label, min, max }) => {
        const txns = filteredTransactions.filter(t => t.amount >= min && t.amount <= max);
        return { label, count: txns.length, sum: _.sumBy(txns, "amount") };
    }).filter(r => r.count > 0);
    return {
        labels: results.map(r => r.label),
        datasets: [{ data: results.map(r => r.sum), backgroundColor: COLORS.slice(0, results.length), _counts: results.map(r => r.count) }],
    };
};

const getAmountByTagData = (filteredTransactions, accountsMap, timeFilter, tags) => {
    let results = tags.map(({ _id, name }) => {
        const txns = filteredTransactions.filter(t => t.appliedTags[_id] >= 1);
        return { label: name, count: txns.length, sum: _.sumBy(txns, "amount") };
    });
    const untagged = filteredTransactions.filter(t => !_.some(t.appliedTags, v => v >= 1));
    results.push({ label: "Untagged", count: untagged.length, sum: _.sumBy(untagged, "amount") });
    results = results.filter(r => r.count > 0);
    return {
        labels: results.map(r => r.label),
        datasets: [{ data: results.map(r => r.sum), backgroundColor: COLORS.slice(0, results.length), _counts: results.map(r => r.count) }],
    };
};

const horizontalBarDatalabelsPlugin = {
    id: "horizontalBarDatalabels",
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((dataset, i) => {
            const counts = dataset._counts;
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                const value = dataset.data[index];
                if (!value) return;
                ctx.save();
                ctx.textBaseline = "middle";
                ctx.textAlign = "left";
                ctx.fillStyle = "#333";
                ctx.font = "12px sans-serif";
                const label = `₹${amountUtil.getFormattedAmount(value)}` + (counts ? ` (${counts[index]})` : "");
                ctx.fillText(label, bar.x + 6, bar.y);
                ctx.restore();
            });
        });
    },
};

const horizontalBarOptions = {
    indexAxis: "y",
    plugins: {
        tooltip: {
            callbacks: {
                label: (context) => {
                    const counts = context.dataset._counts;
                    const value = amountUtil.getFormattedAmount(context.raw);
                    const count = counts?.[context.dataIndex];
                    return count != null ? `₹${value} (${count})` : `₹${value}`;
                },
            },
        },
        legend: { display: false },
    },
};

export const charts = [
    {
        title: "Amount by Tags",
        Chart: Bar,
        getData: getAmountByTagData,
        filters: { "account.type": "bank" },
        className: "col-sm-12 col-md-6 mb-3",
        options: horizontalBarOptions,
        plugins: [horizontalBarDatalabelsPlugin],
    },
    {
        title: "Amount by Range",
        Chart: Bar,
        getData: getAmountByRangeData,
        filters: { "account.type": "bank" },
        className: "col-sm-12 col-md-6 mb-3",
        options: horizontalBarOptions,
        plugins: [horizontalBarDatalabelsPlugin],
    },
    {
        title: "Balance, Debit & Credit Over Time",
        Chart: Line,
        getData: getBalanceDebitCreditTrendData,
        filters: { "account.type": "bank" },
        className: "col-sm-12 col-md-6 mb-3",
        hasTimeFilter: true,
    },
];
