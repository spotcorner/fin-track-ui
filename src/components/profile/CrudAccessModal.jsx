"use strict";

import React from "react";
import Modal from "@components/modal/Modal.jsx";

export default class CrudAccessModal extends React.Component {

    state = this.getInitialState()

    getInitialState() {
        const { data } = this.props;
        return { email: data?.email || "", accessType: data?.accessType || "readonly", nickname: data?.nickname || "" };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.show !== this.props.show && this.props.show) {
            this.setState(this.getInitialState());
        }
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    }

    getTitle() {
        switch (this.props.mode) {
            case "grant": return "Grant Access";
            case "editGranted": return "Edit Access";
            case "editReceived": return "Edit Nickname";
            default: return "";
        }
    }

    getBody() {
        const { mode } = this.props;
        const isGrant = mode === "grant";
        const isEditReceived = mode === "editReceived";
        return <form>
            <div className="mb-2">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" name="email" value={this.state.email}
                    onChange={this.handleChange} required disabled={!isGrant} />
            </div>
            <div className="mb-2">
                <label className="form-label">Access Type</label>
                <select className="form-select" name="accessType" value={this.state.accessType}
                    onChange={this.handleChange} disabled={isEditReceived}>
                    <option value="readonly">Read Only</option>
                    <option value="full">Full Access</option>
                </select>
            </div>
            <div className="mb-2">
                <label className="form-label">Nickname</label>
                <input type="text" className="form-control" name="nickname" value={this.state.nickname}
                    onChange={this.handleChange} />
            </div>
        </form>;
    }

    onSubmit = () => {
        this.props.onSubmit(this.state);
    }

    render() {
        return <Modal show={this.props.show} title={this.getTitle()}
            body={this.getBody()} onSubmitClick={this.onSubmit} onClose={this.props.onClose} />;
    }
}
