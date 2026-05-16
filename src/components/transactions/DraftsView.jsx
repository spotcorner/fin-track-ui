"use strict";

import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { toast } from "react-toastify";
import draftService from "@services/draftService";
import CrudDraftModal from "./CrudDraftModal.jsx";
import SortDropdown from "@components/ui/SortDropdown.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { DRAFTS_HELP } from "@utils/helpContent";
import uiUtil from "@utils/uiUtil";
import amountUtil from "@utils/amountUtil";
import labelUtil from "@utils/labelUtil";

class DraftsView extends React.Component {
    state = { drafts: [], loading: true, editDraft: null, sortField: "createdAt", sortDirection: "desc" };

    componentDidMount() { this.fetchDrafts(); }

    fetchDrafts = () => {
        draftService.getAll().then(data => {
            this.setState({ drafts: data.drafts, loading: false });
        }).catch(() => this.setState({ loading: false }));
    }

    getSortOptions() {
        return [
            { field: "name", label: "Name" },
            { field: "createdAt", label: "Created" },
            { field: "accountName", label: "Account" },
            { field: "accountType", label: "Account Type" },
        ];
    }

    getSortedDrafts() {
        const drafts = this.state.drafts.map(d => {
            const account = this.props.accounts.find(a => a._id === d.accountId);
            return { ...d, accountName: account?.name || "", accountType: account?.type || "" };
        });
        return _.orderBy(drafts, [this.state.sortField], [this.state.sortDirection]);
    }

    handleEditSave = (draft) => {
        this.setState(prev => ({
            drafts: prev.drafts.map(d => d._id === draft._id ? draft : d),
            editDraft: null,
        }));
        toast.info("Draft updated ✅");
    }

    render() {
        const { drafts, loading } = this.state;
        if (loading) return uiUtil.spinnerLoader("mt-3");

        return <div>
            <div className="d-flex align-items-center gap-1 mb-2">
                <div className="text-muted small page-header">Drafts</div>
                <HelpTip items={DRAFTS_HELP} />
                <div className="ms-auto">
                    <SortDropdown options={this.getSortOptions()} prefStoreKey="drafts.sort"
                        selected={{ field: this.state.sortField, direction: this.state.sortDirection }}
                        onChange={(field, direction) => this.setState({ sortField: field, sortDirection: direction })} />
                </div>
            </div>
            {drafts.length === 0
                ? <div className="text-muted small">No active drafts. <Link to="/upload-statement">Upload a statement</Link> to create one.</div>
                : <div className="list-group">
                    {this.getSortedDrafts().map(draft => {
                        const account = this.props.accounts.find(a => a._id === draft.accountId);
                        const isCreditCard = account?.type === "credit_card";
                        return <div key={draft._id} className="list-group-item d-flex align-items-center gap-2">
                            <Link to={`/drafts/${draft._id}`} className="flex-grow-1 text-decoration-none text-reset">
                                <div className="small fw-bold">{draft.name}</div>
                                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                    {account && labelUtil.getAccountLabel(account)}
                                    {!isCreditCard && draft.openingBalance ? ` · Opening Balance: ₹${amountUtil.getFormattedAmount(draft.openingBalance)}` : ""}
                                </div>
                                <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                                    {moment(draft.createdAt).format("MMM D, YYYY h:mm A")}
                                </div>
                            </Link>
                            <button className="btn btn-sm btn-outline-dark" onClick={() => this.setState({ editDraft: draft })}>
                                <i className="bi bi-pencil"></i>
                            </button>
                        </div>;
                    })}
                </div>}
            <CrudDraftModal show={!!this.state.editDraft} draft={this.state.editDraft}
                onSave={this.handleEditSave}
                onClose={() => this.setState({ editDraft: null })} />
        </div>;
    }
}

export default connect(state => _.pick(state.user, ["accounts"]))(DraftsView);
