"use strict";

import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import userService from "@services/userService";
import accessService from "@services/accessService";
import { setUserDetails, updateNicknameForOwnerRequest } from "@store";
import { toast } from "react-toastify";
import CrudAccessModal from "./CrudAccessModal.jsx";
import Modal from "@components/modal/Modal.jsx";
import HelpTip from "@components/ui/HelpTip.jsx";
import { PROFILE_GRANTED_HELP, PROFILE_RECEIVED_HELP } from "@utils/helpContent";
import PreferenceStore from "@utils/PreferenceStore";
import { getFilterLabels } from "@utils/filterUtil";

class Profile extends React.Component {
    state = {
        granted: [],
        modalData: null,
        deleteId: null,
        storedPrefs: PreferenceStore.getRegistry(),
    }

    handleLogout = () => {
        userService.logout().then(data => {
            if (data.success) {
                this.props.dispatch(setUserDetails({}));
                this.props.history.push("/");
            }
        });
    }

    fetchGranted = () => {
        accessService.getGranted().then(data => {
            this.setState({ granted: data.access || [] });
        });
    }

    openGrantModal = () => {
        this.setState({ modalData: { mode: "grant", onSubmit: this.handleGrant } });
    }

    openEditGrantedModal = (a) => {
        this.setState({ modalData: { mode: "editGranted", _id: a._id, email: a.user.email, accessType: a.accessType, nickname: a.nicknameForMember || "", onSubmit: this.handleEditGranted } });
    }

    openEditReceivedModal = (a) => {
        this.setState({ modalData: { mode: "editReceived", _id: a._id, email: a.user.email, accessType: a.accessType, nickname: a.nicknameForOwner || "", onSubmit: this.handleEditReceived } });
    }

    closeModal = () => {
        this.setState({ modalData: null });
    }

    handleGrant = (formData) => {
        accessService.grant(formData.email, formData.accessType, formData.nickname).then((data) => {
            toast.info("Access granted");
            this.setState(prev => ({ granted: [...prev.granted, data.access] }));
            this.closeModal();
        });
    }

    handleEditGranted = (formData) => {
        const { _id } = this.state.modalData;
        accessService.update(_id, { nickname: formData.nickname, accessType: formData.accessType }).then((data) => {
            toast.info("Access updated");
            this.setState(prev => ({
                granted: prev.granted.map(a => a._id === _id ? { ...a, nicknameForMember: data.nicknameForMember, accessType: data.accessType } : a),
            }));
            this.closeModal();
        });
    }

    handleEditReceived = (formData) => {
        const { _id } = this.state.modalData;
        this.props.dispatch(updateNicknameForOwnerRequest({ _id, nickname: formData.nickname })).unwrap().then(() => {
            toast.info("Nickname updated");
            this.closeModal();
        });
    }

    revokeAccess = () => {
        accessService.revoke(this.state.deleteId).then(() => {
            toast.info("Access revoked");
            this.setState(prev => ({ granted: prev.granted.filter(a => a._id !== prev.deleteId), deleteId: null }));
        });
    }

    refreshPrefs = () => {
        this.setState({ storedPrefs: PreferenceStore.getRegistry() });
    }

    clearPref = (key) => {
        PreferenceStore.clearKey(key);
        this.refreshPrefs();
    }

    clearAllPrefs = () => {
        PreferenceStore.clearAll();
        this.refreshPrefs();
    }

    clearGroupPrefs = (group) => {
        this.state.storedPrefs.filter(p => p.group === group && p.stored).forEach(p => PreferenceStore.clearKey(p.key));
        this.refreshPrefs();
    }

    clearSubgroupPrefs = (group, subgroup) => {
        this.state.storedPrefs.filter(p => p.group === group && p.subgroup === subgroup && p.stored).forEach(p => PreferenceStore.clearKey(p.key));
        this.refreshPrefs();
    }

    togglePref = (key, enabled) => {
        PreferenceStore.setEnabled(key, enabled);
        this.refreshPrefs();
    }

    toggleGroupPrefs = (group, enabled) => {
        this.state.storedPrefs.filter(p => p.group === group).forEach(p => PreferenceStore.setEnabled(p.key, enabled));
        this.refreshPrefs();
    }

    toggleSubgroupPrefs = (group, subgroup, enabled) => {
        this.state.storedPrefs.filter(p => p.group === group && p.subgroup === subgroup).forEach(p => PreferenceStore.setEnabled(p.key, enabled));
        this.refreshPrefs();
    }

    formatPrefValue(entry) {
        if (entry.key.endsWith(".filters")) {
            const labels = getFilterLabels(entry.value, this.props.accountsMap, this.props.tagsMap);
            return labels.length ? labels.join(", ") : "Default";
        }
        return JSON.stringify(entry.value);
    }

    getPreferencesSection() {
        const { storedPrefs } = this.state;
        const grouped = _.groupBy(storedPrefs, "group");
        const hasStored = storedPrefs.some(p => p.stored);
        return <div className="card shadow-sm p-3 mt-3">
            <div className="d-flex align-items-center gap-1 mb-2">
                <h6 className="mb-0">Preferences</h6>
                {hasStored && <button className="btn btn-outline-danger btn-sm ms-auto" onClick={this.clearAllPrefs}>Clear All</button>}
            </div>
            {_.map(grouped, (entries, group) => {
                const groupAllEnabled = entries.every(e => e.enabled);
                const groupHasStored = entries.some(e => e.stored);
                const subgrouped = _.groupBy(entries, e => e.subgroup || "");
                return <div key={group} className="mb-3">
                    <div className="d-flex align-items-center mb-1">
                        <input type="checkbox" className="form-check-input me-2" checked={groupAllEnabled}
                            onChange={() => this.toggleGroupPrefs(group, !groupAllEnabled)} />
                        <div className="fw-bold text-muted">{group}</div>
                        {groupHasStored && <span className="badge badge-outline-danger cursor-pointer ms-auto" onClick={() => this.clearGroupPrefs(group)}><i className="bi bi-trash"></i></span>}
                    </div>
                    {_.map(subgrouped, (subEntries, subgroup) => {
                        const subAllEnabled = subEntries.every(e => e.enabled);
                        const subHasStored = subEntries.some(e => e.stored);
                        return <div key={subgroup} className="ms-3">
                            {subgroup && <div className="d-flex align-items-center mt-1 mb-1">
                                <input type="checkbox" className="form-check-input me-2" checked={subAllEnabled}
                                    onChange={() => this.toggleSubgroupPrefs(group, subgroup, !subAllEnabled)} />
                                <div className="small fw-bold text-muted">{subgroup}</div>
                                {subHasStored && <span className="badge badge-outline-danger cursor-pointer ms-auto" onClick={() => this.clearSubgroupPrefs(group, subgroup)}><i className="bi bi-trash"></i></span>}
                            </div>}
                            {subEntries.map(entry => <div key={entry.key} className="d-flex align-items-center py-1 border-bottom ms-3">
                                <input type="checkbox" className="form-check-input me-2" checked={entry.enabled}
                                    onChange={() => this.togglePref(entry.key, !entry.enabled)} />
                                <div className="small"><i className={"bi " + entry.icon + " me-1"}></i>{entry.label}</div>
                                {entry.stored && <>
                                    <span className="text-muted small text-break ms-2" style={{ fontSize: "0.7rem" }}>{this.formatPrefValue(entry)}</span>
                                    <span className="badge badge-outline-danger cursor-pointer ms-auto" onClick={() => this.clearPref(entry.key)}><i className="bi bi-trash"></i></span>
                                </>}
                            </div>)}
                        </div>;
                    })}
                </div>;
            })}
        </div>;
    }

    getAccessBadge(accessType) {
        switch (accessType) {
            case "full": return <span className="badge bg-success bg-opacity-10 text-success">Full Access</span>;
            case "readonly": return <span className="badge bg-primary bg-opacity-10 text-primary">🔒 Read Only</span>;
            default: return <span className="badge bg-secondary bg-opacity-10 text-secondary">{accessType}</span>;
        }
    }

    getGrantedSection() {
        const { granted } = this.state;
        return <div className="card shadow-sm p-3 mt-3">
            <div className="d-flex align-items-center gap-1 mb-2">
                <h6 className="mb-0">Shared my data with</h6>
                <HelpTip items={PROFILE_GRANTED_HELP} />
                <button className="btn btn-outline-dark btn-sm ms-auto" onClick={this.openGrantModal}>+</button>
            </div>
            {granted.length === 0 && <div className="text-muted small">No access granted yet.</div>}
            {granted.map(a => <div key={a._id} className="d-flex align-items-center justify-content-between py-1 border-bottom">
                <div className="d-flex align-items-center gap-2">
                    <div className="small">{a.user.email}</div>
                    {a.nicknameForMember && <span className="badge bg-dark bg-opacity-10 text-dark">{a.nicknameForMember}</span>}
                </div>
                <div className="d-flex align-items-center gap-2">
                    {this.getAccessBadge(a.accessType)}
                    <span className="badge badge-outline-secondary cursor-pointer" onClick={() => this.openEditGrantedModal(a)}><i className="bi bi-pencil"></i></span>
                    <span className="badge badge-outline-danger cursor-pointer" onClick={() => this.setState({ deleteId: a._id })}><i className="bi bi-trash"></i></span>
                </div>
            </div>)}
        </div>;
    }

    getReceivedSection() {
        const { receivedAccessList } = this.props;
        if (!receivedAccessList || receivedAccessList.length === 0) return null;
        return <div className="card shadow-sm p-3 mt-3">
            <div className="d-flex align-items-center gap-1 mb-2">
                <h6 className="mb-0">Shared with me</h6>
                <HelpTip items={PROFILE_RECEIVED_HELP} />
            </div>
            {receivedAccessList.map((a, i) => <div key={i} className="d-flex align-items-center justify-content-between py-1 border-bottom">
                <div className="d-flex align-items-center gap-2">
                    <div className="small">{a.user.email}</div>
                    {a.nicknameForOwner && <span className="badge bg-dark bg-opacity-10 text-dark">{a.nicknameForOwner}</span>}
                </div>
                <div className="d-flex align-items-center gap-2">
                    {this.getAccessBadge(a.accessType)}
                    <span className="badge badge-outline-secondary cursor-pointer" onClick={() => this.openEditReceivedModal(a)}><i className="bi bi-pencil"></i></span>
                </div>
            </div>)}
        </div>;
    }

    render() {
        const userInfo = this.props.userInfo;
        return (
            <div className="">
                <div className="card shadow-sm p-4">
                    <div className="d-flex flex-column flex-sm-row align-items-center">
                        <img src={userInfo.picture} className="rounded-circle border" style={{ width: "100px", height: "100px", objectFit: "cover" }} />
                        <div className="ms-sm-3 text-center text-sm-start mt-3 mt-sm-0 w-100">
                            <h3 className="mb-1">{userInfo.name}</h3>
                            <p className="text-muted mb-0 text-break">{userInfo.email}</p>
                            <p className="text-muted mb-0 text-break">Member since {moment(userInfo.createdAt).format("MMMM D, YYYY")}</p>
                        </div>
                    </div>
                    <div className="mt-3 d-flex justify-content-center">
                        <button className="btn btn-outline-danger" onClick={this.handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
                {this.getGrantedSection()}
                {this.getReceivedSection()}
                {this.getPreferencesSection()}
                <CrudAccessModal show={!!this.state.modalData} mode={this.state.modalData?.mode}
                    data={this.state.modalData}
                    onSubmit={this.state.modalData?.onSubmit}
                    onClose={this.closeModal} />
                <Modal show={!!this.state.deleteId} title="Revoke Access"
                    body="Are you sure you want to revoke access?"
                    onSubmitClick={this.revokeAccess}
                    onClose={() => this.setState({ deleteId: null })} />
            </div>
        );
    }

    componentDidMount() {
        this.fetchGranted();
    }
}

export default withRouter(connect(state => ({
    userInfo: state.user.info,
    receivedAccessList: state.user.receivedAccessList,
    accountsMap: state.user.accountsMap,
    tagsMap: state.user.tagsMap,
}))(Profile));
