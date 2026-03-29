"use strict";

import React from "react";
import { connect } from "react-redux";
import Modal from "@modal/Modal.jsx";
import CrudTagModal from "@components/tags/CrudTagModal.jsx";
import transactionService from "@services/transactionService";
import { toast } from "react-toastify";

const CREATE_NEW = "__CREATE_NEW__";
const STEP_SELECT = "select";
const STEP_ACTION = "action";

class TagTransactionModal extends React.Component {
    state = { selectedTagId: "", step: STEP_SELECT };

    componentDidUpdate(prevProps) {
        if (prevProps.transaction !== this.props.transaction) {
            this.setState({ selectedTagId: "", step: STEP_SELECT });
        }
    }

    handleSelect = (e) => {
        const selectedTagId = e.target.value;
        if (!selectedTagId) return;
        this.setState({
            selectedTagId,
            step: selectedTagId === CREATE_NEW ? STEP_SELECT : STEP_ACTION,
        });
    };

    getTagForCrud() {
        const { selectedTagId } = this.state;
        const description = this.props.transaction?.description || "";
        const newRule = description ? { type: "keyword", value: description, caseSensitive: false } : null;

        if (selectedTagId === CREATE_NEW) {
            return { rules: newRule ? [newRule] : [] };
        }

        const tag = _.find(this.props.tags, t => t._id === selectedTagId);
        if (!tag) return null;
        return { ...tag, rules: [...tag.rules, ...(newRule ? [newRule] : [])] };
    }

    applyDirectTag = () => {
        const transaction = this.props.transaction;
        transaction.appliedTags = transaction.appliedTags || {};
        transaction.appliedTags[this.state.selectedTagId] = 1;
        transactionService.upsert(transaction).then(() => {
            toast.info("Tag applied ✅");
            this.props.onClose();
        });
    };

    goBack = () => {
        this.setState({ selectedTagId: "", step: STEP_SELECT });
    };

    renderActionStep() {
        const tag = _.find(this.props.tags, t => t._id === this.state.selectedTagId);
        const body = (
            <div className="d-flex flex-column gap-2">
                <button className="btn btn-primary" onClick={this.applyDirectTag}>
                    <i className="bi bi-tag me-1"></i>Tag as "{tag?.name}"
                </button>
                <button className="btn btn-outline-dark" onClick={() => this.setState({ step: "addRule" })}>
                    <i className="bi bi-plus-circle me-1"></i>Add Rule
                </button>
            </div>
        );
        return <Modal show={true} title="Tag Transaction" body={body} onClose={this.goBack} />;
    }

    renderSelectStep() {
        const body = (
            <div>
                <label className="form-label">Select a tag or create new</label>
                <select className="form-select" value="" onChange={this.handleSelect}>
                    <option value="">Select a tag</option>
                    {this.props.tags.map(tag => (
                        <option key={tag._id} value={tag._id}>{tag.name}</option>
                    ))}
                    <option value={CREATE_NEW}>+ Create New Tag</option>
                </select>
            </div>
        );
        return <Modal show={true} title="Tag Transaction" body={body} onClose={this.props.onClose} />;
    }

    render() {
        if (!this.props.show) return null;
        const { selectedTagId, step } = this.state;

        if (selectedTagId === CREATE_NEW || step === "addRule") {
            return <CrudTagModal show={true} tag={this.getTagForCrud()}
                onSave={this.props.onClose} onClose={this.goBack} />;
        }

        if (step === STEP_ACTION) {
            return this.renderActionStep();
        }

        return this.renderSelectStep();
    }
}

export default connect(state => _.pick(state.user, ["tags"]))(TagTransactionModal);
