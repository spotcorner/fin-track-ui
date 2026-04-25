"use strict";

import axios from "axios";
import { toast } from "react-toastify";
import store from "@store/store";

async function request(path, method, data = {}, headers) {
    const viewAs = store.getState().user.viewAsUserId;
    const config = {
        url: path,
        method,
        ...data,
        headers: {
            ...headers,
            ...(viewAs ? { "X-View-As": viewAs } : {}),
        },
    };
    try {
        const response = await axios(config);
        return response.data;
    } catch (err) {
        const message = err.response?.data?.message || err.message || "Something went wrong";
        toast.error(message);
        throw new Error(message);
    }
}

export default {
    get: (path, params) => request(path, "GET", { params }),
    post: (path, data, headers) => request(path, "POST", { data }, headers),
    patch: (path, data) => request(path, "PATCH", { data }),
    delete: (path) => request(path, "DELETE"),
};
