"use strict";

import React from "react";
import { connect } from "react-redux";
import { ACCOUNT_TYPE_LABELS, TRANSACTION_TYPES } from "@config";
import labelUtil from "@utils/labelUtil";

class FiltersView extends React.Component {

    state = {
        showFiltersView: false,
    }

    toggleFiltersView() {
        this.setState({ showFiltersView: !this.state.showFiltersView });
    }

    handleFilterChange = (e) => {
        this.props.handleFilterChange(e.target.name, e.target.value);
    };

    getDateFilter = () => {
        const { filters } = this.props;
        return <div className="mb-2">
            <div className="input-group m-0">
                <span className="input-group-text">From</span>
                <input type="date" name="startDateFilter" value={filters.startDateFilter} className="form-control" onChange={this.handleFilterChange} />
                <span className="input-group-text">To</span>
                <input type="date" name="endDateFilter" value={filters.endDateFilter} className="form-control" onChange={this.handleFilterChange} />
                <button className="btn btn-dark" onClick={() => this.props.resetDateFilter("startDateFilter", "")}>
                    <i className="bi bi-trash-fill"></i>
                </button>
            </div>
        </div>
    }

    getFilters() {
        if (!this.state.showFiltersView) return this.getFiltersButton();
        const { accountsMap, tagsMap, filters } = this.props;
        return <div className="p-3 bg-dark rounded-end-1" style={{ maxWidth: "500px" }}>
            <div className="row">
                <div className="col-12 mb-2">
                    <div className="input-group">
                        <span className="input-group-text">Min</span>
                        <input type="number" name="minAmountFilter" value={filters.minAmountFilter} className="form-control" onChange={this.handleFilterChange} />
                        <span className="input-group-text">Max</span>
                        <input type="number" name="maxAmountFilter" value={filters.maxAmountFilter} className="form-control" onChange={this.handleFilterChange} />
                    </div>
                </div>
                {accountsMap && <div className="col-12 mb-2">
                    <div className="input-group">
                        <span className="input-group-text">Account Type</span>
                        <select name="accountTypeFilter" value={filters.accountTypeFilter} className="form-control" onChange={this.handleFilterChange}>
                            <option value="">All</option>
                            {_.keys(_.groupBy(this.props.accountsMap, "type")).map((accountType, index) => <option key={index} value={accountType}>{ACCOUNT_TYPE_LABELS[accountType]}</option>)}
                        </select>
                    </div>
                </div>}
                {accountsMap && <div className="col-12 mb-2">
                    <div className="input-group">
                        <span className="input-group-text">Account</span>
                        <select name="accountIdFilter" value={filters.accountIdFilter} className="form-control" onChange={this.handleFilterChange}>
                            <option value="">All</option>
                            {_.values(this.props.accountsMap).map((account, index) => <option key={index} value={account._id}>{labelUtil.getAccountLabel(account)}</option>)}
                        </select>
                    </div>
                </div>}
                <div className="col-12 mb-2">
                    <div className="input-group">
                        <span className="input-group-text">Transaction Type</span>
                        <select name="transactionTypeFilter" value={filters.transactionTypeFilter} className="form-control" onChange={this.handleFilterChange}>
                            <option value="">All</option>
                            <option value={TRANSACTION_TYPES.DEBIT}>Debit</option>
                            <option value={TRANSACTION_TYPES.CREDIT}>Credit</option>
                        </select>
                    </div>
                </div>
                <div className="col-12 mb-2">
                    <div className="input-group">
                        <span className="input-group-text">Tag</span>
                        <select name="tagFilter" value={filters.tagFilter} className="form-control" onChange={this.handleFilterChange}>
                            <option value="">All</option>
                            <option value={"__NONE__"}>Untagged</option>
                            {_.values(tagsMap).map((tag, index) => <option key={index} value={tag._id}>{tag.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="col-12 mb-2">
                    <div className="input-group">
                        <span className="input-group-text">Include in Totals</span>
                        <select name="excludeFromTotalsFilter" value={filters.excludeFromTotalsFilter} className="form-control" onChange={this.handleFilterChange}>
                            <option value="">All</option>
                            <option value="0">Only Included</option>
                            <option value="1">Only Excluded</option>
                        </select>
                    </div>
                </div>
                <div className="col-12 mb-2">
                    <div className="input-group">
                        <span className="input-group-text">Search</span>
                        <input type="search" name="searchFilter" value={filters.searchFilter} className="form-control" onChange={this.handleFilterChange} />
                    </div>
                </div>
            </div>
            <button className="btn btn-secondary me-2" onClick={() => this.toggleFiltersView()}>
                <i className="bi bi-x-lg"></i>
            </button>
            <button className="btn btn-secondary me-2" onClick={this.props.resetFilters}>
                <i className="bi bi-trash-fill"></i>
            </button>
        </div>;
    }

    getFiltersButton() {
        return <button
            className="btn btn-dark rounded-circle m-2"
            onClick={() => this.toggleFiltersView()}
            style={{ width: "50px", height: "50px" }}
        ><i className="bi bi-funnel-fill"></i></button>;
    }

    render() {
        return <div className="">
            {this.getDateFilter()}
            <div className="position-fixed z-1 bottom-0 start-0">
                {this.getFilters()}
            </div>
        </div>;
    }
}

export default connect(state => _.pick(state.user, ["accountsMap", "tagsMap"]))(FiltersView);