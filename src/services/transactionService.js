"use strict";

import http from "./http";

export default {
    extract: (accountId, extractor, file, draftName) => {
        const formData = new FormData();
        formData.append("accountId", accountId);
        formData.append("extractor", extractor);
        formData.append("file", file);
        formData.append("draftName", draftName);
        const headers = { "Content-Type": "multipart/form-data" };
        return http.post("/api/v1/transactions/extract", formData, headers);
    },
    saveDrafts: (draftId) => http.post("/api/v1/transactions/save-drafts", { draftId }),
    deleteDrafts: (draftId) => http.post("/api/v1/transactions/delete-drafts", { draftId }),
    getAll: (startDate, endDate, isDraft, sortByDate, draftId) => http.get("/api/v1/transactions", {startDate, endDate, isDraft, sortByDate, draftId}),
    upsert: (transaction) => http.post("/api/v1/transaction", transaction),
    delete: (transactionId) => http.delete(`/api/v1/transaction/${transactionId}`),
}