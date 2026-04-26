import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import accountService from "@services/accountService";
import tagService from "@services/tagService";
import accessService from "@services/accessService";

let info = null;
try {
    info = document.querySelector("meta[name='user-info']").content;
    info = JSON.parse(info);
} catch (e) {
    console.log("info::", info);
    info = null;
    console.log("ERR::onParseUser", e);
}

const initialState = {
    info,
    receivedAccessList: [],
    viewAsUserId: localStorage.getItem("viewAsUserId") || null,
    loadingAccounts: false,
    loadingTags: false,
    accounts: [],
    tags: [],
    accountsMap: {},
    tagsMap: {},
    statsGroupByPeriod: "weekly",
}

export const fetchAccountsRequest = createAsyncThunk(
    "user/fetchAccountsRequest",
    async () => {
        return await accountService.getAll();
    }
);

export const fetchTagsRequest = createAsyncThunk(
    "user/fetchTagsRequest",
    async () => {
        return await tagService.getAll();
    }
);

export const fetchReceivedAccessRequest = createAsyncThunk(
    "user/fetchReceivedAccessRequest",
    async () => {
        return await accessService.getReceived();
    }
);

export const upsertAccountRequest = createAsyncThunk(
    "user/upsertAccountRequest",
    async (account) => {
        return await accountService.upsert(account);
    }
);

export const upsertTagRequest = createAsyncThunk(
    "user/upsertTagRequest",
    async (tag) => {
        return await tagService.upsert(tag);
    }
);

export const switchViewAs = createAsyncThunk(
    "user/switchViewAs",
    async (userId, { dispatch }) => {
        dispatch(setViewAsUserId(userId));
        dispatch(fetchAccountsRequest());
        dispatch(fetchTagsRequest());
    }
);

export const updateNicknameForOwnerRequest = createAsyncThunk(
    "user/updateNicknameForOwner",
    async ({ _id, nickname }) => {
        return await accessService.update(_id, { nickname });
    }
);

export const deleteAccountRequest = createAsyncThunk(
    "user/deleteAccountRequest",
    async (_id) => {
        return await accountService.delete(_id);
    }
);

export const deleteTagRequest = createAsyncThunk(
    "user/deleteTagRequest",
    async (_id) => {
        return await tagService.delete(_id);
    }
);

const reducers = {
    setUserDetails: (user, action) => {
        user.info = action.payload;
        user.viewAsUserId = null;
        localStorage.removeItem("viewAsUserId");
    },
    setStatsGroupByPeriod: (user, action) => {
        user.statsGroupByPeriod = action.payload;
    },
    setViewAsUserId: (user, action) => {
        user.viewAsUserId = action.payload;
        if (action.payload) localStorage.setItem("viewAsUserId", action.payload);
        else localStorage.removeItem("viewAsUserId");
    },
    upsertAccount: (user, action) => {
        const { account } = action.payload;
        const index = _.findIndex(user.accounts, a => a._id == account._id);
        if (index >= 0) {
            user.accounts[index] = account;
        } else {
            user.accounts.push(account);
        }
        user.accountsMap[account._id] = account;
    },
    upsertTag: (user, action) => {
        const { tag } = action.payload;
        const index = _.findIndex(user.tags, a => a._id == tag._id);
        if (index >= 0) {
            user.tags[index] = tag;
        } else {
            user.tags.push(tag);
        }
        user.tagsMap[tag._id] = tag;
    },
    deleteAccount: (user, action) => {
        const index = _.findIndex(user.accounts, a => a._id == action.payload._id);
        user.accounts.splice(index, 1);
    },
    deleteTag: (user, action) => {
        const index = _.findIndex(user.tags, a => a._id == action.payload._id);
        user.tags.splice(index, 1);
    },
    updateAccounts: (user, action) => {
        user.accounts = action.payload.accounts;
        user.accountsMap = _.keyBy(user.accounts, "_id");
        user.loadingAccounts = false;
    },
    updateTags: (user, action) => {
        user.tags = action.payload.tags;
        user.tagsMap = _.keyBy(user.tags, "_id");
        user.loadingTags = false;
    },
    updateReceivedAccess: (user, action) => {
        user.receivedAccessList = action.payload.access;
    },
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: { ...reducers },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAccountsRequest.pending, (user) => {
                user.loadingAccounts = true;
            })
            .addCase(fetchTagsRequest.pending, (user) => {
                user.loadingTags = true;
            })
            .addCase(fetchAccountsRequest.fulfilled, reducers.updateAccounts)
            .addCase(fetchTagsRequest.fulfilled, reducers.updateTags)
            .addCase(fetchReceivedAccessRequest.fulfilled, reducers.updateReceivedAccess)
            .addCase(fetchReceivedAccessRequest.rejected, (user) => {
                user.receivedAccessList = [];
            })
            .addCase(fetchAccountsRequest.rejected, (user) => {
                user.accounts = [];
                user.accountsMap = {};
                user.loadingAccounts = false;
            })
            .addCase(fetchTagsRequest.rejected, (user) => {
                user.tags = [];
                user.tagsMap = {};
                user.loadingTags = false;
            })
            .addCase(upsertAccountRequest.fulfilled, reducers.upsertAccount)
            .addCase(upsertTagRequest.fulfilled, reducers.upsertTag)
            .addCase(deleteAccountRequest.fulfilled, reducers.deleteAccount)
            .addCase(deleteTagRequest.fulfilled, reducers.deleteTag)
            .addCase(updateNicknameForOwnerRequest.fulfilled, (user, action) => {
                const { _id, nicknameForOwner } = action.payload;
                const item = user.receivedAccessList.find(a => a._id === _id);
                if (item) item.nicknameForOwner = nicknameForOwner;
            });
    }
});

const { setViewAsUserId } = userSlice.actions;

export const {
    setUserDetails,
    setStatsGroupByPeriod,
} = userSlice.actions;

export default userSlice.reducer;