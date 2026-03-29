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
        keywords: props.tag?.keywords || [],
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

    addKeyword = () => {
        this.setState(prev => ({
            keywords: [...prev.keywords, { value: "", caseSensitive: false }],
        }));
    };

    removeKeyword = (index) => {
        this.setState(prev => ({
            keywords: prev.keywords.filter((_, i) => i !== index),
        }));
    };

    toggleCaseSensitive = (index) => {
        this.setState(prev => ({
            keywords: prev.keywords.map((kw, i) =>
                i === index ? { ...kw, caseSensitive: !kw.caseSensitive } : kw
            ),
        }));
    };

    handleSubmit = (e) => {
        e.preventDefault();
        const keywords = this.state.keywords.filter(kw => kw.value.trim());
        if (keywords.length === 0) {
            toast.error("At least one keyword is required");
            return;
        }
        const payload = {
            _id: this.state._id,
            name: this.state.name,
            keywords,
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

    handleKeywordChange = (index, value) => {
        this.setState(prev => ({
            keywords: prev.keywords.map((kw, i) =>
                i === index ? { ...kw, value } : kw
            ),
        }));
    };

    getKeywordRows() {
        return this.state.keywords.map((kw, index) => (
            <div key={index} className="mb-2">
                <div className="input-group">
                    <input type="text" className="form-control" value={kw.value}
                        onChange={(e) => this.handleKeywordChange(index, e.target.value)} />
                    <button type="button" className="btn btn-outline-danger" onClick={() => this.removeKeyword(index)}>&times;</button>
                </div>
                <div className="form-check mt-1">
                    <input type="checkbox" className="form-check-input" id={`cs-${index}`}
                        checked={kw.caseSensitive} onChange={() => this.toggleCaseSensitive(index)} />
                    <label className="form-check-label" htmlFor={`cs-${index}`}>Case sensitive</label>
                </div>
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
                        <label className="form-label mb-0">Keywords</label>
                        <button type="button" className="btn btn-outline-dark btn-sm" onClick={this.addKeyword}>+</button>
                    </div>
                    {this.getKeywordRows()}
                </div>
            </form>
        );
    }

    render() {
        return <Modal show={this.props.show} title={this.getModalTitle()} body={this.getModalBody()} onClose={this.props.onClose} onSubmitClick={this.onSubmitClick} />;
    }
}

export default connect()(CrudTagModal);
