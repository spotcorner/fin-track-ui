"use strict";

import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { toast } from "react-toastify";
import draftService from "@services/draftService";
import { EXTRACTOR_TYPE_LABELS } from "@config";
import labelUtil from "@utils/labelUtil";
import amountUtil from "@utils/amountUtil";
import Modal from "@components/modal/Modal.jsx";

const STATUS_COLORS = { queued: "warning", started: "primary", extracting: "info", extracted: "success", failed: "danger", draft: "dark" };
const STATUS_LABELS = { queued: "Queued", started: "Started", extracting: "Extracting", extracted: "Extracted", failed: "Failed", draft: "Draft" };

class DraftCard extends React.Component {
    state = { expanded: false, showDeleteModal: false };

    toggleExpand = () => this.setState({ expanded: !this.state.expanded });

    getStepDuration(entry, nextEntry, firstEntry) {
        if (entry.status === "queued" && nextEntry) return moment(nextEntry.at).diff(moment(entry.at), "seconds");
        if (entry.status === "extracting" && nextEntry) return moment(nextEntry.at).diff(moment(entry.at), "seconds");
        if (["extracted", "failed"].includes(entry.status) && firstEntry) return moment(entry.at).diff(moment(firstEntry.at), "seconds");
        return null;
    }

    getTimelineStep(entry, nextEntry, firstEntry) {
        const color = STATUS_COLORS[entry.status] || "secondary";
        const label = STATUS_LABELS[entry.status] || entry.status;
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

    getExtractorSubStep(entry, nextEntry) {
        const label = EXTRACTOR_TYPE_LABELS[entry.extractor] || entry.extractor;
        const duration = nextEntry ? moment(nextEntry.at).diff(moment(entry.at), "seconds") : null;
        return <div key={entry.at} className="mb-1 position-relative" style={{ marginLeft: 16 }}>
            <div className="position-absolute rounded-circle bg-info" style={{ width: 6, height: 6, top: 6, left: -16 }}></div>
            <div className="small">Extracting — {label}</div>
            <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                {moment(entry.at).format("MMM D, h:mm:ss A")}
                {duration !== null && ` · took ${duration}s`}
            </div>
        </div>;
    }

    renderTimeline() {
        const { draft } = this.props;
        const timeline = draft.timeline || [];
        if (timeline.length === 0) return null;

        const steps = [];
        for (let i = 0; i < timeline.length; i++) {
            const entry = timeline[i];
            if (entry.status === "extracting") continue;
            steps.push(this.getTimelineStep(entry, timeline[i + 1], timeline[0]));
            if (entry.status === "started") {
                const extractors = [];
                for (let j = i + 1; j < timeline.length && timeline[j].status === "extracting"; j++) {
                    extractors.push(this.getExtractorSubStep(timeline[j], timeline[j + 1]));
                }
                if (extractors.length > 0) steps.push(<div key="extractors" className="mb-2">{extractors}</div>);
            }
        }

        return <div className="px-2 pb-2">
            <div className="position-relative ps-4 mt-2">
                <div className="border-start position-absolute top-0 bottom-0 start-0 ms-2"></div>
                {steps}
            </div>
        </div>;
    }

    deleteDraft = () => {
        draftService.delete(this.props.draft._id).then(() => {
            toast.info("Draft deleted ✅");
            this.setState({ showDeleteModal: false });
            if (this.props.onDelete) this.props.onDelete(this.props.draft);
        });
    }

    getStatusBadge() {
        const { status } = this.props.draft;
        return <span className={`badge bg-${STATUS_COLORS[status]} bg-opacity-10 text-${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>;
    }

    getDuration() {
        const { timeline, status } = this.props.draft;
        if (!timeline || timeline.length < 2 || !["extracted", "failed"].includes(status)) return null;
        return ` · ${moment(timeline[timeline.length - 1].at).diff(moment(timeline[0].at), "seconds")}s`;
    }

    render() {
        const { draft } = this.props;
        const { expanded } = this.state;
        const account = this.props.accounts[draft.accountId];
        const isCreditCard = account?.type === "credit_card";

        return <div className="border rounded mb-2 cursor-pointer card-clickable" onClick={() => this.props.history.push(`/drafts/${draft._id}`)}>
            <div className="d-flex align-items-center gap-2 p-2">
                <div className="flex-grow-1">
                    <div className="small fw-bold d-flex align-items-center gap-2">
                        {draft.name}
                        {this.getStatusBadge()}
                    </div>
                    {draft.fileName && <div className="text-muted" style={{ fontSize: "0.75rem" }}>{draft.fileName}</div>}
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {account && labelUtil.getAccountLabel(account)}
                        {!isCreditCard && draft.openingBalance ? ` · Opening Balance: ₹${amountUtil.getFormattedAmount(draft.openingBalance)}` : ""}
                    </div>
                    <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: "0.7rem" }}>
                        {moment(draft.createdAt).format("MMM D, YYYY h:mm A")}
                        {this.getDuration()}
                        {draft.timeline && draft.timeline.length > 0 && <i className={`bi bi-chevron-${expanded ? "up" : "down"} cursor-pointer`} onClick={(e) => { e.stopPropagation(); this.toggleExpand(); }}></i>}
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-pencil cursor-pointer text-muted" style={{ fontSize: "0.75rem" }} onClick={(e) => { e.stopPropagation(); this.props.onEdit(draft); }}></i>
                    <i className="bi bi-trash cursor-pointer text-muted" style={{ fontSize: "0.75rem" }} onClick={(e) => { e.stopPropagation(); this.setState({ showDeleteModal: true }); }}></i>
                </div>
            </div>
            {expanded && this.renderTimeline()}
            <div onClick={(e) => e.stopPropagation()}>
                <Modal show={this.state.showDeleteModal} title="Delete Draft"
                    body="Are you sure you want to delete this draft?"
                    onSubmitClick={this.deleteDraft}
                    onClose={() => this.setState({ showDeleteModal: false })} />
            </div>
        </div>;
    }
}

export default withRouter(connect(state => ({ accounts: state.user.accountsMap }))(DraftCard));
