"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@components/modal/Modal.jsx";
import jobService from "@services/jobService";
import labelUtil from "@utils/labelUtil";

class CrudJobModal extends React.Component {

    state = this.getInitialState()

    getInitialState() {
        return {
            draftName: this.props.job?.draftName || "",
            accountId: this.props.job?.accountId || "",
            openingBalance: this.props.job?.openingBalance || 0,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.show !== this.props.show && this.props.show) {
            this.setState(this.getInitialState());
        }
    }

    handleChange = (e) => this.setState({ [e.target.name]: e.target.value });

    handleSubmit = () => {
        const data = {
            draftName: this.state.draftName,
            accountId: this.state.accountId,
            openingBalance: parseFloat(this.state.openingBalance) || 0,
            version: this.props.job.version,
        };
        jobService.update(this.props.job._id, data).then(({ job }) => {
            toast.info("Job updated ✅");
            this.props.onSave(job);
        });
    }

    isCreditCard = () => this.props.accountsMap[this.state.accountId]?.type === "credit_card";

    getBody() {
        return <form>
            <div className="mb-2">
                <label className="form-label">Draft Name</label>
                <input type="text" className="form-control" name="draftName"
                    value={this.state.draftName} onChange={this.handleChange} required />
            </div>
            <div className="mb-2">
                <label className="form-label">Account</label>
                <select className="form-select" name="accountId" value={this.state.accountId} onChange={this.handleChange} required>
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
        return <Modal show={this.props.show} title="Edit Job"
            body={this.getBody()} onSubmitClick={this.handleSubmit} onClose={this.props.onClose} />;
    }
}

export default connect(state => _.pick(state.user, ["accounts", "accountsMap"]))(CrudJobModal);
