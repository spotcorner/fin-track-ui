"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
// import { Link } from "react-router-dom";
import transactionService from "@services/transactionService";
import FiltersView from "@components/transactions/FiltersView.jsx";
import TransactionsView from "@components/transactions/TransactionsView.jsx";
import transactionUtil from "@utils/transactionUtil";
import uiUtil from "@utils/uiUtil";

class TransactionsLayout extends React.Component {

    state = {
        ...this.getInitialDateFilters(),
        ...this.getInitialFilters(),
        transactions: [],
        transactionsLoading: false,
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
        };
    }

    getInitialFilters() {
        return {
            minAmountFilter: "",
            maxAmountFilter: "",
            accountTypeFilter: "",
            accountIdFilter: "",
            transactionTypeFilter: "",
            tagFilter: "",
            excludeFromTotalsFilter: "0",
            searchFilter: "",
        };
    }

    handleDateFilterChange = (name, value) => {
        this.setState({ [name]: value }, this.fetchTransactions);
    };

    resetDateFilter = () => {
        this.setState(this.getInitialDateFilters(), this.fetchTransactions);
    }

    handleFilterChange = (name, value) => {
        this.setState({ [name]: value }, () => {
            if (name == "startDateFilter" || name == "endDateFilter") {
                this.fetchTransactions();
            }
        });
    };

    resetFilters = () => {
        this.setState(this.getInitialFilters());
    }

    getFiltersView() {
        return <FiltersView filters={this.getFilters()} handleFilterChange={this.handleFilterChange} resetFilters={this.resetFilters} resetDateFilter={this.resetDateFilter} />
    }

    getNoTransactionsLabel() {
        if (this.props.isDraft) {
            return <div className="text-muted">No drafts transactions found.
                {/* <div>Visit <Link to="/transactions/upload-statement">Upload Statements</Link> page to extract transactions from statements.</div>
                <div>Visit <Link to="/transactions">Transactions</Link> page to see the saved transactions.</div> */}
            </div>
        }
        return <div className="text-muted">No transactions found.
            {/* <div>Visit <Link to="/transactions/upload-statement">Upload Statements</Link> page to extract transactions from statements.</div>
            <div>Visit <Link to="/transactions/drafts">Edit Drafts</Link> page to edit and save draft transactions.</div> */}
        </div>
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
        return transactionService.updateTags(_id, delta).then((data) => {
            this.setState((prevState) => {
                const transactions = [...prevState.transactions];
                const index = _.findIndex(transactions, (a) => a._id === _id);
                if (index >= 0) {
                    transactions[index] = { ...transactions[index], appliedTags: data.appliedTags, _appliedTags: { ...data.appliedTags } };
                }
                return { transactions };
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

    getLayoutBody() {
        const filteredTransactions = this.getFilteredTransactions();
        return <TransactionsView isDraft={this.props.isDraft} draftId={this.props.draftId}
            transactions={this.state.transactions} filteredTransactions={filteredTransactions}
            updateTransaction={this.updateTransaction} updateTransactionTags={this.updateTransactionTags}
            deleteTransaction={this.deleteTransaction}
            fetchTransactions={this.fetchTransactions} />;
    }

    render() {
        return <div className="">
            {this.props.title !== undefined && <div className="text-muted small mb-2 page-header">{this.props.title}</div>}
            {this.getFiltersView()}
            {this.getLoader()}
            {this.getLayoutBody()}
        </div>;
    }

    fetchTransactions = () => {
        this.setState({ transactions: [], transactionsLoading: true });
        transactionService.getAll(this.state.startDateFilter, this.state.endDateFilter, this.props.isDraft, this.props.sortByDate, this.props.draftId).then(data => {
            this.setState({ transactions: data.transactions, transactionsLoading: false });
        });
    }

    componentDidMount() {
        this.fetchTransactions();
    }
}

export default connect(state => _.pick(state.user, ["accountsMap", "tags"]))(TransactionsLayout);