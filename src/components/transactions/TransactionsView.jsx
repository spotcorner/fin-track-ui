"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import transactionService from "@services/transactionService";
import TagBadges from "@components/tags/TagBadges.jsx";
import { TRANSACTION_TYPES } from "@config";
import CrudTransactionModal from "./CrudTransactionModal.jsx";
import TagTransactionModal from "./TagTransactionModal.jsx";
import Modal from "@components/modal/Modal.jsx";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil.js";

class TransactionsView extends React.Component {

    state = {
        showRulesModal: false,
        showTransactionModal: false,
        selectedTransactionId: null,
        deleteTransactionId: null,
        showSaveDraftsModal: false,
        showDeleteDraftsModal: false,
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

    quickApplyTag = (transaction) => {
        this.props.updateTransactionTags(transaction._id, { [this.props.lastAppliedTagId]: 1 });
    }

    removeTag = (transaction, tagId) => {
        const status = transaction._appliedTags[tagId] == 1 ? -1 : 0;
        this.props.updateTransactionTags(transaction._id, { [tagId]: status });
    }

    restoreTag = (transaction, tagId) => {
        this.props.updateTransactionTags(transaction._id, { [tagId]: -1 });
    }

    getTagBadges(transaction) {
        const hasAppliedTags = _.some(transaction.appliedTags, v => v >= 1);
        return <div className="d-flex flex-wrap align-items-center gap-1">
            {transaction.excludeFromTotals == 1 && <span className="badge bg-secondary">Excluded</span>}
            {transaction.splitAmount > 0 && <span className="badge bg-warning text-dark">
                {transaction.type === TRANSACTION_TYPES.DEBIT ? "Owed" : "Settled"} ₹{amountUtil.getFormattedAmount(transaction.splitAmount)}
            </span>}
            {!hasAppliedTags && <span className="badge bg-dark">Untagged</span>}
            {!hasAppliedTags && this.props.lastAppliedTagId && this.props.tagsMap[this.props.lastAppliedTagId] &&
                <span className="badge tag-status-1 cursor-pointer quick-apply-tag" onClick={() => this.quickApplyTag(transaction)}>
                    <i className="bi bi-check me-1"></i>{this.props.tagsMap[this.props.lastAppliedTagId].name}
                    <span className="ms-1" onClick={(e) => { e.stopPropagation(); this.props.clearLastAppliedTag(); }}>&times;</span>
                </span>}
            <TagBadges appliedTags={transaction.appliedTags}
                onRemove={(tagId) => this.removeTag(transaction, tagId)} />
        </div>;
    }

    getActionButtons(transaction) {
        return <div className="d-flex gap-1 flex-nowrap">
            <span className="badge badge-outline-primary cursor-pointer" onClick={() => this.toggleTagModal(transaction)}><i className="bi bi-tag"></i></span>
            <span className="badge badge-outline-secondary cursor-pointer" onClick={() => this.toggleTransactionModal(transaction)}><i className="bi bi-pencil"></i></span>
            <span className="badge badge-outline-danger cursor-pointer" onClick={() => this.setState({ deleteTransactionId: transaction._id })}><i className="bi bi-trash"></i></span>
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
        return <div className="d-flex align-items-center mb-2">
            <div>
                {isDraft && <>
                    <button className="btn btn-outline-success btn-sm me-2" onClick={() => this.setState({ showSaveDraftsModal: true })}>Save All</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => this.setState({ showDeleteDraftsModal: true })}>Delete All</button>
                </>}
            </div>
            <span className="text-muted mx-auto">Showing {filteredTransactions.length} of {this.props.transactions.length} transactions.</span>
            <button className="btn btn-outline-dark btn-sm" style={{ width: 30, height: 30 }} onClick={() => this.toggleTransactionModal()}>+</button>
        </div>;
    }

    getTransactions(filteredTransactions) {
        const isDraft = this.props.isDraft == 1 && this.props.transactions.length > 0;
        return <div>
            {this.getToolbar(filteredTransactions, isDraft)}
            <div style={{ overflowX: "auto" }}><div className="list-group list-group-striped mb-2" style={{ minWidth: "700px" }}>{filteredTransactions.map(this.getListTransaction)}</div></div>
        </div>;
    }

    saveDrafts = () => {
        transactionService.saveDrafts(this.props.draftId).then(() => {
            toast.info("Draft transactions saved ✅");
            this.setState({ showSaveDraftsModal: false });
            this.props.fetchTransactions();
        });
    }

    handleDeleteTransaction = () => {
        this.props.deleteTransaction({ _id: this.state.deleteTransactionId });
        this.setState({ deleteTransactionId: null });
    }

    deleteDrafts = () => {
        transactionService.deleteDrafts(this.props.draftId).then(() => {
            toast.info("Draft transactions deleted ✅");
            this.setState({ showDeleteDraftsModal: false });
            this.props.fetchTransactions();
        });
    }

    render() {
        const filteredTransactions = this.props.filteredTransactions;
        return (
            <div className="mb-2">
                {this.getTransactions(filteredTransactions)}
                {this.getTagTransactionModal()}
                {this.getCrudTransactionModal()}
                <Modal show={!!this.state.deleteTransactionId} title="Delete Transaction"
                    body="Are you sure you want to delete this transaction?"
                    onSubmitClick={this.handleDeleteTransaction}
                    onClose={() => this.setState({ deleteTransactionId: null })} />
                <Modal show={this.state.showSaveDraftsModal} title="Save All Drafts"
                    body="Are you sure you want to save all draft transactions?"
                    onSubmitClick={this.saveDrafts}
                    onClose={() => this.setState({ showSaveDraftsModal: false })} />
                <Modal show={this.state.showDeleteDraftsModal} title="Delete All Drafts"
                    body="Are you sure you want to delete all draft transactions?"
                    onSubmitClick={this.deleteDrafts}
                    onClose={() => this.setState({ showDeleteDraftsModal: false })} />
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["accountsMap", "accounts", "tagsMap"]))(TransactionsView);
