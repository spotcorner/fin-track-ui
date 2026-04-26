"use strict";

import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { fetchAccountsRequest, fetchTagsRequest, fetchReceivedAccessRequest, switchViewAs } from "@store";

class HomeLayout extends React.Component {

    getProfileLink() {
        return <Link to="/profile" className="nav-link">
            <img src={this.props.userInfo.picture} className="rounded-circle border" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
        </Link>;
    }

    getActiveStatus(to) {
        return this.props.location.pathname.startsWith(to) ? "active" : "";
    }

    getNavLink(to, content, basePath) {
        return <Link to={to} className={"nav-link " + this.getActiveStatus(basePath || to)}>{content}</Link>;
    }

    getViewAsDropdown() {
        const { receivedAccessList, viewAsUserId } = this.props;
        if (!receivedAccessList || receivedAccessList.length === 0) return null;
        return <select className="form-select form-select-sm bg-dark text-light border-secondary ms-2"
            style={{ width: "auto" }}
            value={viewAsUserId || ""}
            onChange={(e) => this.props.dispatch(switchViewAs(e.target.value || null))}>
            <option value="">My Data</option>
            {receivedAccessList.map(a => <option key={a.ownerId} value={a.ownerId}>{a.nicknameForOwner || a.user?.email}</option>)}
        </select>;
    }

    render() {
        const { LayoutBody } = this.props;
        return <div>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container-fluid">
                    <div className="navbar-brand">Finance Tracker</div>
                    <button className="navbar-toggler ms-2" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                {this.getNavLink("/cashflow/stats", "Cashflow", "/cashflow")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/drafts/stats", "Drafts", "/drafts")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/upload-statement", "Upload Statement")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/accounts", "Accounts")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/tags", "Tags")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/how-to-use", "Help")}
                            </li>
                            <li className="nav-item d-lg-none">
                                {this.getViewAsDropdown()}
                            </li>
                            <li className="nav-item d-lg-none">
                                {this.getProfileLink()}
                            </li>
                        </ul>
                    </div>
                    <div className="ms-3 d-none d-lg-flex align-items-center gap-2">
                        {this.getViewAsDropdown()}
                        {this.getProfileLink()}
                    </div>
                </div>
            </nav>
            <div className="container-fluid mt-3" key={this.props.viewAsUserId || "self"}>
                {LayoutBody}
            </div>
        </div>
    }

    componentDidMount() {
        this.props.dispatch(fetchAccountsRequest());
        this.props.dispatch(fetchTagsRequest());
        this.props.dispatch(fetchReceivedAccessRequest());
    }
}

export default withRouter(connect(state => ({ userInfo: state.user.info, receivedAccessList: state.user.receivedAccessList, viewAsUserId: state.user.viewAsUserId }))(HomeLayout));
