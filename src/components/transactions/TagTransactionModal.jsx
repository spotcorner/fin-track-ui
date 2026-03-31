"use strict";

import React from "react";
import { connect } from "react-redux";
import Modal from "@modal/Modal.jsx";
import CrudTagModal from "@components/tags/CrudTagModal.jsx";
import TagBadges from "@components/tags/TagBadges.jsx";
import { TRANSACTION_TYPES } from "@config";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil.js";

const CREATE_NEW = "__CREATE_NEW__";

class TagTransactionModal extends React.Component {
    state = { selectedTagId: "", searchText: "" };

    componentDidUpdate(prevProps) {
        if (prevProps.transaction !== this.props.transaction) {
            this.setState({ selectedTagId: "", searchText: "" });
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
        this.props.updateTransactionTags(this.props.transaction._id, { [tagId]: 1 }).then(() => {
            if (callback) callback();
        });
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
            <button className="btn btn-dark" onClick={() => this.setState({ selectedTagId: CREATE_NEW })}>+</button>
        </div>;
    }

    getTagList(filtered, appliedTags) {
        return <div className="list-group" style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filtered.map(tag => {
                const status = appliedTags[tag._id];
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
        const appliedTags = this.props.transaction?.appliedTags || {};
        const filtered = this.props.tags.filter(t => t.name.toLowerCase().includes(this.state.searchText.toLowerCase()));
        const body = (
            <div>
                {this.getTransactionCard()}
                <div className="mb-3">
                    <TagBadges transaction={this.props.transaction} showExcluded
                        updateTransactionTags={this.props.updateTransactionTags} />
                </div>
                {this.getSearchBar()}
                {this.getTagList(filtered, appliedTags)}
            </div>
        );
        return <Modal show={true} title="Tag Transaction" body={body} onClose={this.props.onClose} />;
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
