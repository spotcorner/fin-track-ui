"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from 'react-toastify';
import CrudTagModal from "./CrudTagModal.jsx";
import SortDropdown from "@components/ui/SortDropdown.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { TAGS_VIEW_HELP } from "@utils/helpContent";
import Modal from "@components/modal/Modal.jsx";
import { deleteTagRequest } from "@store";
import uiUtil from "@utils/uiUtil.js";

class Tags extends React.Component {
    state = {
        selectedTag: null,
        showModal: false,
        deleteTagId: null,
        sortField: "name",
        sortDirection: "asc",
    };

    getTotalBudget() {
        const total = _.sumBy(this.props.tags.filter(t => t.budget > 0), "budget");
        if (!total) return null;
        return <span className="badge bg-dark bg-opacity-10 text-dark">₹{total.toLocaleString("en-IN")}/mo</span>;
    }

    getSortOptions() {
        return [{ field: "name", label: "Name" }, { field: "createdAt", label: "Created" }, { field: "updatedAt", label: "Updated" }];
    }

    toggleModal = (selectedTag = null) => {
        this.setState({ showModal: !this.state.showModal, selectedTag });
    };

    handleDelete = () => {
        this.props.dispatch(deleteTagRequest(this.state.deleteTagId)).unwrap().then(() => {
            this.setState({ deleteTagId: null });
            toast.success("Tag deleted ✅");
        });
    };

    getActionButtons(tag) {
        return <div className="d-flex gap-1 flex-nowrap">
            <span className="badge badge-outline-secondary cursor-pointer" onClick={() => this.toggleModal(tag)}><i className="bi bi-pencil"></i></span>
            <span className="badge badge-outline-danger cursor-pointer" onClick={() => this.setState({ deleteTagId: tag._id })}><i className="bi bi-trash"></i></span>
        </div>;
    }

    getRuleText(rule, i) {
        if (rule.type === "keyword") {
            return <small key={i} className="text-muted">{rule.value}{rule.caseSensitive ? " (Aa)" : ""}</small>;
        }
        if (rule.type === "pattern") {
            return <small key={i} className="text-muted">/{rule.value}/{rule.caseSensitive ? "" : "i"}</small>;
        }
        return null;
    }

    getLinkedTagNames(tag) {
        const { tagsMap } = this.props;
        if (!tag.linkedTags?.length) return null;
        return tag.linkedTags.map((id, i) => {
            const linked = tagsMap[id];
            return linked ? <small key={i} className="text-muted"><i className="bi bi-link-45deg"></i>{linked.name}</small> : null;
        });
    }

    getTagItem = (tag, index) => {
        return <div key={index} className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="fw-bold">{tag.name}</span>
                    {tag.rules.map((rule, i) => this.getRuleText(rule, i))}
                    {this.getLinkedTagNames(tag)}
                </div>
                <div className="d-flex align-items-center gap-2">
                    {tag.budget > 0 && <span className="badge bg-dark bg-opacity-10 text-dark">₹{tag.budget.toLocaleString("en-IN")}/mo</span>}
                    {this.getActionButtons(tag)}
                </div>
            </div>
        </div>;
    }

    getTagsContainer() {
        const { tags, loadingTags } = this.props;

        if (loadingTags) return uiUtil.spinnerLoader("mt-4");
        if (tags.length === 0) return <div className="mt-4"><span className="text-muted">No tags found.</span></div>;

        const sorted = _.orderBy(tags, [this.state.sortField], [this.state.sortDirection]);
        return <div className="list-group shadow-sm list-group-striped">{sorted.map(this.getTagItem)}</div>;
    }

    getCrudTagModal() {
        return <CrudTagModal show={this.state.showModal} tag={this.state.selectedTag} onClose={() => this.toggleModal()} />;
    }

    render() {
        return (
            <div className="container mt-3">
                <div className="d-flex align-items-center gap-1 mb-2">
                    <div className="text-muted small page-header">Tags</div>
                    <HelpTip items={TAGS_VIEW_HELP} />
                    {this.getTotalBudget()}
                    <div className="ms-auto d-flex align-items-center gap-2">
                        <SortDropdown options={this.getSortOptions()} prefStoreKey="tags.sort"
                            selected={{ field: this.state.sortField, direction: this.state.sortDirection }}
                            onChange={(field, direction) => this.setState({ sortField: field, sortDirection: direction })} />
                        <button className="btn btn-outline-dark btn-sm" style={{ width: 30, height: 30 }} onClick={() => this.toggleModal()}>+</button>
                    </div>
                </div>
                {this.getTagsContainer()}
                {this.getCrudTagModal()}
                <Modal show={!!this.state.deleteTagId} title="Delete Tag"
                    body="Are you sure you want to delete this tag?"
                    onSubmitClick={this.handleDelete}
                    onClose={() => this.setState({ deleteTagId: null })} />
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["tags", "loadingTags", "tagsMap"]))(Tags);
