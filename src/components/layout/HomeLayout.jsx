"use strict";

import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { fetchAccountsRequest, fetchTagsRequest } from "@store";

class HomeLayout extends React.Component {

    getProfileLink() {
        return <Link to="/profile" className="nav-link">
            <img src={this.props.userInfo.picture} className="rounded-circle border" style={{ width: "50px", height: "50px", objectFit: "cover" }} />
        </Link>;
    }

    getActiveStatus(to) {
        return this.props.location.pathname == to ? "active" : "";
    }

    getNavLink(to, content) {
        return <Link to={to} className={"nav-link " + this.getActiveStatus(to)}>{content}</Link>;
    }

    getDropdownItem(to, content) {
        return <Link to={to} className={"dropdown-item"}>{content}</Link>;
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
                                {this.getNavLink("/", "Cashflow")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/transactions/drafts", "Drafts")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/transactions/upload-statement", "Upload Statement")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/accounts", "Accounts")}
                            </li>
                            <li className="nav-item">
                                {this.getNavLink("/tags", "Tags")}
                            </li>
                            <li className="nav-item d-lg-none">
                                {this.getProfileLink()}
                            </li>
                        </ul>
                    </div>
                    <div className="ms-3 d-none d-lg-block">
                        {this.getProfileLink()}
                    </div>
                </div>
            </nav>
            <div className="container-fluid mt-3">
                {LayoutBody}
            </div>
        </div>
    }

    componentDidMount() {
        this.props.dispatch(fetchAccountsRequest());
        this.props.dispatch(fetchTagsRequest());
    }
}

export default withRouter(connect(state => ({ userInfo: state.user.info }))(HomeLayout));
