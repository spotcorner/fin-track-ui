"use strict";

import React from "react";
import { connect } from "react-redux";

const TAG_ICONS = { 1: "bi-tag", 2: "bi-robot" };

class TagBadges extends React.Component {

    removeTag = (tagId) => {
        const { transaction } = this.props;
        const status = transaction._appliedTags[tagId] == 1 ? -1 : 0;
        this.props.updateTransactionTags(transaction._id, { [tagId]: status });
    };

    restoreTag = (tagId) => {
        const { transaction } = this.props;
        this.props.updateTransactionTags(transaction._id, { [tagId]: -1 });
    };

    getAppliedTags() {
        const { transaction, tagsMap } = this.props;
        return _.keys(_.pickBy(transaction.appliedTags, v => v >= 1)).map(id => <span key={id} className={"badge tag-status-" + transaction.appliedTags[id]}>
            <i className={"bi " + TAG_ICONS[transaction.appliedTags[id]] + " me-1"}></i>{tagsMap[id]?.name}
            <span className="ms-1 cursor-pointer" onClick={() => this.removeTag(id)}>&times;</span>
        </span>);
    }

    getExcludedTags() {
        const { transaction, tagsMap } = this.props;
        return _.keys(_.pickBy(transaction._appliedTags, v => v == 0)).map(id => <span key={id} className="badge tag-status-0">
            {tagsMap[id]?.name}
            <span className="ms-1 cursor-pointer" onClick={() => this.restoreTag(id)}><i className="bi bi-arrow-counterclockwise"></i></span>
        </span>);
    }

    render() {
        const applied = this.getAppliedTags();
        const excluded = this.props.showExcluded ? this.getExcludedTags() : [];
        if (!applied.length && !excluded.length) return null;
        return <div className="d-flex flex-wrap gap-1">{applied}{excluded}</div>;
    }
}

export default connect(state => _.pick(state.user, ["tagsMap"]))(TagBadges);
