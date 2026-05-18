"use strict";

import http from "./http";

export default {
    getAll: (params) => http.get("/api/v1/activity", params),
};
