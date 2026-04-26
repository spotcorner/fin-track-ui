import { Bar } from "react-chartjs-2";
import statsUtil from "./statsUtil";
import amountUtil from "./amountUtil";

const DEBIT_COLOR = "rgba(220, 53, 70, 0.6)";
const CREDIT_COLOR = "rgba(40, 167, 70, 0.6)";
const DEBIT_LABEL_COLOR = "rgba(220, 53, 70, 0.8)";
const CREDIT_LABEL_COLOR = "rgba(40, 167, 70, 0.8)";

function getDebitCreditSplit(txns) {
    const debit = txns.filter(t => t.type === "DEBIT");
    const credit = txns.filter(t => t.type === "CREDIT");
    return { debit: _.sumBy(debit, "amount"), credit: _.sumBy(credit, "amount"), debitCount: debit.length, creditCount: credit.length, count: txns.length };
}

function buildDebitCreditDatasets(results) {
    return [
        { label: "Debit", data: results.map(r => r.debit), backgroundColor: DEBIT_COLOR, _counts: results.map(r => r.debitCount) },
        { label: "Credit", data: results.map(r => r.credit), backgroundColor: CREDIT_COLOR, _counts: results.map(r => r.creditCount) },
    ];
}

const getAmountByPeriodData = (filteredTransactions, accountsMap, timeFilter) => {
    const sorted = _.sortBy(filteredTransactions, "date");
    const periodMap = {};
    sorted.forEach(txn => {
        const period = statsUtil.formatDate(timeFilter, txn.date);
        if (!periodMap[period]) periodMap[period] = [];
        periodMap[period].push(txn);
    });
    const labels = Object.keys(periodMap);
    const results = labels.map(label => ({ label, ...getDebitCreditSplit(periodMap[label]) }));
    return { labels, datasets: buildDebitCreditDatasets(results) };
};

const getAmountByRangeData = (filteredTransactions) => {
    const results = statsUtil.getTransactionAmountRange().map(({ label, min, max }) => {
        const txns = filteredTransactions.filter(t => t.amount >= min && t.amount <= max);
        return { label, ...getDebitCreditSplit(txns) };
    }).filter(r => r.count > 0);
    return { labels: results.map(r => r.label), datasets: buildDebitCreditDatasets(results) };
};

const getAmountByTagData = (filteredTransactions, accountsMap, timeFilter, tags, sortBy) => {
    let results = tags.map(({ _id, name }) => {
        const txns = filteredTransactions.filter(t => t.appliedTags[_id] >= 1);
        return { label: name, ...getDebitCreditSplit(txns) };
    });
    const untagged = filteredTransactions.filter(t => !_.some(t.appliedTags, v => v >= 1));
    results.push({ label: "Untagged", ...getDebitCreditSplit(untagged) });
    results = results.filter(r => r.count > 0);
    if (sortBy) results = _.orderBy(results, sortBy.field === "name" ? [r => r.label.toLowerCase()] : [r => r.debit + r.credit], [sortBy.direction]);
    return { labels: results.map(r => r.label), datasets: buildDebitCreditDatasets(results) };
};

const fmt = amountUtil.getFormattedAmount;

const horizontalBarDatalabelsPlugin = {
    id: "horizontalBarDatalabels",
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        const debitDs = chart.data.datasets[0];
        const creditDs = chart.data.datasets[1];
        const meta = chart.getDatasetMeta(0);
        meta.data.forEach((bar, index) => {
            const debit = debitDs.data[index] || 0;
            const credit = creditDs?.data[index] || 0;
            if (!debit && !credit) return;
            ctx.save();
            ctx.textBaseline = "middle";
            ctx.textAlign = "left";
            ctx.font = "11px sans-serif";
            let x = 6 + Math.max(...chart.data.datasets.map((_, di) => chart.getDatasetMeta(di).data[index]?.x || 0));
            if (debit) { const dl = `₹${fmt(debit)} (${debitDs._counts[index]})`; ctx.fillStyle = DEBIT_LABEL_COLOR; ctx.fillText(dl, x, bar.y); x += ctx.measureText(dl).width + 8; }
            if (credit) { const cl = `₹${fmt(credit)} (${creditDs._counts[index]})`; ctx.fillStyle = CREDIT_LABEL_COLOR; ctx.fillText(cl, x, bar.y); }
            ctx.restore();
        });
    },
};

const STACKED_SCALES = { scales: { x: { stacked: true }, y: { stacked: true } } };

const getHorizontalBarOptions = (labelCount) => ({
    indexAxis: "y",
    aspectRatio: Math.max(0.5, 2 - labelCount * 0.05),
    layout: { padding: { right: 100 } },
    plugins: {
        tooltip: {
            callbacks: {
                label: (context) => {
                    const count = context.dataset._counts?.[context.dataIndex];
                    const value = fmt(context.raw);
                    return count != null ? `₹${value} (${count})` : `₹${value}`;
                },
            },
        },
        legend: { display: false },
    },
    ...STACKED_SCALES,
});

export const charts = [
    {
        key: "tags",
        title: "Amount by Tags",
        Chart: Bar,
        getData: getAmountByTagData,
        className: "col-sm-12 col-md-6 mb-3",
        getOptions: (data) => getHorizontalBarOptions(data.labels.length),
        getHeight: (data) => Math.max(500, data.labels.length * 25),
        plugins: [horizontalBarDatalabelsPlugin],
        sortOptions: [{ field: "sum", label: "Amount" }, { field: "name", label: "Name" }],
        defaultSort: { field: "sum", direction: "desc" },
    },
    {
        key: "range",
        title: "Amount by Range",
        Chart: Bar,
        getData: getAmountByRangeData,
        className: "col-sm-12 col-md-6 mb-3",
        getOptions: (data) => getHorizontalBarOptions(data.labels.length),
        plugins: [horizontalBarDatalabelsPlugin],
    },
    {
        key: "trends",
        title: "Amount by Period",
        Chart: Bar,
        getData: getAmountByPeriodData,
        className: "col-sm-12 col-md-6 mb-3",
        getOptions: (data) => getHorizontalBarOptions(data.labels.length),
        getHeight: (data) => Math.max(300, data.labels.length * 25),
        plugins: [horizontalBarDatalabelsPlugin],
        hasTimeFilter: true,
    },
];
