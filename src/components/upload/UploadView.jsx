"use strict";

import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import jobService from "@services/jobService";
import labelUtil from "@utils/labelUtil";
import CrudAccountModal from "@components/accounts/CrudAccountModal.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { UPLOAD_HELP } from "@utils/helpContent";

class Upload extends React.Component {
    state = {
        file: null,
        password: "",
        showPassword: true,
        fromPage: "",
        toPage: "",
        accountId: "",
        draftName: "",
        openingBalance: "",
        submitting: false,
        showAccountModal: false,
        jobId: null,
    };

    handleChange = (e) => this.setState({ [e.target.name]: e.target.value });

    handleFileUpload = (e) => {
        const file = e.target.files[0];
        this.setState({ file }, this.autoFillDraftName);
    }

    handleAccountChange = (e) => {
        const accountId = e.target.value;
        const update = { accountId };
        if (!this.state.openingBalance && accountId) {
            const account = this.props.accounts.find(a => a._id === accountId);
            if (account && account.closingBalance) update.openingBalance = account.closingBalance;
        }
        this.setState(update, this.autoFillDraftName);
    }

    autoFillDraftName = () => {
        if (this.state.draftName) return;
        const { accountId, file } = this.state;
        if (!accountId || !file) return;
        const account = this.props.accounts.find(a => a._id === accountId);
        if (!account) return;
        const fileName = file.name;
        this.setState({ draftName: `${labelUtil.getAccountLabel(account)} - ${fileName}` });
    }

    toggleAccountModal = (accountId = this.state.accountId) => {
        this.setState({ showAccountModal: !this.state.showAccountModal, accountId });
    }

    submit = (e) => {
        e.preventDefault();
        const { file, fromPage, toPage, password, accountId, draftName, openingBalance } = this.state;
        this.setState({ submitting: true });
        jobService.create("AUTO", file, fromPage, toPage, password, accountId, draftName, openingBalance).then(data => {
            this.setState({ submitting: false, jobId: data.jobId });
        }).catch(() => {
            this.setState({ submitting: false });
        });
    }

    render() {
        const { submitting, jobId } = this.state;
        return <div>
            <div className="d-flex align-items-center gap-1 mb-2">
                <div className="text-muted small page-header mb-0">Upload Statement</div>
                <HelpTip items={UPLOAD_HELP} />
            </div>
            <form className="p-3 shadow mb-2" onSubmit={this.submit}>
                <div className="mb-2">
                    <label className="form-label">File</label>
                    <input type="file" className="form-control" onChange={this.handleFileUpload} required />
                    <label className="form-check-label small text-muted mt-1">
                        <input type="checkbox" className="form-check-input me-1"
                            checked={this.state.showPassword}
                            onChange={() => this.setState({ showPassword: !this.state.showPassword, password: "" })} />
                        Password protected
                    </label>
                </div>
                {this.state.showPassword && <div className="mb-2">
                    <label className="form-label">PDF Password</label>
                    <input type="password" className="form-control" name="password" value={this.state.password} onChange={this.handleChange} />
                    <div className="form-text text-muted">Password is never stored — only used for this extraction.</div>
                </div>}
                <div className="row mb-2">
                    <div className="col">
                        <label className="form-label">Account</label>
                        <div className="d-flex">
                            <select className="form-select me-2" name="accountId" value={this.state.accountId} onChange={this.handleAccountChange} required>
                                <option value=""></option>
                                {this.props.accounts.map((account, index) => (
                                    <option key={index} value={account._id}>{labelUtil.getAccountLabel(account)}</option>
                                ))}
                            </select>
                            <button type="button" className="btn btn-outline-dark" onClick={() => this.toggleAccountModal()}>+</button>
                        </div>
                    </div>
                    {this.state.accountId && this.props.accounts.find(a => a._id === this.state.accountId)?.type !== "credit_card" && <div className="col">
                        <label className="form-label">Opening Balance <span className="text-muted small">(optional)</span></label>
                        <input type="number" className="form-control" name="openingBalance" value={this.state.openingBalance} onChange={this.handleChange} />
                    </div>}
                </div>
                <div className="mb-2">
                    <label className="form-label">Draft Name</label>
                    <input type="text" className="form-control" name="draftName" value={this.state.draftName} onChange={this.handleChange} required />
                </div>
                <div className="d-flex align-items-center gap-3">
                    <button className="btn btn-outline-dark" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Extraction Job"}
                    </button>
                </div>
            </form>
            {jobId && <div className="alert alert-success mb-2">
                Extraction job submitted. <Link to={`/jobs/${jobId}`}>View Job</Link>
            </div>}
            <CrudAccountModal show={this.state.showAccountModal} onSave={(data) => this.toggleAccountModal(data.account._id)} onClose={() => this.toggleAccountModal()} />
        </div>;
    }
}

export default connect(state => _.pick(state.user, ["accounts"]))(Upload);
