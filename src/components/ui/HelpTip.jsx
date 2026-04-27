"use strict";

import React from "react";
import "@styles/helpTip.scss";

export default class HelpTip extends React.Component {

    state = { open: false };

    componentDidMount() {
        document.addEventListener("mousedown", this.handleClickOutside);
    }

    componentWillUnmount() {
        document.removeEventListener("mousedown", this.handleClickOutside);
    }

    handleClickOutside = (e) => {
        if (this.ref && !this.ref.contains(e.target)) {
            this.setState({ open: false });
        }
    };

    render() {
        const { content } = this.props;
        const { open } = this.state;
        return <div className="help-tip" ref={el => this.ref = el}>
            <i className="bi bi-info-circle help-tip-icon cursor-pointer"
                onClick={() => this.setState({ open: !open })}></i>
            {open && <div className="help-tip-content">{content}</div>}
        </div>;
    }
}
