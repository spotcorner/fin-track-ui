"use strict";

import React from "react";
import "chart.js/auto";
import { setStatsGroupByPeriod } from "@store";
import { charts } from "@utils/statsChartUtilV2"
import { connect } from "react-redux";
import CheckDropdown from "@components/ui/CheckDropdown.jsx";

class StatsView extends React.Component {

    state = {
        collapsed: this.props.isDraft == 1,
        visibleCharts: this.props.isDraft == 1 ? charts.map(c => c.key) : ["tags"],
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

    toggleExpand = (key, e) => {
        e.stopPropagation();
        this.setState(prev => ({
            expandedCharts: { ...prev.expandedCharts, [key]: !prev.expandedCharts[key] },
        }));
    }

    getChartCard = (chart) => {
        const { statsGroupByPeriod, filteredTransactions, accountsMap, tags } = this.props;
        if (!this.state.visibleCharts.includes(chart.key)) return null;
        const applicableTransactions = this.getApplicableTransactions(filteredTransactions, chart.filters);
        if (applicableTransactions.length == 0) return null;
        const chartData = chart.getData(applicableTransactions, accountsMap, statsGroupByPeriod, tags);
        if (chartData.labels.length == 0) return null;
        const chartExpanded = this.state.expandedCharts[chart.key];
        return <div key={chart.key} className={chartExpanded ? "col-12 mb-3" : chart.className}>
            <div className="card shadow-sm p-3">
                <h5 className="card-title d-flex align-items-center">
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
                </h5>
                <div className={"chart-container" + (chartExpanded ? " chart-expanded" : "")} key={chartExpanded}>
                    <chart.Chart data={chartData}
                        options={{ ...(chart.getOptions ? chart.getOptions(chartData) : chart.options || {}), ...(chartExpanded ? { maintainAspectRatio: false, responsive: true } : {}) }}
                        plugins={chart.plugins || []} />
                </div>
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
                <div className="mb-2 d-flex align-items-center">
                    <div className="text-muted small page-header mb-0 cursor-pointer"
                        onClick={() => this.setState({ collapsed: !collapsed })}>Stats</div>
                    {!collapsed && <div className="ms-auto stats-chart-dropdown"><CheckDropdown label="Charts" options={charts.map(c => ({ value: c.key, label: c.title }))}
                        selected={this.state.visibleCharts} onChange={visibleCharts => this.setState({ visibleCharts })} searchable /></div>}
                    <i className={"bi cursor-pointer " + (collapsed ? "bi-plus-square ms-auto" : "bi-dash-square ms-2")}
                        onClick={() => this.setState({ collapsed: !collapsed })}></i>
                </div>
                {!collapsed && <div className="row">{chartViews}</div>}
            </div>
        );
    }
};

export default connect(state => _.pick(state.user, ["statsGroupByPeriod", "accountsMap", "tags"]))(StatsView);