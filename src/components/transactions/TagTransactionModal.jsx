"use strict";

import React from "react";
import { connect } from "react-redux";
import Modal from "@modal/Modal.jsx";
import CrudTagModal from "@components/tags/CrudTagModal.jsx";
import TagBadges from "@components/tags/TagBadges.jsx";
import { TRANSACTION_TYPES } from "@config";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil.js";
import HelpTip from "@components/ui/HelpTip.jsx";
import { TAG_SELECTION_HELP } from "@utils/helpContent";

const CREATE_NEW = "__CREATE_NEW__";

class TagTransactionModal extends React.Component {
    state = { selectedTagId: "", searchText: "", localAppliedTags: {} };

    componentDidUpdate(prevProps) {
        if (prevProps.transaction !== this.props.transaction) {
            this.setState({
                selectedTagId: "", searchText: "",
                localAppliedTags: { ...this.props.transaction?.appliedTags },
            });
        } else if (prevProps.tags !== this.props.tags) {
            this.setState({
                localAppliedTags: { ...this.props.transaction?.appliedTags },
            });
        }
    }

    getTagForCrud() {
        const { selectedTagId } = this.state;
        const description = this.props.transaction?.description || "";
        const newRule = description ? { type: "keyword", value: description, caseSensitive: false } : null;

        if (selectedTagId === CREATE_NEW) {
            return { rules: newRule ? [newRule] : [] };
        }

        const tag = this.props.tagsMap[selectedTagId];
        if (!tag) return [];
        return { ...tag, rules: [...tag.rules, ...(newRule ? [newRule] : [])] };
    }

    applyDirectTag = (tagId, callback) => {
        this.setState(prev => ({
            localAppliedTags: { ...prev.localAppliedTags, [tagId]: 1 },
        }), callback);
    };

    removeTag = (tagId) => {
        const status = this.props.transaction.appliedTags[tagId];
        if (status >= 2) {
            this.setState(prev => ({
                localAppliedTags: { ...prev.localAppliedTags, [tagId]: 0 },
            }));
        } else {
            this.setState(prev => {
                const updated = { ...prev.localAppliedTags };
                delete updated[tagId];
                return { localAppliedTags: updated };
            });
        }
    };

    restoreTag = (tagId) => {
        const status = this.props.transaction.ruleResult[tagId];
        this.setState(prev => ({
            localAppliedTags: { ...prev.localAppliedTags, [tagId]: status },
        }));
    };

    handleSave = () => {
        const { transaction } = this.props;
        const original = transaction._appliedTags || {};
        const local = this.state.localAppliedTags;
        const delta = {};
        _.forEach(local, (status, tagId) => {
            if (status <= 1 && original[tagId] !== status) delta[tagId] = status;
            else if (status >= 2 && original[tagId] === 0) delta[tagId] = -1;
        });
        _.forEach(original, (status, tagId) => {
            if (!(tagId in local)) delta[tagId] = -1;
        });
        if (_.isEmpty(delta)) { this.props.onClose(); return; }
        this.props.updateTransactionTags(transaction._id, delta).then(() => this.props.onClose());
    };

    getTransactionCard() {
        const { transaction } = this.props;
        if (!transaction) return null;
        const typeClass = transaction.type == TRANSACTION_TYPES.CREDIT ? "transaction-credit" : "transaction-debit";
        const amountColor = transaction.type == TRANSACTION_TYPES.CREDIT ? "text-success" : "text-danger";
        const accountLabel = transaction.account && labelUtil.getAccountLabel(transaction.account);
        return <div className={"card mb-3 " + typeClass}>
            <div className="card-body py-2 px-3">
                <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">{moment(transaction.date, "YYYY-MM-DD").format("MMM D, YYYY")}{accountLabel && " · " + accountLabel}</small>
                    <span className={"fw-bold " + amountColor}>₹{amountUtil.getFormattedAmount(transaction.amount)}</span>
                </div>
                <div className="small mt-1">{transaction.description}</div>
            </div>
        </div>;
    }

    resetSelection = () => {
        this.setState({ selectedTagId: "" });
    };

    onCrudSave = (data) => {
        if (data?.tag?._id && (!data.tag.rules || !data.tag.rules.length)) {
            this.applyDirectTag(data.tag._id, this.resetSelection);
        } else {
            this.resetSelection();
        }
    };

    getSearchBar() {
        return <div className="d-flex mb-2">
            <input type="text" className="form-control me-2" placeholder="Search tags..."
                value={this.state.searchText} onChange={(e) => this.setState({ searchText: e.target.value })} />
            <button className="btn btn-outline-dark" onClick={() => this.setState({ selectedTagId: CREATE_NEW })}>+</button>
        </div>;
    }

    getTagList(filtered) {
        const { localAppliedTags } = this.state;
        return <div className="list-group" style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filtered.map(tag => {
                const status = localAppliedTags[tag._id];
                const statusClass = status !== undefined ? " tag-applied-" + status : "";
                return <div key={tag._id} className={"list-group-item d-flex justify-content-between align-items-center" + statusClass}>
                    <span>{tag.name}</span>
                    <div className="d-flex gap-1">
                        {status === undefined && <span className="badge bg-secondary cursor-pointer" onClick={() => this.applyDirectTag(tag._id)}><i className="bi bi-tag"></i></span>}
                        <span className="badge bg-secondary cursor-pointer" onClick={() => this.setState({ selectedTagId: tag._id })}><i className="bi bi-pencil"></i></span>
                    </div>
                </div>;
            })}
            {filtered.length === 0 && <div className="list-group-item text-muted">No tags found</div>}
        </div>;
    }

    renderSelectStep() {
        const filtered = _.sortBy(this.props.tags.filter(t => t.name.toLowerCase().includes(this.state.searchText.toLowerCase())), t => t.name.toLowerCase());
        const body = (
            <div>
                {this.getTransactionCard()}
                <div className="mb-3">
                    <TagBadges appliedTags={this.state.localAppliedTags}
                        showExcluded onRemove={this.removeTag} onRestore={this.restoreTag} />
                </div>
                {this.getSearchBar()}
                {this.getTagList(filtered)}
            </div>
        );
        return <Modal show={true} title={<div className="d-flex align-items-center gap-1">Tag Transaction <HelpTip items={TAG_SELECTION_HELP} /></div>} body={body}
            onClose={this.props.onClose} onSubmitClick={this.handleSave} />;
    }

    render() {
        if (!this.props.show) return null;
        const { selectedTagId } = this.state;

        if (selectedTagId) {
            return <CrudTagModal show={true} tag={this.getTagForCrud()}
                submitLabel="Save & Tag" onSave={this.onCrudSave} onClose={this.resetSelection} />;
        }

        return this.renderSelectStep();
    }
}

export default connect(state => _.pick(state.user, ["tags", "tagsMap"]))(TagTransactionModal);
