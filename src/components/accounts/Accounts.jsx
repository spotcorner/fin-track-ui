"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from 'react-toastify';
import CrudAccountModal from "./CrudAccountModal.jsx";
import { deleteAccountRequest } from "@store";
import { ACCOUNT_TYPE_LABELS } from "@config";
import uiUtil from "@utils/uiUtil.js";
import amountUtil from "@utils/amountUtil.js";

const VIEW_CARD = "card";
const VIEW_BAR = "bar";

const fmt = amountUtil.getFormattedAmount;

class Accounts extends React.Component {
    state = {
        selectedAccount: null,
        showModal: false,
        viewMode: VIEW_CARD,
    };

    toggleModal = (selectedAccount = null) => {
        this.setState({ showModal: !this.state.showModal, selectedAccount });
    };

    handleDelete = (_id) => {
        this.props.dispatch(deleteAccountRequest(_id)).then(() => {
            toast.info("Account deleted ✅");
        });
    };

    getActionButtons(acc) {
        return <div className="d-flex gap-1 flex-nowrap">
            <span className="badge bg-secondary cursor-pointer" onClick={() => this.toggleModal(acc)}><i className="bi bi-pencil"></i></span>
            <span className="badge bg-secondary cursor-pointer" onClick={() => this.handleDelete(acc._id)}><i className="bi bi-trash"></i></span>
        </div>;
    }

    // Card view (Option A)
    getCardAccount = (acc) => {
        return <div key={acc._id} className="col-md-6 col-lg-4">
            <div className="card shadow-sm" style={{ borderLeft: "3px solid #0d6efd" }}>
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold">{acc.name}</span>
                        {this.getActionButtons(acc)}
                    </div>
                    {!_.isEmpty(acc.description) && <div className="small text-muted mb-1">{acc.description}</div>}
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
        </div>;
    }

    // Bar view (Option C)
    getBarAccount = (acc, maxAmount) => {
        return <div key={acc._id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <div>
                    <span className="fw-bold">{acc.name}</span>
                    {!_.isEmpty(acc.description) && <span className="text-muted small ms-2">{acc.description}</span>}
                </div>
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold">₹{fmt(acc.closingBalance)}</span>
                    {this.getActionButtons(acc)}
                </div>
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
        </div>;
    }

    getGroupView(group, accounts) {
        const { viewMode } = this.state;
        const closingBalance = _.sumBy(accounts, "closingBalance");
        const maxAmount = Math.max(...accounts.map(a => Math.max(a.totalDebit || 0, a.totalCredit || 0)), 1);

        return <div key={group} className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">{ACCOUNT_TYPE_LABELS[group]}</h5>
                <span className="fw-bold">₹{fmt(closingBalance)}</span>
            </div>
            {viewMode == VIEW_CARD
                ? <div className="row g-3">{accounts.map(this.getCardAccount)}</div>
                : <div className="list-group shadow-sm">{accounts.map(acc => this.getBarAccount(acc, maxAmount))}</div>}
        </div>;
    }

    getAccountsContainer() {
        const { accounts, loadingAccounts } = this.props;

        if (loadingAccounts) return uiUtil.spinnerLoader("mt-4");
        if (accounts.length === 0) return <div className="mt-4"><span className="text-muted">No accounts found.</span></div>;

        const groupedAccounts = _.groupBy(accounts, "type");
        return _.keys(groupedAccounts)
            .filter(g => !g.includes("others"))
            .map(group => this.getGroupView(group, groupedAccounts[group]));
    }

    getViewToggle() {
        const { viewMode } = this.state;
        return <div className="btn-group btn-group-sm ms-auto">
            <button className={"btn btn-" + (viewMode == VIEW_CARD ? "dark" : "outline-dark")} onClick={() => this.setState({ viewMode: VIEW_CARD })}>
                <i className="bi bi-grid"></i>
            </button>
            <button className={"btn btn-" + (viewMode == VIEW_BAR ? "dark" : "outline-dark")} onClick={() => this.setState({ viewMode: VIEW_BAR })}>
                <i className="bi bi-bar-chart"></i>
            </button>
        </div>;
    }

    getCrudAccountModal() {
        return <CrudAccountModal show={this.state.showModal} account={this.state.selectedAccount} onClose={() => this.toggleModal()} />;
    }

    getAddButton() {
        return <button
            className="btn btn-dark rounded-circle position-fixed bottom-0 end-0 m-4"
            onClick={() => this.toggleModal()}
            style={{ width: "50px", height: "50px" }}
        >+</button>;
    }

    render() {
        return (
            <div className="container mt-3">
                <div className="d-flex align-items-center">
                    <h1 className="mb-0">Accounts</h1>
                    {this.getViewToggle()}
                </div>
                {this.getAccountsContainer()}
                {this.getCrudAccountModal()}
                {this.getAddButton()}
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["accounts", "loadingAccounts"]))(Accounts);
