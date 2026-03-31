"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from 'react-toastify';
import CrudAccountModal from "./CrudAccountModal.jsx";
import { deleteAccountRequest } from "@store";
import { ACCOUNT_TYPE_LABELS } from "@config";
import uiUtil from "@utils/uiUtil.js";
import amountUtil from "@utils/amountUtil.js";

const fmt = amountUtil.getFormattedAmount;

class Accounts extends React.Component {
    state = {
        selectedAccount: null,
        showModal: false,
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

    getAccountCard = (acc) => {
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

    getGroupView(group, accounts) {
        const closingBalance = _.sumBy(accounts, "closingBalance");
        return <div key={group} className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">{ACCOUNT_TYPE_LABELS[group]}</h5>
                <span className="fw-bold">₹{fmt(closingBalance)}</span>
            </div>
            <div className="row g-3">{accounts.map(this.getAccountCard)}</div>
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
                <div className="text-muted small mb-2 page-header">Accounts</div>
                {this.getAccountsContainer()}
                {this.getCrudAccountModal()}
                {this.getAddButton()}
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["accounts", "loadingAccounts"]))(Accounts);
