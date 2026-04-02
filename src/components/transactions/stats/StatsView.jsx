"use strict";

import React from "react";
import "chart.js/auto";
import { setStatsGroupByPeriod } from "@store";
import { charts } from "@utils/statsChartUtilV2"
import { connect } from "react-redux";

class StatsView extends React.Component {

    state = {
        collapsed: false,
        collapsedCharts: {},
        expandedCharts: { tags: true },
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

    toggleChart = (key) => {
        this.setState(prev => ({
            collapsedCharts: { ...prev.collapsedCharts, [key]: !prev.collapsedCharts[key] },
        }));
    }

    toggleExpand = (key, e) => {
        e.stopPropagation();
        this.setState(prev => ({
            expandedCharts: { ...prev.expandedCharts, [key]: !prev.expandedCharts[key] },
        }));
    }

    getChartCard = (chart) => {
        const { statsGroupByPeriod, filteredTransactions, accountsMap, tags } = this.props;
        const applicableTransactions = this.getApplicableTransactions(filteredTransactions, chart.filters);
        if (applicableTransactions.length == 0) return null;
        const chartData = chart.getData(applicableTransactions, accountsMap, statsGroupByPeriod, tags);
        if (chartData.labels.length == 0) return null;
        const chartCollapsed = this.state.collapsedCharts[chart.key];
        const chartExpanded = this.state.expandedCharts[chart.key];
        return <div key={chart.key} className={chartExpanded ? "col-12 mb-3" : chart.className}>
            <div className="card shadow-sm p-3">
                <h5 className="card-title cursor-pointer d-flex align-items-center" onClick={() => this.toggleChart(chart.key)}>
                    {chart.title}
                    {chart.hasTimeFilter && <select className="form-select form-select-sm w-auto ms-2" value={statsGroupByPeriod}
                        onChange={this.handleChange} onClick={e => e.stopPropagation()}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="overall">Overall</option>
                    </select>}
                    <i className={"bi ms-auto " + (chartExpanded ? "bi-fullscreen-exit" : "bi-arrows-fullscreen")}
                        onClick={(e) => this.toggleExpand(chart.key, e)}></i>
                    <i className={"bi ms-2 " + (chartCollapsed ? "bi-plus-square" : "bi-dash-square")}></i>
                </h5>
                {!chartCollapsed && <div className={"chart-container" + (chartExpanded ? " chart-expanded" : "")} key={chartExpanded}>
                    <chart.Chart data={chartData}
                        options={{ ...(chart.getOptions ? chart.getOptions(chartData) : chart.options || {}), ...(chartExpanded ? { maintainAspectRatio: false, responsive: true } : {}) }}
                        plugins={chart.plugins || []} />
                </div>}
            </div>
        </div>;
    }

    getChartCards() {
        return charts.map(this.getChartCard).filter(c => c != null);
    }

    render() {
        const { filteredTransactions } = this.props;
        if (filteredTransactions.length == 0) return <div />;
        const { collapsed } = this.state;
        const chartViews = this.getChartCards();
        return (
            <div className="">
                <div className="mb-2 d-flex align-items-center cursor-pointer"
                    onClick={() => this.setState({ collapsed: !collapsed })}>
                    <div className="text-muted small page-header mb-0">Stats</div>
                    <i className={"bi ms-2 " + (collapsed ? "bi-plus-square" : "bi-dash-square")}></i>
                </div>
                {!collapsed && <div className="row">{chartViews}</div>}
            </div>
        );
    }
};

export default connect(state => _.pick(state.user, ["statsGroupByPeriod", "accountsMap", "tags"]))(StatsView);