"use strict";

import React from "react";
import { TRANSACTION_TYPES } from "@config";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil";

const VIEW_TABLE = "table";
const VIEW_CARD = "card";
const VIEW_BAR = "bar";

const fmt = amountUtil.getFormattedAmount;

export default class SummaryTable extends React.Component {

    state = {
        collapsed: false,
        viewMode: VIEW_BAR,
    }

    getSummaries() {
        const { transactions, accounts } = this.props;
        const transactionAccountIds = _.uniq(transactions.map(tx => tx.accountId));
        const filteredAccounts = accounts.filter(acc => transactionAccountIds.includes(acc._id || acc.id) && !acc.type.includes("others"));

        const accountSummaries = filteredAccounts.map((account) => {
            const accountId = account._id || account.id;
            const openingBalance = account.openingBalance || 0;
            const filteredTransactions = transactions.filter(tx => tx.accountId === accountId);
            const grouped = _.groupBy(filteredTransactions, "type");
            const totalDebit = _.sumBy(grouped[TRANSACTION_TYPES.DEBIT], tx => tx.amount);
            const totalCredit = _.sumBy(grouped[TRANSACTION_TYPES.CREDIT], tx => tx.amount);
            return {
                name: account.name, type: account.type, openingBalance, totalDebit, totalCredit,
                closingBalance: openingBalance + totalCredit - totalDebit,
            };
        });

        const cumulative = {
            openingBalance: _.sumBy(accountSummaries, "openingBalance"),
            totalDebit: _.sumBy(accountSummaries, "totalDebit"),
            totalCredit: _.sumBy(accountSummaries, "totalCredit"),
        };
        cumulative.closingBalance = cumulative.openingBalance + cumulative.totalCredit - cumulative.totalDebit;

        return { accountSummaries, cumulative };
    }

    getCumulativeRow(cumulative) {
        return <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <span className="fw-bold">Total</span>
            <span className="small text-muted">Opening: ₹{fmt(cumulative.openingBalance)}</span>
            <span className="small text-danger">Debit: ₹{fmt(cumulative.totalDebit)}</span>
            <span className="small text-success">Credit: ₹{fmt(cumulative.totalCredit)}</span>
            <span className="fw-bold">Closing: ₹{fmt(cumulative.closingBalance)}</span>
        </div>;
    }

    // Table view (clean minimal)
    getTableView(accountSummaries, cumulative) {
        return <div className="table-responsive">
            <table className="table summary-table text-center">
                <thead>
                    <tr>
                        <th className="text-start">Account</th>
                        <th>Opening</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Closing</th>
                    </tr>
                </thead>
                <tbody>
                    {accountSummaries.map((acc, idx) => <tr key={idx}>
                        <td className="text-start">{labelUtil.getAccountLabel(acc)}</td>
                        <td className="text-muted">₹{fmt(acc.openingBalance)}</td>
                        <td><span className="badge bg-danger bg-opacity-10 text-danger">₹{fmt(acc.totalDebit)}</span></td>
                        <td><span className="badge bg-success bg-opacity-10 text-success">₹{fmt(acc.totalCredit)}</span></td>
                        <td className="fw-bold">₹{fmt(acc.closingBalance)}</td>
                    </tr>)}
                    <tr className="summary-table-total">
                        <td className="text-start">Total</td>
                        <td>₹{fmt(cumulative.openingBalance)}</td>
                        <td><span className="badge bg-danger bg-opacity-10 text-danger fw-bold">₹{fmt(cumulative.totalDebit)}</span></td>
                        <td><span className="badge bg-success bg-opacity-10 text-success fw-bold">₹{fmt(cumulative.totalCredit)}</span></td>
                        <td className="fw-bold">₹{fmt(cumulative.closingBalance)}</td>
                    </tr>
                </tbody>
            </table>
        </div>;
    }

    // Card view
    getCardView(accountSummaries, cumulative) {
        return <div>
            <div className="row g-3">
                {accountSummaries.map((acc, idx) => <div key={idx} className="col-md-6 col-lg-4">
                    <div className="card shadow-sm" style={{ borderLeft: "3px solid #0d6efd" }}>
                        <div className="card-body">
                            <div className="fw-bold mb-2">{labelUtil.getAccountLabel(acc)}</div>
                            <div className="d-flex justify-content-between small text-muted mb-1">
                                <span>Opening</span><span>₹{fmt(acc.openingBalance)}</span>
                            </div>
                            <div className="d-flex justify-content-between small mb-1">
                                <span className="text-danger">Debit</span><span className="text-danger">₹{fmt(acc.totalDebit)}</span>
                            </div>
                            <div className="d-flex justify-content-between small mb-1">
                                <span className="text-success">Credit</span><span className="text-success">₹{fmt(acc.totalCredit)}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="d-flex justify-content-between fw-bold">
                                <span>Closing</span><span>₹{fmt(acc.closingBalance)}</span>
                            </div>
                        </div>
                    </div>
                </div>)}
            </div>
            <div className="card shadow-sm bg-light mt-3">
                <div className="card-body py-2">{this.getCumulativeRow(cumulative)}</div>
            </div>
        </div>;
    }

    // Bar view
    getBarView(accountSummaries, cumulative) {
        const maxAmount = Math.max(...accountSummaries.map(a => Math.max(a.totalDebit, a.totalCredit)), 1);
        return <div className="list-group shadow-sm">
            {accountSummaries.map((acc, idx) => <div key={idx} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold">{labelUtil.getAccountLabel(acc)}</span>
                    <span className="fw-bold">₹{fmt(acc.closingBalance)}</span>
                </div>
                <div className="d-flex gap-4 small mb-2">
                    <span className="text-muted">Open: ₹{fmt(acc.openingBalance)}</span>
                    <span className="text-danger">Debit: ₹{fmt(acc.totalDebit)}</span>
                    <span className="text-success">Credit: ₹{fmt(acc.totalCredit)}</span>
                </div>
                <div className="d-flex gap-1">
                    <div className="summary-bar flex-grow-1">
                        <div className="summary-bar-debit" style={{ width: (acc.totalDebit / maxAmount * 100) + "%" }}></div>
                    </div>
                    <div className="summary-bar flex-grow-1">
                        <div className="summary-bar-credit" style={{ width: (acc.totalCredit / maxAmount * 100) + "%" }}></div>
                    </div>
                </div>
            </div>)}
            <div className="list-group-item bg-light">
                {this.getCumulativeRow(cumulative)}
            </div>
        </div>;
    }

    render() {
        const { transactions, accounts } = this.props;
        if (_.isEmpty(transactions) || _.isEmpty(accounts)) return <></>;

        const { collapsed, viewMode } = this.state;
        const { accountSummaries, cumulative } = this.getSummaries();

        return (
            <div className="mb-2">
                <div className="mb-2 d-flex align-items-center">
                    <div className="cursor-pointer d-flex align-items-center"
                        onClick={() => this.setState({ collapsed: !collapsed })}>
                        <h3 className="mb-0">Summary</h3>
                        <i className={"bi ms-2 " + (collapsed ? "bi-plus-square" : "bi-dash-square")}></i>
                    </div>
                    {!collapsed && <div className="btn-group btn-group-sm ms-auto">
                        <button className={"btn btn-" + (viewMode == VIEW_TABLE ? "dark" : "outline-dark")} onClick={() => this.setState({ viewMode: VIEW_TABLE })}>
                            <i className="bi bi-table"></i>
                        </button>
                        <button className={"btn btn-" + (viewMode == VIEW_CARD ? "dark" : "outline-dark")} onClick={() => this.setState({ viewMode: VIEW_CARD })}>
                            <i className="bi bi-grid"></i>
                        </button>
                        <button className={"btn btn-" + (viewMode == VIEW_BAR ? "dark" : "outline-dark")} onClick={() => this.setState({ viewMode: VIEW_BAR })}>
                            <i className="bi bi-bar-chart"></i>
                        </button>
                    </div>}
                </div>
                {!collapsed && <>
                    {viewMode == VIEW_TABLE && this.getTableView(accountSummaries, cumulative)}
                    {viewMode == VIEW_CARD && this.getCardView(accountSummaries, cumulative)}
                    {viewMode == VIEW_BAR && this.getBarView(accountSummaries, cumulative)}
                </>}
            </div>
        );
    }
}
