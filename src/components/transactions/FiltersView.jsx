"use strict";

import React from "react";
import { connect } from "react-redux";
import { ACCOUNT_TYPE_LABELS, TRANSACTION_TYPES } from "@config";
import CheckDropdown from "@components/ui/CheckDropdown.jsx";
import SortDropdown from "@components/ui/SortDropdown.jsx";
import labelUtil from "@utils/labelUtil";
import "@styles/filtersView.scss";

class FiltersView extends React.Component {

    state = { showPanel: false }

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

    getTagOptions() {
        return [
            { value: "__NONE__", label: "Untagged", separator: true },
            ..._.values(this.props.tagsMap).map(t => ({ value: t._id, label: t.name })),
        ];
    }

    getFilterBar(counts) {
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
                <div className="col-md-2">
                    <CheckDropdown label="Tags" options={this.getTagOptions()} searchable sortByLabel pinSelected
                        selected={filters.tagFilter} onChange={v => this.props.handleFilterChange("tagFilter", v)} countMap={counts.tag} />
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
                    <i className={"bi bi-funnel" + (hasFilters ? "-fill" : "")}></i> Filters
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

    matchesFilters(t, skip) {
        const { filters, accountsMap } = this.props;
        if (skip !== "amount") {
            if (filters.minAmountFilter && t.amount < filters.minAmountFilter) return false;
            if (filters.maxAmountFilter && t.amount > filters.maxAmountFilter) return false;
        }
        if (skip !== "excludeFromTotals" && filters.excludeFromTotalsFilter.length && !filters.excludeFromTotalsFilter.includes(String(t.excludeFromTotals ? 1 : 0))) return false;
        const acc = accountsMap?.[t.accountId] || {};
        if (skip !== "accountType" && filters.accountTypeFilter.length && !filters.accountTypeFilter.includes(acc.type)) return false;
        if (skip !== "accountId" && filters.accountIdFilter.length && !filters.accountIdFilter.includes(t.accountId)) return false;
        if (skip !== "transactionType" && filters.transactionTypeFilter.length && !filters.transactionTypeFilter.includes(t.type)) return false;
        if (skip !== "tag" && filters.tagFilter.length) {
            const hasUntagged = filters.tagFilter.includes("__NONE__");
            const tagIds = filters.tagFilter.filter(id => id !== "__NONE__");
            const isUntagged = !_.some(t.appliedTags, v => v >= 1);
            const matchesTag = tagIds.length && _.some(tagIds, id => t.appliedTags[id] >= 1);
            if (!(hasUntagged && isUntagged) && !matchesTag) return false;
        }
        if (skip !== "search" && filters.searchFilter) {
            if (filters.searchRegex) {
                try { if (!new RegExp(filters.searchFilter, filters.searchCaseSensitive ? "" : "i").test(t.description)) return false; }
                catch (e) { return false; }
            } else {
                const match = filters.searchCaseSensitive ? _.includes(t.description, filters.searchFilter) : _.includes(_.toLower(t.description), _.toLower(filters.searchFilter));
                if (!match) return false;
            }
        }
        return true;
    }

    getCounts() {
        const { transactions, accountsMap } = this.props;
        const counts = { type: {}, totals: {}, accountType: {}, account: {}, tag: {} };
        (transactions || []).forEach(t => {
            if (this.matchesFilters(t, "transactionType")) counts.type[t.type] = (counts.type[t.type] || 0) + 1;
            if (this.matchesFilters(t, "excludeFromTotals")) counts.totals[t.excludeFromTotals ? "1" : "0"] = (counts.totals[t.excludeFromTotals ? "1" : "0"] || 0) + 1;
            const acc = accountsMap?.[t.accountId];
            if (acc?.type && this.matchesFilters(t, "accountType")) counts.accountType[acc.type] = (counts.accountType[acc.type] || 0) + 1;
            if (t.accountId && this.matchesFilters(t, "accountId")) counts.account[t.accountId] = (counts.account[t.accountId] || 0) + 1;
            if (this.matchesFilters(t, "tag")) {
                const hasTag = _.some(t.appliedTags, v => v >= 1);
                if (!hasTag) counts.tag["__NONE__"] = (counts.tag["__NONE__"] || 0) + 1;
                _.forEach(t.appliedTags, (v, id) => { if (v >= 1) counts.tag[id] = (counts.tag[id] || 0) + 1; });
            }
        });
        return counts;
    }

    getPanel(counts) {
        if (!this.state.showPanel) return null;
        const { filters, accountsMap, tagsMap } = this.props;
        const accountTypeOptions = _.keys(_.groupBy(accountsMap, "type")).map(type => ({ value: type, label: ACCOUNT_TYPE_LABELS[type] || type }));
        const accountOptions = _.values(accountsMap).map(a => ({ value: a._id, label: labelUtil.getAccountLabel(a) }));
        return <div className="filter-panel">
            <div className="row g-2">
                <div className="col-md-4">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">Min ₹</span>
                        <input type="number" name="minAmountFilter" value={filters.minAmountFilter} className="form-control" onChange={this.handleFilterChange} />
                        <span className="input-group-text">Max ₹</span>
                        <input type="number" name="maxAmountFilter" value={filters.maxAmountFilter} className="form-control" onChange={this.handleFilterChange} />
                    </div>
                </div>
                <div className="col-md-2">
                    <CheckDropdown label="Type" options={[{ value: TRANSACTION_TYPES.DEBIT, label: "Debit" }, { value: TRANSACTION_TYPES.CREDIT, label: "Credit" }]}
                        selected={filters.transactionTypeFilter} onChange={v => this.props.handleFilterChange("transactionTypeFilter", v)} countMap={counts.type} />
                </div>
                <div className="col-md-2">
                    <CheckDropdown label="Totals" options={[{ value: "0", label: "Included" }, { value: "1", label: "Excluded" }]}
                        selected={filters.excludeFromTotalsFilter} onChange={v => this.props.handleFilterChange("excludeFromTotalsFilter", v)} countMap={counts.totals} />
                </div>
                <div className="col-md-2">
                    <CheckDropdown label="Account Type" options={accountTypeOptions}
                        selected={filters.accountTypeFilter} onChange={v => this.props.handleFilterChange("accountTypeFilter", v)} countMap={counts.accountType} />
                </div>
                <div className="col-md-2">
                    <CheckDropdown label="Account" options={accountOptions} searchable sortByLabel pinSelected
                        selected={filters.accountIdFilter} onChange={v => this.props.handleFilterChange("accountIdFilter", v)} countMap={counts.account} />
                </div>
            </div>
            <div className="mt-2 text-end d-flex gap-2 justify-content-end">
                <button className="btn btn-outline-secondary btn-sm" onClick={this.props.clearFilters}>
                    <i className="bi bi-x-lg"></i> Clear All
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={this.props.resetFilters}>
                    <i className="bi bi-arrow-counterclockwise"></i> Reset to Default
                </button>
            </div>
        </div>;
    }

    render() {
        const counts = this.getCounts();
        return <div className="mb-2 filter-sticky">
            {this.getFilterBar(counts)}
            {this.getChips()}
            {this.getPanel(counts)}
        </div>;
    }
}

export default connect(state => _.pick(state.user, ["accountsMap", "tagsMap"]))(FiltersView);
