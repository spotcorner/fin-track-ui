"use strict";

import React from "react";
import activityService from "@services/activityService";
import uiUtil from "@utils/uiUtil";

const ENTITY_ICONS = {
    user: "bi-person",
    account: "bi-bank",
    draft: "bi-journal-check",
};

const ACTION_LABELS = {
    logged_in: "Logged in",
    logged_out: "Logged out",
    created: "Created",
    updated: "Updated",
    deleted: "Deleted",
    finalized: "Finalized",
    discarded: "Discarded",
};

const ENTITY_LABELS = {
    user: " ",
    account: "account",
    draft: "draft",
};

class ActivityView extends React.Component {
    state = { activities: [], loading: true, page: 1, hasMore: true };

    componentDidMount() { this.fetchActivities(); }

    fetchActivities = (page = 1) => {
        activityService.getAll({ page, limit: 50 }).then(data => {
            this.setState(prev => ({
                activities: page === 1 ? data.activities : [...prev.activities, ...data.activities],
                loading: false,
                page,
                hasMore: data.activities.length === 50,
            }));
        }).catch(() => this.setState({ loading: false }));
    }

    getDescription(activity) {
        const action = ACTION_LABELS[activity.action] || activity.action;
        const entity = ENTITY_LABELS[activity.entity] || activity.entity;
        const name = activity.meta?.name || "";
        return `${action} ${entity}${name ? ` — ${name}` : ""}`;
    }

    render() {
        const { activities, loading, hasMore } = this.state;
        if (loading && activities.length === 0) return uiUtil.spinnerLoader("mt-3");

        return <div>
            <div className="d-flex align-items-center gap-2 mb-2">
                <div className="text-muted small page-header mb-0">Activity</div>
            </div>
            {activities.length === 0
                ? <div className="text-muted small">No activity yet.</div>
                : <div className="list-group">
                    {activities.map(a => (
                        <div key={a._id} className="list-group-item py-2">
                            <div className="d-flex align-items-center gap-2">
                                <i className={`bi ${ENTITY_ICONS[a.entity] || "bi-circle"} text-muted`}></i>
                                <div className="flex-grow-1">
                                    <div className="small">{this.getDescription(a)}</div>
                                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>{moment(a.at).format("MMM D, YYYY h:mm A")}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>}
            {hasMore && <div className="text-center mt-2">
                <button className="btn btn-sm btn-outline-dark" onClick={() => this.fetchActivities(this.state.page + 1)}>
                    Load More
                </button>
            </div>}
        </div>;
    }
}

export default ActivityView;
