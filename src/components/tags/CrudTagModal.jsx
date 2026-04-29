"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from 'react-toastify';
import Modal from "@modal/Modal.jsx";
import CheckDropdown from "@components/ui/CheckDropdown.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { TAG_MODAL_HELP } from "@utils/helpContent";
import { upsertTagRequest } from "@store";

function getDerivedStateFromProps(props) {
    return {
        _id: props.tag?._id || "",
        name: props.tag?.name || "",
        rules: props.tag?.rules || (props.tag?._id ? [] : [{ type: "keyword", value: "", caseSensitive: false }]),
        linkedTags: props.tag?.linkedTags || [],
        priority: props.tag?.priority || 0,
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
        if (prevProps.show !== this.props.show && this.props.show) {
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
            priority: parseInt(this.state.priority) || 0,
            description: this.state.description,
        };
        this.props.dispatch(upsertTagRequest(payload)).unwrap().then(data => {
            toast.info("Tag saved ✅");
            const onSave = this.props.onSave || this.props.onClose || (() => { });
            onSave(data);
        });
    };

    getModalTitle() {
        const label = this.props.tag?._id ? "Edit Tag" : "Create Tag";
        return <div className="d-flex align-items-center gap-1">{label} <HelpTip items={TAG_MODAL_HELP.overview} /></div>;
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
                    <button type="button" className={"btn " + (rule.caseSensitive ? "btn-dark" : "btn-outline-secondary")}
                        title="Case Sensitive" onClick={() => this.handleRuleChange(index, "caseSensitive", !rule.caseSensitive)}>Aa</button>
                    <button type="button" className="btn btn-outline-danger" onClick={() => this.removeRule(index)}>&times;</button>
                </div>
            </div>
        ));
    }

    getLinkedTagsSection() {
        const { tags } = this.props;
        const options = tags.filter(t => t._id !== this.state._id).map(t => ({ value: t._id, label: t.name }));
        return <div className="mb-2">
            <div className="d-flex align-items-center gap-1 mb-1">
                <label className="form-label mb-0">Linked Tags</label>
                <HelpTip text={TAG_MODAL_HELP.linkedTags} />
            </div>
            <CheckDropdown label="Select tags" options={options} searchable sortByLabel inline pinSelected
                selected={this.state.linkedTags} onChange={v => this.setState({ linkedTags: v })} />
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
                        <div className="d-flex align-items-center gap-1">
                            <label className="form-label mb-0">Rules</label>
                            <HelpTip items={TAG_MODAL_HELP.rules} />
                        </div>
                        <button type="button" className="btn btn-outline-dark btn-sm" onClick={this.addRule}>+</button>
                    </div>
                    {this.getRuleRows()}
                </div>
                {this.getLinkedTagsSection()}
                <div className="mb-2">
                    <div className="d-flex align-items-center gap-1">
                        <input type="checkbox" className="form-check-input" checked={this.state.priority > 0}
                            onChange={() => this.setState({ priority: this.state.priority > 0 ? 0 : 1 })} />
                        <label className="form-label mb-0">Set Priority</label>
                        <HelpTip text={TAG_MODAL_HELP.priority} />
                    </div>
                    {this.state.priority > 0 && <input type="number" className="form-control mt-1" name="priority" value={this.state.priority} onChange={this.handleChange} min="1" />}
                </div>
            </form>
        );
    }

    render() {
        return <Modal show={this.props.show} title={this.getModalTitle()} body={this.getModalBody()} onClose={this.props.onClose} onSubmitClick={this.onSubmitClick} submitLabel={this.props.submitLabel} />;
    }
}

export default connect(state => _.pick(state.user, ["tags"]))(CrudTagModal);
