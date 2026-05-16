"use strict";

import React from "react";
import { Link, withRouter } from "react-router-dom";
import jobService from "@services/jobService";
import uiUtil from "@utils/uiUtil";
import JobCard from "./JobCard.jsx";
import ExtractionResults from "./ExtractionResults.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { JOB_DETAIL_HELP } from "@utils/helpContent";

class JobDetailView extends React.Component {
    state = { job: null, loading: true };
    pollTimer = null;

    componentDidMount() { this.fetchJob(); }
    componentWillUnmount() { clearInterval(this.pollTimer); }

    fetchJob = () => {
        const id = this.props.match.params.id;
        jobService.get(id).then(data => {
            this.setState({ job: data.job, loading: false }, this.autoRefresh);
        }).catch(() => this.setState({ loading: false }));
    }

    autoRefresh = () => {
        const shouldPoll = ["queued", "started"].includes(this.state.job.status);
        if (shouldPoll && !this.pollTimer) this.pollTimer = setInterval(this.fetchJob, 2000);
        else if (!shouldPoll) { clearInterval(this.pollTimer); this.pollTimer = null; }
    }

    onEdit = (job) => {
        this.setState({ job: { ...this.state.job, ...job } });
    }

    onDelete = () => {
        this.props.history.push("/jobs");
    }

    onDraftCreated = (draftId) => {
        this.props.history.push(`/drafts/${draftId}`);
    }

    renderContent() {
        const { job } = this.state;
        if (["queued", "started"].includes(job.status)) {
            const color = job.status === "queued" ? "warning" : "primary";
            const label = job.status === "queued" ? "Waiting in queue..." : "Extraction in progress...";
            return <div className={`alert bg-${color} bg-opacity-10 text-${color} d-flex align-items-center gap-2`}>
                <div className="spinner-border spinner-border-sm"></div>
                {label}
            </div>;
        }
        if (job.status === "failed") return <div className="alert alert-danger">{job.error || "Extraction failed."}</div>;
        if (job.status === "extracted") return <ExtractionResults results={job.results} job={job} onDraftCreated={this.onDraftCreated} />;
        return null;
    }

    render() {
        const { job, loading } = this.state;
        if (loading) return uiUtil.spinnerLoader("mt-3");

        return <div>
            <div className="d-flex align-items-center gap-2 mb-2">
                <Link to="/jobs" className="btn btn-sm btn-outline-secondary"><i className="bi bi-arrow-left"></i></Link>
                <div className="text-muted small page-header mb-0">Review Extraction</div>
                <HelpTip items={JOB_DETAIL_HELP} />
            </div>
            {!job
                ? <div className="alert alert-danger">Job not found.</div>
                : <>
                    <JobCard job={job} onDelete={this.onDelete} onEdit={this.onEdit} />
                    {this.renderContent()}
                </>}
        </div>;
    }
}

export default withRouter(JobDetailView);
