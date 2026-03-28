"use strict";

import React from "react";
import "chart.js/auto";
import { setStatsGroupByPeriod } from "@store";
import { charts } from "@utils/statsChartUtil"
import { connect } from "react-redux";
import amountUtil from "@utils/amountUtil";

const datalabelsPlugin = {
    id: "datalabels",
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                const value = dataset.data[index];
                if (!value) return;
                ctx.save();
                ctx.textAlign = "center";
                ctx.fillText(amountUtil.getFormattedAmount(value), bar.x, bar.y - 5);
                ctx.restore();
            });
        });
    },
};

class StatsView extends React.Component {

    state = {
        collapsed: true,
        collapsedCharts: {},
    }

    handleChange = (e) => {
        this.props.dispatch(setStatsGroupByPeriod(e.target.value));
    }

    getApplicableTransactions(transactions, filters) {
        return _.filter(transactions, (transaction) => {
            if (_.isEmpty(filters)) return true;
            return _.every(filters, (value, key) => {
                return _.get(transaction, key) == value;
            });
        });
    }

    toggleChart = (index) => {
        this.setState(prev => ({
            collapsedCharts: { ...prev.collapsedCharts, [index]: !prev.collapsedCharts[index] },
        }));
    }

    getChartCard = (chart, index) => {
        const { statsGroupByPeriod, filteredTransactions, accountsMap, rules } = this.props;
        const applicableTransactions = this.getApplicableTransactions(filteredTransactions, chart.filters);
        if (applicableTransactions.length == 0) return null;
        const { labels, data } = chart.getData(applicableTransactions, accountsMap, statsGroupByPeriod, rules);
        const datasets = chart.getDatasets(data);
        const chartCollapsed = this.state.collapsedCharts[index];
        return <div key={index} className={chart.className}>
            <div className="card shadow-sm p-3">
                <h5 className="card-title cursor-pointer d-flex align-items-center" onClick={() => this.toggleChart(index)}>
                    {chart.title}
                    <i className={"bi ms-auto " + (chartCollapsed ? "bi-plus-square" : "bi-dash-square")}></i>
                </h5>
                {!chartCollapsed && <div className="chart-container">
                    <chart.Chart data={{ labels, datasets }}
                        plugins={chart.showDatalabels ? [datalabelsPlugin] : []} />
                </div>}
            </div>
        </div>;
    }

    getChartCards() {
        return charts.map(this.getChartCard).filter(c => c != null);
    }

    render() {
        const { statsGroupByPeriod, filteredTransactions } = this.props;
        if (filteredTransactions.length == 0) return <div />;
        const { collapsed } = this.state;
        const chartViews = this.getChartCards();
        return (
            <div className="">
                <div className="mb-2 d-flex align-items-center cursor-pointer"
                    onClick={() => this.setState({ collapsed: !collapsed })}>
                    <h3 className="mb-0">Stats</h3>
                    <i className={"bi ms-2 " + (collapsed ? "bi-plus-square" : "bi-dash-square")}></i>
                    {!collapsed && <select className="form-select w-auto ms-auto" value={statsGroupByPeriod}
                        onChange={this.handleChange} onClick={e => e.stopPropagation()}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="overall">Overall</option>
                    </select>}
                </div>
                {!collapsed && <div className="row">{chartViews}</div>}
            </div>
        );
    }
};

export default connect(state => _.pick(state.user, ["statsGroupByPeriod", "accountsMap", "rules"]))(StatsView);