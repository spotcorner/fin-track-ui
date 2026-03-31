"use strict";

import axios from "axios";

async function request(path, method, data = {}, headers) {
    const config = {
        url: path,
        method,
        ...data,
    };
    if (headers) {
        config.headers = headers;
    }
    const response = await axios(config);
    return response.data;
}

export default {
    get: (path, params) => request(path, "GET", { params }),
    post: (path, data, headers) => request(path, "POST", { data }, headers),
    patch: (path, data) => request(path, "PATCH", { data }),
    delete: (path) => request(path, "DELETE"),
};