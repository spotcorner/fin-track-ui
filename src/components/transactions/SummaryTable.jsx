"use strict";

import React from "react";
import { TRANSACTION_TYPES } from "@config";
import amountUtil from "@utils/amountUtil.js";
import labelUtil from "@utils/labelUtil";
import HelpTip from "@components/ui/HelpTip.jsx";
import { SUMMARY_HELP } from "@utils/helpContent";

const fmt = amountUtil.getFormattedAmount;

export default class SummaryTable extends React.Component {

    getEffectiveOpeningBalance(account) {
        if (this.props.isDraft) return this.props.draftOpeningBalance || 0;
        const prePeriod = this.props.prePeriodTotals[account._id] || {};
        return (account.openingBalance || 0) + (prePeriod?.totalCredit || 0) - (prePeriod?.totalDebit || 0);
    }

    // all transactions excluding parents (children represent the real amounts)
    getAllTransactions() {
        return this.props.transactions.filter(t => !t.childIds?.length);
    }

    hasActiveFilters() {
        return this.props.filteredTransactions.length !== this.getAllTransactions().length;
    }

    getAccountTotals(transactions, accountId) {
        const filtered = transactions.filter(tx => tx.accountId === accountId);
        const grouped = _.groupBy(filtered, "type");
        return {
            totalDebit: _.sumBy(grouped[TRANSACTION_TYPES.DEBIT], "amount") || 0,
            totalCredit: _.sumBy(grouped[TRANSACTION_TYPES.CREDIT], "amount") || 0,
        };
    }

    getSummaries() {
        const { filteredTransactions, accounts } = this.props;
        const allTransactions = this.getAllTransactions();
        const showFiltered = this.hasActiveFilters();

        const transactionAccountIds = _.uniq(allTransactions.map(tx => tx.accountId));
        const filteredAccounts = accounts.filter(acc =>
            transactionAccountIds.includes(acc._id || acc.id) && !acc.type.includes("others")
        );

        const accountSummaries = filteredAccounts.map(account => {
            const accountId = account._id || account.id;
            const isCreditCard = account.type === "credit_card";
            const openingBalance = isCreditCard ? 0 : this.getEffectiveOpeningBalance(account);
            const total = this.getAccountTotals(allTransactions, accountId);
            const filtered = showFiltered ? this.getAccountTotals(filteredTransactions, accountId) : null;
            return {
                name: account.name, type: account.type, isCreditCard, openingBalance,
                ...total, filtered,
                closingBalance: isCreditCard ? 0 : openingBalance + total.totalCredit - total.totalDebit,
            };
        });

        const bankSummaries = accountSummaries.filter(a => !a.isCreditCard);
        const ccSummaries = accountSummaries.filter(a => a.isCreditCard);

        const bankCumulative = {
            openingBalance: _.sumBy(bankSummaries, "openingBalance"),
            totalDebit: _.sumBy(bankSummaries, "totalDebit"),
            totalCredit: _.sumBy(bankSummaries, "totalCredit"),
            filtered: showFiltered ? {
                totalDebit: _.sumBy(bankSummaries, "filtered.totalDebit"),
                totalCredit: _.sumBy(bankSummaries, "filtered.totalCredit"),
            } : null,
        };
        bankCumulative.closingBalance = bankCumulative.openingBalance + bankCumulative.totalCredit - bankCumulative.totalDebit;

        const ccCumulative = {
            totalDebit: _.sumBy(ccSummaries, "totalDebit"),
            totalCredit: _.sumBy(ccSummaries, "totalCredit"),
            filtered: showFiltered ? {
                totalDebit: _.sumBy(ccSummaries, "filtered.totalDebit"),
                totalCredit: _.sumBy(ccSummaries, "filtered.totalCredit"),
            } : null,
        };

        return { bankSummaries, ccSummaries, bankCumulative, ccCumulative, showFiltered };
    }

    renderDebitCell(filtered, total) {
        if (filtered === null) return <td><span className="badge bg-danger bg-opacity-10 text-danger">₹{fmt(total)}</span></td>;
        return <td>
            <span className="text-muted small">₹{fmt(filtered)}</span>
            <span className="text-muted mx-1">/</span>
            <span className="badge bg-danger bg-opacity-10 text-danger">₹{fmt(total)}</span>
        </td>;
    }

    renderCreditCell(filtered, total) {
        if (filtered === null) return <td><span className="badge bg-success bg-opacity-10 text-success">₹{fmt(total)}</span></td>;
        return <td>
            <span className="text-muted small">₹{fmt(filtered)}</span>
            <span className="text-muted mx-1">/</span>
            <span className="badge bg-success bg-opacity-10 text-success">₹{fmt(total)}</span>
        </td>;
    }

    renderBankSummary(summaries, cumulative, showFiltered) {
        if (summaries.length === 0) return null;
        const headerHint = showFiltered ? <span className="text-primary">(filtered / total)</span> : null;
        return <div className="table-responsive">
            <table className="table summary-table text-center">
                <thead>
                    <tr>
                        <th className="text-start">Account</th>
                        <th>Opening</th>
                        <th>Debit {headerHint}</th>
                        <th>Credit {headerHint}</th>
                        <th>Closing</th>
                    </tr>
                </thead>
                <tbody>
                    {summaries.map((acc, idx) => <tr key={idx}>
                        <td className="text-start">{labelUtil.getAccountLabel(acc)}</td>
                        <td className="text-muted">₹{fmt(acc.openingBalance)}</td>
                        {this.renderDebitCell(acc.filtered?.totalDebit ?? null, acc.totalDebit)}
                        {this.renderCreditCell(acc.filtered?.totalCredit ?? null, acc.totalCredit)}
                        <td className="fw-bold">₹{fmt(acc.closingBalance)}</td>
                    </tr>)}
                    {summaries.length > 1 && <tr className="summary-table-total">
                        <td className="text-start">Total</td>
                        <td>₹{fmt(cumulative.openingBalance)}</td>
                        {this.renderDebitCell(cumulative.filtered?.totalDebit ?? null, cumulative.totalDebit)}
                        {this.renderCreditCell(cumulative.filtered?.totalCredit ?? null, cumulative.totalCredit)}
                        <td className="fw-bold">₹{fmt(cumulative.closingBalance)}</td>
                    </tr>}
                </tbody>
            </table>
        </div>;
    }

    renderCreditCardSummary(summaries, cumulative, showFiltered) {
        if (summaries.length === 0) return null;
        const headerHint = showFiltered ? <span className="text-primary">(filtered / total)</span> : null;
        return <div className="table-responsive">
            <table className="table summary-table text-center">
                <thead>
                    <tr>
                        <th className="text-start">Credit Card</th>
                        <th>Spends {headerHint}</th>
                        <th>Payments {headerHint}</th>
                    </tr>
                </thead>
                <tbody>
                    {summaries.map((acc, idx) => <tr key={idx}>
                        <td className="text-start">{labelUtil.getAccountLabel(acc)}</td>
                        {this.renderDebitCell(acc.filtered?.totalDebit ?? null, acc.totalDebit)}
                        {this.renderCreditCell(acc.filtered?.totalCredit ?? null, acc.totalCredit)}
                    </tr>)}
                    {summaries.length > 1 && <tr className="summary-table-total">
                        <td className="text-start">Total</td>
                        {this.renderDebitCell(cumulative.filtered?.totalDebit ?? null, cumulative.totalDebit)}
                        {this.renderCreditCell(cumulative.filtered?.totalCredit ?? null, cumulative.totalCredit)}
                    </tr>}
                </tbody>
            </table>
        </div>;
    }

    render() {
        const { transactions, accounts } = this.props;
        if (_.isEmpty(transactions) || _.isEmpty(accounts)) return <></>;

        const { bankSummaries, ccSummaries, bankCumulative, ccCumulative, showFiltered } = this.getSummaries();

        return (
            <div className="mb-2">
                <div className="mb-2 d-flex align-items-center gap-1">
                    <div className="text-muted small page-header mb-0">Summary</div>
                    <HelpTip items={SUMMARY_HELP(this.props.isDraft)} />
                </div>
                {this.renderBankSummary(bankSummaries, bankCumulative, showFiltered)}
                {this.renderCreditCardSummary(ccSummaries, ccCumulative, showFiltered)}
            </div>
        );
    }
}
