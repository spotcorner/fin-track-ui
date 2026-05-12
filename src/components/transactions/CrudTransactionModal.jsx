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
import amountUtil from "@utils/amountUtil";

function getDerivedStateFromProps(props) {
    return {
        _id: props.transaction?._id || "",
        date: props.transaction?.date || moment().format("YYYY-MM-DD"),
        type: props.transaction?.type || TRANSACTION_TYPES.DEBIT,
        accountId: props.transaction?.accountId || props.draftAccountId || "",
        amount: props.transaction?.amount || 0,
        excludeFromTotals: props.transaction?.excludeFromTotals || 0,
        balance: props.transaction?.balance || 0,
        description: props.transaction?.description || "",
        appliedTags: props.transaction?.appliedTags || {},
        comments: props.transaction?.comments || "",
        isDraft: props.isDraft,
        draftId: props.transaction?.draftId || props.draftId || "",
        children: props.transaction?.childIds?.length ? (props.children || []) : [],
        splitMode: !!(props.transaction?.childIds?.length),
        wasSplit: !!(props.transaction?.childIds?.length),
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

    handleChildChange = (index, field, value) => {
        this.setState(prev => {
            const children = [...prev.children];
            children[index] = { ...children[index], [field]: value };
            return { children };
        });
    };

    addChild = () => {
        this.setState(prev => ({
            children: [...prev.children, { amount: "", description: "" }],
            splitMode: true,
        }));
    };

    removeChild = (index) => {
        this.setState(prev => {
            const children = prev.children.filter((_, i) => i !== index);
            return { children, splitMode: children.length > 0 };
        });
    };

    toggleSplitMode = () => {
        this.setState(prev => {
            if (prev.splitMode) {
                return { splitMode: false, children: [] };
            }
            const half = parseFloat(prev.amount) / 2 || 0;
            return {
                splitMode: true,
                children: [
                    { amount: half, description: "" },
                    { amount: half, description: "" },
                ],
            };
        });
    };

    handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...this.state };
        payload.amount = parseFloat(payload.amount);
        payload.excludeFromTotals = parseInt(payload.excludeFromTotals);
        if (payload.splitMode) {
            payload.children = payload.children.map(c => ({ ...c, amount: parseFloat(c.amount) || 0 }));
        } else if (payload.wasSplit) {
            payload.children = [];
        } else {
            delete payload.children;
        }
        delete payload.splitMode;
        delete payload.wasSplit;
        const save = payload._id
            ? transactionService.update(payload._id, payload)
            : transactionService.create(payload);
        save.then(data => {
            toast.info("Transaction saved ✅");
            this.props.onSave(data.transaction, data.children || []);
            this.props.onClose();
        });
    };

    getModalTitle() {
        const title = this.props.transaction ? "Edit Transaction" : "Add Transaction";
        return <span className="d-flex align-items-center gap-1">{title}<HelpTip items={TRANSACTION_MODAL_HELP.overview} /></span>;
    }

    onSubmitClick = () => {
        if (this.formRef.current) {
            this.formRef.current.requestSubmit();
        }
    }

    getRemaining() {
        const total = parseFloat(this.state.amount) || 0;
        const childSum = this.state.children.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        return total - childSum;
    }

    getSplitSection() {
        const { children, splitMode, amount } = this.state;
        if (!amount || parseFloat(amount) <= 0) return null;
        return <div className="mb-2">
            <div className="d-flex align-items-center gap-1 mb-1">
                <input type="checkbox" className="form-check-input" checked={splitMode}
                    onChange={this.toggleSplitMode} />
                <label className="form-check-label">Split amount</label>
                <HelpTip text={TRANSACTION_MODAL_HELP.split} />
            </div>
            {splitMode && <>
                {children.map((child, i) => <div key={i} className="row g-2 mb-1">
                    <div className="col-4">
                        <input type="number" className="form-control form-control-sm" placeholder="Amount"
                            value={child.amount} onChange={(e) => this.handleChildChange(i, "amount", e.target.value)} required />
                    </div>
                    <div className="col">
                        <input type="text" className="form-control form-control-sm" placeholder="Description"
                            value={child.description} onChange={(e) => this.handleChildChange(i, "description", e.target.value)} />
                    </div>
                    <div className="col-auto">
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => this.removeChild(i)}>
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                </div>)}
                <div className="d-flex align-items-center gap-2 mt-1">
                    <button type="button" className="btn btn-sm btn-outline-dark" onClick={this.addChild}>+ Add</button>
                    {children.length > 0 && (() => {
                        const remaining = this.getRemaining();
                        const color = remaining === 0 ? "success" : remaining > 0 ? "warning" : "danger";
                        return <span className={`badge bg-${color} bg-opacity-10 text-${color}`}>
                            Remaining: ₹{amountUtil.getFormattedAmount(Math.abs(remaining))}
                            {remaining === 0 && " ✓"}
                        </span>;
                    })()}
                </div>
            </>}
        </div>;
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
                        <select className="form-select" name="accountId" value={accountId} onChange={this.handleChange} required disabled={this.props.isDraft}>
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
                <div className="mb-2">
                    <label className="form-label">Amount</label>
                    <input type="number" className="form-control" name="amount" value={amount} onChange={this.handleChange} required />
                </div>
                {this.getSplitSection()}
                <div className="mb-2 d-flex align-items-center gap-1">
                    <input type="checkbox" className="form-check-input" name="excludeFromTotals" checked={excludeFromTotals == 1}
                        onChange={(e) => this.setState({ excludeFromTotals: e.target.checked ? 1 : 0 })} />
                    <label className="form-check-label">Exclude from totals</label>
                    <HelpTip text={TRANSACTION_MODAL_HELP.excludeFromTotals} />
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
