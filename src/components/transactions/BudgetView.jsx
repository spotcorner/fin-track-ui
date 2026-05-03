"use strict";

import React from "react";
import { connect } from "react-redux";
import { TRANSACTION_TYPES } from "@config";
import amountUtil from "@utils/amountUtil";
import TransactionPreview from "@components/upload/TransactionPreview.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { BUDGETS_HELP, UNBUDGETED_HELP } from "@utils/helpContent";

class BudgetView extends React.Component {

    state = { unbudgetedCollapsed: true, expandedTagId: null }

    // exact month (1st to last day) → use budget as-is, otherwise pro-rate by days
    getEffectiveBudget(budget) {
        const { startDate, endDate } = this.props;
        if (!startDate || !endDate) return budget;
        const start = moment(startDate, "YYYY-MM-DD");
        const end = moment(endDate, "YYYY-MM-DD");
        if (start.date() === 1 && end.isSame(end.clone().endOf("month"), "day") && start.isSame(end, "month")) {
            return budget;
        }
        return (budget / 30) * (end.diff(start, "days") + 1);
    }

    isProRated() {
        const { startDate, endDate } = this.props;
        if (!startDate || !endDate) return false;
        const start = moment(startDate, "YYYY-MM-DD");
        const end = moment(endDate, "YYYY-MM-DD");
        return !(start.date() === 1 && end.isSame(end.clone().endOf("month"), "day") && start.isSame(end, "month"));
    }

    // tags with budget, sorted by % spent descending
    getBudgetData() {
        const tagsWithBudget = this.props.tags.filter(t => t.budget > 0);
        if (!tagsWithBudget.length) return [];
        return tagsWithBudget.map(tag => {
            const spent = this.getSpentForTag(tag._id);
            const effective = this.getEffectiveBudget(tag.budget);
            return { tag, spent, effective, pct: effective > 0 ? (spent / effective) * 100 : 0 };
        }).sort((a, b) => b.pct - a.pct);
    }

    // tags without budget + untagged, only those with spending
    getUnbudgetedData() {
        const data = this.props.tags.filter(t => !t.budget).map(tag => {
            return { tag, spent: this.getSpentForTag(tag._id) };
        }).filter(d => d.spent > 0);

        const untaggedSpent = this.getSpentForTag("__UNTAGGED__");
        if (untaggedSpent > 0) data.push({ tag: { _id: "__UNTAGGED__", name: "Untagged" }, spent: untaggedSpent });

        return data.sort((a, b) => b.spent - a.spent);
    }

    getSpentForTag(tagId) {
        return _.sumBy(this.getTransactionsForTag(tagId), "amount");
    }

    // debit transactions matching a tag, or untagged
    getTransactionsForTag(tagId) {
        return this.props.filteredTransactions.filter(t =>
            t.type === TRANSACTION_TYPES.DEBIT && (tagId === "__UNTAGGED__"
                ? !_.some(t.appliedTags, v => v >= 1)
                : t.appliedTags?.[tagId] >= 1)
        );
    }

    toggleExpand = (tagId) => {
        this.setState(prev => ({ expandedTagId: prev.expandedTagId === tagId ? null : tagId }));
    }

    getProgressColor(pct) {
        if (pct > 100) return "bg-danger";
        if (pct === 100) return "bg-info";
        if (pct >= 75) return "bg-warning";
        return "bg-success";
    }

    renderProgressBar(pct, height = "8px") {
        return <div className="progress" style={{ height }}>
            <div className={"progress-bar " + this.getProgressColor(pct)}
                style={{ width: Math.min(pct, 100) + "%" }}></div>
        </div>;
    }

    renderStatus(spent, budget) {
        if (spent > budget) return <div className="text-danger small mt-1">Over by ₹{amountUtil.getFormattedAmount(spent - budget)}</div>;
        if (spent === budget) return <div className="text-muted small mt-1">Budget fully used</div>;
        return <div className="text-success small mt-1">Remaining ₹{amountUtil.getFormattedAmount(budget - spent)}</div>;
    }

    renderExpandToggle(tagId) {
        return <i className={"bi cursor-pointer " + (this.state.expandedTagId === tagId ? "bi-chevron-up" : "bi-chevron-down")}
            onClick={() => this.toggleExpand(tagId)}></i>;
    }

    renderTransactions(tagId) {
        if (this.state.expandedTagId !== tagId) return null;
        return <div className="mt-2"><TransactionPreview transactions={this.getTransactionsForTag(tagId)} /></div>;
    }

    renderOverall(data) {
        const totalBudget = _.sumBy(data, "effective");
        const totalSpent = _.sumBy(data, "spent");
        const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        return <div className="mb-3 p-2 border rounded">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-bold">Overall</span>
                <span className="small text-muted">₹{amountUtil.getFormattedAmount(totalSpent)} / ₹{amountUtil.getFormattedAmount(totalBudget)}</span>
            </div>
            {this.renderProgressBar(totalPct, "10px")}
            {this.renderStatus(totalSpent, totalBudget)}
        </div>;
    }

    renderBudgetCard({ tag, spent, effective, pct }) {
        const proRated = this.isProRated();
        return <div key={tag._id} className="mb-3 p-2 border rounded">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-2">
                    <span className="small fw-bold">{tag.name}</span>
                    <span className="text-muted" style={{ fontSize: "0.7rem" }}>{proRated ? `₹${amountUtil.getFormattedAmount(tag.budget / 30)}/day` : "monthly"}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">₹{amountUtil.getFormattedAmount(spent)} / ₹{amountUtil.getFormattedAmount(effective)}</span>
                    {this.renderExpandToggle(tag._id)}
                </div>
            </div>
            {this.renderProgressBar(pct)}
            {this.renderStatus(spent, effective)}
            {this.renderTransactions(tag._id)}
        </div>;
    }

    renderUnbudgetedCard({ tag, spent }) {
        return <div key={tag._id} className="mb-2 p-2 border rounded">
            <div className="d-flex justify-content-between align-items-center">
                <span className="small fw-bold">{tag.name}</span>
                <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">₹{amountUtil.getFormattedAmount(spent)}</span>
                    {this.renderExpandToggle(tag._id)}
                </div>
            </div>
            {this.renderTransactions(tag._id)}
        </div>;
    }

    renderUnbudgeted() {
        const data = this.getUnbudgetedData();
        if (!data.length) return null;
        const total = _.sumBy(data, "spent");
        return <>
            <div className="d-flex justify-content-between align-items-center mb-2 mt-3">
                <div className="d-flex align-items-center gap-1">
                    <div className="text-muted small page-header mb-0">Unbudgeted</div>
                    <HelpTip items={UNBUDGETED_HELP} />
                </div>
                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-dark bg-opacity-10 text-dark">₹{amountUtil.getFormattedAmount(total)}</span>
                    <i className={"bi cursor-pointer " + (this.state.unbudgetedCollapsed ? "bi-chevron-down" : "bi-chevron-up")}
                        onClick={() => this.setState(prev => ({ unbudgetedCollapsed: !prev.unbudgetedCollapsed }))}></i>
                </div>
            </div>
            {!this.state.unbudgetedCollapsed && data.map(d => this.renderUnbudgetedCard(d))}
        </>;
    }

    render() {
        const data = this.getBudgetData();
        if (!data.length) return <div className="text-muted small">No tags with budgets set. Edit a tag to add a monthly budget.</div>;

        return <div>
            <div className="d-flex align-items-center gap-2 mb-2">
                <div className="text-muted small page-header mb-0">Budgets</div>
                <HelpTip items={BUDGETS_HELP} />
                {this.isProRated() && <span className="text-muted" style={{ fontSize: "0.7rem" }}><i className="bi bi-calendar"></i> {moment(this.props.endDate).diff(moment(this.props.startDate), "days") + 1} days</span>}
            </div>
            {this.renderOverall(data)}
            {data.map(d => this.renderBudgetCard(d))}
            {this.renderUnbudgeted()}
        </div>;
    }
}

export default connect(state => _.pick(state.user, ["tags"]))(BudgetView);
