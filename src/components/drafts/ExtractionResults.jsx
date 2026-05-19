"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { EXTRACTOR_TYPE_LABELS } from "@config";
import draftService from "@services/draftService";
import amountUtil from "@utils/amountUtil";
import { getUnmappedColumns, getFlattenedResults, applyMapping } from "@utils/transactionGroupUtil";
import { getDefaultMapping, isMappingComplete } from "@utils/columnMappingUtil";
import ColumnMappingTable from "@components/upload/ColumnMappingTable.jsx";
import TransactionPreview from "@components/upload/TransactionPreview.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { EXTRACTION_RESULT_HELP } from "@utils/helpContent";

class ExtractionResults extends React.Component {
    constructor(props) {
        super(props);
        const flattened = getFlattenedResults(props.results, EXTRACTOR_TYPE_LABELS);
        const mappings = {};
        if (flattened) flattened.forEach((row, i) => {
            if (row.unmapped) {
                const columns = getUnmappedColumns(row.transactions);
                const columnMapping = getDefaultMapping(columns, row.transactions);
                mappings[i] = { columnMapping, isComplete: isMappingComplete({ columnMapping }, columns, row.transactions) };
            }
        });
        this.state = {
            flattened,
            mappings,
            selectedResult: null,
            saving: false,
            expanded: {},
            showMappedPreview: {},
        };
    }

    getSelectedResult = () => {
        const { flattened, selectedResult } = this.state;
        return flattened && selectedResult !== null ? flattened[selectedResult] : null;
    }

    saveDraft = () => {
        const selected = this.getSelectedResult();
        if (!selected) return;
        const idx = this.state.selectedResult;
        const transactions = selected.unmapped
            ? this.getMappedPreviewData(selected, idx)
            : selected.transactions;
        if (!transactions || transactions.length === 0) return;
        const { draft } = this.props;
        this.setState({ saving: true });
        draftService.saveDraft(draft._id, { transactions }).then(() => {
            toast.info("Draft saved ✅");
            this.props.onDraftSaved();
        }).catch(() => {
            this.setState({ saving: false });
        });
    }

    isMappingIncomplete = () => {
        const selected = this.getSelectedResult();
        if (!selected?.unmapped) return false;
        return !this.getMapping(this.state.selectedResult)?.isComplete;
    }

    canSave = () => this.state.selectedResult !== null && !this.isMappingIncomplete();

    isCreditCard = () => this.props.accountsMap[this.props.draft.accountId]?.type === "credit_card";

    toggleExpand = (i) => this.setState({ expanded: { ...this.state.expanded, [`row_${i}`]: !this.state.expanded[`row_${i}`] } });

    selectResult = (e, i) => {
        e.stopPropagation();
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

    getMapping(idx) { return this.state.mappings[idx] || null; }

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
        const opening = this.props.draft.openingBalance || 0;
        if (!opening || this.isCreditCard()) return null;
        return this.renderBadge("closing", opening + totalCredit - totalDebit, "Closing");
    }

    getRowBadges(row, idx, mappedData) {
        if (row.unmapped) {
            if (!mappedData) return null;
            let totalDebit = 0, totalCredit = 0;
            mappedData.forEach(txn => { if (txn.type === "CREDIT") totalCredit += txn.amount; else totalDebit += txn.amount; });
            return <>{this.renderBadge("debit", totalDebit)}{this.renderBadge("credit", totalCredit)}{this.getClosingBalance(totalDebit, totalCredit)}</>;
        }
        const isCS = row.extractor.includes("CS");
        return <>
            {this.renderBadge("debit", row.totalDebit, isCS ? "Spends" : null)}
            {this.renderBadge("credit", row.totalCredit, isCS ? "Payments" : null)}
            {this.getClosingBalance(row.totalDebit, row.totalCredit)}
        </>;
    }

    renderRowHeader(row, i, mappedData) {
        const isComplete = !row.unmapped || !!mappedData;
        const isExpanded = this.state.expanded[`row_${i}`];
        return <div className="d-flex align-items-center p-2 flex-wrap">
            <input type="radio" className="form-check-input me-2" checked={this.state.selectedResult === i}
                onClick={(e) => this.selectResult(e, i)} readOnly />
            {!isComplete && <span className="badge bg-warning bg-opacity-10 text-warning me-2">Unmapped</span>}
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

    renderRowBody(row, i, mappedData) {
        if (!this.state.expanded[`row_${i}`]) return null;
        if (!row.unmapped) return <TransactionPreview transactions={row.transactions} />;
        if (this.state.showMappedPreview[i]) return <TransactionPreview transactions={mappedData} />;
        return <ColumnMappingTable transactions={row.transactions} columns={getUnmappedColumns(row.transactions)}
            editable initialMapping={this.getMapping(i)}
            onMappingChange={(m) => this.onMappingChange(i, m)} />;
    }

    renderSaveBar() {
        const { saving, selectedResult } = this.state;
        if (selectedResult === null) {
            return <div className="alert alert-info mb-2">Select an extractor result to continue.</div>;
        }
        if (this.isMappingIncomplete()) {
            return <div className="alert alert-warning mb-2">Column mapping required before saving.</div>;
        }
        return <div className="mb-2 d-flex justify-content-end">
            <button className="btn btn-sm btn-outline-dark" disabled={saving} onClick={this.saveDraft}>
                {saving ? "Saving..." : "Save as Draft"}
            </button>
        </div>;
    }

    render() {
        const { flattened } = this.state;
        if (!flattened) return null;
        if (flattened.length === 0) {
            return <div className="alert alert-warning">No transactions found in the uploaded file.</div>;
        }
        return <div>
            {this.renderSaveBar()}
            <div className="mb-2">
                {flattened.map((row, i) => {
                    const mappedData = this.getMappedPreviewData(row, i);
                    return <div key={i} className="border rounded mb-2">
                        {this.renderRowHeader(row, i, mappedData)}
                        {this.renderRowBody(row, i, mappedData)}
                    </div>;
                })}
            </div>
        </div>;
    }
}

export default connect(state => _.pick(state.user, ["accountsMap"]))(ExtractionResults);
