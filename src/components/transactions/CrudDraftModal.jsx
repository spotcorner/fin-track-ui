"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@components/modal/Modal.jsx";
import draftService from "@services/draftService";
import labelUtil from "@utils/labelUtil";

class CrudDraftModal extends React.Component {

    state = this.getInitialState()

    getInitialState() {
        return {
            name: this.props.draft?.name || "",
            accountId: this.props.draft?.accountId || "",
            openingBalance: this.props.draft?.openingBalance || 0,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.show !== this.props.show && this.props.show) {
            this.setState(this.getInitialState());
        }
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    }

    handleSubmit = () => {
        const data = {
            name: this.state.name,
            openingBalance: parseFloat(this.state.openingBalance) || 0,
        };
        draftService.update(this.props.draft._id, data).then(({ draft }) => {
            toast.info("Draft updated ✅");
            this.props.onSave(draft);
        });
    }

    isCreditCard = () => this.props.accounts.find(a => a._id === this.state.accountId)?.type === "credit_card";

    getBody() {
        return <form>
            <div className="mb-2">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" name="name"
                    value={this.state.name} onChange={this.handleChange} required />
            </div>
            <div className="mb-2">
                <label className="form-label">Account</label>
                <select className="form-select" name="accountId" value={this.state.accountId} disabled>
                    <option value=""></option>
                    {this.props.accounts.map((account, index) => (
                        <option key={index} value={account._id}>{labelUtil.getAccountLabel(account)}</option>
                    ))}
                </select>
            </div>
            {this.state.accountId && !this.isCreditCard() && <div className="mb-2">
                <label className="form-label">Opening Balance</label>
                <input type="number" className="form-control" name="openingBalance"
                    value={this.state.openingBalance} onChange={this.handleChange} />
            </div>}
        </form>;
    }

    render() {
        return <Modal show={this.props.show} title="Edit Draft"
            body={this.getBody()} onSubmitClick={this.handleSubmit} onClose={this.props.onClose} />;
    }
}

export default connect(state => _.pick(state.user, ["accounts"]))(CrudDraftModal);
