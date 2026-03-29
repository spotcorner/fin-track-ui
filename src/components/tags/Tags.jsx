"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from 'react-toastify';
import CrudRuleModal from "./CrudRuleModal.jsx";
import { deleteRuleRequest } from "@store";
import uiUtil from "@utils/uiUtil.js";

class Rules extends React.Component {
    state = {
        selectedRule: null,
        showModal: false,
    };

    toggleModal = (selectedRule = null) => {
        this.setState({ showModal: !this.state.showModal, selectedRule });
    };

    handleDelete = (_id) => {
        this.props.dispatch(deleteRuleRequest(_id)).then(() => {
            toast.success("Rule deleted ✅");
        });
    };

    getRulesContainer() {
        const { rules, loadingRules } = this.props;

        if (loadingRules) {
            return uiUtil.spinnerLoader("mt-4");
        }

        if (rules.length === 0) {
            return <div className="mt-4">
                <span className="text-muted">No rules found.</span>
            </div>
        }

        return (
            <div className="row">
                {rules.map((rule, index) => (
                    <div key={index} className="col-md-4 mb-3">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <strong>{rule.tag}</strong>
                                <div className="mt-1 text-muted"><small>Keywords: {rule.keywords.map((kw, i) => (
                                    <span key={i} className={"badge me-1 " + (kw.caseSensitive ? "bg-warning text-dark" : "bg-secondary")}>
                                        {kw.value}
                                    </span>
                                ))}</small></div>
                                <div className="mt-3 d-flex justify-content-between">
                                    <button className="btn btn-warning btn-sm" onClick={() => this.toggleModal(rule)}>
                                        <i className="bi bi-pencil"></i> Edit
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => this.handleDelete(rule._id)}>
                                        <i className="bi bi-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }


    getCrudRuleModal() {
        return <CrudRuleModal show={this.state.showModal} rule={this.state.selectedRule} onClose={() => this.toggleModal()} />;
    }

    getAddButton() {
        return <button
            className="btn btn-dark rounded-circle position-fixed bottom-0 end-0 m-4"
            onClick={() => this.toggleModal()}
            style={{ width: "50px", height: "50px" }}
        >+</button>;
    }

    render() {
        return (
            <div className="container mt-3">
                <h1>Rules</h1>
                {this.getRulesContainer()}
                {this.getCrudRuleModal()}
                {this.getAddButton()}
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["rules", "loadingRules"]))(Rules);
