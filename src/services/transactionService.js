"use strict";

import http from "./http";

export default {
    extract: (extractor, file, fromPage, toPage) => {
        const formData = new FormData();
        formData.append("extractor", extractor);
        formData.append("file", file);
        if (fromPage) formData.append("fromPage", fromPage);
        if (toPage) formData.append("toPage", toPage);
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