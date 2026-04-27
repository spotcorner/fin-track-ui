"use strict";

import React from "react";
import { TRANSACTION_TYPES } from "@config";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil";
import HelpTip from "@components/ui/HelpTip.jsx";
import { SUMMARY_HELP } from "@utils/helpContent";

const fmt = amountUtil.getFormattedAmount;

export default class SummaryTable extends React.Component {

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

    getEffectiveOpeningBalance(props, account) {
        let openingBalance = 0;
        if (props.isDraft) {
            openingBalance = props.draftOpeningBalance || 0;
        } else {
            const prePeriod = props.prePeriodTotals[account._id] || {};
            openingBalance = (account.openingBalance || 0)
                + (prePeriod?.totalCredit || 0) - (prePeriod?.totalDebit || 0);
        }
        return openingBalance;
    }

    getSummaries() {
        const { transactions, accounts } = this.props;
        const transactionAccountIds = _.uniq(transactions.map(tx => tx.accountId));
        const filteredAccounts = accounts.filter(acc => transactionAccountIds.includes(acc._id || acc.id) && !acc.type.includes("others"));

        const accountSummaries = filteredAccounts.map((account) => {
            const accountId = account._id || account.id;
            const isCreditCard = account.type === "credit_card";
            let openingBalance = 0;
            if (!isCreditCard) {
                openingBalance = this.getEffectiveOpeningBalance(this.props, account);
            }
            const filteredTransactions = transactions.filter(tx => tx.accountId === accountId);
            const grouped = _.groupBy(filteredTransactions, "type");
            const totalDebit = _.sumBy(grouped[TRANSACTION_TYPES.DEBIT], tx => tx.amount);
            const totalCredit = _.sumBy(grouped[TRANSACTION_TYPES.CREDIT], tx => tx.amount);
            return {
                name: account.name, type: account.type, isCreditCard, openingBalance, totalDebit, totalCredit,
                closingBalance: isCreditCard ? 0 : openingBalance + totalCredit - totalDebit,
            };
        });

        const bankSummaries = accountSummaries.filter(a => !a.isCreditCard);
        const ccSummaries = accountSummaries.filter(a => a.isCreditCard);

        const bankCumulative = {
            openingBalance: _.sumBy(bankSummaries, "openingBalance"),
            totalDebit: _.sumBy(bankSummaries, "totalDebit"),
            totalCredit: _.sumBy(bankSummaries, "totalCredit"),
        };
        bankCumulative.closingBalance = bankCumulative.openingBalance + bankCumulative.totalCredit - bankCumulative.totalDebit;

        const ccCumulative = {
            totalDebit: _.sumBy(ccSummaries, "totalDebit"),
            totalCredit: _.sumBy(ccSummaries, "totalCredit"),
        };

        return { bankSummaries, ccSummaries, bankCumulative, ccCumulative };
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

    renderBankSummary(summaries, cumulative) {
        if (summaries.length === 0) return null;
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
                    {summaries.map((acc, idx) => <tr key={idx}>
                        <td className="text-start">{labelUtil.getAccountLabel(acc)}</td>
                        <td className="text-muted">₹{fmt(acc.openingBalance)}</td>
                        <td><span className="badge bg-danger bg-opacity-10 text-danger">₹{fmt(acc.totalDebit)}</span></td>
                        <td><span className="badge bg-success bg-opacity-10 text-success">₹{fmt(acc.totalCredit)}</span></td>
                        <td className="fw-bold">₹{fmt(acc.closingBalance)}</td>
                    </tr>)}
                    {summaries.length > 1 && <tr className="summary-table-total">
                        <td className="text-start">Total</td>
                        <td>₹{fmt(cumulative.openingBalance)}</td>
                        <td><span className="badge bg-danger bg-opacity-10 text-danger fw-bold">₹{fmt(cumulative.totalDebit)}</span></td>
                        <td><span className="badge bg-success bg-opacity-10 text-success fw-bold">₹{fmt(cumulative.totalCredit)}</span></td>
                        <td className="fw-bold">₹{fmt(cumulative.closingBalance)}</td>
                    </tr>}
                </tbody>
            </table>
        </div>;
    }

    renderCreditCardSummary(summaries, cumulative) {
        if (summaries.length === 0) return null;
        return <div className="table-responsive">
            <table className="table summary-table text-center">
                <thead>
                    <tr>
                        <th className="text-start">Credit Card</th>
                        <th>Spends</th>
                        <th>Payments</th>
                    </tr>
                </thead>
                <tbody>
                    {summaries.map((acc, idx) => <tr key={idx}>
                        <td className="text-start">{labelUtil.getAccountLabel(acc)}</td>
                        <td><span className="badge bg-danger bg-opacity-10 text-danger">₹{fmt(acc.totalDebit)}</span></td>
                        <td><span className="badge bg-success bg-opacity-10 text-success">₹{fmt(acc.totalCredit)}</span></td>
                    </tr>)}
                    {summaries.length > 1 && <tr className="summary-table-total">
                        <td className="text-start">Total</td>
                        <td><span className="badge bg-danger bg-opacity-10 text-danger fw-bold">₹{fmt(cumulative.totalDebit)}</span></td>
                        <td><span className="badge bg-success bg-opacity-10 text-success fw-bold">₹{fmt(cumulative.totalCredit)}</span></td>
                    </tr>}
                </tbody>
            </table>
        </div>;
    }

    render() {
        const { transactions, accounts } = this.props;
        if (_.isEmpty(transactions) || _.isEmpty(accounts)) return <></>;

        const { bankSummaries, ccSummaries, bankCumulative, ccCumulative } = this.getSummaries();

        return (
            <div className="mb-2">
                <div className="mb-2 d-flex align-items-center gap-1">
                    <div className="text-muted small page-header mb-0">Summary</div>
                    <HelpTip items={SUMMARY_HELP(this.props.isDraft)} />
                </div>
                {this.renderBankSummary(bankSummaries, bankCumulative)}
                {this.renderCreditCardSummary(ccSummaries, ccCumulative)}
                {this.renderSplitSummary()}
            </div>
        );
    }
}
