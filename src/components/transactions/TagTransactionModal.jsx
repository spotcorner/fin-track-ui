"use strict";

import React from "react";
import { connect } from "react-redux";
import Modal from "@modal/Modal.jsx";
import CrudTagModal from "@components/tags/CrudTagModal.jsx";

const CREATE_NEW = "__CREATE_NEW__";

class AddKeywordToTagModal extends React.Component {
    state = { selectedTagId: "" };

    componentDidUpdate(prevProps) {
        if (prevProps.transaction !== this.props.transaction) {
            this.setState({ selectedTagId: "" });
        }
    }

    handleSelect = (e) => {
        this.setState({ selectedTagId: e.target.value });
    };

    getTag() {
        const { selectedTagId } = this.state;
        const description = this.props.transaction?.description || "";
        const newKeyword = description ? { value: description, caseSensitive: false } : null;

        if (selectedTagId === CREATE_NEW) {
            return { keywords: newKeyword ? [newKeyword] : [] };
        }

        const tag = _.find(this.props.tags, t => t._id === selectedTagId);
        if (!tag) return null;
        return { ...tag, keywords: [...tag.keywords, ...(newKeyword ? [newKeyword] : [])] };
    }

    render() {
        if (!this.props.show) return null;
        const { selectedTagId } = this.state;

        if (selectedTagId) {
            return <CrudTagModal show={true} tag={this.getTag()}
                onSave={this.props.onClose} onClose={() => this.setState({ selectedTagId: "" })} />;
        }

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
}

export default connect(state => _.pick(state.user, ["tags"]))(AddKeywordToTagModal);
