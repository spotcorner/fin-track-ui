"use strict";

import React from "react";
import "@styles/checkDropdown.scss";

class CheckDropdown extends React.Component {

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

    toggle = (value) => {
        const selected = this.props.selected || [];
        const updated = selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value];
        this.props.onChange(updated);
    };

    render() {
        const { label, options, selected = [] } = this.props;
        const { open } = this.state;
        const hasSelection = selected.length > 0;
        const toggleLabel = !hasSelection ? label : selected.length === 1 ? `${label}: ${options.find(o => o.value === selected[0])?.label || selected[0]}` : `${label} (${selected.length})`;
        return <div className="check-dropdown" ref={el => this.ref = el}>
            <div className={"check-dropdown-toggle" + (hasSelection ? " has-selection" : "") + (open ? " open" : "")}
                onClick={() => this.setState({ open: !open })}>
                <span className="text-truncate">{toggleLabel}</span>
                <i className={"bi bi-chevron-" + (open ? "up" : "down")} style={{ fontSize: "0.7rem" }}></i>
            </div>
            {open && <div className="check-dropdown-menu">
                {options.map(opt => <div key={opt.value} className={"check-dropdown-item" + (opt.separator ? " check-dropdown-separator" : "")}
                    onClick={() => this.toggle(opt.value)}>
                    <input type="checkbox" checked={selected.includes(opt.value)} readOnly />
                    {opt.label}
                </div>)}
            </div>}
        </div>;
    }
}

export default CheckDropdown;
