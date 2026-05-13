"use strict";

import React from "react";
import { Link } from "react-router-dom";
import jobService from "@services/jobService";
import uiUtil from "@utils/uiUtil";
import JobCard from "./JobCard.jsx";

class JobsView extends React.Component {
    state = { jobs: [], loading: true };
    pollTimer = null;

    componentDidMount() { this.fetchJobs(); }
    componentWillUnmount() { clearInterval(this.pollTimer); }

    fetchJobs = () => {
        jobService.getAll().then(data => {
            this.setState({ jobs: data.jobs, loading: false }, this.autoRefresh);
        }).catch(() => this.setState({ loading: false }));
    }

    autoRefresh = () => {
        const shouldPoll = this.state.jobs.some(j => ["queued", "started"].includes(j.status));
        if (shouldPoll && !this.pollTimer) this.pollTimer = setInterval(this.fetchJobs, 3000);
        else if (!shouldPoll) { clearInterval(this.pollTimer); this.pollTimer = null; }
    }

    onEdit = (updatedJob) => {
        this.setState({ jobs: this.state.jobs.map(j => j._id === updatedJob._id ? { ...j, ...updatedJob } : j) });
    }

    onDelete = (job) => {
        this.setState({ jobs: this.state.jobs.filter(j => j._id !== job._id) });
    }

    renderJobs() {
        const { jobs } = this.state;
        if (jobs.length === 0) {
            return <div className="text-muted small">No extraction jobs yet. <Link to="/upload-statement">Upload a statement</Link> to get started.</div>;
        }
        return jobs.map(job => (
            <JobCard key={job._id} job={job} showOpen onDelete={this.onDelete} onEdit={this.onEdit} />
        ));
    }

    render() {
        if (this.state.loading) return uiUtil.spinnerLoader("mt-3");

        return <div>
            <div className="d-flex align-items-center gap-2 mb-2">
                <div className="text-muted small page-header mb-0">Extraction Jobs</div>
            </div>
            {this.renderJobs()}
        </div>;
    }
}

export default JobsView;
