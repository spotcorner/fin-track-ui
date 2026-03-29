"use strict";

import http from "./http";

export default {
    getAll: () => http.get("/api/v1/tags"),
    upsert: (tag) => http.post("/api/v1/tag", tag),
    delete: (_id) => http.delete(`/api/v1/tag/${_id}`),
}
