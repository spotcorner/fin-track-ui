"use strict";

import http from "./http";

export default {
    extract: (extractor, file) => {
        const formData = new FormData();
        formData.append("extractor", extractor || "AUTO");
        formData.append("file", file);
        const headers = { "Content-Type": "multipart/form-data" };
        return http.post("/api/v1/transactions/extract", formData, headers);
    },
    createDrafts: (accountId, draftName, transactions) => http.post("/api/v1/transactions/drafts", { accountId, draftName, transactions }),
    saveDrafts: (draftId) => http.post("/api/v1/transactions/save-drafts", { draftId }),
    deleteDrafts: (draftId) => http.post("/api/v1/transactions/delete-drafts", { draftId }),
    getAll: (startDate, endDate, isDraft, sortByDate, draftId) => http.get("/api/v1/transactions", {startDate, endDate, isDraft, sortByDate, draftId}),
    upsert: (transaction) => http.post("/api/v1/transaction", transaction),
    updateTags: (_id, appliedTags) => http.patch(`/api/v1/transaction/${_id}/tags`, { appliedTags }),
    delete: (transactionId) => http.delete(`/api/v1/transaction/${transactionId}`),
}