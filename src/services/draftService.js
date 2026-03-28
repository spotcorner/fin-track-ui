"use strict";

import http from "./http";

export default {
    getAll: () => http.get("/api/v1/drafts"),
    close: (draftId) => http.post(`/api/v1/draft/${draftId}/close`),
}
