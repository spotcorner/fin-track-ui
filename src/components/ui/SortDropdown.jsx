"use strict";

import React from "react";
import "@styles/sortDropdown.scss";
import PreferenceStore from "@utils/PreferenceStore";

class SortDropdown extends React.Component {

    sortPref = this.props.prefStoreKey ? new PreferenceStore(this.props.prefStoreKey, this.props.selected) : null;

    state = { open: false };

    componentDidMount() {
        document.addEventListener("mousedown", this.handleClickOutside);
        if (this.sortPref) {
            const pref = this.sortPref.getMap();
            if (pref && this.props.options.some(o => o.field === pref.field)) {
                this.props.onChange(pref.field, pref.direction);
            }
        }
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
        if (this.sortPref) {
            this.sortPref.set({ field, direction });
        }
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
            <button className="btn btn-sm btn-outline-secondary text-nowrap" onClick={() => this.setState({ open: !open })}>
                {this.getLabel()}
            </button>
            {open && <div className="sort-dropdown-menu">
                {options.map(opt => {
                    const active = selected.field === opt.field;
                    return <div key={opt.field} className={"sort-dropdown-item" + (active ? " active" : "")}>
                        <span className="sort-dropdown-label" onClick={() => this.select(opt.field, selected.field === opt.field && selected.direction === "asc" ? "desc" : "asc")}>{opt.label}</span>
                        <span className="sort-dropdown-arrows">
                            <i className={"bi bi-arrow-up" + (active && selected.direction === "asc" ? " sort-active" : "")} onClick={() => this.select(opt.field, "asc")}></i>
                            <i className={"bi bi-arrow-down" + (active && selected.direction === "desc" ? " sort-active" : "")} onClick={() => this.select(opt.field, "desc")}></i>
                        </span>
                    </div>;
                })}
            </div>}
        </div>;
    }
}

export default SortDropdown;
