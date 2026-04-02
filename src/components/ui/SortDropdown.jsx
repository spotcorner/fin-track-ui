"use strict";

import React from "react";
import "@styles/sortDropdown.scss";

class SortDropdown extends React.Component {

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

    select = (field, direction) => {
        this.props.onChange(field, direction);
        this.setState({ open: false });
    };

    getLabel() {
        const { options, selected } = this.props;
        const opt = options.find(o => o.field === selected.field);
        return <><i className={"bi bi-arrow-" + (selected.direction === "asc" ? "up" : "down")}></i> {opt?.label || selected.field}</>;
    }

    render() {
        const { options, selected } = this.props;
        const { open } = this.state;
        return <div className="sort-dropdown" ref={el => this.ref = el}>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => this.setState({ open: !open })}>
                {this.getLabel()}
            </button>
            {open && <div className="sort-dropdown-menu">
                {options.map(opt => ["desc", "asc"].map(dir => {
                    const active = selected.field === opt.field && selected.direction === dir;
                    return <div key={opt.field + dir} className={"sort-dropdown-item" + (active ? " active" : "")}
                        onClick={() => this.select(opt.field, dir)}>
                        {opt.label} <i className={"bi bi-arrow-" + (dir === "asc" ? "up" : "down")}></i>
                    </div>;
                }))}
            </div>}
        </div>;
    }
}

export default SortDropdown;
