"use strict";

import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import draftService from "@services/draftService";
import DraftCard from "./DraftCard.jsx";
import CrudDraftModal from "./CrudDraftModal.jsx";
import SortDropdown from "@components/ui/SortDropdown.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { DRAFTS_HELP } from "@utils/helpContent";
import uiUtil from "@utils/uiUtil";

class DraftsView extends React.Component {

    state = { 
        drafts: [], 
        loading: true, 
        draftModalMode: null, 
        editDraft: null, 
        sortField: "createdAt", 
        sortDirection: "desc" 
    };

    pollTimer = null;

    componentDidMount() { this.fetchDrafts(); }
    componentWillUnmount() { clearInterval(this.pollTimer); }

    fetchDrafts = () => {
        draftService.getAll().then(data => {
            this.setState({ drafts: data.drafts, loading: false }, this.autoRefresh);
        }).catch(() => this.setState({ loading: false }));
    }

    autoRefresh = () => {
        const shouldPoll = this.state.drafts.some(d => ["queued", "started"].includes(d.status));
        if (shouldPoll && !this.pollTimer) this.pollTimer = setInterval(this.fetchDrafts, 3000);
        else if (!shouldPoll) { clearInterval(this.pollTimer); this.pollTimer = null; }
    }

    onCrudSave = (draftOrId) => {
        if (typeof draftOrId === "string") {
            this.props.history.push(`/drafts/${draftOrId}`);
        } else {
            this.setState({ drafts: this.state.drafts.map(d => d._id === draftOrId._id ? { ...d, ...draftOrId } : d), draftModalMode: null, editDraft: null });
        }
    }

    onDelete = (draft) => {
        this.setState({ drafts: this.state.drafts.filter(d => d._id !== draft._id) });
    }

    getSortOptions() {
        return [
            { field: "name", label: "Name" },
            { field: "createdAt", label: "Created" },
            { field: "status", label: "Status" },
            { field: "accountName", label: "Account" },
            { field: "accountType", label: "Account Type" },
        ];
    }

    getSortedDrafts() {
        const drafts = this.state.drafts.map(d => {
            const account = this.props.accountsMap[d.accountId];
            return { ...d, accountName: account?.name || "", accountType: account?.type || "" };
        });
        return _.orderBy(drafts, [this.state.sortField], [this.state.sortDirection]);
    }

    renderDrafts() {
        if (this.state.drafts.length === 0) {
            return <div className="text-muted small">No drafts yet. Import a statement or create a blank draft to get started.</div>;
        }
        return this.getSortedDrafts().map(draft => (
            <DraftCard key={draft._id} draft={draft} onDelete={this.onDelete} onEdit={(d) => this.setState({ draftModalMode: "edit", editDraft: d })} />
        ));
    }

    render() {
        if (this.state.loading) return uiUtil.spinnerLoader("mt-3");

        return <div>
            <div className="d-flex align-items-center gap-2 mb-2">
                <div className="text-muted small page-header mb-0">Drafts</div>
                <HelpTip items={DRAFTS_HELP} />
                <div className="ms-auto d-flex align-items-center gap-2">
                    <SortDropdown options={this.getSortOptions()} prefStoreKey="drafts.sort"
                        selected={{ field: this.state.sortField, direction: this.state.sortDirection }}
                        onChange={(field, direction) => this.setState({ sortField: field, sortDirection: direction })} />
                    <button className="btn btn-sm btn-outline-dark" onClick={() => this.setState({ draftModalMode: "create" })}>New Draft</button>
                    <button className="btn btn-sm btn-outline-dark" onClick={() => this.setState({ draftModalMode: "import" })}>Import</button>
                </div>
            </div>
            {this.renderDrafts()}
            <CrudDraftModal show={!!this.state.draftModalMode} mode={this.state.draftModalMode} draft={this.state.editDraft}
                onSave={this.onCrudSave} onClose={() => this.setState({ draftModalMode: null, editDraft: null })} />
        </div>;
    }
}

export default withRouter(connect(state => _.pick(state.user, ["accountsMap"]))(DraftsView));
