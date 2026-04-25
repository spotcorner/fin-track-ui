"use strict";

import React from "react";
import { toast } from "react-toastify";
import draftService from "@services/draftService";
import TransactionsLayout from "./TransactionsLayout.jsx";
import Modal from "@components/modal/Modal.jsx";
import uiUtil from "@utils/uiUtil";

export default class DraftsLayout extends React.Component {

    state = {
        drafts: [],
        selectedDraftId: "",
        loading: true,
        showCloseModal: false,
    }

    fetchDrafts = () => {
        this.setState({ loading: true });
        draftService.getAll().then(data => {
            const drafts = data.drafts;
            this.setState({
                drafts,
                selectedDraftId: drafts.length > 0 ? drafts[0]._id : "",
                loading: false,
            });
        }).catch(() => {
            this.setState({ loading: false });
        });
    }

    handleDraftChange = (e) => {
        this.setState({ selectedDraftId: e.target.value });
    }

    closeDraft = () => {
        draftService.close(this.state.selectedDraftId).then(() => {
            toast.info("Draft closed ✅");
            this.setState({ showCloseModal: false });
            this.fetchDrafts();
        });
    }

    render() {
        const { drafts, selectedDraftId, loading } = this.state;

        if (loading) return uiUtil.spinnerLoader("mt-3");

        if (drafts.length === 0) {
            return <div className="mt-3 text-center text-muted">No active drafts found.</div>;
        }

        return <div>
            <div className="text-muted small mb-2 page-header">Drafts</div>
            <div className="mb-2 d-flex gap-2 align-items-center">
                <select className="form-select" value={selectedDraftId} onChange={this.handleDraftChange}>
                    {drafts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <button className="btn btn-outline-secondary text-nowrap" onClick={() => this.setState({ showCloseModal: true })}>Close Draft</button>
            </div>
            <Modal show={this.state.showCloseModal} title="Close Draft"
                body="Are you sure you want to close this draft?"
                onSubmitClick={this.closeDraft}
                onClose={() => this.setState({ showCloseModal: false })} />
            {selectedDraftId && <TransactionsLayout key={selectedDraftId}
                isDraft={1} draftId={selectedDraftId} sortByDate={1} />}
        </div>;
    }

    componentDidMount() {
        this.fetchDrafts();
    }
}
