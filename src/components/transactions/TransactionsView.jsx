"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import transactionService from "@services/transactionService";
import SummaryTable from "./SummaryTable.jsx";
import TagBadges from "@components/tags/TagBadges.jsx";
import { TRANSACTION_TYPES } from "@config";
import CrudTransactionModal from "./CrudTransactionModal.jsx";
import TagTransactionModal from "./TagTransactionModal.jsx";
import StatsView from "./stats/StatsView.jsx";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil.js";

class TransactionsView extends React.Component {

    state = {
        showRulesModal: false,
        showTransactionModal: false,
        selectedTransactionId: null,
    }

    getSelectedTransaction() {
        return this.props.filteredTransactions.find(t => t._id === this.state.selectedTransactionId);
    }

    toggleTagModal = (transaction) => {
        this.setState({ showRulesModal: !this.state.showRulesModal, selectedTransactionId: transaction?._id || null });
    }

    getTagTransactionModal() {
        return <TagTransactionModal show={this.state.showRulesModal} transaction={this.getSelectedTransaction()}
            updateTransactionTags={this.props.updateTransactionTags}
            onClose={() => this.toggleTagModal()} />;
    }

    toggleTransactionModal = (transaction) => {
        this.setState({ showTransactionModal: !this.state.showTransactionModal, selectedTransactionId: transaction?._id || null });
    }

    getCrudTransactionModal() {
        return <CrudTransactionModal show={this.state.showTransactionModal}
            transaction={this.getSelectedTransaction()} onSave={this.props.updateTransaction}
            isDraft={this.props.isDraft} draftId={this.props.draftId}
            onClose={() => this.toggleTransactionModal()} />;
    }

    getTagBadges(transaction) {
        const hasAppliedTags = _.some(transaction.appliedTags, v => v >= 1);
        return <div className="d-flex flex-wrap align-items-center gap-1">
            {transaction.excludeFromTotals == 1 && <span className="badge bg-secondary">Excluded</span>}
            {!hasAppliedTags && <span className="badge bg-dark">Untagged</span>}
            <TagBadges transaction={transaction} updateTransactionTags={this.props.updateTransactionTags} />
        </div>;
    }

    getActionButtons(transaction) {
        return <div className="d-flex gap-1 flex-nowrap">
            <span className="badge bg-secondary cursor-pointer" onClick={() => this.toggleTagModal(transaction)}><i className="bi bi-tag"></i></span>
            <span className="badge bg-secondary cursor-pointer" onClick={() => this.toggleTransactionModal(transaction)}><i className="bi bi-pencil"></i></span>
            <span className="badge bg-secondary cursor-pointer" onClick={() => this.props.deleteTransaction(transaction)}><i className="bi bi-trash"></i></span>
        </div>;
    }

    getListTransaction = (transaction, transactionIndex) => {
        const typeClass = transaction.type == TRANSACTION_TYPES.CREDIT ? "transaction-credit" : "transaction-debit";
        const amountColor = transaction.type == TRANSACTION_TYPES.CREDIT ? "text-success" : "text-danger";
        const accountLabel = transaction.account && labelUtil.getAccountLabel(transaction.account);
        return <div key={transactionIndex} className={"list-group-item " + typeClass}>
            <div className="d-flex align-items-center gap-3">
                <div className="text-muted small text-nowrap">{moment(transaction.date, "YYYY-MM-DD").format("MMM D, YYYY")}</div>
                {accountLabel && <div className="text-muted small text-nowrap">{accountLabel}</div>}
                <span className={"fw-bold text-nowrap " + amountColor}>₹{amountUtil.getFormattedAmount(transaction.amount)}</span>
                <div className="flex-grow-1 text-truncate small">{transaction.description}</div>
                {this.getTagBadges(transaction)}
                {this.getActionButtons(transaction)}
            </div>
        </div>;
    }

    getToolbar(filteredTransactions, isDraft) {
        return <div className="d-flex justify-content-between align-items-center mb-2">
            <div></div>
            <span className="text-muted">Showing {filteredTransactions.length} of {this.props.transactions.length} transactions.</span>
            <div>
                {isDraft && <>
                    <button className="btn btn-primary btn-sm me-2" onClick={this.saveDrafts}>Save All</button>
                    <button className="btn btn-danger btn-sm" onClick={this.deleteDrafts}>Delete All</button>
                </>}
            </div>
        </div>;
    }

    getTransactions(filteredTransactions) {
        const reversed = filteredTransactions.slice().reverse();
        const isDraft = this.props.isDraft == 1 && this.props.transactions.length > 0;
        return this.props.transactions.length > 0 && <div>
            <StatsView filteredTransactions={filteredTransactions} />
            <SummaryTable transactions={this.props.transactions} accounts={this.props.accounts} />
            {this.getToolbar(filteredTransactions, isDraft)}
            <div style={{ overflowX: "auto" }}><div className="list-group list-group-striped mb-2" style={{ minWidth: "700px" }}>{reversed.map(this.getListTransaction)}</div></div>
            {this.getToolbar(filteredTransactions, isDraft)}
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
                {this.getTagTransactionModal()}
                {this.getCrudTransactionModal()}
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["accountsMap", "accounts"]))(TransactionsView);
