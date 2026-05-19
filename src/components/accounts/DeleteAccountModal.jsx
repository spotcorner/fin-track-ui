"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@components/modal/Modal.jsx";
import accountService from "@services/accountService";
import { deleteAccountRequest } from "@store";

class DeleteAccountModal extends React.Component {
    state = { stats: null, loading: false, confirmText: "" };

    componentDidUpdate(prevProps) {
        if (this.props.accountId && this.props.accountId !== prevProps.accountId) {
            this.setState({ stats: null, loading: true, confirmText: "" });
            accountService.getDeleteStats(this.props.accountId).then(data => {
                this.setState({ stats: data.counts, loading: false });
            });
        }
    }

    handleDelete = () => {
        this.props.dispatch(deleteAccountRequest(this.props.accountId)).unwrap().then(() => {
            toast.info("Account deleted ✅");
            this.props.onClose();
        });
    }

    getBody() {
        const { stats, loading, confirmText } = this.state;
        if (loading) return <div className="d-flex justify-content-center py-3"><div className="spinner-border spinner-border-sm"></div></div>;
        if (!stats) return null;
        const { transactions, drafts } = stats;
        const hasLinked = transactions > 0 || drafts > 0;
        return <div>
            {hasLinked && <div className="mb-2">
                <div className="fw-bold mb-1">This will permanently delete:</div>
                <ul className="mb-0 small">
                    {transactions > 0 && <li>{transactions} transaction{transactions !== 1 ? "s" : ""}</li>}
                    {drafts > 0 && <li>{drafts} draft{drafts !== 1 ? "s" : ""}</li>}
                </ul>
            </div>}
            <div className="text-danger small fw-bold mb-2">This action is unrecoverable.</div>
            <div>
                <label className="form-label small">Type <b>confirm</b> to proceed</label>
                <input type="text" className="form-control" value={confirmText}
                    onChange={(e) => this.setState({ confirmText: e.target.value })} />
            </div>
        </div>;
    }

    render() {
        return <Modal show={!!this.props.accountId} title="Delete Account"
            body={this.getBody()}
            submitDisabled={this.state.confirmText !== "confirm"}
            onSubmitClick={this.handleDelete}
            onClose={this.props.onClose} />;
    }
}

export default connect()(DeleteAccountModal);
