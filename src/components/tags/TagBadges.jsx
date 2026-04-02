"use strict";

import React from "react";
import { connect } from "react-redux";

const TAG_ICONS = { 1: "bi-tag", 2: "bi-robot", 3: "bi-link-45deg" };

class TagBadges extends React.Component {

    getAppliedTags() {
        const { appliedTags, tagsMap, onRemove } = this.props;
        return _.sortBy(_.keys(_.pickBy(appliedTags, v => v >= 1)), id => tagsMap[id]?.name?.toLowerCase()).map(id => <span key={id} className={"badge tag-status-" + appliedTags[id]}>
            <i className={"bi " + TAG_ICONS[appliedTags[id]] + " me-1"}></i>{tagsMap[id]?.name}
            {onRemove && <span className="ms-1 cursor-pointer" onClick={() => onRemove(id)}>&times;</span>}
        </span>);
    }

    getExcludedTags() {
        const { appliedTags, tagsMap, onRestore } = this.props;
        return _.sortBy(_.keys(_.pickBy(appliedTags, v => v == 0)), id => tagsMap[id]?.name?.toLowerCase()).map(id => <span key={id} className="badge tag-status-0">
            {tagsMap[id]?.name}
            {onRestore && <span className="ms-1 cursor-pointer" onClick={() => onRestore(id)}><i className="bi bi-arrow-counterclockwise"></i></span>}
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
