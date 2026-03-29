"use strict";

import http from "./http";

export default {
    getAll: () => http.get("/api/v1/rules"),
    upsert: (rule) => http.post("/api/v1/rule", rule),
    delete: (_id) => http.delete(`/api/v1/rule/${_id}`),
}
