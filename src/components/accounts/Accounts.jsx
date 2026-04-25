"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from 'react-toastify';
import CrudAccountModal from "./CrudAccountModal.jsx";
import SortDropdown from "@components/ui/SortDropdown.jsx";
import Modal from "@components/modal/Modal.jsx";
import { deleteAccountRequest } from "@store";
import { ACCOUNT_TYPE_LABELS } from "@config";
import uiUtil from "@utils/uiUtil.js";
import amountUtil from "@utils/amountUtil.js";

const fmt = amountUtil.getFormattedAmount;

class Accounts extends React.Component {
    state = {
        selectedAccount: null,
        showModal: false,
        deleteAccountId: null,
        sortField: "name",
        sortDirection: "asc",
    };

    getSortOptions() {
        return [
            { field: "name", label: "Name" },
            { field: "openingBalance", label: "Opening" },
            { field: "closingBalance", label: "Closing" },
            { field: "totalDebit", label: "Debit" },
            { field: "totalCredit", label: "Credit" },
            { field: "createdAt", label: "Created" },
            { field: "updatedAt", label: "Updated" },
        ];
    }

    toggleModal = (selectedAccount = null) => {
        this.setState({ showModal: !this.state.showModal, selectedAccount });
    };

    handleDelete = () => {
        this.props.dispatch(deleteAccountRequest(this.state.deleteAccountId)).unwrap().then(() => {
            this.setState({ deleteAccountId: null });
            toast.info("Account deleted ✅");
        });
    };

    getActionButtons(acc) {
        return <div className="d-flex gap-1 flex-nowrap">
            <span className="badge badge-outline-secondary cursor-pointer" onClick={() => this.toggleModal(acc)}><i className="bi bi-pencil"></i></span>
            <span className="badge badge-outline-danger cursor-pointer" onClick={() => this.setState({ deleteAccountId: acc._id })}><i className="bi bi-trash"></i></span>
        </div>;
    }

    getAccountDetails(acc) {
        if (acc.type === "credit_card") return null;
        return <>
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
        </>;
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
                    {this.getAccountDetails(acc)}
                </div>
            </div>
        </div>;
    }

    getGroupView(group, accounts) {
        const sorted = _.orderBy(accounts, [this.state.sortField], [this.state.sortDirection]);
        const isCreditCard = group === "credit_card";
        return <div key={group} className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">{ACCOUNT_TYPE_LABELS[group]}</h5>
                {!isCreditCard && <span className="fw-bold">₹{fmt(_.sumBy(accounts, "closingBalance"))}</span>}
            </div>
            <div className="row g-3">{sorted.map(this.getAccountCard)}</div>
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
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="text-muted small page-header">Accounts</div>
                    <SortDropdown options={this.getSortOptions()}
                        selected={{ field: this.state.sortField, direction: this.state.sortDirection }}
                        onChange={(field, direction) => this.setState({ sortField: field, sortDirection: direction })} />
                </div>
                {this.getAccountsContainer()}
                {this.getCrudAccountModal()}
                <Modal show={!!this.state.deleteAccountId} title="Delete Account"
                    body="Are you sure you want to delete this account?"
                    onSubmitClick={this.handleDelete}
                    onClose={() => this.setState({ deleteAccountId: null })} />
                {this.getAddButton()}
            </div>
        );
    }
}

export default connect(state => _.pick(state.user, ["accounts", "loadingAccounts"]))(Accounts);
