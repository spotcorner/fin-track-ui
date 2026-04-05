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
        extractor: "",
        draftName: "",
        file: null,
        status: UPLOAD_STATUS.IDLE,
        transactions: null,
        showAccountModal: false,
        showPdfPreview: false,
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
        this.setState({ status: UPLOAD_STATUS.EXTRACTING, transactions: null });
        transactionService.extract(this.state.extractor, this.state.file).then(data => {
            this.setState({ transactions: data.transactions, status: UPLOAD_STATUS.EXTRACTED });
        }).catch(err => {
            this.setState({ status: UPLOAD_STATUS.IDLE });
            toast.error(err.message);
        });
    }

    confirmDrafts = (e) => {
        e.preventDefault();
        this.setState({ status: UPLOAD_STATUS.SAVING });
        transactionService.createDrafts(this.state.accountId, this.state.draftName, this.state.transactions).then(data => {
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
                <select className="form-select" name="extractor" value={this.state.extractor} onChange={this.handleChange} required>
                    <option value=""></option>
                    {_.keys(EXTRACTOR_TYPE_LABELS).map((extractor, index) => (
                        <option key={index} value={extractor}>{EXTRACTOR_TYPE_LABELS[extractor]}</option>
                    ))}
                </select>
            </div>
            <div className="mb-2">
                <label className="form-label">File</label>
                <input type="file" className="form-control" onChange={this.handleFileUpload} required />
            </div>
            <button className="btn btn-outline-dark" disabled={status === UPLOAD_STATUS.EXTRACTING}>
                {status === UPLOAD_STATUS.EXTRACTING ? "Extracting..." : "Extract Transactions"}
            </button>
            {status === UPLOAD_STATUS.EXTRACTING && uiUtil.spinnerLoader("mt-2")}
        </form>;
    }

    getConfirmationForm() {
        const { status } = this.state;
        const isSaved = status === UPLOAD_STATUS.SAVED;
        if (![UPLOAD_STATUS.EXTRACTED, UPLOAD_STATUS.SAVING, UPLOAD_STATUS.SAVED].includes(status)) return null;
        return <form className="p-3 shadow mb-2" onSubmit={this.confirmDrafts}>
            <div className="mb-2">
                <label className="form-label">Extractor</label>
                <input type="text" className="form-control" value={EXTRACTOR_TYPE_LABELS[this.state.extractor]} disabled />
            </div>
            <div className="mb-2">
                <label className="form-label">File</label>
                <input type="text" className="form-control" value={this.state.file?.name || ""} disabled />
            </div>
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
            {isSaved
                ? <button type="button" className="btn btn-outline-secondary" onClick={this.reset}>Clear</button>
                : <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={this.reset}>Cancel</button>
                    <button className="btn btn-outline-dark" disabled={status === UPLOAD_STATUS.SAVING}>
                        {status === UPLOAD_STATUS.SAVING ? "Saving..." : "Confirm & Save as Draft"}
                    </button>
                </div>
            }
            {status === UPLOAD_STATUS.SAVING && uiUtil.spinnerLoader("mt-2")}
        </form>;
    }

    getSavedAlert() {
        const { status, transactions } = this.state;
        if (status !== UPLOAD_STATUS.SAVED) return null;
        return <div className="mb-2 alert alert-success">
            <span>Saved {transactions.length} transactions as draft. </span>
            {transactions.length > 0 && <span>Visit <Link to="/transactions/drafts">Edit Drafts</Link> page to review.</span>}
        </div>;
    }

    getPreview() {
        const { transactions } = this.state;

        if (!transactions) return null;

        if (transactions.length === 0) {
            return <div className="mb-2 alert alert-warning">No transactions found in the uploaded file.</div>;
        }

        const totalDebit = _.sumBy(transactions.filter(t => t.type === TRANSACTION_TYPES.DEBIT), "amount");
        const totalCredit = _.sumBy(transactions.filter(t => t.type === TRANSACTION_TYPES.CREDIT), "amount");
        const isCreditCard = this.state.extractor.includes("CS");

        return <div className="mb-2">
            <div className="text-muted mb-2">
                <span>{transactions.length} transactions</span>
                <span className="badge bg-danger bg-opacity-10 text-danger ms-2">{isCreditCard ? "Spends" : "Debit"} ₹{amountUtil.getFormattedAmount(totalDebit)}</span>
                <span className="badge bg-success bg-opacity-10 text-success ms-2">{isCreditCard ? "Payments" : "Credit"} ₹{amountUtil.getFormattedAmount(totalCredit)}</span>
            </div>
            <div style={{ overflowX: "auto" }}>
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
            </div>
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
