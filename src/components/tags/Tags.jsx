"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from 'react-toastify';
import CrudTagModal from "./CrudTagModal.jsx";
import { deleteTagRequest } from "@store";
import uiUtil from "@utils/uiUtil.js";

class Tags extends React.Component {
    state = {
        selectedTag: null,
        showModal: false,
    };

    toggleModal = (selectedTag = null) => {
        this.setState({ showModal: !this.state.showModal, selectedTag });
    };

    handleDelete = (_id) => {
        this.props.dispatch(deleteTagRequest(_id)).then(() => {
            toast.success("Tag deleted ✅");
        });
    };

    getActionButtons(tag) {
        return <div className="d-flex gap-1 flex-nowrap">
            <span className="badge bg-secondary cursor-pointer" onClick={() => this.toggleModal(tag)}><i className="bi bi-pencil"></i></span>
            <span className="badge bg-secondary cursor-pointer" onClick={() => this.handleDelete(tag._id)}><i className="bi bi-trash"></i></span>
        </div>;
    }

    getRuleBadge(rule, i) {
        return <span key={i} className={"badge text-truncate " + (rule.type === "keyword" && rule.caseSensitive ? "bg-warning text-dark" : "bg-secondary")} style={{ maxWidth: "150px" }}>
            {rule.value}
        </span>;
    }

    getTagItem = (tag, index) => {
        return <div key={index} className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="fw-bold">{tag.name}</span>
                    {tag.rules.map((rule, i) => this.getRuleBadge(rule, i))}
                </div>
                {this.getActionButtons(tag)}
            </div>
        </div>;
    }

    getTagsContainer() {
        const { tags, loadingTags } = this.props;

        if (loadingTags) return uiUtil.spinnerLoader("mt-4");
        if (tags.length === 0) return <div className="mt-4"><span className="text-muted">No tags found.</span></div>;

        return <div className="list-group shadow-sm list-group-striped">{tags.map(this.getTagItem)}</div>;
    }

    getCrudTagModal() {
        return <CrudTagModal show={this.state.showModal} tag={this.state.selectedTag} onClose={() => this.toggleModal()} />;
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
                <h1>Tags</h1>
                {this.getTagsContainer()}
                {this.getCrudTagModal()}
                {this.getAddButton()}
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["tags", "loadingTags"]))(Tags);
