"use strict";

import http from "./http";

export default {
    getGranted: () => http.get("/api/v1/access/granted"),
    getReceived: () => http.get("/api/v1/access/received"),
    grant: (email, accessType) => http.post("/api/v1/access", { email, accessType }),
    revoke: (_id) => http.delete(`/api/v1/access/${_id}`),
};
