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
        linkedTags: props.tag?.linkedTags || [],
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
        const rules = this.state.rules.filter(r => (r.type === "keyword" || r.type === "pattern") ? r.value.trim() : true);
        const payload = {
            _id: this.state._id,
            name: this.state.name,
            rules,
            linkedTags: this.state.linkedTags,
            description: this.state.description,
        };
        this.props.dispatch(upsertTagRequest(payload)).then(data => {
            toast.info("Tag saved ✅");
            const onSave = this.props.onSave || this.props.onClose || (() => { });
            onSave(data.payload);
        });
    };

    getModalTitle() {
        return this.props.tag?._id ? "Edit Tag" : "Create Tag";
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
                        <option value="pattern">Pattern</option>
                    </select>
                    {(rule.type === "keyword" || rule.type === "pattern") && <input type="text" className="form-control" value={rule.value}
                        onChange={(e) => this.handleRuleChange(index, "value", e.target.value)} placeholder={rule.type === "keyword" ? "Keyword" : "Regex pattern"} />}
                    <button type="button" className="btn btn-outline-danger" onClick={() => this.removeRule(index)}>&times;</button>
                </div>
                {(rule.type === "keyword" || rule.type === "pattern") && <div className="form-check mt-1">
                    <input type="checkbox" className="form-check-input" id={`cs-${index}`}
                        checked={rule.caseSensitive} onChange={() => this.handleRuleChange(index, "caseSensitive", !rule.caseSensitive)} />
                    <label className="form-check-label" htmlFor={`cs-${index}`}>Case sensitive</label>
                </div>}
            </div>
        ));
    }

    toggleLinkedTag = (tagId) => {
        this.setState(prev => ({
            linkedTags: prev.linkedTags.includes(tagId)
                ? prev.linkedTags.filter(id => id !== tagId)
                : [...prev.linkedTags, tagId],
        }));
    }

    getLinkedTagsSection() {
        const { tags } = this.props;
        const { linkedTags, linkSearch = "" } = this.state;
        const available = tags.filter(t => t._id !== this.state._id && t.name.toLowerCase().includes(linkSearch.toLowerCase()));
        return <div className="mb-2">
            <label className="form-label">Linked Tags</label>
            {linkedTags.length > 0 && <div className="d-flex flex-wrap gap-1 mb-2">
                {linkedTags.map(id => {
                    const tag = tags.find(t => t._id === id);
                    return tag ? <span key={id} className="badge bg-primary cursor-pointer" onClick={() => this.toggleLinkedTag(id)}>{tag.name} &times;</span> : null;
                })}
            </div>}
            <input type="text" className="form-control form-control-sm mb-1" placeholder="Search tags..."
                value={linkSearch} onChange={(e) => this.setState({ linkSearch: e.target.value })} />
            <div className="list-group" style={{ maxHeight: "150px", overflowY: "auto" }}>
                {available.map(tag => {
                    const selected = linkedTags.includes(tag._id);
                    return <div key={tag._id} className={"list-group-item list-group-item-action d-flex justify-content-between align-items-center py-1 cursor-pointer" + (selected ? " active" : "")}
                        onClick={() => this.toggleLinkedTag(tag._id)}>
                        <small>{tag.name}</small>
                        {selected && <i className="bi bi-check"></i>}
                    </div>;
                })}
            </div>
        </div>;
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
                {this.getLinkedTagsSection()}
            </form>
        );
    }

    render() {
        return <Modal show={this.props.show} title={this.getModalTitle()} body={this.getModalBody()} onClose={this.props.onClose} onSubmitClick={this.onSubmitClick} submitLabel={this.props.submitLabel} />;
    }
}

export default connect(state => _.pick(state.user, ["tags"]))(CrudTagModal);
