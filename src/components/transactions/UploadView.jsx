"use strict";

import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';
import { EXTRACTOR_TYPE_LABELS, TRANSACTION_TYPES } from "@config";
import CrudAccountModal from "@components/accounts/CrudAccountModal.jsx";
import transactionService from "@services/transactionService";
import uiUtil from "@utils/uiUtil";
import labelUtil from "@utils/labelUtil";
import amountUtil from "@utils/amountUtil";

const UPLOAD_STATUS = {
    IDLE: "IDLE",
    EXTRACTING: "EXTRACTING",
    EXTRACTED: "EXTRACTED",
    SAVING: "SAVING",
    SAVED: "SAVED",
};

class Upload extends React.Component {
    initialState = () => ({
        accountId: "",
        extractor: "AUTO",
        draftName: "",
        file: null,
        fromPage: "",
        toPage: "",
        status: UPLOAD_STATUS.IDLE,
        results: null,
        selectedResult: null,
        showAccountModal: false,
        showPdfPreview: false,
        expanded: {},
    });

    state = this.initialState();

    toggleAccountModal = (accountId = this.state.accountId) => {
        this.setState({ showAccountModal: !this.state.showAccountModal, accountId });
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleFileUpload = (e) => {
        this.setState({ file: e.target.files[0] });
    };

    extractTransactions = (e) => {
        e.preventDefault();
        this.setState({ status: UPLOAD_STATUS.EXTRACTING, results: null });
        transactionService.extract(this.state.extractor, this.state.file, this.state.fromPage, this.state.toPage).then(data => {
            const results = data.results || [];
            this.setState({
                results,
                selectedResult: null,
                status: UPLOAD_STATUS.EXTRACTED,
            });
        }).catch(err => {
            this.setState({ status: UPLOAD_STATUS.IDLE });
            toast.error(err.message);
        });
    }

    getSelectedResult = () => {
        const flattened = this.getFlattenedResults();
        const { selectedResult } = this.state;
        return flattened && selectedResult !== null ? flattened[selectedResult] : null;
    }

    confirmDrafts = (e) => {
        e.preventDefault();
        const selected = this.getSelectedResult();
        if (!selected) return;
        this.setState({ status: UPLOAD_STATUS.SAVING });
        transactionService.createDrafts(this.state.accountId, this.state.draftName, selected.transactions).then(data => {
            this.setState({ status: UPLOAD_STATUS.SAVED });
        }).catch(err => {
            this.setState({ status: UPLOAD_STATUS.EXTRACTED });
            toast.error(err.message);
        });
    }

    reset = () => this.setState(this.initialState());

    getExtractionForm() {
        const { status } = this.state;
        if (![UPLOAD_STATUS.IDLE, UPLOAD_STATUS.EXTRACTING].includes(status)) return null;
        return <form className="p-3 shadow mb-2" onSubmit={this.extractTransactions}>
            <div className="mb-2">
                <label className="form-label">Extractor</label>
                <select className="form-select" name="extractor" value={this.state.extractor} onChange={this.handleChange}>
                    {_.keys(EXTRACTOR_TYPE_LABELS).map((extractor, index) => (
                        <option key={index} value={extractor}>{EXTRACTOR_TYPE_LABELS[extractor]}</option>
                    ))}
                </select>
            </div>
            <div className="mb-2">
                <label className="form-label">File</label>
                <input type="file" className="form-control" onChange={this.handleFileUpload} required />
            </div>
            <div className="mb-2">
                <label className="form-label">Page Range <span className="text-muted small">(optional)</span></label>
                <div className="d-flex gap-2">
                    <input type="number" className="form-control" name="fromPage" placeholder="From" min="1" value={this.state.fromPage} onChange={this.handleChange} />
                    <input type="number" className="form-control" name="toPage" placeholder="To" min="1" value={this.state.toPage} onChange={this.handleChange} />
                </div>
            </div>
            <button className="btn btn-outline-dark" disabled={status === UPLOAD_STATUS.EXTRACTING}>
                {status === UPLOAD_STATUS.EXTRACTING ? "Extracting..." : "Extract Transactions"}
            </button>
            {status === UPLOAD_STATUS.EXTRACTING && uiUtil.spinnerLoader("mt-2")}
        </form>;
    }

    isUnmappedResult = () => {
        const selected = this.getSelectedResult();
        return selected?.unmapped;
    }

    getConfirmationForm() {
        const { status } = this.state;
        const isSaved = status === UPLOAD_STATUS.SAVED;
        const isUnmapped = this.isUnmappedResult();
        if (![UPLOAD_STATUS.EXTRACTED, UPLOAD_STATUS.SAVING, UPLOAD_STATUS.SAVED].includes(status)) return null;
        const hasSelection = this.state.selectedResult !== null;
        return <form className="p-3 shadow mb-2" onSubmit={this.confirmDrafts}>
            <div className="mb-2">
                <label className="form-label">Extractor</label>
                <input type="text" className="form-control" value={EXTRACTOR_TYPE_LABELS[this.state.extractor] || this.state.extractor} disabled />
            </div>
            <div className="mb-2">
                <label className="form-label">File</label>
                <input type="text" className="form-control" value={this.state.file?.name + (this.state.fromPage || this.state.toPage ? ` (Pages ${this.state.fromPage || "1"}-${this.state.toPage || "end"})` : "")} disabled />
            </div>
            {!hasSelection
                ? <div className="alert alert-info mb-2">Select an extractor result below to continue.</div>
                : isUnmapped
                ? <div className="alert alert-warning mb-2">Unmapped extraction — column mapping required before saving. (Coming soon)</div>
                : <>
                    <div className="mb-2">
                        <label className="form-label">Draft Name</label>
                        <input type="text" className="form-control" name="draftName" value={this.state.draftName} onChange={this.handleChange} required disabled={isSaved} />
                    </div>
                    <div className="mb-2">
                        <label className="form-label">Account</label>
                        {isSaved
                            ? <input type="text" className="form-control" value={labelUtil.getAccountLabel(this.props.accounts.find(a => a._id === this.state.accountId))} disabled />
                            : <div className="d-flex">
                                <select className="form-select me-2" name="accountId" value={this.state.accountId} onChange={this.handleChange} required>
                                    <option value=""></option>
                                    {this.props.accounts.map((account, index) => (
                                        <option key={index} value={account._id}>{labelUtil.getAccountLabel(account)}</option>
                                    ))}
                                </select>
                                <button type="button" className="btn btn-outline-dark" onClick={() => this.toggleAccountModal()}>+</button>
                            </div>
                        }
                    </div>
                </>}
            {isSaved
                ? <button type="button" className="btn btn-outline-secondary" onClick={this.reset}>Clear</button>
                : <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={this.reset}>Cancel</button>
                    {!isUnmapped && <button className="btn btn-outline-dark" disabled={status === UPLOAD_STATUS.SAVING || this.state.selectedResult === null}>
                        {status === UPLOAD_STATUS.SAVING ? "Saving..." : "Confirm & Save as Draft"}
                    </button>}
                </div>
            }
            {status === UPLOAD_STATUS.SAVING && uiUtil.spinnerLoader("mt-2")}
        </form>;
    }

    getSavedAlert() {
        if (this.state.status !== UPLOAD_STATUS.SAVED) return null;
        const count = this.getSelectedResult()?.transactions?.length || 0;
        return <div className="mb-2 alert alert-success">
            <span>Saved {count} transactions as draft. </span>
            {count > 0 && <span>Visit <Link to="/transactions/drafts">Edit Drafts</Link> page to review.</span>}
        </div>;
    }

    getUnmappedColumns(transactions) {
        const keys = new Set();
        transactions.forEach(txn => Object.keys(txn).forEach(k => keys.add(k)));
        const order = ["page", "date", "description", "amount"];
        return [...keys].sort((a, b) => {
            const ai = order.findIndex(p => a.startsWith(p));
            const bi = order.findIndex(p => b.startsWith(p));
            return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi) || a.localeCompare(b);
        });
    }

    getUnmappedGroups(transactions) {
        const buckets = {};
        transactions.forEach(txn => {
            const count = Object.keys(txn).filter(k => k.startsWith("amount_")).length;
            const label = `${count} amount${count !== 1 ? "s" : ""}`;
            (buckets[label] = buckets[label] || []).push(txn);
        });
        return Object.entries(buckets)
            .map(([label, txns]) => ({ label, transactions: txns, subGroups: this.getPageSubGroups(txns) }))
            .sort((a, b) => b.transactions.length - a.transactions.length);
    }

    getPageSubGroups(transactions) {
        const groups = [];
        let current = null;
        transactions.forEach(txn => {
            const page = txn.page;
            if (!current || page !== current.endPage + 1 && page !== current.endPage) {
                current = { startPage: page, endPage: page, transactions: [] };
                groups.push(current);
            }
            current.endPage = page;
            current.transactions.push(txn);
        });
        return groups.map(g => ({
            label: g.startPage === g.endPage ? `Page ${g.startPage}` : `Pages ${g.startPage}-${g.endPage}`,
            transactions: g.transactions,
        }));
    }

    getUnmappedCell(txn, col) {
        const val = txn[col];
        if (!Array.isArray(val)) return val || "";
        return val.map((part, i) => <span key={i}>{i > 0 && <i className="bi bi-arrow-return-left text-muted mx-1"></i>}{part}</span>);
    }

    getUnmappedTable(transactions) {
        const columns = this.getUnmappedColumns(transactions);
        return <div style={{ overflowX: "auto" }}>
            <table className="table table-sm table-striped table-bordered small mb-2">
                <thead><tr>{columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
                <tbody>
                    {transactions.map((txn, i) => <tr key={i}>
                        {columns.map(col => <td key={col}>{this.getUnmappedCell(txn, col)}</td>)}
                    </tr>)}
                </tbody>
            </table>
        </div>;
    }

    getTransactionList(transactions) {
        return <div style={{ overflowX: "auto" }}>
            <div className="list-group list-group-striped mb-2" style={{ minWidth: "700px" }}>
                {transactions.map((txn, i) => {
                    const typeClass = txn.type === TRANSACTION_TYPES.CREDIT ? "transaction-credit" : "transaction-debit";
                    const amountColor = txn.type === TRANSACTION_TYPES.CREDIT ? "text-success" : "text-danger";
                    return <div key={i} className={"list-group-item " + typeClass}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="text-muted small text-nowrap">{moment(txn.date, "YYYY-MM-DD").format("MMM D, YYYY")}</div>
                            <span className={"fw-bold text-nowrap " + amountColor}>₹{amountUtil.getFormattedAmount(txn.amount)}</span>
                            <div className="flex-grow-1 text-truncate small">{txn.description}</div>
                        </div>
                    </div>;
                })}
            </div>
        </div>;
    }

    getFlattenedResults() {
        const { results } = this.state;
        if (!results) return null;
        const flattened = [];
        results.forEach(result => {
            if (result.unmapped) {
                this.getUnmappedGroups(result.transactions).forEach(group => {
                    const subGroups = this.getPageSubGroups(group.transactions);
                    subGroups.forEach(sub => {
                        flattened.push({
                            ...result,
                            label: `${EXTRACTOR_TYPE_LABELS[result.extractor] || result.extractor} - ${group.label} - ${sub.label}`,
                            transactions: sub.transactions,
                        });
                    });
                });
            } else {
                flattened.push({
                    ...result,
                    label: EXTRACTOR_TYPE_LABELS[result.extractor] || result.extractor,
                });
            }
        });
        return flattened;
    }

    getPreview() {
        const flattened = this.getFlattenedResults();
        if (!flattened) return null;
        if (flattened.length === 0) {
            return <div className="mb-2 alert alert-warning">No transactions found in the uploaded file.</div>;
        }
        return <div className="mb-2">
            {flattened.map((row, i) => {
                const isExpanded = this.state.expanded[`row_${i}`];
                return <div key={i} className="border rounded mb-2">
                    <div className="d-flex align-items-center p-2 cursor-pointer"
                        onClick={() => this.setState({ expanded: { ...this.state.expanded, [`row_${i}`]: !isExpanded } })}>
                        <input type="radio" className="form-check-input me-2" checked={this.state.selectedResult === i}
                            onClick={(e) => { e.stopPropagation(); this.setState({ selectedResult: this.state.selectedResult === i ? null : i }); }} readOnly />
                        <div className="me-2 small fw-bold">{row.label}</div>
                        <span className="text-muted small">{row.transactions.length} transactions</span>
                        {row.unmapped
                            ? <span className="badge bg-warning bg-opacity-10 text-warning ms-2">Unmapped</span>
                            : <>{row.totalDebit > 0 && <span className="badge bg-danger bg-opacity-10 text-danger ms-2">{row.extractor.includes("CS") ? "Spends" : "Debit"} ₹{amountUtil.getFormattedAmount(row.totalDebit)}</span>}
                                {row.totalCredit > 0 && <span className="badge bg-success bg-opacity-10 text-success ms-2">{row.extractor.includes("CS") ? "Payments" : "Credit"} ₹{amountUtil.getFormattedAmount(row.totalCredit)}</span>}</>}
                        <i className={"bi ms-auto " + (isExpanded ? "bi-chevron-up" : "bi-chevron-down")}></i>
                    </div>
                    {isExpanded && (row.unmapped
                        ? this.getUnmappedTable(row.transactions)
                        : this.getTransactionList(row.transactions))}
                </div>;
            })}
        </div>;
    }

    getPdfPreview() {
        const { file, showPdfPreview } = this.state;
        if (!file) return null;
        return <div className="mb-2">
            <div className="d-flex align-items-center cursor-pointer mb-2"
                onClick={() => this.setState({ showPdfPreview: !showPdfPreview })}>
                <div className="text-muted small page-header mb-0">Source Preview</div>
                <i className={"bi ms-auto " + (showPdfPreview ? "bi-dash-square" : "bi-plus-square")}></i>
            </div>
            {showPdfPreview && <iframe src={URL.createObjectURL(file)} width="100%" height="600px" style={{ border: "1px solid #dee2e6", borderRadius: "4px" }} />}
        </div>;
    }

    render() {
        return (
            <div className="mb-2">
                <div className="text-muted small mb-2 page-header">Upload Statement</div>
                {this.getExtractionForm()}
                {this.getConfirmationForm()}
                {this.getSavedAlert()}
                {this.getPdfPreview()}
                {this.getPreview()}
                <CrudAccountModal show={this.state.showAccountModal} onSave={(data) => this.toggleAccountModal(data.account._id)} onClose={() => this.toggleAccountModal()} />
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["accounts"]))(Upload);
