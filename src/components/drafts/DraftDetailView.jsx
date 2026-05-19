"use strict";

import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { toast } from "react-toastify";
import draftService from "@services/draftService";
import TransactionsLayout from "@components/transactions/TransactionsLayout.jsx";
import ExtractionResults from "./ExtractionResults.jsx";
import CrudDraftModal from "./CrudDraftModal.jsx";
import Modal from "@components/modal/Modal.jsx";
import uiUtil from "@utils/uiUtil";
import amountUtil from "@utils/amountUtil";
import labelUtil from "@utils/labelUtil";

class DraftDetailView extends React.Component {
    state = { draft: null, loading: true, showEditModal: false, showFinalizeModal: false, showDeleteModal: false, deleteText: "" };
    pollTimer = null;

    componentDidMount() { this.fetchDraft(); }
    componentWillUnmount() { clearInterval(this.pollTimer); }

    fetchDraft = () => {
        const id = this.props.match.params.id;
        draftService.get(id).then(data => {
            this.setState({ draft: data.draft, loading: false }, this.autoRefresh);
        }).catch(() => this.setState({ loading: false }));
    }

    autoRefresh = () => {
        const shouldPoll = ["queued", "started"].includes(this.state.draft?.status);
        if (shouldPoll && !this.pollTimer) this.pollTimer = setInterval(this.fetchDraft, 2000);
        else if (!shouldPoll) { clearInterval(this.pollTimer); this.pollTimer = null; }
    }

    onEdit = (draft) => {
        this.setState({ draft: { ...this.state.draft, ...draft }, showEditModal: false });
    }

    onDelete = () => {
        this.props.history.push("/drafts");
    }

    onDraftSaved = () => {
        this.fetchDraft();
    }

    finalize = () => {
        draftService.finalize(this.state.draft._id).then(() => {
            toast.info("Draft finalized ✅");
            this.props.history.push("/drafts");
        });
    }

    deleteDraft = () => {
        draftService.delete(this.state.draft._id).then(() => {
            toast.info("Draft deleted ✅");
            this.props.history.push("/drafts");
        });
    }

    renderProcessing() {
        const { draft } = this.state;
        const color = draft.status === "queued" ? "warning" : "primary";
        const label = draft.status === "queued" ? "Waiting in queue..." : "Extraction in progress...";
        return <div className={`alert bg-${color} bg-opacity-10 text-${color} d-flex align-items-center gap-2`}>
            <div className="spinner-border spinner-border-sm"></div>
            {label}
        </div>;
    }

    renderExtracted() {
        const { draft } = this.state;
        return <ExtractionResults results={draft.results} draft={draft} onDraftSaved={this.onDraftSaved} />;
    }

    renderDraft() {
        const { draft } = this.state;
        return <TransactionsLayout
            isDraft={1} draftId={draft._id} draftAccountId={draft.accountId}
            draftOpeningBalance={draft.openingBalance || 0}
            sortByDate={1} basePath={`/drafts/${draft._id}`} tab={this.props.match?.params?.tab} />;
    }

    renderFailed() {
        const { draft } = this.state;
        return <div className="alert alert-danger">{draft.error || "Extraction failed."}</div>;
    }

    renderContent() {
        const { draft } = this.state;
        if (["queued", "started"].includes(draft.status)) return this.renderProcessing();
        if (draft.status === "extracted") return this.renderExtracted();
        if (draft.status === "draft") return this.renderDraft();
        if (draft.status === "failed") return this.renderFailed();
        return null;
    }

    renderHeader() {
        const { draft } = this.state;
        const account = this.props.accountsMap[draft.accountId];
        const isCreditCard = account?.type === "credit_card";

        return <div className="d-flex align-items-center gap-2 mb-2">
            <Link to="/drafts" className="btn btn-sm btn-outline-secondary"><i className="bi bi-arrow-left"></i></Link>
            <div className="text-muted small page-header mb-0">{draft.name}</div>
            <div className="ms-auto d-flex align-items-center gap-2">
                {account && <span className="badge bg-dark bg-opacity-10 text-dark">{labelUtil.getAccountLabel(account)}</span>}
                {!isCreditCard && draft.openingBalance > 0 && <span className="badge bg-primary bg-opacity-10 text-primary">
                    Opening: ₹{amountUtil.getFormattedAmount(draft.openingBalance)}
                </span>}
                <i className="bi bi-pencil cursor-pointer text-muted" onClick={() => this.setState({ showEditModal: true })}></i>
                {draft.status === "draft" && <>
                    <button className="btn btn-sm btn-outline-dark" onClick={() => this.setState({ showFinalizeModal: true })}>Finalize</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => this.setState({ showDeleteModal: true })}>Delete</button>
                </>}
            </div>
        </div>;
    }

    renderFinalizeModal() {
        return <Modal show={this.state.showFinalizeModal} title="Finalize Draft"
            body="Are you sure? Transactions will be saved permanently."
            onSubmitClick={this.finalize}
            onClose={() => this.setState({ showFinalizeModal: false })} />;
    }

    renderDeleteModal() {
        const canDelete = this.state.deleteText.toLowerCase() === "delete";
        return <Modal show={this.state.showDeleteModal} title="Delete Draft"
            body={<div>
                <p>This will delete all draft transactions. Type <strong>delete</strong> to confirm.</p>
                <input type="text" className="form-control" value={this.state.deleteText}
                    onChange={(e) => this.setState({ deleteText: e.target.value })} />
            </div>}
            submitDisabled={!canDelete}
            onSubmitClick={this.deleteDraft}
            onClose={() => this.setState({ showDeleteModal: false, deleteText: "" })} />;
    }

    renderNotFound() {
        return <div>
            <div className="d-flex align-items-center gap-2 mb-2">
                <Link to="/drafts" className="btn btn-sm btn-outline-secondary"><i className="bi bi-arrow-left"></i></Link>
                <div className="text-muted small page-header mb-0">Draft</div>
            </div>
            <div className="alert alert-danger">Draft not found.</div>
        </div>;
    }

    render() {
        const { draft, loading } = this.state;
        if (loading) return uiUtil.spinnerLoader("mt-3");
        if (!draft) return this.renderNotFound();

        return <div>
            {this.renderHeader()}
            {this.renderContent()}
            <CrudDraftModal show={this.state.showEditModal} draft={draft} onSave={this.onEdit} onClose={() => this.setState({ showEditModal: false })} />
            {this.renderFinalizeModal()}
            {this.renderDeleteModal()}
        </div>;
    }
}

export default withRouter(connect(state => _.pick(state.user, ["accountsMap"]))(DraftDetailView));
