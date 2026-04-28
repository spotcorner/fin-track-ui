"use strict";

import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { toast } from "react-toastify";
import draftService from "@services/draftService";
import TransactionsLayout from "./TransactionsLayout.jsx";
import Modal from "@components/modal/Modal.jsx";
import CrudDraftModal from "./CrudDraftModal.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { DRAFTS_HELP } from "@utils/helpContent";
import uiUtil from "@utils/uiUtil";
import amountUtil from "@utils/amountUtil";
import PreferenceStore from "@utils/PreferenceStore";

const draftPref = new PreferenceStore("drafts.selection", { selectedDraftId: "" });

class DraftsLayout extends React.Component {

    state = {
        drafts: [],
        selectedDraftId: "",
        loading: true,
        showCloseModal: false,
        showEditModal: false,
    }

    getQueryDraftId() {
        return new URLSearchParams(this.props.location.search).get("draftId") || "";
    }

    setQueryDraftId(id) {
        const params = new URLSearchParams(this.props.location.search);
        if (id) params.set("draftId", id); else params.delete("draftId");
        this.props.history.replace({ search: params.toString() });
    }

    fetchDrafts = () => {
        this.setState({ loading: true });
        draftService.getAll().then(data => {
            const drafts = data.drafts;
            const queryId = this.getQueryDraftId();
            const prefId = draftPref.get().selectedDraftId;
            const selectedDraftId = [queryId, prefId].find(id => id && drafts.find(d => d._id === id)) || (drafts.length > 0 ? drafts[0]._id : "");
            this.setQueryDraftId(selectedDraftId);
            draftPref.set({ selectedDraftId });
            this.setState({ drafts, selectedDraftId, loading: false });
        }).catch(() => {
            this.setState({ loading: false });
        });
    }

    handleDraftChange = (e) => {
        const selectedDraftId = e.target.value;
        this.setQueryDraftId(selectedDraftId);
        draftPref.set({ selectedDraftId });
        this.setState({ selectedDraftId });
    }

    closeDraft = () => {
        draftService.close(this.state.selectedDraftId).then(() => {
            toast.info("Draft closed ✅");
            this.setState({ showCloseModal: false });
            this.fetchDrafts();
        });
    }

    getSelectedDraft = () => this.state.drafts.find(d => d._id === this.state.selectedDraftId);

    handleDraftSave = (draft) => {
        this.setState(prev => ({
            drafts: prev.drafts.map(d => d._id === draft._id ? draft : d),
            showEditModal: false,
        }));
    }

    isCreditCard = () => this.props.accountsMap[this.getSelectedDraft()?.accountId]?.type === "credit_card";

    render() {
        const { drafts, selectedDraftId, loading } = this.state;

        if (loading) return uiUtil.spinnerLoader("mt-3");

        if (drafts.length === 0) {
            return <div className="mt-3 text-center text-muted">No active drafts found.</div>;
        }

        const selectedDraft = this.getSelectedDraft();

        return <div>
            <div className="d-flex align-items-center gap-1 mb-2">
                <div className="text-muted small page-header">Drafts</div>
                <HelpTip items={DRAFTS_HELP} />
                <div className="ms-auto d-flex align-items-center gap-2">
                    {!this.isCreditCard() && <span className="badge bg-primary bg-opacity-10 text-primary">
                        Opening Balance ₹{amountUtil.getFormattedAmount(selectedDraft?.openingBalance || 0)}
                    </span>}
                    <select className="form-select form-select-sm" style={{ width: "auto" }} value={selectedDraftId} onChange={this.handleDraftChange}>
                        {drafts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => this.setState({ showEditModal: true })}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-outline-danger btn-sm text-nowrap" onClick={() => this.setState({ showCloseModal: true })}>Close Draft</button>
                </div>
            </div>
            <Modal show={this.state.showCloseModal} title="Close Draft"
                body="Are you sure you want to close this draft?"
                onSubmitClick={this.closeDraft}
                onClose={() => this.setState({ showCloseModal: false })} />
            <CrudDraftModal show={this.state.showEditModal} draft={selectedDraft}
                onSave={this.handleDraftSave}
                onClose={() => this.setState({ showEditModal: false })} />
            {selectedDraftId && <TransactionsLayout key={selectedDraftId}
                isDraft={1} draftId={selectedDraftId} draftOpeningBalance={selectedDraft?.openingBalance || 0}
                sortByDate={1} basePath={"/drafts"} tab={this.props.tab} />}
        </div>;
    }

    componentDidMount() {
        this.fetchDrafts();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.search !== this.props.location.search && !this.getQueryDraftId() && this.state.selectedDraftId) {
            this.setQueryDraftId(this.state.selectedDraftId);
        }
    }
}

export default withRouter(connect(state => _.pick(state.user, ["accountsMap"]))(DraftsLayout));
