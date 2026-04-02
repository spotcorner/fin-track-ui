"use strict";

import React from "react";
import "@styles/checkDropdown.scss";

class CheckDropdown extends React.Component {

    state = { open: false, search: "" };

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

    toggleAll = (filteredValues, allSelected) => {
        const selected = this.props.selected || [];
        this.props.onChange(allSelected ? selected.filter(v => !filteredValues.includes(v)) : [...new Set([...selected, ...filteredValues])]);
    };

    render() {
        const { label, options, selected = [], sortByLabel, searchable, inline, pinSelected, countMap } = this.props;
        const { open, search } = this.state;
        const hasSelection = selected.length > 0;
        const toggleLabel = !hasSelection ? label : selected.length === 1 ? `${label}: ${options.find(o => o.value === selected[0])?.label || selected[0]}` : `${label} (${selected.length})`;
        let filtered = options;
        if (sortByLabel) {
            const pinned = options.filter(o => o.separator);
            const rest = _.sortBy(options.filter(o => !o.separator), o => o.label?.toLowerCase());
            filtered = [...pinned, ...rest];
        }
        if (searchable && search) filtered = filtered.filter(o => o.label?.toLowerCase().includes(search.toLowerCase()));
        if (pinSelected) {
            const sel = filtered.filter(o => !o.separator && selected.includes(o.value));
            const unsel = filtered.filter(o => !o.separator && !selected.includes(o.value));
            if (sel.length && unsel.length) sel[sel.length - 1] = { ...sel[sel.length - 1], separator: true };
            filtered = [...filtered.filter(o => o.separator), ...sel, ...unsel];
        }
        return <div className="check-dropdown" ref={el => this.ref = el}>
            <div className={"check-dropdown-toggle" + (hasSelection ? " has-selection" : "") + (open ? " open" : "")}
                onClick={() => this.setState({ open: !open, search: "" })}>
                <span className="text-truncate">{toggleLabel}</span>
                <i className={"bi bi-chevron-" + (open ? "up" : "down")} style={{ fontSize: "0.7rem" }}></i>
            </div>
            {open && <div className={"check-dropdown-menu" + (inline ? " check-dropdown-inline" : "")}>
                {searchable && <input type="text" className="check-dropdown-search" placeholder="Search..."
                    value={search} onChange={e => this.setState({ search: e.target.value })} onClick={e => e.stopPropagation()} />}
                {searchable && (() => {
                    const values = filtered.filter(o => !o.separator).map(o => o.value);
                    const allSelected = values.length > 0 && values.every(v => selected.includes(v));
                    return <div className="check-dropdown-select-all" onClick={() => this.toggleAll(values, allSelected)}>
                        <input type="checkbox" checked={allSelected} readOnly />
                        Select all ({values.length})
                    </div>;
                })()}
                {filtered.map(opt => <div key={opt.value} className={"check-dropdown-item" + (opt.separator ? " check-dropdown-separator" : "")}
                    onClick={() => this.toggle(opt.value)}>
                    <input type="checkbox" checked={selected.includes(opt.value)} readOnly />
                    <span className="check-dropdown-item-label">{opt.label}</span>
                    {countMap && <span className="check-dropdown-count">{countMap[opt.value] || 0}</span>}
                </div>)}
            </div>}
        </div>;
    }
}

export default CheckDropdown;
