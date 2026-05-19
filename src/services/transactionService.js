"use strict";

import http from "./http";

export default {
    getAll: (startDate, endDate, sortByDate, draftId) => http.get("/api/v1/transactions", {startDate, endDate, sortByDate, draftId}),
    create: (transaction) => http.post("/api/v1/transaction", transaction),
    update: (_id, transaction) => http.put(`/api/v1/transaction/${_id}`, transaction),
    updateTags: (_id, appliedTags) => http.patch(`/api/v1/transaction/${_id}/tags`, { appliedTags }),
    bulkUpdateTags: (transactionIds, tagId, status) => http.patch("/api/v1/transactions/tags", { transactionIds, tagId, status }),
    delete: (transactionId) => http.delete(`/api/v1/transaction/${transactionId}`),
}
