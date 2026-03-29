"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import transactionService from "@services/transactionService";
import SummaryTable from "./SummaryTable.jsx";
import { TRANSACTION_TYPES } from "@config";
import CrudTransactionModal from "./CrudTransactionModal.jsx";
import TagTransactionModal from "./TagTransactionModal.jsx";
import StatsView from "./stats/StatsView.jsx";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil.js";

const VIEW_CARD = "card";
const VIEW_LIST = "list";

const TAG_ICONS = { 1: "bi-tag", 2: "bi-key" };

class TransactionsView extends React.Component {

    state = {
        showRulesModal: false,
        showTransactionModal: false,
        selectedTransaction: null,
        viewMode: VIEW_LIST,
        expandedDescs: {},
    }

    toggleTagModal = (selectedTransaction) => {
        this.setState({ showRulesModal: !this.state.showRulesModal, selectedTransaction });
    }

    getTagTransactionModal() {
        const { showRulesModal, selectedTransaction } = this.state;
        return <TagTransactionModal show={showRulesModal} transaction={selectedTransaction}
            onSave={(t) => { this.props.updateTransaction(t); this.toggleTagModal(); }}
            onClose={() => this.toggleTagModal()} />;
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

    removeTransactionTag(transaction, tag_id) {
        if (transaction._appliedTags[tag_id] == 1) {
            transaction.appliedTags = _.omit(transaction.appliedTags, tag_id);
            transaction._appliedTags = _.omit(transaction._appliedTags, tag_id);
        } else {
            transaction.appliedTags = { ...transaction.appliedTags, [tag_id]: 0 };
            transaction._appliedTags = { ...transaction._appliedTags, [tag_id]: 0 };
        }
        transactionService.upsert(transaction).then(this.props.updateTransaction);
    }

    restoreTransactionTag(transaction, tag_id) {
        transaction.appliedTags = _.omit(transaction.appliedTags, tag_id);
        transaction._appliedTags = _.omit(transaction._appliedTags, tag_id);
        transactionService.upsert(transaction).then(this.props.updateTransaction);
    }

    getTag(transaction, tag_id) {
        const { tagsMap } = this.props;
        const status = transaction.appliedTags[tag_id];
        return <span key={tag_id} className={"badge tag-status-" + status + " mb-1 me-1"}>
            <i className={"bi " + TAG_ICONS[status] + " me-1"}></i>
            {tagsMap[tag_id]?.name}
            <span className="ms-1 cursor-pointer" onClick={() => this.removeTransactionTag(transaction, tag_id)}>&times;</span>
        </span>;
    }

    getExcludedTag(transaction, tag_id) {
        const { tagsMap } = this.props;
        return <span key={tag_id} className="badge tag-status-0 mb-1 me-1">
            {tagsMap[tag_id]?.name}
            <span className="ms-1 cursor-pointer" onClick={() => this.restoreTransactionTag(transaction, tag_id)}>
                <i className="bi bi-arrow-counterclockwise"></i>
            </span>
        </span>;
    }

    getTagBadges(transaction) {
        const usedTags = _.keys(_.pickBy(transaction.appliedTags, v => v >= 1));
        const excludedTags = _.keys(_.pickBy(transaction._appliedTags, v => v == 0));
        return <div className="d-flex flex-wrap">
            {transaction.excludeFromTotals == 1 && <span className="badge bg-secondary mb-1 me-1">Excluded</span>}
            {usedTags.length == 0 && <span className="badge bg-dark mb-1 me-1">Untagged</span>}
            {usedTags.map((tag_id) => this.getTag(transaction, tag_id))}
            {excludedTags.map((tag_id) => this.getExcludedTag(transaction, tag_id))}
        </div>;
    }

    getActionButtons(transaction) {
        return <div className="d-flex gap-1 flex-nowrap">
            <span className="badge bg-secondary cursor-pointer" onClick={() => this.toggleTagModal(transaction)}><i className="bi bi-tag"></i></span>
            <span className="badge bg-secondary cursor-pointer" onClick={() => this.toggleTransactionModal(transaction)}><i className="bi bi-pencil"></i></span>
            <span className="badge bg-secondary cursor-pointer" onClick={() => this.props.deleteTransaction(transaction)}><i className="bi bi-trash"></i></span>
        </div>;
    }

    getAmountColor(transaction) {
        return transaction.type == TRANSACTION_TYPES.CREDIT ? "success" : "danger";
    }

    getBorderColor(transaction) {
        return transaction.type == TRANSACTION_TYPES.CREDIT ? "#198754" : "#dc3545";
    }

    toggleDesc = (id) => {
        this.setState(prev => ({ expandedDescs: { ...prev.expandedDescs, [id]: !prev.expandedDescs[id] } }));
    }

    // Card view (Option A)
    getCardTransaction = (transaction, transactionIndex) => {
        const borderColor = this.getBorderColor(transaction);
        const amountColor = this.getAmountColor(transaction);
        const accountLabel = transaction.account && labelUtil.getAccountLabel(transaction.account);
        const descExpanded = this.state.expandedDescs[transaction._id];
        return <div key={transactionIndex} className="col-md-6 col-lg-4 mb-2">
            <div className="card shadow-sm" style={{ borderLeft: `2px solid ${borderColor}`, background: `linear-gradient(to right, ${borderColor}10, transparent)` }}>
                <div className="card-body">
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                        <span className={"fs-5 fw-bold text-" + amountColor}>₹{amountUtil.getFormattedAmount(transaction.amount)}</span>
                        {this.getActionButtons(transaction)}
                    </div>
                    <div className="mb-2">{this.getTagBadges(transaction)}</div>
                    <div className="text-muted small mb-1">
                        {moment(transaction.date, "YYYY-MM-DD").format("MMMM D, YYYY (dddd)")}
                        {accountLabel && <span> · {accountLabel}</span>}
                    </div>
                    {!_.isEmpty(transaction.description) && <div
                        className={"small desc-truncate" + (descExpanded ? " expanded" : "")}
                        onClick={() => this.toggleDesc(transaction._id)}
                    >{transaction.description}</div>}
                    {!_.isEmpty(transaction.comments) && <div className="small text-muted mt-1">{transaction.comments}</div>}
                </div>
            </div>
        </div>;
    }

    // List view (Option B)
    getListTransaction = (transaction, transactionIndex) => {
        const borderColor = this.getBorderColor(transaction);
        const amountColor = this.getAmountColor(transaction);
        const accountLabel = transaction.account && labelUtil.getAccountLabel(transaction.account);
        return <div key={transactionIndex} className="list-group-item" style={{ borderLeft: `3px solid ${borderColor}` }}>
            <div className="d-flex align-items-center gap-3">
                {this.getTagBadges(transaction)}
                <div className="text-muted small text-nowrap">{moment(transaction.date, "YYYY-MM-DD").format("MMM D, YYYY")}</div>
                {accountLabel && <div className="text-muted small text-nowrap">{accountLabel}</div>}
                <span className={"fw-bold text-nowrap text-" + amountColor}>₹{amountUtil.getFormattedAmount(transaction.amount)}</span>
                <div className="flex-grow-1 text-truncate small">{transaction.description}</div>
                {this.getActionButtons(transaction)}
            </div>
        </div>;
    }

    getViewToggle() {
        const { viewMode } = this.state;
        return <div className="d-flex justify-content-end mb-2">
            <div className="btn-group btn-group-sm">
                <button className={"btn btn-" + (viewMode == VIEW_LIST ? "dark" : "outline-dark")} onClick={() => this.setState({ viewMode: VIEW_LIST })}>
                    <i className="bi bi-list"></i>
                </button>
                <button className={"btn btn-" + (viewMode == VIEW_CARD ? "dark" : "outline-dark")} onClick={() => this.setState({ viewMode: VIEW_CARD })}>
                    <i className="bi bi-grid"></i>
                </button>
            </div>
        </div>;
    }

    getTransactionsCountLabel(filteredTransactions) {
        return <div className="d-flex justify-content-center">
            <span className="text-muted">Showing {filteredTransactions.length} of {this.props.transactions.length} transactions.</span>
        </div>;
    }

    getDraftActions(filteredTransactions) {
        return this.props.isDraft == 1 && this.props.transactions.length > 0 && <div className="mt-2 d-flex justify-content-center">
            <button className="btn btn-primary me-2" onClick={this.saveDrafts}>Save All</button>
            <button className="btn btn-danger" onClick={this.deleteDrafts}>Delete All</button>
        </div>;
    }

    getTransactionsList(filteredTransactions) {
        const reversed = filteredTransactions.slice().reverse();
        if (this.state.viewMode == VIEW_LIST) {
            return <div className="mt-2" style={{ overflowX: "auto" }}><div className="list-group" style={{ minWidth: "700px" }}>{reversed.map(this.getListTransaction)}</div></div>;
        }
        return <div className="row mt-2">{reversed.map(this.getCardTransaction)}</div>;
    }

    getTransactions(filteredTransactions) {
        return this.props.transactions.length > 0 && <div>
            <StatsView filteredTransactions={filteredTransactions} />
            <SummaryTable transactions={this.props.transactions} accounts={this.props.accounts} />
            {this.getTransactionsCountLabel(filteredTransactions)}
            {this.getDraftActions(filteredTransactions)}
            {this.getViewToggle()}
            {this.getTransactionsList(filteredTransactions)}
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
                {this.getTagTransactionModal()}
                {this.getCrudTransactionModal()}
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["accountsMap", "accounts", "tagsMap"]))(TransactionsView);
