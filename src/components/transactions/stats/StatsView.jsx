"use strict";

import React from "react";
import "chart.js/auto";
import { setStatsGroupByPeriod } from "@store";
import { charts } from "@utils/statsChartUtilV2"
import { connect } from "react-redux";
import CheckDropdown from "@components/ui/CheckDropdown.jsx";
import SortDropdown from "@components/ui/SortDropdown.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { STATS_HELP } from "@utils/helpContent";

class StatsView extends React.Component {

    state = {
        visibleCharts: charts.map(c => c.key),
        expandedCharts: _.fromPairs(charts.map(c => [c.key, true])),
        sortBy: {},
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

    handleSortChange = (key, field, direction) => {
        this.setState(prev => ({ sortBy: { ...prev.sortBy, [key]: { field, direction } } }));
    }

    getChartCard = (chart) => {
        const { statsGroupByPeriod, filteredTransactions, accountsMap, tags } = this.props;
        if (!this.state.visibleCharts.includes(chart.key)) return null;
        const applicableTransactions = this.getApplicableTransactions(filteredTransactions, chart.filters);
        if (applicableTransactions.length == 0) return null;
        const sortBy = this.state.sortBy[chart.key] || chart.defaultSort;
        const chartData = chart.getData(applicableTransactions, accountsMap, statsGroupByPeriod, tags, sortBy);
        if (chartData.labels.length == 0) return null;
        const chartExpanded = this.state.expandedCharts[chart.key];
        return <div key={chart.key} className={chartExpanded ? "col-12 mb-3" : chart.className}>
            <div className="card shadow-sm p-3">
                <h5 className="card-title d-flex align-items-center gap-1">
                    {chart.title}
                    {STATS_HELP[chart.key] && <HelpTip text={STATS_HELP[chart.key]} />}
                    <div className="ms-auto d-flex align-items-center gap-2">
                        {chart.sortOptions && <SortDropdown
                            options={chart.sortOptions}
                            selected={sortBy}
                            onChange={(field, direction) => this.handleSortChange(chart.key, field, direction)} />}
                        {chart.hasTimeFilter && <select className="form-select form-select-sm w-auto" value={statsGroupByPeriod}
                            onChange={this.handleChange} onClick={e => e.stopPropagation()}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="overall">Overall</option>
                        </select>}
                        {/* TODO: re-enable expand toggle button
                        <i className={"bi " + (chartExpanded ? "bi-fullscreen-exit" : "bi-arrows-fullscreen")}
                            onClick={(e) => this.toggleExpand(chart.key, e)}></i>
                        */}
                    </div>
                </h5>
                <div className={"chart-container" + (chartExpanded ? " chart-expanded" : "")} key={chartExpanded}
                    style={chart.getHeight ? { height: chart.getHeight(chartData) } : {}}>
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
        const chartViews = this.getChartCards();
        return (
            <div className="">
                <div className="mb-2 d-flex align-items-center gap-1">
                    <div className="text-muted small page-header mb-0">Stats</div>
                    <HelpTip map={STATS_HELP} />
                    <div className="ms-auto stats-chart-dropdown"><CheckDropdown label="Charts" options={charts.map(c => ({ value: c.key, label: c.title }))}
                        selected={this.state.visibleCharts} onChange={visibleCharts => this.setState({ visibleCharts })} searchable /></div>
                </div>
                <div className="row">{chartViews}</div>
            </div>
        );
    }
};

export default connect(state => _.pick(state.user, ["statsGroupByPeriod", "accountsMap", "tags"]))(StatsView);