"use strict";

import React from "react";
import { connect } from "react-redux";
import userService from "@services/userService";
import { setUserDetails } from "@store";

class Profile extends React.Component {
    handleLogout = () => {
        userService.logout().then(data => {
            if (data.success) {
                this.props.dispatch(setUserDetails({}));
            } else {
                console.error("Logout failed:", data.error);
            }
        });
    }
    getFamily() {
        const family = this.props.userInfo.family;
        if (_.isEmpty(family)) return;
        return <div className="row mt-3">
            {Object.entries(family || {}).map(([id, member]) => (
                <div key={id} className="col-md-4 col-sm-6 col-12 mb-3">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title">{member.name}</h5>
                            <p className="card-text">
                                <strong>Relation:</strong> {member.relation}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
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
                {this.getFamily()}
            </div>
        );
    }
}

export default connect(state => ({ userInfo: state.user.info }))(Profile);