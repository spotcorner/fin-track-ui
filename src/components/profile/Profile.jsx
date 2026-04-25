"use strict";

import React from "react";
import { connect } from "react-redux";
import userService from "@services/userService";
import accessService from "@services/accessService";
import { setUserDetails, fetchReceivedAccessRequest } from "@store";
import { toast } from "react-toastify";

class Profile extends React.Component {
    state = {
        grantEmail: "",
        granted: [],
    }

    handleLogout = () => {
        userService.logout().then(data => {
            if (data.success) {
                this.props.dispatch(setUserDetails({}));
            }
        });
    }

    fetchGranted = () => {
        accessService.getGranted().then(data => {
            this.setState({ granted: data.access || [] });
        });
    }

    grantAccess = (e) => {
        e.preventDefault();
        accessService.grant(this.state.grantEmail).then(() => {
            toast.info("Access granted");
            this.setState({ grantEmail: "" });
            this.fetchGranted();
        });
    }

    revokeAccess = (_id) => {
        accessService.revoke(_id).then(() => {
            toast.info("Access revoked");
            this.fetchGranted();
            this.props.dispatch(fetchReceivedAccessRequest());
        });
    }

    getGrantedSection() {
        const { granted } = this.state;
        return <div className="card shadow-sm p-3 mt-3">
            <h6>Shared my data with</h6>
            <form className="d-flex gap-2 mb-2" onSubmit={this.grantAccess}>
                <input type="email" className="form-control form-control-sm" placeholder="Enter email to grant access"
                    value={this.state.grantEmail} onChange={(e) => this.setState({ grantEmail: e.target.value })} required />
                <button className="btn btn-outline-dark btn-sm text-nowrap">Grant</button>
            </form>
            {granted.length === 0 && <div className="text-muted small">No access granted yet.</div>}
            {granted.map(a => <div key={a._id} className="d-flex align-items-center justify-content-between py-1 border-bottom">
                <div className="small">{a.user.email}</div>
                <button className="btn btn-outline-danger btn-sm" onClick={() => this.revokeAccess(a._id)}>Revoke</button>
            </div>)}
        </div>;
    }

    getReceivedSection() {
        const { receivedAccessList } = this.props;
        if (!receivedAccessList || receivedAccessList.length === 0) return null;
        return <div className="card shadow-sm p-3 mt-3">
            <h6>Shared with me</h6>
            {receivedAccessList.map((a, i) => <div key={i} className="d-flex align-items-center py-1 border-bottom">
                <div className="small">{a.email}</div>
                <span className="badge bg-secondary bg-opacity-10 text-secondary ms-auto">{a.accessType}</span>
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
            </div>
        );
    }

    componentDidMount() {
        this.fetchGranted();
    }
}

export default connect(state => ({
    userInfo: state.user.info,
    receivedAccessList: state.user.receivedAccessList,
}))(Profile);
