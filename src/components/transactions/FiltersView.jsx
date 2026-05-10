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
import { getSmartSuggestions } from "@utils/smartFilterUtil";
import "@styles/filtersView.scss";

class FiltersView extends React.Component {

    collapsedPref = new PreferenceStore(`${this.props.prefStoreKey}.filters.collapsed`, false);
    stickyPref = new PreferenceStore(`${this.props.prefStoreKey}.filters.sticky`, true);
    showChipsPref = new PreferenceStore(`${this.props.prefStoreKey}.filters.showChips`, true);
    state = { collapsed: this.collapsedPref.get(), sticky: this.stickyPref.get(), showChips: this.showChipsPref.get(), searchInput: "", searchCaseSensitive: false, searchRegex: false }

    handleFilterChange = (e) => {
        this.props.handleFilterChange(e.target.name, e.target.value);
    };

    handleSearchKeyDown = (e) => {
        if (e.key === "Enter" && this.state.searchInput.trim()) {
            const input = this.state.searchInput.trim();
            const term = { value: input, caseSensitive: this.state.searchCaseSensitive, regex: this.state.searchRegex };
            const terms = [...this.props.filters.searchTerms, term];
            this.props.handleFilterChange("searchTerms", terms);
            this.setState({ searchInput: "" });
        }
    }

    applySmartFilter = (suggestion) => {
        switch (suggestion.type) {
            case "amount":
                if (suggestion.min) this.props.handleFilterChange("minAmountFilter", suggestion.min);
                if (suggestion.max) this.props.handleFilterChange("maxAmountFilter", suggestion.max);
                break;
            case "date":
                this.props.handleDateChange(suggestion.start, suggestion.end, suggestion.preset);
                break;
            case "transactionType":
                this.props.handleFilterChange("transactionTypeFilter", [...this.props.filters.transactionTypeFilter, suggestion.value]);
                break;
            case "accountType":
                this.props.handleFilterChange("accountTypeFilter", [...this.props.filters.accountTypeFilter, suggestion.value]);
                break;
            case "account":
                this.props.handleFilterChange("accountIdFilter", [...this.props.filters.accountIdFilter, suggestion.value]);
                break;
            case "tag":
                this.props.handleFilterChange("tagFilter", [...this.props.filters.tagFilter, suggestion.value]);
                break;
        }
        this.setState({ searchInput: "" });
    }

    getSuggestionCount(suggestion) {
        const { transactions, accountsMap } = this.props;
        if (!transactions) return 0;
        switch (suggestion.type) {
            case "transactionType": return transactions.filter(t => t.type === suggestion.value).length;
            case "accountType": return transactions.filter(t => accountsMap?.[t.accountId]?.type === suggestion.value).length;
            case "account": return transactions.filter(t => t.accountId === suggestion.value).length;
            case "tag": return transactions.filter(t => t.appliedTags?.[suggestion.value] >= 1).length;
            default: return null;
        }
    }

    getSmartSuggestions() {
        const input = this.state.searchInput.trim();
        if (!input) return null;
        const { filters } = this.props;
        const suggestions = getSmartSuggestions(input, {
            tags: _.values(this.props.tagsMap),
            accounts: _.values(this.props.accountsMap),
        }).filter(s => {
            if (s.type === "transactionType") return !filters.transactionTypeFilter.includes(s.value);
            if (s.type === "accountType") return !filters.accountTypeFilter.includes(s.value);
            if (s.type === "account") return !filters.accountIdFilter.includes(s.value);
            if (s.type === "tag") return !filters.tagFilter.includes(s.value);
            return true;
        });
        if (!suggestions.length) return null;
        return <div className="smart-suggestions position-absolute bg-white border rounded shadow-sm mt-1 p-1" style={{ zIndex: 10, minWidth: "200px" }}>
            {suggestions.map((s, i) => {
                const count = this.getSuggestionCount(s);
                return <div key={i} className="small cursor-pointer px-2 py-1 rounded d-flex align-items-center justify-content-between" onClick={() => this.applySmartFilter(s)}>
                    <span>{s.icon && <i className={"bi me-1 " + s.icon}></i>}{s.label}</span>
                    {count !== null && <span className="badge bg-dark bg-opacity-10 text-dark ms-2">{count}</span>}
                </div>;
            })}
        </div>;
    }

    getActiveFilterCount() {
        const { filters } = this.props;
        let count = 0;
        if (filters.datePreset !== "allTime") count++;
        count += filters.transactionTypeFilter.length;
        if (filters.skipExcluded) count++;
        count += filters.accountTypeFilter.length;
        count += filters.accountIdFilter.length;
        count += filters.tagFilter.length;
        if (filters.minAmountFilter) count++;
        if (filters.maxAmountFilter) count++;
        if (filters.searchTerms.length) count++;
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
            <span className={"badge cursor-pointer " + (this.state.showChips ? "bg-dark text-white" : "bg-dark bg-opacity-10 text-dark")} onClick={this.handleShowChipsChange}>{this.getActiveFilterCount()}</span>
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
                <div className="col-12 col-md-6 col-lg-3 position-relative">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input type="text" value={this.state.searchInput} className="form-control" placeholder="Search... (Enter to add)"
                            onChange={(e) => this.setState({ searchInput: e.target.value })}
                            onKeyDown={this.handleSearchKeyDown} />
                        <button className={"btn btn-sm " + (this.state.searchCaseSensitive ? "btn-dark" : "btn-outline-secondary")}
                            title="Match Case" onClick={() => this.setState(prev => ({ searchCaseSensitive: !prev.searchCaseSensitive }))}>
                            Aa
                        </button>
                        <button className={"btn btn-sm " + (this.state.searchRegex ? "btn-dark" : "btn-outline-secondary")}
                            title="Use Regex" onClick={() => this.setState(prev => ({ searchRegex: !prev.searchRegex }))}>
                            .*
                        </button>
                    </div>
                    {this.getSmartSuggestions()}
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
                <div className="col-auto d-flex align-items-center">
                    <label className="form-check-label small text-nowrap d-flex align-items-center gap-1 cursor-pointer">
                        <input type="checkbox" className="form-check-input" checked={filters.skipExcluded}
                            onChange={() => this.props.handleFilterChange("skipExcluded", !filters.skipExcluded)} />
                        Skip excluded
                    </label>
                </div>
                <div className="col d-flex gap-1 justify-content-end align-items-center">
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
        if (filters.skipExcluded) chips.push({ text: "Skip excluded", label: "Skip excluded", onRemove: () => this.props.handleFilterChange("skipExcluded", false) });
        if (filters.minAmountFilter) chips.push({ text: "Min: ₹" + filters.minAmountFilter, label: "Min: ₹" + filters.minAmountFilter, onRemove: () => this.props.handleFilterChange("minAmountFilter", "") });
        if (filters.maxAmountFilter) chips.push({ text: "Max: ₹" + filters.maxAmountFilter, label: "Max: ₹" + filters.maxAmountFilter, onRemove: () => this.props.handleFilterChange("maxAmountFilter", "") });
        filters.accountTypeFilter.forEach(type => { const text = ACCOUNT_TYPE_LABELS[type] || type; chips.push({ text, label: text, onRemove: () => this.props.handleFilterChange("accountTypeFilter", filters.accountTypeFilter.filter(v => v !== type)) }); });
        filters.accountIdFilter.forEach(id => { const text = labelUtil.getAccountLabel(accountsMap[id]) || id; chips.push({ text, label: text, onRemove: () => this.props.handleFilterChange("accountIdFilter", filters.accountIdFilter.filter(v => v !== id)) }); });
        filters.tagFilter.forEach(id => { const text = id === "__NONE__" ? "Untagged" : (tagsMap[id]?.name || id); chips.push({ text, label: <><i className="bi bi-tag"></i> {text}</>, onRemove: () => this.props.handleFilterChange("tagFilter", filters.tagFilter.filter(v => v !== id)) }); });
        filters.searchTerms.forEach((term, i) => {
            const indicators = (term.caseSensitive ? "Aa" : "") + (term.regex ? ".*" : "");
            const suffix = indicators ? ` [${indicators}]` : "";
            chips.push({ text: term.value, label: <><i className="bi bi-search"></i> {term.value}{suffix}</>, onRemove: () => this.props.handleFilterChange("searchTerms", filters.searchTerms.filter((_, j) => j !== i)) });
        });
        return chips;
    }

    getChips(chips) {
        if (!chips.length) return null;
        return <div className="filter-chips d-flex flex-wrap gap-1">
            {chips.map((chip, i) => <span key={i} className={"badge filter-chip bg-dark" + (chip.onRemove ? " cursor-pointer" : "")} onClick={chip.onRemove}>
                {chip.label}{chip.onRemove && " ×"}
            </span>)}
            {this.getActiveFilterCount() > 0 && <span className="badge filter-chip bg-danger cursor-pointer" onClick={this.props.clearFilters}>
                <i className="bi bi-trash"></i> Clear All
            </span>}
        </div>;
    }

    matchesFilters(t, skip) {
        const { filters, accountsMap } = this.props;
        if (skip !== "amount") {
            if (filters.minAmountFilter && t.amount < filters.minAmountFilter) return false;
            if (filters.maxAmountFilter && t.amount > filters.maxAmountFilter) return false;
        }
        if (skip !== "excludeFromTotals" && filters.skipExcluded && t.excludeFromTotals) return false;
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
        if (skip !== "search" && filters.searchTerms.length) {
            const matches = filters.searchTerms.every(term => {
                if (term.regex) {
                    try { return new RegExp(term.value, term.caseSensitive ? "" : "i").test(t.description); }
                    catch (e) { return false; }
                }
                return term.caseSensitive ? _.includes(t.description, term.value) : _.includes(_.toLower(t.description), _.toLower(term.value));
            });
            if (!matches) return false;
        }
        return true;
    }

    getCounts() {
        const { transactions, accountsMap } = this.props;
        const counts = { type: {}, accountType: {}, account: {}, tag: {} };
        (transactions || []).forEach(t => {
            if (this.matchesFilters(t, "transactionType")) counts.type[t.type] = (counts.type[t.type] || 0) + 1;
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
