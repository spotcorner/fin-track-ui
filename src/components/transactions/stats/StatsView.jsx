"use strict";

import React from "react";
import "chart.js/auto";
import { charts } from "@utils/statsChartUtilV2"
import { connect } from "react-redux";
import CheckDropdown from "@components/ui/CheckDropdown.jsx";
import SortDropdown from "@components/ui/SortDropdown.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { STATS_HELP } from "@utils/helpContent";
import PreferenceStore from "@utils/PreferenceStore";

class StatsView extends React.Component {

    groupByPeriodPref = new PreferenceStore(`${this.props.prefStoreKey}.stats.groupByPeriod`, "weekly");

    state = {
        visibleCharts: charts.map(c => c.key),
        groupByPeriod: this.groupByPeriodPref.get(),
        sortBy: {},
    }

    handleGroupByPeriodChange = (e) => {
        this.setState({ groupByPeriod: e.target.value }, () => this.groupByPeriodPref.set(this.state.groupByPeriod));
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

    handleChartSortChange = (key, field, direction) => {
        this.setState(prev => ({ sortBy: { ...prev.sortBy, [key]: { field, direction } } }));
    }

    getChartSortDropdown(chart, sortBy) {
        if (!chart.sortOptions) return null;
        return <SortDropdown
            options={chart.sortOptions}
            selected={sortBy}
            prefStoreKey={`${this.props.prefStoreKey}.stats.sort.${chart.key}`}
            onChange={(field, direction) => this.handleChartSortChange(chart.key, field, direction)} />;
    }

    getGroupByPeriodSelect(chart) {
        if (!chart.hasTimeFilter) return null;
        return <select className="form-select form-select-sm w-auto" value={this.state.groupByPeriod}
            onChange={this.handleGroupByPeriodChange} onClick={e => e.stopPropagation()}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="overall">Overall</option>
        </select>;
    }

    getChartControls(chart, sortBy) {
        return <div className="ms-auto d-flex align-items-center gap-2">
            {this.getChartSortDropdown(chart, sortBy)}
            {this.getGroupByPeriodSelect(chart)}
        </div>;
    }

    getChartCard = (chart) => {
        const { filteredTransactions, accountsMap, tags } = this.props;
        if (!this.state.visibleCharts.includes(chart.key)) return null;
        const applicableTransactions = this.getApplicableTransactions(filteredTransactions, chart.filters);
        if (applicableTransactions.length == 0) return null;
        const sortBy = this.state.sortBy[chart.key] || chart.defaultSort;
        const chartData = chart.getData(applicableTransactions, accountsMap, this.state.groupByPeriod, tags, sortBy);
        if (chartData.labels.length == 0) return null;
        const chartExpanded = true; // this.state.expandedCharts[chart.key];
        return <div key={chart.key} className={chartExpanded ? "col-12 mb-3" : chart.className}>
            <div className="card shadow-sm p-3">
                <h5 className="card-title d-flex align-items-center gap-1">
                    {chart.title}
                    {STATS_HELP[chart.key] && <HelpTip text={STATS_HELP[chart.key]} />}
                    {this.getChartControls(chart, sortBy)}
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
                    <HelpTip items={STATS_HELP.overview} />
                    <div className="ms-auto stats-chart-dropdown"><CheckDropdown label="Charts" options={charts.map(c => ({ value: c.key, label: c.title }))}
                        selected={this.state.visibleCharts} onChange={visibleCharts => this.setState({ visibleCharts })} searchable
                        prefStoreKey={`${this.props.prefStoreKey}.stats.visibleCharts`} /></div>
                </div>
                <div className="row">{chartViews.length > 0 ? chartViews : <div className="text-muted small ms-1">No charts selected. Use the Charts dropdown to show charts.</div>}</div>
            </div>
        );
    }
};

export default connect(state => _.pick(state.user, ["accountsMap", "tags"]))(StatsView);