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

    getContent() {
        const { items, text, map, content } = this.props;
        if (content) return content;
        if (text) return <div>{text}</div>;
        let list = items;
        if (map) {
            list = [];
            Object.values(map).forEach(v => Array.isArray(v) ? list.push(...v) : list.push(v));
        }
        if (list) return <ul className="mb-0 ps-3">{list.map((item, i) => <li key={i}>{item}</li>)}</ul>;
        return null;
    }

    render() {
        const { open } = this.state;
        return <div className="help-tip" ref={el => this.ref = el}>
            <i className="bi bi-info-circle help-tip-icon cursor-pointer"
                onClick={() => this.setState({ open: !open })}></i>
            {open && <div className="help-tip-content">{this.getContent()}</div>}
        </div>;
    }
}
