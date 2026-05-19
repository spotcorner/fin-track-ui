"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@components/modal/Modal.jsx";
import draftService from "@services/draftService";
import labelUtil from "@utils/labelUtil";
import CrudAccountModal from "@components/accounts/CrudAccountModal.jsx";

const MODE_CONFIG = {
    create: { title: "New Draft", submitLabel: "Create" },
    import: { title: "Import Statement", submitLabel: "Start Extraction" },
    edit: { title: "Edit Draft", submitLabel: "Save" },
};

class CrudDraftModal extends React.Component {
    state = this.getInitialState();

    getInitialState() {
        return {
            name: this.props.draft?.name || "",
            accountId: this.props.draft?.accountId || "",
            openingBalance: this.props.draft?.openingBalance || "",
            file: null,
            password: "",
            showPassword: true,
            fromPage: "",
            toPage: "",
            showAccountModal: false,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.show !== this.props.show && this.props.show) {
            this.setState(this.getInitialState());
        }
    }

    handleChange = (e) => this.setState({ [e.target.name]: e.target.value });

    handleFileUpload = (e) => {
        const file = e.target.files[0];
        this.setState({ file }, this.autoFillName);
    }

    handleAccountChange = (e) => {
        const accountId = e.target.value;
        const update = { accountId };
        if (!this.state.openingBalance && accountId) {
            const account = this.props.accountsMap[accountId];
            if (account?.closingBalance) update.openingBalance = account.closingBalance;
        }
        this.setState(update, this.autoFillName);
    }

    autoFillName = () => {
        if (this.state.name || this.props.mode !== "import") return;
        const { accountId, file } = this.state;
        if (!accountId || !file) return;
        const account = this.props.accountsMap[accountId];
        if (!account) return;
        this.setState({ name: `${labelUtil.getAccountLabel(account)} - ${file.name}` });
    }

    isCreditCard = () => this.props.accountsMap[this.state.accountId]?.type === "credit_card";

    handleSubmit = () => {
        const { name, accountId, openingBalance, file, password, fromPage, toPage } = this.state;
        const { mode, draft } = this.props;

        if (mode === "import") {
            draftService.importDraft(file, accountId, name, openingBalance, password, fromPage, toPage).then(data => {
                this.props.onSave(data.draftId);
            });
        } else if (mode === "edit") {
            draftService.update(draft._id, { name, openingBalance: parseFloat(openingBalance) || 0, version: draft.version }).then(({ draft }) => {
                toast.info("Draft updated ✅");
                this.props.onSave(draft);
            });
        } else {
            draftService.create({ name, accountId, openingBalance: parseFloat(openingBalance) || 0 }).then(data => {
                this.props.onSave(data.draftId);
            });
        }
    }

    renderFileFields() {
        return <>
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
        </>;
    }

    renderAccountField() {
        const disabled = this.props.mode === "edit";
        return <div className="d-flex">
            <select className="form-select me-2" name="accountId" value={this.state.accountId} onChange={this.handleAccountChange} required disabled={disabled}>
                <option value=""></option>
                {this.props.accounts.map((account, i) => (
                    <option key={i} value={account._id}>{labelUtil.getAccountLabel(account)}</option>
                ))}
            </select>
            {!disabled && <button type="button" className="btn btn-outline-dark" onClick={() => this.setState({ showAccountModal: true })}>+</button>}
        </div>;
    }

    getBody() {
        return <form>
            <div className="mb-2">
                <label className="form-label">Account</label>
                {this.renderAccountField()}
            </div>
            {this.state.accountId && !this.isCreditCard() && <div className="mb-2">
                <label className="form-label">Opening Balance</label>
                <input type="number" className="form-control" name="openingBalance" value={this.state.openingBalance} onChange={this.handleChange} />
            </div>}
            {this.props.mode === "import" && this.renderFileFields()}
            <div className="mb-2">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" name="name" value={this.state.name} onChange={this.handleChange} required />
            </div>
            <CrudAccountModal show={this.state.showAccountModal}
                onSave={(data) => this.setState({ showAccountModal: false, accountId: data.account._id })}
                onClose={() => this.setState({ showAccountModal: false })} />
        </form>;
    }

    render() {
        const config = MODE_CONFIG[this.props.mode] || MODE_CONFIG.create;
        return <Modal show={this.props.show} title={config.title}
            submitLabel={config.submitLabel}
            body={this.getBody()} onSubmitClick={this.handleSubmit} onClose={this.props.onClose} />;
    }
}

export default connect(state => _.pick(state.user, ["accounts", "accountsMap"]))(CrudDraftModal);
