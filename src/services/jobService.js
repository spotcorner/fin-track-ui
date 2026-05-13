"use strict";

import http from "./http";

export default {
    create: (extractor, file, fromPage, toPage, password, accountId, draftName, openingBalance) => {
        const formData = new FormData();
        formData.append("extractor", extractor);
        formData.append("file", file);
        if (fromPage) formData.append("fromPage", fromPage);
        if (toPage) formData.append("toPage", toPage);
        if (password) formData.append("password", password);
        if (accountId) formData.append("accountId", accountId);
        if (draftName) formData.append("draftName", draftName);
        if (openingBalance) formData.append("openingBalance", openingBalance);
        const headers = { "Content-Type": "multipart/form-data" };
        return http.post("/api/v1/jobs/extract", formData, headers);
    },
    getAll: () => http.get("/api/v1/jobs"),
    get: (id) => http.get(`/api/v1/jobs/${id}`),
    update: (id, data) => http.patch(`/api/v1/jobs/${id}`, data),
    delete: (id) => http.delete(`/api/v1/jobs/${id}`),
};
