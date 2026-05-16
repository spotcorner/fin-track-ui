"use strict";

import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import jobService from "@services/jobService";
import uiUtil from "@utils/uiUtil";
import JobCard from "./JobCard.jsx";
import SortDropdown from "@components/ui/SortDropdown.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { JOBS_HELP } from "@utils/helpContent";

class JobsView extends React.Component {
    state = { jobs: [], loading: true, sortField: "createdAt", sortDirection: "desc" };
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

    getSortOptions() {
        return [
            { field: "draftName", label: "Draft Name" },
            { field: "fileName", label: "File" },
            { field: "status", label: "Status" },
            { field: "createdAt", label: "Created" },
            { field: "accountName", label: "Account" },
            { field: "accountType", label: "Account Type" },
        ];
    }

    renderJobs() {
        const { jobs } = this.state;
        if (jobs.length === 0) {
            return <div className="text-muted small">No extraction jobs yet. <Link to="/upload-statement">Upload a statement</Link> to get started.</div>;
        }
        const enriched = jobs.map(j => {
            const account = this.props.accounts.find(a => a._id === j.accountId);
            return { ...j, accountName: account?.name || "", accountType: account?.type || "" };
        });
        const sorted = _.orderBy(enriched, [this.state.sortField], [this.state.sortDirection]);
        return sorted.map(job => (
            <JobCard key={job._id} job={job} showOpen onDelete={this.onDelete} onEdit={this.onEdit} />
        ));
    }

    render() {
        if (this.state.loading) return uiUtil.spinnerLoader("mt-3");

        return <div>
            <div className="d-flex align-items-center gap-2 mb-2">
                <div className="text-muted small page-header mb-0">Extraction Jobs</div>
                <HelpTip items={JOBS_HELP} />
                <div className="ms-auto">
                    <SortDropdown options={this.getSortOptions()} prefStoreKey="jobs.sort"
                        selected={{ field: this.state.sortField, direction: this.state.sortDirection }}
                        onChange={(field, direction) => this.setState({ sortField: field, sortDirection: direction })} />
                </div>
            </div>
            {this.renderJobs()}
        </div>;
    }
}

export default connect(state => _.pick(state.user, ["accounts"]))(JobsView);
