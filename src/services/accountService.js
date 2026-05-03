"use strict";

import http from "./http";

export default {
    getAll: () => http.get("/api/v1/accounts"),
    create: (account) => http.post("/api/v1/account", account),
    update: (_id, account) => http.put(`/api/v1/account/${_id}`, account),
    delete: (_id) => http.delete(`/api/v1/account/${_id}`),
}