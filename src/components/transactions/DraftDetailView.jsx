"use strict";

import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { toast } from "react-toastify";
import draftService from "@services/draftService";
import TransactionsLayout from "./TransactionsLayout.jsx";
import Modal from "@components/modal/Modal.jsx";
import CrudDraftModal from "./CrudDraftModal.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { DRAFT_DETAIL_HELP } from "@utils/helpContent";
import uiUtil from "@utils/uiUtil";
import amountUtil from "@utils/amountUtil";
import labelUtil from "@utils/labelUtil";

class DraftDetailView extends React.Component {

    state = {
        draft: null,
        loading: true,
        showCloseModal: false,
        showEditModal: false,
    }

    componentDidMount() { this.fetchDraft(); }

    fetchDraft = () => {
        draftService.getAll().then(data => {
            const id = this.props.match.params.id;
            const draft = data.drafts.find(d => d._id === id);
            this.setState({ draft, loading: false });
        }).catch(() => this.setState({ loading: false }));
    }

    closeDraft = () => {
        draftService.close(this.state.draft._id).then(() => {
            toast.info("Draft closed ✅");
            this.props.history.push("/drafts");
        }).catch(() => {
            this.setState({ showCloseModal: false });
        });
    }

    handleDraftSave = (draft) => {
        this.setState({ draft, showEditModal: false });
    }

    isCreditCard = () => this.props.accountsMap[this.state.draft?.accountId]?.type === "credit_card";

    render() {
        const { draft, loading } = this.state;
        if (loading) return uiUtil.spinnerLoader("mt-3");
        if (!draft) return <div>
            <div className="d-flex align-items-center gap-1 mb-2">
                <Link to="/drafts" className="btn btn-sm btn-outline-secondary"><i className="bi bi-arrow-left"></i></Link>
                <div className="text-muted small page-header">Draft</div>
            </div>
            <div className="alert alert-danger">Draft not found.</div>
        </div>;

        return <div>
            <div className="d-flex align-items-center gap-1 mb-2">
                <Link to="/drafts" className="btn btn-sm btn-outline-secondary"><i className="bi bi-arrow-left"></i></Link>
                <div className="text-muted small page-header">Draft — {draft.name}</div>
                <HelpTip items={DRAFT_DETAIL_HELP} />
                <div className="ms-auto d-flex align-items-center gap-2">
                    <span className="badge bg-dark bg-opacity-10 text-dark">
                        {this.props.accountsMap[draft.accountId] && labelUtil.getAccountLabel(this.props.accountsMap[draft.accountId])}
                    </span>
                    {!this.isCreditCard() && <span className="badge bg-primary bg-opacity-10 text-primary">
                        Opening Balance: ₹{amountUtil.getFormattedAmount(draft.openingBalance || 0)}
                    </span>}
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => this.setState({ showEditModal: true })}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-outline-danger btn-sm text-nowrap" onClick={() => this.setState({ showCloseModal: true })}>Close Draft</button>
                </div>
            </div>
            <Modal show={this.state.showCloseModal} title="Close Draft"
                body="Are you sure you want to close this draft?"
                onSubmitClick={this.closeDraft}
                onClose={() => this.setState({ showCloseModal: false })} />
            <CrudDraftModal show={this.state.showEditModal} draft={draft}
                onSave={this.handleDraftSave}
                onClose={() => this.setState({ showEditModal: false })} />
            <TransactionsLayout
                isDraft={1} draftId={draft._id} draftAccountId={draft.accountId}
                draftOpeningBalance={draft.openingBalance || 0}
                sortByDate={1} basePath={`/drafts/${draft._id}`} tab={this.props.match?.params?.tab} />
        </div>;
    }
}

export default withRouter(connect(state => _.pick(state.user, ["accountsMap"]))(DraftDetailView));
