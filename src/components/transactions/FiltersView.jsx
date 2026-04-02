"use strict";

import React from "react";
import { connect } from "react-redux";
import { ACCOUNT_TYPE_LABELS, TRANSACTION_TYPES } from "@config";
import CheckDropdown from "@components/ui/CheckDropdown.jsx";
import SortDropdown from "@components/ui/SortDropdown.jsx";
import labelUtil from "@utils/labelUtil";
import "@styles/filtersView.scss";

class FiltersView extends React.Component {

    state = { showPanel: false, collapsed: false }

    handleFilterChange = (e) => {
        this.props.handleFilterChange(e.target.name, e.target.value);
    };

    hasActiveFilters() {
        const { filters } = this.props;
        return filters.minAmountFilter || filters.maxAmountFilter || filters.transactionTypeFilter.length
            || filters.excludeFromTotalsFilter.length || filters.accountTypeFilter.length
            || filters.accountIdFilter.length || filters.tagFilter.length || filters.searchFilter;
    }

    getSortOptions() {
        return [{ field: "date", label: "Date" }, { field: "amount", label: "Amount" }, { field: "updatedAt", label: "Updated" }];
    }

    getSortSelected() {
        return { field: this.props.filters.sortField, direction: this.props.filters.sortDirection };
    }

    handleSortChange = (field, direction) => {
        this.props.handleFilterChange("sortField", field);
        this.props.handleFilterChange("sortDirection", direction);
    };

    getCollapsedBar() {
        const { filters } = this.props;
        const hasFilters = this.hasActiveFilters();
        const chips = this.getChipCount();
        return <div className="filter-bar">
            <div className="filter-row">
                <span className="filter-collapsed-summary">
                    {chips > 0 && <><i className={"bi bi-funnel" + (hasFilters ? "-fill" : "")}></i> {chips} filter{chips > 1 ? "s" : ""} · </>}
                    <SortDropdown options={this.getSortOptions()} selected={this.getSortSelected()} onChange={this.handleSortChange} />
                </span>
                <div className="flex-grow-1"></div>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => this.setState({ collapsed: false })}>
                    <i className="bi bi-plus-lg"></i>
                </button>
            </div>
        </div>;
    }

    getChipCount() {
        const { filters } = this.props;
        let count = 0;
        count += filters.transactionTypeFilter.length;
        count += filters.excludeFromTotalsFilter.length;
        if (filters.minAmountFilter) count++;
        if (filters.maxAmountFilter) count++;
        count += filters.accountTypeFilter.length;
        count += filters.accountIdFilter.length;
        count += filters.tagFilter.length;
        if (filters.searchFilter) count++;
        return count;
    }

    getFilterBar() {
        const { filters } = this.props;
        const hasFilters = this.hasActiveFilters();
        return <div className={"filter-bar" + (hasFilters || this.state.showPanel ? " filter-bar-open" : "")}>
            <div className="filter-row">
                <div className="input-group input-group-sm filter-date">
                    <span className="input-group-text">From</span>
                    <input type="date" name="startDateFilter" value={filters.startDateFilter} className="form-control" onChange={this.handleFilterChange} />
                    <span className="input-group-text">To</span>
                    <input type="date" name="endDateFilter" value={filters.endDateFilter} className="form-control" onChange={this.handleFilterChange} />
                    <button className="btn btn-outline-secondary btn-sm" onClick={this.props.resetDateFilter}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="flex-grow-1"></div>
                <div className="input-group input-group-sm filter-search">
                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                    <input type="search" name="searchFilter" value={filters.searchFilter} className="form-control" placeholder="Search..." onChange={this.handleFilterChange} />
                    <button className={"btn btn-sm " + (filters.searchCaseSensitive ? "btn-dark" : "btn-outline-secondary")}
                        title="Match Case" onClick={() => this.props.handleFilterChange("searchCaseSensitive", !filters.searchCaseSensitive)}>
                        Aa
                    </button>
                    <button className={"btn btn-sm " + (filters.searchRegex ? "btn-dark" : "btn-outline-secondary")}
                        title="Use Regex" onClick={() => this.props.handleFilterChange("searchRegex", !filters.searchRegex)}>
                        .*
                    </button>
                </div>
                <SortDropdown options={this.getSortOptions()} selected={this.getSortSelected()} onChange={this.handleSortChange} />
                <button className={"btn btn-sm " + (hasFilters || this.state.showPanel ? "btn-dark" : "btn-outline-secondary")}
                    onClick={() => this.setState({ showPanel: !this.state.showPanel })}>
                    <i className={"bi bi-funnel" + (hasFilters ? "-fill" : "")}></i>
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => this.setState({ collapsed: true, showPanel: false })}>
                    <i className="bi bi-dash-lg"></i>
                </button>
            </div>
        </div>;
    }

    getChips() {
        const { filters, accountsMap, tagsMap } = this.props;
        const chips = [];
        if (filters.transactionTypeFilter.length) filters.transactionTypeFilter.forEach(v => chips.push({ label: v === TRANSACTION_TYPES.DEBIT ? "Debit" : "Credit", onRemove: () => this.props.handleFilterChange("transactionTypeFilter", filters.transactionTypeFilter.filter(x => x !== v)) }));
        filters.excludeFromTotalsFilter.forEach(v => chips.push({ label: v === "1" ? "Excluded" : "Included", onRemove: () => this.props.handleFilterChange("excludeFromTotalsFilter", filters.excludeFromTotalsFilter.filter(x => x !== v)) }));
        if (filters.minAmountFilter) chips.push({ label: "Min: ₹" + filters.minAmountFilter, onRemove: () => this.props.handleFilterChange("minAmountFilter", "") });
        if (filters.maxAmountFilter) chips.push({ label: "Max: ₹" + filters.maxAmountFilter, onRemove: () => this.props.handleFilterChange("maxAmountFilter", "") });
        filters.accountTypeFilter.forEach(type => chips.push({ label: ACCOUNT_TYPE_LABELS[type] || type, onRemove: () => this.props.handleFilterChange("accountTypeFilter", filters.accountTypeFilter.filter(v => v !== type)) }));
        filters.accountIdFilter.forEach(id => chips.push({ label: labelUtil.getAccountLabel(accountsMap[id]) || id, onRemove: () => this.props.handleFilterChange("accountIdFilter", filters.accountIdFilter.filter(v => v !== id)) }));
        filters.tagFilter.forEach(id => chips.push({ label: id === "__NONE__" ? "Untagged" : (tagsMap[id]?.name || id), onRemove: () => this.props.handleFilterChange("tagFilter", filters.tagFilter.filter(v => v !== id)) }));
        if (!chips.length) return null;
        return <div className={"filter-chips d-flex flex-wrap gap-1" + (this.state.showPanel ? " filter-chips-with-panel" : "")}>
            {chips.map((chip, i) => <span key={i} className="badge bg-dark filter-chip" onClick={chip.onRemove}>
                {chip.label} &times;
            </span>)}
        </div>;
    }

    getPanel() {
        if (!this.state.showPanel) return null;
        const { filters, accountsMap, tagsMap } = this.props;
        const accountTypeOptions = _.keys(_.groupBy(accountsMap, "type")).map(type => ({ value: type, label: ACCOUNT_TYPE_LABELS[type] || type }));
        const accountOptions = _.values(accountsMap).map(a => ({ value: a._id, label: labelUtil.getAccountLabel(a) }));
        const tagOptions = [
            { value: "__NONE__", label: "Untagged", separator: true },
            ..._.values(tagsMap).map(t => ({ value: t._id, label: t.name })),
        ];
        return <div className="filter-panel">
            <div className="row g-2">
                <div className="col-md-6">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">Min ₹</span>
                        <input type="number" name="minAmountFilter" value={filters.minAmountFilter} className="form-control" onChange={this.handleFilterChange} />
                        <span className="input-group-text">Max ₹</span>
                        <input type="number" name="maxAmountFilter" value={filters.maxAmountFilter} className="form-control" onChange={this.handleFilterChange} />
                    </div>
                </div>
                <div className="col-md-3">
                    <CheckDropdown label="Type" options={[{ value: TRANSACTION_TYPES.DEBIT, label: "Debit" }, { value: TRANSACTION_TYPES.CREDIT, label: "Credit" }]}
                        selected={filters.transactionTypeFilter} onChange={v => this.props.handleFilterChange("transactionTypeFilter", v)} />
                </div>
                <div className="col-md-3">
                    <CheckDropdown label="Totals" options={[{ value: "0", label: "Included" }, { value: "1", label: "Excluded" }]}
                        selected={filters.excludeFromTotalsFilter} onChange={v => this.props.handleFilterChange("excludeFromTotalsFilter", v)} />
                </div>
                <div className="col-md-4">
                    <CheckDropdown label="Account Type" options={accountTypeOptions}
                        selected={filters.accountTypeFilter} onChange={v => this.props.handleFilterChange("accountTypeFilter", v)} />
                </div>
                <div className="col-md-4">
                    <CheckDropdown label="Account" options={accountOptions}
                        selected={filters.accountIdFilter} onChange={v => this.props.handleFilterChange("accountIdFilter", v)} />
                </div>
                <div className="col-md-4">
                    <CheckDropdown label="Tag" options={tagOptions}
                        selected={filters.tagFilter} onChange={v => this.props.handleFilterChange("tagFilter", v)} />
                </div>
            </div>
            <div className="mt-2 text-end">
                <button className="btn btn-outline-secondary btn-sm" onClick={this.props.resetFilters}>
                    <i className="bi bi-trash"></i> Clear All
                </button>
            </div>
        </div>;
    }

    render() {
        if (this.state.collapsed) return <div className="mb-2 filter-sticky">{this.getCollapsedBar()}</div>;
        return <div className="mb-2 filter-sticky">
            {this.getFilterBar()}
            {this.getChips()}
            {this.getPanel()}
        </div>;
    }
}

export default connect(state => _.pick(state.user, ["accountsMap", "tagsMap"]))(FiltersView);
