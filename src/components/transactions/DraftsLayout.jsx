"use strict";

import React from "react";
import { toast } from "react-toastify";
import draftService from "@services/draftService";
import TransactionsLayout from "./TransactionsLayout.jsx";
import Modal from "@components/modal/Modal.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { DRAFTS_HELP } from "@utils/helpContent";
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
            <div className="d-flex align-items-center gap-1 mb-2">
                <div className="text-muted small page-header">Drafts</div>
                <HelpTip items={DRAFTS_HELP} />
                <div className="ms-auto d-flex align-items-center gap-2">
                    <select className="form-select form-select-sm" style={{ width: "auto" }} value={selectedDraftId} onChange={this.handleDraftChange}>
                        {drafts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                    <button className="btn btn-outline-secondary btn-sm text-nowrap" onClick={() => this.setState({ showCloseModal: true })}>Close Draft</button>
                </div>
            </div>
            <Modal show={this.state.showCloseModal} title="Close Draft"
                body="Are you sure you want to close this draft?"
                onSubmitClick={this.closeDraft}
                onClose={() => this.setState({ showCloseModal: false })} />
            {selectedDraftId && <TransactionsLayout key={selectedDraftId}
                isDraft={1} draftId={selectedDraftId} sortByDate={1} basePath={"/drafts"} />}
        </div>;
    }

    componentDidMount() {
        this.fetchDrafts();
    }
}
