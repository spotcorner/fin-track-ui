"use strict";

import React from "react";
import { DATE_PRESETS, getDateRange, shiftDateRange } from "@utils/datePresetUtil";

export default class DateFilter extends React.Component {

    onPresetChange = (e) => {
        const preset = e.target.value;
        const range = getDateRange(preset, this.props.startDate);
        if (range) {
            this.props.onChange(range.start, range.end, preset);
        } else {
            this.props.onChange(this.props.startDate, this.props.endDate, preset);
        }
    }

    onDateChange = (e) => {
        const { name, value } = e.target;
        const start = name === "startDate" ? value : this.props.startDate;
        const end = name === "endDate" ? value : this.props.endDate;
        this.props.onChange(start, end, "custom");
    }

    onShift = (direction) => {
        const { start, end, preset } = shiftDateRange(this.props.startDate, this.props.endDate, direction, this.props.preset);
        this.props.onChange(start, end, preset);
    }

    render() {
        const { startDate, endDate, preset } = this.props;
        const canShift = startDate && endDate;

        return <div className="row g-1">
            <div className="col-12 col-md-3">
                <select className="form-select form-select-sm" value={preset || "custom"} onChange={this.onPresetChange}>
                    <optgroup label="Quick">
                        {DATE_PRESETS.filter(p => p.group === "quick").map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </optgroup>
                    <optgroup label="Window">
                        {DATE_PRESETS.filter(p => p.group === "window").map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </optgroup>
                    {DATE_PRESETS.filter(p => p.group === "other").map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    {preset === "_fyYearly" && <option value="_fyYearly" hidden>Financial Year</option>}
                </select>
            </div>
            <div className="col-12 col-md-9">
                <div className="input-group input-group-sm">
                    <button className="btn btn-outline-secondary" type="button" disabled={!canShift}
                        onClick={() => this.onShift("prev")}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <input type="date" className="form-control"
                        name="startDate" value={startDate} onChange={this.onDateChange} />
                    <span className="input-group-text">to</span>
                    <input type="date" className="form-control"
                        name="endDate" value={endDate} onChange={this.onDateChange} />
                    <button className="btn btn-outline-secondary" type="button" disabled={!canShift}
                        onClick={() => this.onShift("next")}>
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>;
    }
}
