"use strict";

import http from "./http";

export default {
    importDraft: (file, accountId, name, openingBalance, password, fromPage, toPage) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("accountId", accountId);
        formData.append("name", name);
        if (openingBalance) formData.append("openingBalance", openingBalance);
        if (password) formData.append("password", password);
        if (fromPage) formData.append("fromPage", fromPage);
        if (toPage) formData.append("toPage", toPage);
        return http.post("/api/v1/draft/import", formData, { "Content-Type": "multipart/form-data" });
    },
    create: (data) => http.post("/api/v1/draft", data),
    getAll: () => http.get("/api/v1/drafts"),
    get: (id) => http.get(`/api/v1/draft/${id}`),
    update: (id, data) => http.patch(`/api/v1/draft/${id}`, data),
    delete: (id) => http.delete(`/api/v1/draft/${id}`),
    saveDraft: (id, data) => http.post(`/api/v1/draft/${id}/save`, data),
    finalize: (id) => http.post(`/api/v1/draft/${id}/finalize`),
};
