"use strict";

import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { fetchAccountsRequest, fetchTagsRequest, fetchReceivedAccessRequest, switchViewAs } from "@store";

class HomeLayout extends React.Component {

    getProfileLink() {
        return <Link to="/profile" className="nav-link">
            <img src={this.props.userInfo.picture} className="rounded-circle border" style={{ width: "35px", height: "35px", objectFit: "cover" }} />
        </Link>;
    }

    getActiveStatus(to) {
        if (to === "/") return this.props.location.pathname === "/" ? "active" : "";
        return this.props.location.pathname.startsWith(to) ? "active" : "";
    }

    getNavLink(to, content) {
        return <Link to={to} className={"nav-link " + this.getActiveStatus(to)}>{content}</Link>;
    }

    getViewAsDropdown() {
        const { receivedAccessList, viewAsUserId } = this.props;
        if (!viewAsUserId && (!receivedAccessList || receivedAccessList.length === 0)) return null;
        return <select className="form-select form-select-sm bg-dark text-light border-secondary ms-2"
            style={{ width: "auto", maxWidth: 200 }}
            value={viewAsUserId || ""}
            onChange={(e) => this.props.dispatch(switchViewAs(e.target.value || null))}>
            <option value="">My Data</option>
            {receivedAccessList.map(a => <option key={a.ownerId} value={a.ownerId}>{a.accessType === "readonly" ? "🔒 " : ""}{a.nicknameForOwner || a.user?.email}</option>)}
        </select>;
    }

    render() {
        const { LayoutBody } = this.props;
        return <div>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark p-0">
                <div className="container-fluid">
                    <Link to="/" className="navbar-brand"><img src="/assets/images/favicon.png" alt="" style={{ width: 40, height: 40 }} className="me-1" />fin-track</Link>
                    <button className="navbar-toggler ms-2" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                {this.getNavLink("/", "Home")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/cashflow", "Cashflow")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/drafts", "Drafts")}
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
