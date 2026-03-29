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

    getTagsContainer() {
        const { tags, loadingTags } = this.props;

        if (loadingTags) {
            return uiUtil.spinnerLoader("mt-4");
        }

        if (tags.length === 0) {
            return <div className="mt-4">
                <span className="text-muted">No tags found.</span>
            </div>
        }

        return (
            <div className="row">
                {tags.map((tag, index) => (
                    <div key={index} className="col-md-4 mb-3">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <strong>{tag.name}</strong>
                                <div className="mt-1 text-muted"><small>Rules: {tag.rules.map((rule, i) => (
                                    <span key={i} className={"badge me-1 text-truncate " + (rule.type === "keyword" && rule.caseSensitive ? "bg-warning text-dark" : "bg-secondary")} style={{ maxWidth: "150px" }}>
                                        {rule.value}
                                    </span>
                                ))}</small></div>
                                <div className="mt-3 d-flex justify-content-between">
                                    <button className="btn btn-warning btn-sm" onClick={() => this.toggleModal(tag)}>
                                        <i className="bi bi-pencil"></i> Edit
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => this.handleDelete(tag._id)}>
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
