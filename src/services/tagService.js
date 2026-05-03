"use strict";

import http from "./http";

export default {
    getAll: () => http.get("/api/v1/tags"),
    create: (tag) => http.post("/api/v1/tag", tag),
    update: (_id, tag) => http.put(`/api/v1/tag/${_id}`, tag),
    delete: (_id) => http.delete(`/api/v1/tag/${_id}`),
}
