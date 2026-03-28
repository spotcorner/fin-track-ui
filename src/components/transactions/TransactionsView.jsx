"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import transactionService from "@services/transactionService";
import SummaryTable from "./SummaryTable.jsx";
import { TRANSACTION_LABELS, TRANSACTION_TYPES } from "@config";
import CrudTransactionModal from "./CrudTransactionModal.jsx";
import AddKeywordToRuleModal from "./AddKeywordToRuleModal.jsx";
import StatsView from "./stats/StatsView.jsx";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil.js";

const momentDate = (date) => {
    return moment(date, "YYYY-MM-DD");
}

class TransactionsView extends React.Component {

    state = {
        showRulesModal: false,
        showTransactionModal: false,
        selectedTransaction: null,
    }

    toggleRulesModal = (selectedTransaction) => {
        this.setState({ showRulesModal: !this.state.showRulesModal, selectedTransaction });
    }

    getCrudRuleModal() {
        const { showRulesModal, selectedTransaction } = this.state;
        return <AddKeywordToRuleModal show={showRulesModal} transaction={selectedTransaction}
            onClose={() => this.toggleRulesModal()} />;
    }

    toggleTransactionModal = (selectedTransaction) => {
        this.setState({ showTransactionModal: !this.state.showTransactionModal, selectedTransaction });
    }

    getCrudTransactionModal() {
        const { showTransactionModal, selectedTransaction } = this.state;
        return <CrudTransactionModal show={showTransactionModal}
            transaction={selectedTransaction} onSave={this.props.updateTransaction}
            isDraft={this.props.isDraft} draftId={this.props.draftId}
            onClose={() => this.toggleTransactionModal()} />;
    }

    removeTransactionTag(transaction, rule_id) {
        transaction.appliedRules[rule_id] = 0;
        transactionService.upsert(transaction).then(this.props.updateTransaction);
    }

    getDefaultTag(tag, bg) {
        return <span className={"badge bg-" + bg + " mb-2 me-1"}>
            {tag}
        </span>
    }

    getTag(transaction, rule_id) {
        const { rulesMap } = this.props;
        return <div key={rule_id} className="badge bg-primary mb-2 me-1">
            {rulesMap[rule_id]?.tag}
            <span className="ms-1 cursor-pointer" onClick={() => this.removeTransactionTag(transaction, rule_id)}>
                &times;
            </span>
        </div>;
    }

    getTransactionTypeBg(transactionType) {
        return transactionType == TRANSACTION_TYPES.CREDIT ? "success" : "danger";
    }

    getTags(transaction) {
        const usedRules = _.keys(_.pickBy(transaction.appliedRules, v => v == 1));
        return <div className="d-flex ">
            <div className="d-flex flex-wrap">

                {transaction.excludeFromTotals == 1 && this.getDefaultTag("Excluded", "secondary")}
                {usedRules.length == 0 && this.getDefaultTag("Others", "dark")}
                {usedRules.map((rule_id) => this.getTag(transaction, rule_id))}
            </div>
            <div className="ms-auto d-flex flex-wrap justify-content-end">
                <span
                    className="badge bg-secondary mb-2 me-1 cursor-pointer"
                    onClick={() => this.toggleRulesModal(transaction)}
                >
                    <i className="bi bi-tag"></i>
                </span>
                <span className="badge bg-secondary cursor-pointer mb-2 me-1" onClick={() => this.toggleTransactionModal(transaction)}><i className="bi bi-pencil"></i></span>
                <span className="badge bg-secondary cursor-pointer mb-2 me-1" onClick={() => this.props.deleteTransaction(transaction)}><i className="bi bi-trash"></i></span>
            </div>
        </div>;
    }

    getTransactionDate(transaction) {
        return <div className="mb-1">
            <strong>{TRANSACTION_LABELS.DATE}:</strong> {momentDate(transaction.date).format("MMMM D, YYYY (dddd)")}
        </div>;
    }

    getTransactionAccount(transaction) {
        return transaction.account && <div className="mb-1">
            <strong>{TRANSACTION_LABELS.ACCOUNT}:</strong> {labelUtil.getAccountLabel(transaction.account)}
        </div>;
    }

    getTransactionAmount(transaction) {
        return <div className="mb-1">
            <strong>{TRANSACTION_LABELS.AMOUNT}: </strong>
            <span className={"badge bg-" + this.getTransactionTypeBg(transaction.type)}>₹{amountUtil.getFormattedAmount(transaction.amount)}</span>
        </div>
    }

    getTransactionDescription(transaction) {
        const description = transaction.description;
        return !_.isEmpty(description) && <div className="mb-1">
            <strong>{TRANSACTION_LABELS.DESCRIPTION}:</strong> {description}
        </div>;
    }

    getTransactionComments(transaction) {
        const comments = transaction.comments;
        return !_.isEmpty(comments) && <div className="mb-1">
            <strong>{TRANSACTION_LABELS.COMMENTS}:</strong> {comments}
        </div>;
    }

    getTransaction = (transaction, transactionIndex) => {
        const borderColor = transaction.type == TRANSACTION_TYPES.CREDIT ? "#198754" : "#dc3545";
        return <div key={transactionIndex} className="col-md-6 col-lg-4 mb-2">
            <div className="card shadow-sm" style={{ borderLeft: `2px solid ${borderColor}`, background: `linear-gradient(to right, ${borderColor}10, transparent)` }}>
                <div className="card-body">
                    {this.getTags(transaction)}
                    {this.getTransactionDate(transaction)}
                    {this.getTransactionAccount(transaction)}
                    {this.getTransactionAmount(transaction)}
                    {this.getTransactionDescription(transaction)}
                    {this.getTransactionComments(transaction)}
                </div>
            </div>
        </div>;
    }

    getTransactionsCountLabel(filteredTransactions) {
        return <div className="d-flex justify-content-center">
            <span className="text-muted">Showing {filteredTransactions.length} of {this.props.transactions.length} transactions.</span>
        </div>;
    }

    getDraftActions(filteredTransactions) {
        // const isFiltered = filteredTransactions.length < this.props.transactions.length;
        return this.props.isDraft == 1 && this.props.transactions.length > 0 && <div className="mt-2 d-flex justify-content-center">
            <button className="btn btn-primary me-2" onClick={this.saveDrafts}>Save All</button>
            <button className="btn btn-danger" onClick={this.deleteDrafts}>Delete All</button>
        </div>;
    }

    getTransactions(filteredTransactions) {
        return this.props.transactions.length > 0 && <div>
            <StatsView filteredTransactions={filteredTransactions} />
            <SummaryTable transactions={this.props.transactions} accounts={this.props.accounts} />
            {this.getTransactionsCountLabel(filteredTransactions)}
            {this.getDraftActions(filteredTransactions)}
            <div className="row mt-2">{filteredTransactions.slice().reverse().map(this.getTransaction)}</div>
            {this.getDraftActions(filteredTransactions)}
        </div>;
    }

    getAddButton() {
        return <button
            className="btn btn-dark rounded-circle position-fixed bottom-0 end-0 m-2"
            onClick={() => this.toggleTransactionModal()}
            style={{ width: "50px", height: "50px" }}
        ><i className="bi bi-database-fill-add"></i></button>;
    }

    saveDrafts = () => {
        transactionService.saveDrafts(this.props.draftId).then(() => {
            toast.info("Draft transactions saved ✅");
            this.props.fetchTransactions();
        });
    }

    deleteDrafts = () => {
        transactionService.deleteDrafts(this.props.draftId).then(() => {
            toast.info("Draft transactions deleted ✅");
            this.props.fetchTransactions();
        });
    }

    render() {
        const filteredTransactions = this.props.filteredTransactions;
        return (
            <div className="mb-2">
                {this.getTransactions(filteredTransactions)}
                {this.getAddButton()}
                {this.getCrudRuleModal()}
                {this.getCrudTransactionModal()}
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["accountsMap", "accounts", "rulesMap"]))(TransactionsView);