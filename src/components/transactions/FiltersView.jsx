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
    showChipsPref = new PreferenceStore(`${this.props.prefStoreKey}.filters.showChips`, true);
    state = { collapsed: this.collapsedPref.get(), sticky: this.stickyPref.get(), showChips: this.showChipsPref.get() }

    handleFilterChange = (e) => {
        this.props.handleFilterChange(e.target.name, e.target.value);
    };

    hasActiveFilters() {
        const { filters, isDraft } = this.props;
        const defaultDatePreset = isDraft ? "allTime" : "currentMonth";
        return filters.datePreset !== defaultDatePreset
            || filters.minAmountFilter || filters.maxAmountFilter || filters.transactionTypeFilter.length
            || filters.excludeFromTotalsFilter.length || filters.accountTypeFilter.length
            || filters.accountIdFilter.length || filters.tagFilter.length || filters.searchFilter
            || !filters.expandSplits;
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

    handleShowChipsChange = () => {
        this.setState({ showChips: !this.state.showChips }, () => this.showChipsPref.set(this.state.showChips));
    }

    getFilterSummary(chips) {
        if (!chips.length) return null;
        return <span className="text-muted text-truncate" style={{ minWidth: 0, fontSize: "0.7rem" }}>{chips.map(c => c.text).join(", ")}</span>;
    }

    getHeader(chips) {
        const { collapsed, sticky } = this.state;
        return <div className="d-flex align-items-center gap-1 mb-1">
            {chips.length > 0 && <span className={"badge cursor-pointer " + (this.state.showChips ? "bg-dark text-white" : "bg-dark bg-opacity-10 text-dark")} onClick={this.handleShowChipsChange}>{chips.length}</span>}
            <div className="text-muted small page-header mb-0">Filters</div>
            <HelpTip items={FILTERS_HELP(this.props.isDraft)} />
            {!this.state.showChips && this.getFilterSummary(chips)}
            <div className="ms-auto d-flex align-items-center gap-2">
                <i className={"bi cursor-pointer " + (sticky ? "bi-pin-fill" : "bi-pin")}
                    onClick={this.handleStickyChange}></i>
                <i className={"bi cursor-pointer " + (collapsed ? "bi-funnel" : "bi-funnel-fill")}
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
                    <label className="form-check-label small text-nowrap d-flex align-items-center gap-1 cursor-pointer">
                        <input type="checkbox" className="form-check-input" checked={filters.expandSplits}
                            onChange={(e) => this.props.handleFilterChange("expandSplits", e.target.checked)} />
                        Expand splits
                    </label>
                    {this.hasActiveFilters() && <button className="btn btn-outline-danger btn-sm text-nowrap" onClick={this.props.clearFilters}>
                        <i className="bi bi-x-lg"></i> Clear All
                    </button>}
                    <button className="btn btn-outline-dark btn-sm text-nowrap" onClick={this.props.resetFilters}>
                        <i className="bi bi-arrow-counterclockwise"></i> Reset to Default
                    </button>
                </div>
            </div>
        </>;
    }

    getChipData() {
        const { filters, accountsMap, tagsMap, isDraft } = this.props;
        const chips = [];
        const isAllTime = filters.datePreset === "allTime" && !filters.startDateFilter && !filters.endDateFilter;
        const defaultDatePreset = isDraft ? "allTime" : "currentMonth";
        if (filters.startDateFilter || filters.endDateFilter || isAllTime) {
            const text = formatDateRange(filters.startDateFilter, filters.endDateFilter, filters.datePreset);
            chips.push({ text, label: <><i className="bi bi-calendar"></i> {text}</>, onRemove: isAllTime ? null : this.props.resetDateFilter });
        }
        if (filters.transactionTypeFilter.length) filters.transactionTypeFilter.forEach(v => { const text = v === TRANSACTION_TYPES.DEBIT ? "Debit" : "Credit"; chips.push({ text, label: text, onRemove: () => this.props.handleFilterChange("transactionTypeFilter", filters.transactionTypeFilter.filter(x => x !== v)) }); });
        filters.excludeFromTotalsFilter.forEach(v => { const text = v === "1" ? "Excluded" : "Active"; chips.push({ text, label: text, onRemove: () => this.props.handleFilterChange("excludeFromTotalsFilter", filters.excludeFromTotalsFilter.filter(x => x !== v)) }); });
        if (filters.minAmountFilter) chips.push({ text: "Min: ₹" + filters.minAmountFilter, label: "Min: ₹" + filters.minAmountFilter, onRemove: () => this.props.handleFilterChange("minAmountFilter", "") });
        if (filters.maxAmountFilter) chips.push({ text: "Max: ₹" + filters.maxAmountFilter, label: "Max: ₹" + filters.maxAmountFilter, onRemove: () => this.props.handleFilterChange("maxAmountFilter", "") });
        filters.accountTypeFilter.forEach(type => { const text = ACCOUNT_TYPE_LABELS[type] || type; chips.push({ text, label: text, onRemove: () => this.props.handleFilterChange("accountTypeFilter", filters.accountTypeFilter.filter(v => v !== type)) }); });
        filters.accountIdFilter.forEach(id => { const text = labelUtil.getAccountLabel(accountsMap[id]) || id; chips.push({ text, label: text, onRemove: () => this.props.handleFilterChange("accountIdFilter", filters.accountIdFilter.filter(v => v !== id)) }); });
        filters.tagFilter.forEach(id => { const text = id === "__NONE__" ? "Untagged" : (tagsMap[id]?.name || id); chips.push({ text, label: <><i className="bi bi-tag"></i> {text}</>, onRemove: () => this.props.handleFilterChange("tagFilter", filters.tagFilter.filter(v => v !== id)) }); });
        if (filters.searchFilter) chips.push({ text: filters.searchFilter, label: <><i className="bi bi-search"></i> {filters.searchFilter}</>, onRemove: () => this.props.handleFilterChange("searchFilter", "") });
        if (!filters.expandSplits) chips.push({ text: "Splits collapsed", label: "Splits collapsed", onRemove: () => this.props.handleFilterChange("expandSplits", true) });
        return chips;
    }

    getChips(chips) {
        if (!chips.length) return null;
        return <div className="filter-chips d-flex flex-wrap gap-1">
            {chips.map((chip, i) => <span key={i} className={"badge filter-chip bg-dark" + (chip.onRemove ? " cursor-pointer" : "")} onClick={chip.onRemove}>
                {chip.label}{chip.onRemove && " ×"}
            </span>)}
        </div>;
    }

    matchesFilters(t, skip) {
        const { filters, accountsMap } = this.props;
        // split view filter
        if (filters.expandSplits) {
            if (t.childIds?.length) return false;
        } else {
            if (t.parentId) return false;
        }
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
        const chips = this.getChipData();
        return <div className={"mb-2" + (this.state.sticky ? " filter-sticky" : "")}>
            <div className="filter-bar">
                {this.getHeader(chips)}
                {!this.state.collapsed && this.getFilters(counts)}
                {this.state.showChips && this.getChips(chips)}
            </div>
        </div>;
    }
}

export default connect(state => _.pick(state.user, ["accountsMap", "tagsMap"]))(FiltersView);
