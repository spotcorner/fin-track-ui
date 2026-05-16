"use strict";

import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import jobService from "@services/jobService";
import { EXTRACTOR_TYPE_LABELS } from "@config";
import labelUtil from "@utils/labelUtil";
import CrudJobModal from "./CrudJobModal.jsx";

const STATUS_COLORS = { queued: "warning", started: "primary", extracting: "info", extracted: "success", failed: "danger" };
const STATUS_LABELS = { queued: "Queued", started: "Started", extracting: "Extracting", extracted: "Extracted", failed: "Failed" };

class JobCard extends React.Component {
    state = { expanded: false, showEditModal: false };

    toggleExpand = () => this.setState({ expanded: !this.state.expanded });

    getStepDuration(entry, nextEntry, firstEntry) {
        if (entry.status === "queued" && nextEntry) return moment(nextEntry.at).diff(moment(entry.at), "seconds");
        if (entry.status === "extracting" && nextEntry) return moment(nextEntry.at).diff(moment(entry.at), "seconds");
        if (["extracted", "failed"].includes(entry.status) && firstEntry) return moment(entry.at).diff(moment(firstEntry.at), "seconds");
        return null;
    }

    getTimelineStep(entry, nextEntry, firstEntry) {
        const color = STATUS_COLORS[entry.status] || "secondary";
        const label = entry.extractor
            ? `${STATUS_LABELS[entry.status]} — ${EXTRACTOR_TYPE_LABELS[entry.extractor] || entry.extractor}`
            : STATUS_LABELS[entry.status];
        const duration = this.getStepDuration(entry, nextEntry, firstEntry);
        return <div key={entry.at} className="mb-2 position-relative">
            <div className={`position-absolute rounded-circle bg-${color}`} style={{ width: 10, height: 10, top: 5, left: -24 }}></div>
            <div className="small">{label}</div>
            <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                {moment(entry.at).format("MMM D, h:mm:ss A")}
                {duration !== null && ` · took ${duration}s`}
            </div>
        </div>;
    }

    renderTimeline() {
        const { job } = this.props;
        const timeline = job.timeline || [];
        return <div className="px-2 pb-2">
            <div className="position-relative ps-4 mt-2">
                <div className="border-start position-absolute top-0 bottom-0 start-0 ms-2"></div>
                {timeline.map((entry, i) => this.getTimelineStep(entry, timeline[i + 1], timeline[0]))}
            </div>
            {["extracted", "failed"].includes(job.status) && <div className="mt-2">
                <button className="btn btn-sm btn-outline-danger" onClick={this.deleteJob}>Delete</button>
            </div>}
        </div>;
    }

    deleteJob = () => {
        jobService.delete(this.props.job._id).then(() => {
            if (this.props.onDelete) this.props.onDelete(this.props.job);
        });
    }

    getStatusBadge() {
        const { status } = this.props.job;
        return <span className={`badge bg-${STATUS_COLORS[status]} bg-opacity-10 text-${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>;
    }

    getDuration() {
        const { timeline, status } = this.props.job;
        if (!timeline || timeline.length < 2 || !["extracted", "failed"].includes(status)) return null;
        const first = timeline[0];
        const last = timeline[timeline.length - 1];
        return ` · duration ${moment(last.at).diff(moment(first.at), "seconds")}s`;
    }

    onEditSave = (job) => {
        this.setState({ showEditModal: false });
        if (this.props.onEdit) this.props.onEdit(job);
    }

    render() {
        const { job, accounts, showOpen } = this.props;
        const { expanded } = this.state;
        const account = accounts[job.accountId];
        return <div className="border rounded mb-2">
            <div className="d-flex align-items-center gap-2 p-2">
                <div className="flex-grow-1">
                    <div className="small fw-bold d-flex align-items-center gap-2">
                        {job.draftName}
                        {this.getStatusBadge()}
                        <i className="bi bi-pencil cursor-pointer text-muted" style={{ fontSize: "0.75rem" }} onClick={() => this.setState({ showEditModal: true })}></i>
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {job.fileName}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {account && labelUtil.getAccountLabel(account)}
                        {job.openingBalance && account?.type !== "credit_card" ? ` · Opening Balance: ₹${job.openingBalance}` : ""}
                    </div>
                    <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: "0.7rem" }}>
                        {moment(job.createdAt).format("MMM D, YYYY h:mm A")}
                        {this.getDuration()}
                        <i className={`bi bi-chevron-${expanded ? "up" : "down"} cursor-pointer`} onClick={this.toggleExpand}></i>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                    {showOpen && job.status === "extracted" && <button className="btn btn-sm btn-outline-dark" onClick={() => this.props.history.push(`/jobs/${job._id}`)}>
                        <i className="bi bi-box-arrow-up-right"></i>
                    </button>}
                </div>
            </div>
            {expanded && this.renderTimeline()}
            <CrudJobModal show={this.state.showEditModal} job={job}
                onSave={this.onEditSave}
                onClose={() => this.setState({ showEditModal: false })} />
        </div>;
    }
}

export default withRouter(connect(state => ({ accounts: state.user.accountsMap }))(JobCard));
