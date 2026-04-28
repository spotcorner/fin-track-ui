"use strict";

import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';
import { EXTRACTOR_TYPE_LABELS } from "@config";
import CrudAccountModal from "@components/accounts/CrudAccountModal.jsx";
import transactionService from "@services/transactionService";
import uiUtil from "@utils/uiUtil";
import labelUtil from "@utils/labelUtil";
import amountUtil from "@utils/amountUtil";
import { getUnmappedColumns, getFlattenedResults, applyMapping } from "@utils/transactionGroupUtil";
import { getDefaultMapping, isMappingComplete } from "@utils/columnMappingUtil";
import ColumnMappingTable from "./ColumnMappingTable.jsx";
import TransactionPreview from "./TransactionPreview.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { UPLOAD_HELP, SOURCE_PREVIEW_HELP, EXTRACTION_RESULT_HELP } from "@utils/helpContent";

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
        openingBalance: "",
        extractor: "AUTO",
        draftName: "",
        file: null,
        pdfUrl: null, // stored once on upload to avoid iframe reload on state changes
        password: "",
        showPassword: false,
        fromPage: "",
        toPage: "",
        status: UPLOAD_STATUS.IDLE,
        results: null,
        flattened: null, // computed once after extraction, derived from results
        selectedResult: null,
        showAccountModal: false,
        showPdfPreview: false,
        expanded: {},
        mappings: {},
        showMappedPreview: {},
    });

    state = this.initialState();

    toggleAccountModal = (accountId = this.state.accountId) => {
        this.setState({ showAccountModal: !this.state.showAccountModal, accountId });
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (this.state.pdfUrl) URL.revokeObjectURL(this.state.pdfUrl);
        this.setState({ file, pdfUrl: file ? URL.createObjectURL(file) : null });
    };

    extractTransactions = (e) => {
        e.preventDefault();
        this.setState({ status: UPLOAD_STATUS.EXTRACTING, results: null });
        transactionService.extract(this.state.extractor, this.state.file, this.state.fromPage, this.state.toPage, this.state.password).then(data => {
            const results = data.results || [];
            const flattened = getFlattenedResults(results, EXTRACTOR_TYPE_LABELS);
            const mappings = {};
            if (flattened) flattened.forEach((row, i) => {
                if (row.unmapped) {
                    const columns = getUnmappedColumns(row.transactions);
                    const columnMapping = getDefaultMapping(columns, row.transactions);
                    mappings[i] = { columnMapping, isComplete: isMappingComplete({ columnMapping }, columns, row.transactions) };
                }
            });
            this.setState({
                results,
                flattened,
                mappings,
                selectedResult: null,
                status: UPLOAD_STATUS.EXTRACTED,
            });
        }).catch(() => {
            this.setState({ status: UPLOAD_STATUS.IDLE });
        });
    }

    getSelectedResult = () => {
        const { flattened, selectedResult } = this.state;
        return flattened && selectedResult !== null ? flattened[selectedResult] : null;
    }

    confirmDrafts = (e) => {
        e.preventDefault();
        const selected = this.getSelectedResult();
        if (!selected) return;
        const idx = this.state.selectedResult;
        const transactions = selected.unmapped
            ? this.getMappedPreviewData(selected, idx)
            : selected.transactions;
        if (!transactions || transactions.length === 0) return;
        this.setState({ status: UPLOAD_STATUS.SAVING });
        transactionService.createDrafts(this.state.accountId, this.state.draftName, transactions, parseFloat(this.state.openingBalance) || 0).then(data => {
            this.setState({ status: UPLOAD_STATUS.SAVED, savedDraftId: data.draftId });
        }).catch(() => {
            this.setState({ status: UPLOAD_STATUS.EXTRACTED });
        });
    }

    reset = () => {
        if (this.state.pdfUrl) URL.revokeObjectURL(this.state.pdfUrl);
        this.setState(this.initialState());
    }

    getExtractionForm() {
        const { status } = this.state;
        if (![UPLOAD_STATUS.IDLE, UPLOAD_STATUS.EXTRACTING].includes(status)) return null;
        return <form className="p-3 shadow mb-2" onSubmit={this.extractTransactions}>
            {/* <div className="mb-2">
                <label className="form-label">Extractor</label>
                <select className="form-select" name="extractor" value={this.state.extractor} onChange={this.handleChange}>
                    {_.keys(EXTRACTOR_TYPE_LABELS).map((extractor, index) => (
                        <option key={index} value={extractor}>{EXTRACTOR_TYPE_LABELS[extractor]}</option>
                    ))}
                </select>
            </div> */}
            <div className="mb-2">
                <label className="form-label">File</label>
                <input type="file" className="form-control" onChange={this.handleFileUpload} required />
                <label className="form-check-label small text-muted mt-1">
                    <input type="checkbox" className="form-check-input me-1"
                        checked={this.state.showPassword}
                        onChange={() => this.setState({ showPassword: !this.state.showPassword, password: "" })} />
                    Password protected
                </label>
            </div>
            {this.state.showPassword && <div className="mb-2">
                <label className="form-label">PDF Password</label>
                <input type="password" className="form-control" name="password" value={this.state.password} onChange={this.handleChange} />
                <div className="form-text text-muted">Password is never stored — only used for this extraction.</div>
            </div>}
            {/* <div className="mb-2">
                <label className="form-label">Page Range <span className="text-muted small">(optional)</span></label>
                <div className="d-flex gap-2">
                    <input type="number" className="form-control" name="fromPage" placeholder="From" min="1" value={this.state.fromPage} onChange={this.handleChange} />
                    <input type="number" className="form-control" name="toPage" placeholder="To" min="1" value={this.state.toPage} onChange={this.handleChange} />
                </div>
            </div> */}
            <div className="d-flex align-items-center gap-3">
                <button className="btn btn-outline-dark" disabled={status === UPLOAD_STATUS.EXTRACTING}>
                    {status === UPLOAD_STATUS.EXTRACTING ? "Extracting..." : "Extract Transactions"}
                </button>
            </div>
            {status === UPLOAD_STATUS.EXTRACTING && uiUtil.spinnerLoader("mt-2")}
        </form>;
    }

    isMappingIncomplete = () => {
        const selected = this.getSelectedResult();
        if (!selected?.unmapped) return false;
        const mapping = this.getMapping(this.state.selectedResult);
        return !mapping?.isComplete;
    }

    getSelectedAccount = () => this.props.accounts.find(a => a._id === this.state.accountId);

    isCreditCard = () => this.getSelectedAccount()?.type === "credit_card";

    getConfirmationForm() {
        const { status } = this.state;
        const isSaved = status === UPLOAD_STATUS.SAVED;
        const isUnmapped = this.isMappingIncomplete();
        if (![UPLOAD_STATUS.EXTRACTED, UPLOAD_STATUS.SAVING, UPLOAD_STATUS.SAVED].includes(status)) return null;
        const hasSelection = this.state.selectedResult !== null;
        return <form className="p-3 shadow mb-2" onSubmit={this.confirmDrafts}>
            {/* <div className="mb-2">
                <label className="form-label">Extractor</label>
                <input type="text" className="form-control" value={EXTRACTOR_TYPE_LABELS[this.state.extractor] || this.state.extractor} disabled />
            </div> */}
            <div className="row mb-2">
                <div className="col">
                    <label className="form-label">File</label>
                    <input type="text" className="form-control" value={this.state.file?.name + (this.state.fromPage || this.state.toPage ? ` (Pages ${this.state.fromPage || "1"}-${this.state.toPage || "end"})` : "")} disabled />
                </div>
                <div className="col">
                    <label className="form-label">Account</label>
                    {isSaved
                        ? <input type="text" className="form-control" value={labelUtil.getAccountLabel(this.getSelectedAccount())} disabled />
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
                {this.state.accountId && !this.isCreditCard() && <div className="col">
                    <label className="form-label">Opening Balance</label>
                    <input type="number" className="form-control" name="openingBalance" value={this.state.openingBalance} onChange={this.handleChange} disabled={isSaved} />
                </div>}
            </div>
            {!hasSelection
                ? <div className="alert alert-info mb-2">Select an extractor result below to continue.</div>
                : isUnmapped
                ? <div className="alert alert-warning mb-2">Unmapped extraction — column mapping required before saving.</div>
                : <>
                    <div className="mb-2">
                        <label className="form-label">Draft Name</label>
                        <input type="text" className="form-control" name="draftName" value={this.state.draftName} onChange={this.handleChange} required disabled={isSaved} />
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
            {count > 0 && <span>Visit <Link to={`/drafts?draftId=${this.state.savedDraftId}`}>Edit Drafts</Link> page to review.</span>}
        </div>;
    }

    toggleExpand = (i) => {
        this.setState({ expanded: { ...this.state.expanded, [`row_${i}`]: !this.state.expanded[`row_${i}`] } });
    }

    selectResult = (e, i) => {
        e.stopPropagation();
        const row = this.state.flattened[i];
        if (row.unmapped && !this.getMapping(i)?.isComplete) return;
        const deselect = this.state.selectedResult === i;
        this.setState({
            selectedResult: deselect ? null : i,
            expanded: { ...this.state.expanded, ...(!deselect ? { [`row_${i}`]: true } : {}) },
        });
    }

    togglePreview = (e, i) => {
        e.stopPropagation();
        this.setState({
            showMappedPreview: { ...this.state.showMappedPreview, [i]: !this.state.showMappedPreview[i] },
            selectedResult: i,
            expanded: { ...this.state.expanded, [`row_${i}`]: true },
        });
    }

    onMappingChange = (idx, mapping) => {
        this.setState({ mappings: { ...this.state.mappings, [idx]: mapping }, showMappedPreview: { ...this.state.showMappedPreview, [idx]: false } });
    }

    getMapping(idx) {
        return this.state.mappings[idx] || null;
    }

    getMappedPreviewData(row, idx) {
        const mapping = this.getMapping(idx);
        if (!row.unmapped || !mapping?.isComplete) return null;
        return applyMapping(row.transactions, mapping);
    }

    renderBadge(type, amount, label) {
        if (amount <= 0) return null;
        const isCredit = type === "credit";
        const isClosing = type === "closing";
        return <span className={`badge bg-${isClosing ? "dark" : isCredit ? "success" : "danger"} bg-opacity-10 text-${isClosing ? "dark" : isCredit ? "success" : "danger"} ms-2`}>
            {label || (isClosing ? "Closing" : isCredit ? "Credit" : "Debit")} ₹{amountUtil.getFormattedAmount(amount)}
        </span>;
    }

    getClosingBalance(totalDebit, totalCredit) {
        const opening = parseFloat(this.state.openingBalance) || 0;
        if (!opening || this.isCreditCard()) return null;
        const closing = opening + totalCredit - totalDebit;
        return this.renderBadge("closing", closing, "Closing");
    }

    getRowBadges(row, idx, mappedData) {
        if (row.unmapped) {
            if (!mappedData) return null;
            let totalDebit = 0, totalCredit = 0;
            mappedData.forEach(txn => {
                if (txn.type === "CREDIT") totalCredit += txn.amount;
                else totalDebit += txn.amount;
            });
            return <>{this.renderBadge("debit", totalDebit)}{this.renderBadge("credit", totalCredit)}{this.getClosingBalance(totalDebit, totalCredit)}</>;
        }
        const isCS = row.extractor.includes("CS");
        return <>
            {this.renderBadge("debit", row.totalDebit, isCS ? "Spends" : null)}
            {this.renderBadge("credit", row.totalCredit, isCS ? "Payments" : null)}
            {this.getClosingBalance(row.totalDebit, row.totalCredit)}
        </>;
    }


    getPreviewRowHeader(row, i, mappedData) {
        const isComplete = !row.unmapped || !!mappedData;
        const isExpanded = this.state.expanded[`row_${i}`];
        return <div className="d-flex align-items-center p-2 flex-wrap">
            {isComplete
                ? <input type="radio" className="form-check-input me-2" checked={this.state.selectedResult === i}
                    onClick={(e) => this.selectResult(e, i)} readOnly />
                : <span className="badge bg-warning bg-opacity-10 text-warning me-2">Unmapped</span>}
            <div className="me-2 small fw-bold cursor-pointer" onClick={() => this.toggleExpand(i)}>{row.label}</div>
            <div className="me-2"><HelpTip {...(row.unmapped ? { items: EXTRACTION_RESULT_HELP.unmapped } : { text: EXTRACTION_RESULT_HELP.mapped })} /></div>
            <span className="text-muted small cursor-pointer" onClick={() => this.toggleExpand(i)}>{row.transactions.length} transactions</span>
            {this.getRowBadges(row, i, mappedData)}
            <span className="ms-auto d-flex align-items-center gap-2">
                {row.unmapped && isComplete &&
                    <button type="button" className={"btn btn-sm " + (this.state.showMappedPreview[i] ? "btn-outline-secondary" : "btn-outline-dark")}
                        onClick={(e) => this.togglePreview(e, i)}>
                        {this.state.showMappedPreview[i] ? "Show Mapping" : "Preview"}
                    </button>}
                <i className={"bi cursor-pointer " + (isExpanded ? "bi-chevron-up" : "bi-chevron-down")} onClick={() => this.toggleExpand(i)}></i>
            </span>
        </div>;
    }

    getPreviewRowBody(row, i, mappedData) {
        if (!this.state.expanded[`row_${i}`]) return null;
        if (!row.unmapped) return <TransactionPreview transactions={row.transactions} />;
        if (this.state.showMappedPreview[i]) return <TransactionPreview transactions={mappedData} />;
        return <ColumnMappingTable transactions={row.transactions} columns={getUnmappedColumns(row.transactions)}
            editable initialMapping={this.getMapping(i)}
            onMappingChange={(m) => this.onMappingChange(i, m)} />;
    }

    getPreview() {
        const { flattened } = this.state;
        if (!flattened) return null;
        if (flattened.length === 0) {
            return <div className="mb-2 alert alert-warning">No transactions found in the uploaded file.</div>;
        }
        return <div className="mb-2">
            {flattened.map((row, i) => {
                const mappedData = this.getMappedPreviewData(row, i);
                return <div key={i} className="border rounded mb-2">
                    {this.getPreviewRowHeader(row, i, mappedData)}
                    {this.getPreviewRowBody(row, i, mappedData)}
                </div>;
            })}
        </div>;
    }

    getPdfPreview() {
        const { file, showPdfPreview } = this.state;
        if (!file) return null;
        return <div className="mb-2">
            <div className="d-flex align-items-center mb-2 gap-1">
                <div className="text-muted small page-header mb-0 cursor-pointer" onClick={() => this.setState({ showPdfPreview: !showPdfPreview })}>Source Preview</div>
                <HelpTip text={SOURCE_PREVIEW_HELP} />
                <i className={"bi ms-auto cursor-pointer " + (showPdfPreview ? "bi-dash-square" : "bi-plus-square")} onClick={() => this.setState({ showPdfPreview: !showPdfPreview })}></i>
            </div>
            {showPdfPreview && <iframe src={this.state.pdfUrl} width="100%" height="600px" style={{ border: "1px solid #dee2e6", borderRadius: "4px" }} />}
        </div>;
    }

    render() {
        return (
            <div className="mb-2">
                <div className="d-flex align-items-center gap-1 mb-2">
                    <div className="text-muted small page-header mb-0">Upload Statement</div>
                    <HelpTip items={UPLOAD_HELP} />
                </div>
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
