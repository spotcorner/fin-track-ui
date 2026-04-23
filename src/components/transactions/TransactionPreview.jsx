"use strict";

import React from "react";
import { TRANSACTION_TYPES } from "@config";
import amountUtil from "@utils/amountUtil";

class TransactionPreview extends React.Component {
    render() {
        const { transactions } = this.props;
        if (!transactions || !transactions.length) return null;
        return <div style={{ overflowX: "auto" }}>
            <div className="list-group list-group-striped mb-2" style={{ minWidth: "700px" }}>
                {transactions.map((txn, i) => {
                    const typeClass = txn.type === TRANSACTION_TYPES.CREDIT ? "transaction-credit" : "transaction-debit";
                    const amountColor = txn.type === TRANSACTION_TYPES.CREDIT ? "text-success" : "text-danger";
                    return <div key={i} className={"list-group-item " + typeClass}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="text-muted small text-nowrap">{moment(txn.date, "YYYY-MM-DD").format("MMM D, YYYY")}</div>
                            <span className={"fw-bold text-nowrap " + amountColor}>₹{amountUtil.getFormattedAmount(txn.amount)}</span>
                            <div className="flex-grow-1 text-truncate small">{txn.description}</div>
                        </div>
                    </div>;
                })}
            </div>
        </div>;
    }
}

export default TransactionPreview;
