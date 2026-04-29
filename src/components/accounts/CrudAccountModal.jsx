"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from 'react-toastify';
import Modal from "@modal/Modal.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { ACCOUNT_MODAL_HELP } from "@utils/helpContent";
import { upsertAccountRequest } from "@store";
import { ACCOUNT_TYPE_LABELS } from "@config";

function getDerivedStateFromProps(props) {
    return {
        _id: props.account?._id || "",
        type: props.account?.type || "",
        name: props.account?.name || "",
        openingBalance: props.account?.openingBalance || 0,
        description: props.account?.description || "",
    };
}

class CrudAccountModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = getDerivedStateFromProps(props);
        this.formRef = React.createRef();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.show !== this.props.show && this.props.show) {
            this.setState(getDerivedStateFromProps(this.props));
        }
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSubmit = (e) => {
        e.preventDefault();

        this.state.openingBalance = parseFloat(this.state.openingBalance);
        this.props.dispatch(upsertAccountRequest(this.state)).unwrap().then(data => {
            toast.info("Account saved ✅");
            const onSave = this.props.onSave || this.props.onClose || (() => { });
            onSave(data);
        });
    };

    getModalTitle() {
        const label = this.props.account ? "Edit Account" : "Create Account";
        return <div className="d-flex align-items-center gap-1">{label} <HelpTip items={ACCOUNT_MODAL_HELP} /></div>;
    }

    onSubmitClick = () => {
        if (this.formRef.current) {
            this.formRef.current.requestSubmit();
        }
    }

    getModalBody() {
        const { type, name, openingBalance, description } = this.state;
        return (
            <form ref={this.formRef} onSubmit={this.handleSubmit}>
                <div className="mb-2">
                    <label className="form-label">Account Type</label>
                    <select className="form-control" name="type" value={type} onChange={this.handleChange} required>
                        <option></option>
                        {_.keys(ACCOUNT_TYPE_LABELS).map((key, index) => (
                            <option key={index} value={key}>{ACCOUNT_TYPE_LABELS[key]}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-2">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-control" name="name" value={name} onChange={this.handleChange} required />
                </div>
                {type !== "credit_card" && <div className="mb-2">
                    <label className="form-label">Opening Balance</label>
                    <input type="number" className="form-control" name="openingBalance" value={openingBalance} onChange={this.handleChange} />
                </div>}
                <div className="mb-2">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" name="description" value={description} onChange={this.handleChange} />
                </div>
            </form>
        );
    }

    render() {
        return <Modal show={this.props.show} title={this.getModalTitle()} body={this.getModalBody()} onClose={this.props.onClose} onSubmitClick={this.onSubmitClick} />;
    }
}

export default connect()(CrudAccountModal);