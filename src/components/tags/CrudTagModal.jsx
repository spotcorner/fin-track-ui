"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from 'react-toastify';
import Modal from "@modal/Modal.jsx";
import { upsertTagRequest } from "@store";

function getDerivedStateFromProps(props) {
    return {
        _id: props.tag?._id || "",
        name: props.tag?.name || "",
        rules: props.tag?.rules || [],
        description: props.tag?.description || "",
    };
}

class CrudTagModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = getDerivedStateFromProps(props);
        this.formRef = React.createRef();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.tag !== this.props.tag) {
            this.setState(getDerivedStateFromProps(this.props));
        }
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    addRule = () => {
        this.setState(prev => ({
            rules: [...prev.rules, { type: "keyword", value: "", caseSensitive: false }],
        }));
    };

    removeRule = (index) => {
        this.setState(prev => ({
            rules: prev.rules.filter((_, i) => i !== index),
        }));
    };

    handleRuleChange = (index, field, value) => {
        this.setState(prev => ({
            rules: prev.rules.map((rule, i) =>
                i === index ? { ...rule, [field]: value } : rule
            ),
        }));
    };

    handleSubmit = (e) => {
        e.preventDefault();
        const rules = this.state.rules.filter(r => r.type !== "keyword" || r.value.trim());
        const payload = {
            _id: this.state._id,
            name: this.state.name,
            rules,
            description: this.state.description,
        };
        this.props.dispatch(upsertTagRequest(payload)).then(data => {
            toast.info("Tag saved ✅");
            const onSave = this.props.onSave || this.props.onClose || (() => { });
            onSave(data.payload);
        });
    };

    getModalTitle() {
        return this.props.tag?._id ? "Edit Tag" : "Add Tag";
    }

    onSubmitClick = () => {
        if (this.formRef.current) {
            this.formRef.current.requestSubmit();
        }
    }

    getRuleRows() {
        return this.state.rules.map((rule, index) => (
            <div key={index} className="mb-2">
                <div className="input-group">
                    <select className="form-select" style={{ maxWidth: "120px" }} value={rule.type}
                        onChange={(e) => this.handleRuleChange(index, "type", e.target.value)}>
                        <option value="keyword">Keyword</option>
                    </select>
                    {rule.type === "keyword" && <input type="text" className="form-control" value={rule.value}
                        onChange={(e) => this.handleRuleChange(index, "value", e.target.value)} placeholder="Keyword" />}
                    <button type="button" className="btn btn-outline-danger" onClick={() => this.removeRule(index)}>&times;</button>
                </div>
                {rule.type === "keyword" && <div className="form-check mt-1">
                    <input type="checkbox" className="form-check-input" id={`cs-${index}`}
                        checked={rule.caseSensitive} onChange={() => this.handleRuleChange(index, "caseSensitive", !rule.caseSensitive)} />
                    <label className="form-check-label" htmlFor={`cs-${index}`}>Case sensitive</label>
                </div>}
            </div>
        ));
    }

    getModalBody() {
        const { name } = this.state;
        return (
            <form ref={this.formRef} onSubmit={this.handleSubmit}>
                <div className="mb-2">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-control" name="name" value={name} onChange={this.handleChange} placeholder="Tag name" required />
                </div>
                <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label mb-0">Rules</label>
                        <button type="button" className="btn btn-outline-dark btn-sm" onClick={this.addRule}>+</button>
                    </div>
                    {this.getRuleRows()}
                </div>
            </form>
        );
    }

    render() {
        return <Modal show={this.props.show} title={this.getModalTitle()} body={this.getModalBody()} onClose={this.props.onClose} onSubmitClick={this.onSubmitClick} />;
    }
}

export default connect()(CrudTagModal);
