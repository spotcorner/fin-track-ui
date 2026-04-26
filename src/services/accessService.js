"use strict";

import http from "./http";

export default {
    getGranted: () => http.get("/api/v1/access/granted"),
    getReceived: () => http.get("/api/v1/access/received"),
    grant: (email, accessType, nicknameForMember) => http.post("/api/v1/access", { email, accessType, nicknameForMember }),
    update: (_id, data) => http.patch(`/api/v1/access/${_id}`, data),
    revoke: (_id) => http.delete(`/api/v1/access/${_id}`),
};
