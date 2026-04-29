"use strict";

import React from "react";
import { connect } from "react-redux";
import { ACCOUNT_TYPE_LABELS, TRANSACTION_TYPES } from "@config";
import CheckDropdown from "@components/ui/CheckDropdown.jsx";
import DateFilter from "@components/ui/DateFilter.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { FILTERS_HELP } from "@utils/helpContent";
import { formatDateRange } from "@utils/datePresetUtil";
import labelUtil from "@utils/labelUtil";
import PreferenceStore from "@utils/PreferenceStore";
import "@styles/filtersView.scss";

class FiltersView extends React.Component {

    collapsedPref = new PreferenceStore(`${this.props.prefStoreKey}.filters.collapsed`, false);
    stickyPref = new PreferenceStore(`${this.props.prefStoreKey}.filters.sticky`, true);
    state = { collapsed: this.collapsedPref.get(), sticky: this.stickyPref.get() }

    handleFilterChange = (e) => {
        this.props.handleFilterChange(e.target.name, e.target.value);
    };

    getActiveFilterCount() {
        const { filters } = this.props;
        let count = 0;
        if (filters.startDateFilter || filters.endDateFilter) count++;
        if (filters.minAmountFilter) count++;
        if (filters.maxAmountFilter) count++;
        count += filters.transactionTypeFilter.length;
        count += filters.excludeFromTotalsFilter.length;
        count += filters.accountTypeFilter.length;
        count += filters.accountIdFilter.length;
        count += filters.tagFilter.length;
        if (filters.searchFilter) count++;
        return count;
    }

    getTagOptions() {
        return [
            { value: "__NONE__", label: "Untagged", separator: true },
            ..._.values(this.props.tagsMap).map(t => ({ value: t._id, label: t.name })),
        ];
    }

    handleStickyChange = () => {
        this.setState({ sticky: !this.state.sticky }, () => this.stickyPref.set(this.state.sticky));
    }

    handleCollapsedChange = () => {
        this.setState({ collapsed: !this.state.collapsed }, () => this.collapsedPref.set(this.state.collapsed));
    }

    getHeader() {
        const { collapsed, sticky } = this.state;
        const count = this.getActiveFilterCount();
        return <div className="d-flex align-items-center gap-1 mb-1">
            {count > 0 && <span className="badge bg-dark bg-opacity-10 text-dark">{count}</span>}
            <div className="text-muted small page-header mb-0">Filters</div>
            <HelpTip items={FILTERS_HELP(this.props.isDraft)} />
            <div className="ms-auto d-flex align-items-center gap-2">
                <i className={"bi cursor-pointer " + (sticky ? "bi-pin-fill" : "bi-pin")}
                    onClick={this.handleStickyChange}></i>
                <i className={"bi cursor-pointer " + (collapsed ? "bi-plus-square" : "bi-dash-square")}
                    onClick={this.handleCollapsedChange}></i>
            </div>
        </div>;
    }

    getFilters(counts) {
        const { filters, accountsMap } = this.props;
        const accountTypeOptions = _.keys(_.groupBy(accountsMap, "type")).map(type => ({ value: type, label: ACCOUNT_TYPE_LABELS[type] || type }));
        const accountOptions = _.values(accountsMap).map(a => ({ value: a._id, label: labelUtil.getAccountLabel(a) }));
        return <>
            <div className="row g-2 mb-2">
                <div className="col-12 col-lg-6">
                    <DateFilter startDate={filters.startDateFilter} endDate={filters.endDateFilter}
                        preset={filters.datePreset} onChange={this.props.handleDateChange} />
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <CheckDropdown label="Tags" options={this.getTagOptions()} searchable sortByLabel pinSelected
                        selected={filters.tagFilter} onChange={v => this.props.handleFilterChange("tagFilter", v)} countMap={counts.tag} />
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="input-group input-group-sm">
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
                </div>
            </div>
            <div className="row g-2">
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">₹</span>
                        <input type="number" name="minAmountFilter" value={filters.minAmountFilter} className="form-control" placeholder="Min" onChange={this.handleFilterChange} />
                        <input type="number" name="maxAmountFilter" value={filters.maxAmountFilter} className="form-control" placeholder="Max" onChange={this.handleFilterChange} />
                    </div>
                </div>
                <div className="col-6 col-md-3 col-lg-1">
                    <CheckDropdown label="Type" options={[{ value: TRANSACTION_TYPES.DEBIT, label: "Debit" }, { value: TRANSACTION_TYPES.CREDIT, label: "Credit" }]}
                        selected={filters.transactionTypeFilter} onChange={v => this.props.handleFilterChange("transactionTypeFilter", v)} countMap={counts.type} />
                </div>
                <div className="col-6 col-md-3 col-lg-2">
                    <CheckDropdown label="Totals" options={[{ value: "0", label: "Active" }, { value: "1", label: "Excluded" }]}
                        selected={filters.excludeFromTotalsFilter} onChange={v => this.props.handleFilterChange("excludeFromTotalsFilter", v)} countMap={counts.totals} />
                </div>
                {!this.props.isDraft && <>
                    <div className="col-6 col-md-3 col-lg-2">
                        <CheckDropdown label="Account Type" options={accountTypeOptions}
                            selected={filters.accountTypeFilter} onChange={v => this.props.handleFilterChange("accountTypeFilter", v)} countMap={counts.accountType} />
                    </div>
                    <div className="col-6 col-md-3 col-lg-2">
                        <CheckDropdown label="Account" options={accountOptions} searchable sortByLabel pinSelected
                            selected={filters.accountIdFilter} onChange={v => this.props.handleFilterChange("accountIdFilter", v)} countMap={counts.account} />
                    </div>
                </>}
                <div className="col d-flex gap-2 justify-content-end align-items-center">
                    <button className="btn btn-outline-danger btn-sm text-nowrap" onClick={this.props.clearFilters}>
                        <i className="bi bi-x-lg"></i> Clear All
                    </button>
                    <button className="btn btn-outline-dark btn-sm text-nowrap" onClick={this.props.resetFilters}>
                        <i className="bi bi-arrow-counterclockwise"></i> Reset to Default
                    </button>
                </div>
            </div>
        </>;
    }

    getChips() {
        const { filters, accountsMap, tagsMap } = this.props;
        const chips = [];
        const isAllTime = filters.datePreset === "allTime" && !filters.startDateFilter && !filters.endDateFilter;
        if (filters.startDateFilter || filters.endDateFilter || isAllTime) chips.push({ label: <><i className="bi bi-calendar"></i> {formatDateRange(filters.startDateFilter, filters.endDateFilter, filters.datePreset)}</>, onRemove: isAllTime ? null : this.props.resetDateFilter });
        if (filters.transactionTypeFilter.length) filters.transactionTypeFilter.forEach(v => chips.push({ label: v === TRANSACTION_TYPES.DEBIT ? "Debit" : "Credit", onRemove: () => this.props.handleFilterChange("transactionTypeFilter", filters.transactionTypeFilter.filter(x => x !== v)) }));
        filters.excludeFromTotalsFilter.forEach(v => chips.push({ label: v === "1" ? "Excluded" : "Active", onRemove: () => this.props.handleFilterChange("excludeFromTotalsFilter", filters.excludeFromTotalsFilter.filter(x => x !== v)) }));
        if (filters.minAmountFilter) chips.push({ label: "Min: ₹" + filters.minAmountFilter, onRemove: () => this.props.handleFilterChange("minAmountFilter", "") });
        if (filters.maxAmountFilter) chips.push({ label: "Max: ₹" + filters.maxAmountFilter, onRemove: () => this.props.handleFilterChange("maxAmountFilter", "") });
        filters.accountTypeFilter.forEach(type => chips.push({ label: ACCOUNT_TYPE_LABELS[type] || type, onRemove: () => this.props.handleFilterChange("accountTypeFilter", filters.accountTypeFilter.filter(v => v !== type)) }));
        filters.accountIdFilter.forEach(id => chips.push({ label: labelUtil.getAccountLabel(accountsMap[id]) || id, onRemove: () => this.props.handleFilterChange("accountIdFilter", filters.accountIdFilter.filter(v => v !== id)) }));
        filters.tagFilter.forEach(id => chips.push({ label: <><i className="bi bi-tag"></i> {id === "__NONE__" ? "Untagged" : (tagsMap[id]?.name || id)}</>, onRemove: () => this.props.handleFilterChange("tagFilter", filters.tagFilter.filter(v => v !== id)) }));
        if (filters.searchFilter) chips.push({ label: <><i className="bi bi-search"></i> {filters.searchFilter}</>, onRemove: () => this.props.handleFilterChange("searchFilter", "") });
        if (!chips.length) return null;
        return <div className="filter-chips d-flex flex-wrap gap-1">
            {chips.map((chip, i) => <span key={i} className={"badge bg-dark filter-chip" + (chip.onRemove ? " cursor-pointer" : "")} onClick={chip.onRemove}>
                {chip.label}{chip.onRemove && " ×"}
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

    render() {
        const counts = this.getCounts();
        return <div className={"mb-2" + (this.state.sticky ? " filter-sticky" : "")}>
            <div className="filter-bar">
                {this.getHeader()}
                {!this.state.collapsed && <>
                    {this.getFilters(counts)}
                    {this.getChips()}
                </>}
            </div>
        </div>;
    }
}

export default connect(state => _.pick(state.user, ["accountsMap", "tagsMap"]))(FiltersView);
