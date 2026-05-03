"use strict";

import React from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import Modal from "@modal/Modal.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { TRANSACTION_MODAL_HELP } from "@utils/helpContent";
import { TRANSACTION_TYPES } from "@config";
import transactionService from "@services/transactionService";
import labelUtil from "@utils/labelUtil";

function getDerivedStateFromProps(props) {
    return {
        _id: props.transaction?._id || "",
        date: props.transaction?.date || moment().format("YYYY-MM-DD"),
        type: props.transaction?.type || TRANSACTION_TYPES.DEBIT,
        accountId: props.transaction?.accountId || "",
        amount: props.transaction?.amount || 0,
        splitAmount: props.transaction?.splitAmount || "",
        excludeFromTotals: props.transaction?.excludeFromTotals || 0,
        balance: props.transaction?.balance || 0,
        description: props.transaction?.description || "",
        appliedTags: props.transaction?.appliedTags || {},
        comments: props.transaction?.comments || "",
        isDraft: props.isDraft,
        draftId: props.transaction?.draftId || props.draftId || "",
    };
}

class CrudTransactionModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = getDerivedStateFromProps(props);
        this.formRef = React.createRef();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.show !== this.props.show && this.props.show) {
            this.setState(getDerivedStateFromProps(this.props));
        }
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSubmit = (e) => {
        e.preventDefault();

        this.state.amount = parseFloat(this.state.amount);
        this.state.splitAmount = this.state.splitAmount ? parseFloat(this.state.splitAmount) : null;
        this.state.excludeFromTotals = parseInt(this.state.excludeFromTotals);
        const save = this.state._id
            ? transactionService.update(this.state._id, this.state)
            : transactionService.create(this.state);
        save.then(data => {
            toast.info("Transaction saved ✅");
            this.props.onSave(data.transaction);
            this.props.onClose();
        })
    };

    getModalTitle() {
        const title = this.props.transaction ? "Edit Transaction" : "Add Transaction";
        return <span className="d-flex align-items-center gap-1">{title}<HelpTip items={TRANSACTION_MODAL_HELP} /></span>;
    }

    onSubmitClick = () => {
        if (this.formRef.current) {
            this.formRef.current.requestSubmit();
        }
    }

    getModalBody() {
        const { date, description, accountId, type, amount, excludeFromTotals, comments } = this.state;
        const { accountsMap } = this.props;
        return (
            <form ref={this.formRef} onSubmit={this.handleSubmit}>
                <div className="mb-2">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" name="date" value={date} onChange={this.handleChange} required />
                </div>
                <div className="row mb-2">
                    <div className="col">
                        <label className="form-label">Account</label>
                        <select className="form-select" name="accountId" value={accountId} onChange={this.handleChange} required>
                            <option value=""></option>
                            {_.values(accountsMap).map((account, index) => (
                                <option key={index} value={account._id}>{labelUtil.getAccountLabel(account)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col">
                        <label className="form-label">Type</label>
                        <select className="form-select" name="type" value={type} onChange={this.handleChange} required>
                            <option value=""></option>
                            <option value="DEBIT">Debit</option>
                            <option value="CREDIT">Credit</option>
                        </select>
                    </div>
                </div>
                <div className="row mb-2">
                    <div className="col">
                        <label className="form-label">Amount</label>
                        <input type="number" className="form-control" name="amount" value={amount} onChange={this.handleChange} required />
                    </div>
                    <div className="col">
                        <label className="form-label">Split ({type === TRANSACTION_TYPES.DEBIT ? "owed" : "settled"})</label>
                        <input type="number" className="form-control" name="splitAmount" value={this.state.splitAmount} onChange={this.handleChange} />
                    </div>
                </div>
                <div className="mb-2 form-check">
                    <input type="checkbox" className="form-check-input" name="excludeFromTotals" checked={excludeFromTotals == 1}
                        onChange={(e) => this.setState({ excludeFromTotals: e.target.checked ? 1 : 0 })} />
                    <label className="form-check-label">Exclude from totals</label>
                </div>
                <div className="mb-2">
                    <label className="form-label">Description</label>
                    <input type="text" className="form-control" name="description" value={description} onChange={this.handleChange} />
                </div>
                <div className="mb-2">
                    <label className="form-label">Comments</label>
                    <textarea className="form-control" name="comments" value={comments} onChange={this.handleChange} />
                </div>
            </form>
        );
    }

    render() {
        return <Modal show={this.props.show} title={this.getModalTitle()} body={this.getModalBody()} onClose={this.props.onClose} onSubmitClick={this.onSubmitClick} />;
    }
}

export default connect(state => _.pick(state.user, ["accountsMap"]))(CrudTransactionModal);