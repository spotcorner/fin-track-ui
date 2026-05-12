"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import transactionService from "@services/transactionService";
import SortDropdown from "@components/ui/SortDropdown.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { TRANSACTIONS_HELP, TRANSACTIONS_DRAFT_HELP } from "@utils/helpContent";
import TagBadges from "@components/tags/TagBadges.jsx";
import CheckDropdown from "@components/ui/CheckDropdown.jsx";
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
        selectionMode: false,
        selectedIds: {},
        sortField: "date",
        sortDirection: "desc",
    }

    getSelectedTransaction() {
        return this.props.transactions.find(t => t._id === this.state.selectedTransactionId);
    }

    toggleTagModal = (transaction) => {
        this.setState({ showRulesModal: !this.state.showRulesModal, selectedTransactionId: transaction?._id || null });
    }

    getTagTransactionModal() {
        return <TagTransactionModal show={this.state.showRulesModal} transaction={this.getSelectedTransaction()}
            updateTransactionTags={this.props.updateTransactionTags}
            onClose={() => this.toggleTagModal()} />;
    }

    getParentTransaction(transaction) {
        if (!transaction.parentId) return transaction;
        return this.props.transactions.find(t => t._id === transaction.parentId);
    }

    toggleTransactionModal = (transaction) => {
        const resolved = transaction?.parentId ? this.getParentTransaction(transaction) : transaction;
        this.setState({ showTransactionModal: !this.state.showTransactionModal, selectedTransactionId: resolved?._id || null });
    }

    getChildrenForTransaction(transaction) {
        if (!transaction?.childIds?.length) return [];
        return this.props.transactions.filter(t => t.parentId === transaction._id);
    }

    getCrudTransactionModal() {
        const transaction = this.getSelectedTransaction();
        return <CrudTransactionModal show={this.state.showTransactionModal}
            transaction={transaction} children={this.getChildrenForTransaction(transaction)}
            onSave={this.props.updateTransaction}
            isDraft={this.props.isDraft} draftId={this.props.draftId} draftAccountId={this.props.draftAccountId}
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
            {!!transaction.parentId && <span className="badge bg-warning text-dark">Split</span>}
            {!hasAppliedTags && <span className="badge bg-dark">Untagged</span>}
            {!hasAppliedTags && !this.props.compact && this.props.lastAppliedTagId && this.props.tagsMap[this.props.lastAppliedTagId] &&
                <span className="badge tag-status-1 cursor-pointer quick-apply-tag" onClick={() => this.quickApplyTag(transaction)}>
                    <i className="bi bi-check me-1"></i>{this.props.tagsMap[this.props.lastAppliedTagId].name}
                    <span className="ms-1" onClick={(e) => { e.stopPropagation(); this.props.clearLastAppliedTag(); }}>&times;</span>
                </span>}
            <TagBadges appliedTags={transaction.appliedTags}
                onRemove={(tagId) => this.removeTag(transaction, tagId)} />
        </div>;
    }

    toggleSelection = (id) => {
        this.setState(prev => {
            const selectedIds = { ...prev.selectedIds };
            if (selectedIds[id]) delete selectedIds[id]; else selectedIds[id] = true;
            return { selectedIds };
        });
    }

    selectAll = () => {
        const allSelected = this.getSelectedCount() === this.props.filteredTransactions.length;
        if (allSelected) {
            this.setState({ selectedIds: {} });
        } else {
            const selectedIds = {};
            this.props.filteredTransactions.forEach(t => selectedIds[t._id] = true);
            this.setState({ selectedIds });
        }
    }

    clearSelection = () => {
        this.setState({ selectedIds: {}, selectionMode: false });
    }

    getSelectedCount() {
        return Object.keys(this.state.selectedIds).length;
    }

    getCommonTagIds() {
        const selectedIds = Object.keys(this.state.selectedIds);
        if (!selectedIds.length) return [];
        const selected = this.props.filteredTransactions.filter(t => this.state.selectedIds[t._id]);
        if (!selected.length) return [];
        const first = new Set(_.keys(_.pickBy(selected[0].appliedTags, v => v >= 1)));
        return [...first].filter(tagId => selected.every(t => t.appliedTags?.[tagId] >= 1));
    }

    bulkApplyTag = (newSelected) => {
        const commonTags = this.getCommonTagIds();
        const transactionIds = Object.keys(this.state.selectedIds);
        const added = newSelected.find(id => !commonTags.includes(id));
        const removed = commonTags.find(id => !newSelected.includes(id));
        if (added) {
            transactionService.bulkUpdateTags(transactionIds, added, 1).then(() => {
                toast.info(`Tagged ${transactionIds.length} transactions ✅`);
                this.props.fetchTransactions();
            });
        } else if (removed) {
            transactionService.bulkUpdateTags(transactionIds, removed, -1).then(() => {
                toast.info(`Untagged ${transactionIds.length} transactions ✅`);
                this.props.fetchTransactions();
            });
        }
    }

    getActionButtons(transaction) {
        const isChild = !!transaction.parentId;
        return <div className="d-flex gap-1 flex-nowrap">
            <span className="badge badge-outline-primary cursor-pointer" onClick={() => this.toggleTagModal(transaction)}><i className="bi bi-tag"></i></span>
            <span className="badge badge-outline-secondary cursor-pointer" onClick={() => this.toggleTransactionModal(transaction)}><i className="bi bi-pencil"></i></span>
            {isChild
                ? <span className="badge" style={{ visibility: "hidden" }}><i className="bi bi-trash"></i></span>
                : <span className="badge badge-outline-danger cursor-pointer" onClick={() => this.setState({ deleteTransactionId: transaction._id })}><i className="bi bi-trash"></i></span>}
        </div>;
    }

    getListTransaction = (transaction, transactionIndex) => {
        const typeClass = transaction.type == TRANSACTION_TYPES.CREDIT ? "transaction-credit" : "transaction-debit";
        const amountColor = transaction.type == TRANSACTION_TYPES.CREDIT ? "text-success" : "text-danger";
        const accountLabel = transaction.account && labelUtil.getAccountLabel(transaction.account);
        return <div key={transactionIndex} className={"list-group-item " + typeClass}>
            <div className="d-flex align-items-center gap-3">
                {this.state.selectionMode && <input type="checkbox" className="form-check-input flex-shrink-0"
                    checked={!!this.state.selectedIds[transaction._id]}
                    onChange={() => this.toggleSelection(transaction._id)} />}
                <div className="text-muted small text-nowrap">{moment(transaction.date, "YYYY-MM-DD").format("MMM D, YYYY")}</div>
                {accountLabel && <div className="text-muted small text-nowrap">{accountLabel}</div>}
                <span className={"fw-bold text-nowrap " + amountColor}>₹{amountUtil.getFormattedAmount(transaction.amount)}</span>
                <div className="flex-grow-1 text-truncate small">
                    {transaction.description}
                </div>
                {this.getTagBadges(transaction)}
                {this.getActionButtons(transaction)}
            </div>
        </div>;
    }

    getSortOptions() {
        return [{ field: "date", label: "Date" }, { field: "amount", label: "Amount" }, { field: "updatedAt", label: "Updated" }];
    }

    handleSortChange = (field, direction) => {
        this.setState({ sortField: field, sortDirection: direction });
    }

    getSortedTransactions() {
        return _.orderBy(this.props.filteredTransactions, [this.state.sortField], [this.state.sortDirection]);
    }

    getSelectionControls(filteredTransactions) {
        if (!this.state.selectionMode) return null;
        const selectedCount = this.getSelectedCount();
        return <div className="d-flex align-items-center gap-2 mb-2">
            <label className="form-check-label small text-muted text-nowrap d-flex align-items-center gap-1 cursor-pointer">
                <input type="checkbox" className="form-check-input"
                    checked={selectedCount > 0 && selectedCount === filteredTransactions.length}
                    onChange={this.selectAll} />
                Select All
            </label>
            <div className="ms-auto" style={{ minWidth: 200 }}>
                <CheckDropdown label={`Tag (${selectedCount})`}
                    options={this.props.tags.map(t => ({ value: t._id, label: t.name }))}
                    selected={this.getCommonTagIds()} onChange={this.bulkApplyTag} searchable showSelectAll={false}
                    disabled={selectedCount === 0} />
            </div>
        </div>;
    }

    getToolbar(filteredTransactions, isDraft) {
        return <>
            <div className="d-flex align-items-center gap-1 mb-2">
                <div className="text-muted small page-header mb-0">Transactions</div>
                <HelpTip items={isDraft ? [...TRANSACTIONS_HELP, ...TRANSACTIONS_DRAFT_HELP] : TRANSACTIONS_HELP} />
                <span className="text-muted mx-auto">Showing {filteredTransactions.length} of {this.props.totalCount} entries</span>
                <div className="d-flex align-items-center gap-2">
                    <button className={"btn btn-sm text-nowrap " + (this.state.selectionMode ? "btn-dark" : "btn-outline-secondary")}
                        onClick={() => this.setState(prev => ({ selectionMode: !prev.selectionMode, selectedIds: {} }))}>
                        <i className="bi bi-check2-square"></i>
                    </button>
                    {isDraft && <>
                        <button className="btn btn-outline-success btn-sm text-nowrap" onClick={() => this.setState({ showSaveDraftsModal: true })}>Save All</button>
                        <button className="btn btn-outline-danger btn-sm text-nowrap" onClick={() => this.setState({ showDeleteDraftsModal: true })}>Delete All</button>
                    </>}
                    <SortDropdown options={this.getSortOptions()} prefStoreKey={`${this.props.prefStoreKey}.transactionSort`}
                        selected={{ field: this.state.sortField, direction: this.state.sortDirection }}
                        onChange={this.handleSortChange} />
                    <button className="btn btn-outline-dark btn-sm" style={{ width: 30, height: 30 }} onClick={() => this.toggleTransactionModal()}>+</button>
                </div>
            </div>
        </>;
    }

    getTransactions(filteredTransactions) {
        const isDraft = this.props.isDraft == 1 && this.props.transactions.length > 0;
        return <div>
            {!this.props.compact && this.getToolbar(filteredTransactions, isDraft)}
            {!this.props.compact && this.getSelectionControls(filteredTransactions)}
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
        const filteredTransactions = this.getSortedTransactions();
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

export default connect(state => _.pick(state.user, ["accountsMap", "accounts", "tagsMap", "tags"]))(TransactionsView);
