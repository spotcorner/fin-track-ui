"use strict";

import React from "react";
import { TRANSACTION_TYPES } from "@config";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil";

const fmt = amountUtil.getFormattedAmount;

export default class SummaryTable extends React.Component {

    state = {
        collapsed: this.props.isDraft != 1,
    }

    getSplitSummary() {
        const { filteredTransactions } = this.props;
        let owed = 0, settled = 0;
        filteredTransactions.forEach(tx => {
            if (!tx.splitAmount) return;
            if (tx.type === TRANSACTION_TYPES.DEBIT) owed += tx.splitAmount;
            else settled += tx.splitAmount;
        });
        if (owed === 0 && settled === 0) return null;
        return { owed, settled, pending: owed - settled };
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

    renderSplitSummary() {
        const split = this.getSplitSummary();
        if (!split) return null;
        return <div className="text-muted small">
            Split:
            <span className="badge bg-danger bg-opacity-10 text-danger ms-1">Owed ₹{fmt(split.owed)}</span>
            <span className="badge bg-success bg-opacity-10 text-success ms-1">Settled ₹{fmt(split.settled)}</span>
            <span className="badge bg-warning text-dark ms-1">Pending ₹{fmt(split.pending)}</span>
        </div>;
    }

    render() {
        const { transactions, accounts } = this.props;
        if (_.isEmpty(transactions) || _.isEmpty(accounts)) return <></>;

        const { collapsed } = this.state;
        const { accountSummaries, cumulative } = this.getSummaries();

        return (
            <div className="mb-2">
                <div className="mb-2 d-flex align-items-center cursor-pointer"
                    onClick={() => this.setState({ collapsed: !collapsed })}>
                    <div className="text-muted small page-header mb-0">Summary</div>
                    <i className={"bi ms-auto " + (collapsed ? "bi-plus-square" : "bi-dash-square")}></i>
                </div>
                {!collapsed && <div className="table-responsive">
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
                </div>}
                {!collapsed && this.renderSplitSummary()}
            </div>
        );
    }
}
