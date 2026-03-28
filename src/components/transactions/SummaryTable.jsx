"use strict";

import React from "react";
import { TRANSACTION_TYPES } from "@config";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil";

export default class SummaryTable extends React.Component {

    state = {
        collapsed: false,
    }

    render() {
        const { transactions, accounts } = this.props;
        if (_.isEmpty(transactions) || _.isEmpty(accounts)) return <></>;

        const transactionAccountIds = _.uniq(transactions.map(tx => tx.accountId));
        const filteredAccounts = accounts.filter(acc => transactionAccountIds.includes(acc._id || acc.id) && !acc.type.includes("others"));
        
        const accountSummaries = filteredAccounts.map((account) => {
            const accountId = account._id || account.id;
            const openingBalance = account.openingBalance || 0;

            const filteredTransactions = transactions.filter(tx => tx.accountId === accountId);

            const grouped = _.groupBy(filteredTransactions, "type");
            const totalDebit = _.sumBy(grouped[TRANSACTION_TYPES.DEBIT], tx => tx.amount);
            const totalCredit = _.sumBy(grouped[TRANSACTION_TYPES.CREDIT], tx => tx.amount);

            const closingBalance = openingBalance + totalCredit - totalDebit;

            return {
                name: account.name,
                type: account.type,
                openingBalance,
                totalDebit,
                totalCredit,
                closingBalance
            };
        });

        const cumulative = {
            openingBalance: _.sumBy(accountSummaries, "openingBalance"),
            totalDebit: _.sumBy(accountSummaries, "totalDebit"),
            totalCredit: _.sumBy(accountSummaries, "totalCredit"),
        };
        cumulative.closingBalance = cumulative.openingBalance + cumulative.totalCredit - cumulative.totalDebit;

        const { collapsed } = this.state;

        return (
            <div className="">
                <div className="mb-2 d-flex align-items-center cursor-pointer"
                    onClick={() => this.setState({ collapsed: !collapsed })}>
                    <h3 className="mb-0">Summary</h3>
                    <i className={"bi ms-2 " + (collapsed ? "bi-plus-square" : "bi-dash-square")}></i>
                </div>
                {!collapsed && <div className="table-responsive">
                    <table className="table table-bordered table-striped text-center shadow-sm">
                        <thead className="table-light">
                            <tr>
                                <th>Account</th>
                                <th>Opening Balance (₹)</th>
                                <th>Total Debit (₹)</th>
                                <th>Total Credit (₹)</th>
                                <th>Closing Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accountSummaries.map((acc, idx) => (
                                <tr key={idx}>
                                    <td>{labelUtil.getAccountLabel(acc)}</td>
                                    <td className="text-muted">{amountUtil.getFormattedAmount(acc.openingBalance)}</td>
                                    <td className="text-danger">{amountUtil.getFormattedAmount(acc.totalDebit)}</td>
                                    <td className="text-success">{amountUtil.getFormattedAmount(acc.totalCredit)}</td>
                                    <td className="fw-bold">{amountUtil.getFormattedAmount(acc.closingBalance)}</td>
                                </tr>
                            ))}
                            <tr className="table-secondary fw-bold">
                                <td>Total</td>
                                <td>{amountUtil.getFormattedAmount(cumulative.openingBalance)}</td>
                                <td>{amountUtil.getFormattedAmount(cumulative.totalDebit)}</td>
                                <td>{amountUtil.getFormattedAmount(cumulative.totalCredit)}</td>
                                <td>{amountUtil.getFormattedAmount(cumulative.closingBalance)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>}
            </div>
        );
    }
}
