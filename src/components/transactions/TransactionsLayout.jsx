"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { NavLink, withRouter } from "react-router-dom";
import transactionService from "@services/transactionService";
import FiltersView from "@components/transactions/FiltersView.jsx";
import TransactionsView from "@components/transactions/TransactionsView.jsx";
import StatsView from "./stats/StatsView.jsx";
import SummaryTable from "./SummaryTable.jsx";
import transactionUtil from "@utils/transactionUtil";
import HelpTip from "@components/ui/HelpTip.jsx";
import { CASHFLOW_HELP } from "@utils/helpContent";
import PreferenceStore from "@utils/PreferenceStore";
import uiUtil from "@utils/uiUtil";

const TABS = [
    { key: "stats", label: "Stats" },
    { key: "summary", label: "Summary" },
    { key: "transactions", label: "Transactions" },
];

class TransactionsLayout extends React.Component {

    filterCache = new PreferenceStore(this.getCacheKey(), this.getInitialFilters());

    state = {
        ...this.filterCache.get(),
        transactions: [],
        transactionsLoading: false,
    }

    getCacheKey() {
        return this.props.isDraft ? `draft.${this.props.draftId}` : "cashflow";
    }
    getInitialDateFilters() {
        return {
            startDateFilter: this.props.startDateFilter || "",
            endDateFilter: this.props.endDateFilter || "",
        }
    }

    getFilters() {
        return {
            startDateFilter: this.state.startDateFilter,
            endDateFilter: this.state.endDateFilter,
            minAmountFilter: this.state.minAmountFilter,
            maxAmountFilter: this.state.maxAmountFilter,
            excludeFromTotalsFilter: this.state.excludeFromTotalsFilter,
            accountTypeFilter: this.state.accountTypeFilter,
            accountIdFilter: this.state.accountIdFilter,
            transactionTypeFilter: this.state.transactionTypeFilter,
            tagFilter: this.state.tagFilter,
            searchFilter: this.state.searchFilter,
            searchCaseSensitive: this.state.searchCaseSensitive,
            searchRegex: this.state.searchRegex,
            sortField: this.state.sortField,
            sortDirection: this.state.sortDirection,
        };
    }

    getInitialFilters() {
        return {
            ...this.getInitialDateFilters(),
            minAmountFilter: "",
            maxAmountFilter: "",
            accountTypeFilter: [],
            accountIdFilter: [],
            transactionTypeFilter: [],
            tagFilter: [],
            excludeFromTotalsFilter: ["0"],
            searchFilter: "",
            searchCaseSensitive: false,
            searchRegex: false,
            sortField: "date",
            sortDirection: "desc",
        };
    }

    cacheFiltersState = () => {
        this.filterCache.set(this.getFilters());
    }

    resetDateFilter = () => {
        this.setState(this.getInitialDateFilters(), () => {
            this.cacheFiltersState();
            this.fetchTransactions();
        });
    }

    handleFilterChange = (name, value) => {
        this.setState({ [name]: value }, () => {
            this.cacheFiltersState();
            if (name == "startDateFilter" || name == "endDateFilter") {
                this.fetchTransactions();
            }
        });
    };

    resetFilters = () => {
        this.setState(this.getInitialFilters(), this.cacheFiltersState);
    }

    clearFilters = () => {
        this.setState({ ...this.getInitialFilters(), excludeFromTotalsFilter: [] }, this.cacheFiltersState);
    }

    getFilteredTransactions() {
        return transactionUtil.applyFilters(this.state.transactions, this.getFilters(), this.props.accountsMap, this.props.tags);
    }

    updateTransaction = (transaction) => {
        this.setState((prevState) => {
            const transactions = [...prevState.transactions];
            const index = _.findIndex(transactions, (a) => a._id === transaction._id);
            if (index >= 0) {
                transactions[index] = { ...transaction };
            } else {
                transactions.push(transaction);
            }
            return { transactions, showTransactionModal: false, };
        });
    }

    updateTransactionTags = (_id, delta) => {
        const directTagId = _.findKey(delta, v => v === 1);
        return transactionService.updateTags(_id, delta).then((data) => {
            this.setState((prevState) => {
                const transactions = [...prevState.transactions];
                const index = _.findIndex(transactions, (a) => a._id === _id);
                if (index >= 0) {
                    transactions[index] = { ...transactions[index], appliedTags: data.appliedTags, _appliedTags: { ...data.appliedTags } };
                }
                return { transactions, lastAppliedTagId: directTagId  };
            });
            return data;
        });
    }

    deleteTransaction = (transaction) => {
        transactionService.delete(transaction._id).then((data) => {
            this.setState((prevState) => ({
                transactions: prevState.transactions.filter(t => t._id !== data._id)
            }), () => toast.info("Transaction deleted ✅"));
        });
    }

    getActiveTab() {
        const tab = _.find(TABS, t => _.endsWith(this.props.location.pathname, t.key));
        return tab ? tab.key : "stats";
    }

    getTabBar() {
        const basePath = this.props.basePath || "/";
        return <ul className="nav nav-tabs mb-2">
            {TABS.map(tab => <li key={tab.key} className="nav-item">
                <NavLink className="nav-link" activeClassName="active"
                    to={basePath === "/" ? `/${tab.key}` : `${basePath}/${tab.key}`}>{tab.label}</NavLink>
            </li>)}
        </ul>;
    }

    getTabContent(filteredTransactions) {
        const tab = this.getActiveTab();
        if (tab === "stats") {
            return <StatsView filteredTransactions={filteredTransactions} isDraft={this.props.isDraft} />;
        }
        if (tab === "summary") {
            return <SummaryTable transactions={this.state.transactions} filteredTransactions={filteredTransactions}
                accounts={this.props.accounts} isDraft={this.props.isDraft}
                draftOpeningBalance={this.props.draftOpeningBalance}
                prePeriodTotals={this.state.prePeriodTotals} />;
        }
        return <TransactionsView isDraft={this.props.isDraft} draftId={this.props.draftId}
            transactions={this.state.transactions} filteredTransactions={filteredTransactions}
            updateTransaction={this.updateTransaction} updateTransactionTags={this.updateTransactionTags}
            deleteTransaction={this.deleteTransaction}
            fetchTransactions={this.fetchTransactions}
            lastAppliedTagId={this.state.lastAppliedTagId}
            clearLastAppliedTag={() => this.setState({ lastAppliedTagId: null })}
            sortField={this.state.sortField} sortDirection={this.state.sortDirection}
            handleFilterChange={this.handleFilterChange} />;
    }

    getNoTransactionsLabel() {
        if (this.props.isDraft) {
            return <div className="text-muted">No drafts transactions found.</div>;
        }
        return <div className="text-muted">No transactions found.</div>;
    }

    getLoader() {
        if (this.state.transactionsLoading) {
            return uiUtil.spinnerLoader("mt-3");
        }
        if (this.state.transactions.length == 0) {
            return <div className="mt-3 mb-3 text-center">
                {this.getNoTransactionsLabel()}
            </div>;
        }
    }

    render() {
        const filteredTransactions = this.getFilteredTransactions();
        return <div className="">
            {this.props.title !== undefined && <div className="d-flex align-items-center gap-1 mb-2">
                <div className="text-muted small page-header">{this.props.title}</div>
                <HelpTip items={CASHFLOW_HELP} />
            </div>}
            <FiltersView filters={this.getFilters()} transactions={this.state.transactions} isDraft={this.props.isDraft} handleFilterChange={this.handleFilterChange} resetFilters={this.resetFilters} clearFilters={this.clearFilters} resetDateFilter={this.resetDateFilter} />
            {this.getLoader()}
            {this.state.transactions.length > 0 && <>
                {this.getTabBar()}
                {this.getTabContent(filteredTransactions)}
            </>}
        </div>;
    }

    fetchTransactions = () => {
        this.setState({ transactions: [], transactionsLoading: true });
        transactionService.getAll(this.state.startDateFilter, this.state.endDateFilter, this.props.isDraft, this.props.sortByDate, this.props.draftId).then(data => {
            this.setState({ transactions: data.transactions, prePeriodTotals: data.prePeriodTotals || {}, transactionsLoading: false });
        }).catch(() => {
            this.setState({ transactionsLoading: false });
        });
    }

    componentDidMount() {
        this.fetchTransactions();
    }
}

export default withRouter(connect(state => _.pick(state.user, ["accountsMap", "accounts", "tags"]))(TransactionsLayout));
