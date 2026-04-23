"use strict";

import React from "react";
import {
    TYPE_OPTIONS, MAPPER_REGISTRY,
    getTargets, getUniqueSuffixes, isMappingComplete,
    noDateCount, getVisibleColumns, getFilteredTransactions,
} from "@utils/columnMappingUtil";

class ColumnMappingTable extends React.Component {
    constructor(props) {
        super(props);
        const m = props.initialMapping || {};
        this.state = {
            columnMapping: m.columnMapping || {},
            suffixMapping: m.suffixMapping || {},
            descKeywords: m.descKeywords || {},
            inferFirstTxn: m.inferFirstTxn || null,
            manualDates: m.manualDates || {},
            excludedRows: m.excludedRows || {},
            showNoDateRows: m.showNoDateRows !== undefined ? m.showNoDateRows : true,
            showPageNumbers: m.showPageNumbers || false,
            showExclude: m.showExclude || false,
        };
    }

    notifyMapping(update) {
        this.setState(update, () => {
            if (!this.props.onMappingChange) return;
            const { columnMapping, suffixMapping, descKeywords, inferFirstTxn, manualDates, excludedRows, showNoDateRows, showPageNumbers, showExclude } = this.state;
            this.props.onMappingChange({
                columnMapping, suffixMapping, descKeywords, inferFirstTxn, manualDates, excludedRows, showNoDateRows, showPageNumbers, showExclude,
                isComplete: isMappingComplete(this.state, this.props.columns, this.props.transactions),
            });
        });
    }

    setColumnMapping = (col, target) => {
        this.notifyMapping({ columnMapping: { ...this.state.columnMapping, [col]: target || "" } });
    };

    setSuffixMapping = (col, suffix, type) => {
        this.notifyMapping({ suffixMapping: { ...this.state.suffixMapping, [`${col}:${suffix}`]: type } });
    };

    getCell(txn, col) {
        const val = txn[col];
        if (!Array.isArray(val)) return val || "";
        return val.map((part, i) => <span key={i}>{i > 0 && <i className="bi bi-arrow-return-left text-muted mx-1"></i>}{part}</span>);
    }

    renderFilterBar() {
        if (!this.props.editable) return null;
        const count = noDateCount(this.props.transactions, this.props.columns);
        return <div className="d-flex align-items-center gap-3 mb-1 px-1 flex-wrap">
            {count > 0 && <label className="form-check-label small text-muted">
                <input type="checkbox" className="form-check-input me-1"
                    checked={this.state.showNoDateRows}
                    onChange={() => this.notifyMapping({ showNoDateRows: !this.state.showNoDateRows })} />
                Show transactions without date ({count})
            </label>}
            {this.props.columns.includes("page") && <label className="form-check-label small text-muted">
                <input type="checkbox" className="form-check-input me-1"
                    checked={this.state.showPageNumbers}
                    onChange={() => this.notifyMapping({ showPageNumbers: !this.state.showPageNumbers })} />
                Show page numbers
            </label>}
            <label className="form-check-label small text-muted">
                <input type="checkbox" className="form-check-input me-1"
                    checked={this.state.showExclude}
                    onChange={() => this.notifyMapping({ showExclude: !this.state.showExclude })} />
                Exclude rows{Object.keys(this.state.excludedRows).length > 0 && ` (${Object.keys(this.state.excludedRows).length})`}
            </label>
        </div>;
    }

    getAvailableTargets(col) {
        const targets = getTargets(col);
        if (!targets) return null;
        const currentTarget = this.state.columnMapping[col];
        const usedTargets = new Set(
            Object.entries(this.state.columnMapping)
                .filter(([k, v]) => k !== col && v)
                .map(([, v]) => v)
        );
        return targets.filter(t => !t.value || t.value === "ignore" || t.value === currentTarget || !usedTargets.has(t.value));
    }

    isColumnComplete(col) {
        if (!getTargets(col)) return true;
        const target = this.state.columnMapping[col];
        if (!target) return false;
        if (target === "ignore") return true;
        const mapper = MAPPER_REGISTRY[target];
        if (!mapper) return true;
        return mapper.isComplete(this.state, col, Object.values(this.state.columnMapping), this.props.transactions);
    }

    renderHeaderCell(col) {
        const targets = this.getAvailableTargets(col);
        if (!this.props.editable || !targets) return <th key={col}>{col}</th>;
        const target = this.state.columnMapping[col];
        const complete = this.isColumnComplete(col);
        return <th key={col} className={complete ? "" : "table-warning"}>
            <select className="form-select form-select-sm" value={target || ""}
                onChange={(e) => this.setColumnMapping(col, e.target.value)}>
                <option value="">{col}</option>
                {targets.filter(t => t.value).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
        </th>;
    }

    renderSuffixConfig(col) {
        const { suffixMapping } = this.state;
        const suffixes = getUniqueSuffixes(this.props.transactions, col);
        return <div key={col} className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted" style={{ fontSize: "0.7rem" }}>Suffix:</span>
            {suffixes.map(s => {
                const key = `${col}:${s}`;
                return <div key={key} className="d-flex align-items-center gap-1">
                    <span className="text-muted" style={{ fontSize: "0.7rem" }}>{s || "(no suffix)"}</span>
                    <select className="form-select form-select-sm" style={{ fontSize: "0.75rem", width: "auto" }}
                        value={suffixMapping[key] || ""}
                        onChange={(e) => this.setSuffixMapping(col, s, e.target.value)}>
                        <option value="">—</option>
                        {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>;
            })}
        </div>;
    }

    renderKeywordConfig(col) {
        const kw = this.state.descKeywords[col] || {};
        const setKeyword = (type, val) => this.notifyMapping({
            descKeywords: { ...this.state.descKeywords, [col]: { ...kw, [type]: val } },
        });
        return <div key={col} className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted" style={{ fontSize: "0.7rem" }}>Keyword:</span>
            {TYPE_OPTIONS.map(t => <div key={t.value} className="d-flex align-items-center gap-1">
                <span className="text-muted" style={{ fontSize: "0.7rem" }}>{t.label}</span>
                <input type="text" className="form-control form-control-sm" style={{ fontSize: "0.75rem", width: "80px" }}
                    placeholder="keyword" value={kw[t.value] || ""}
                    onChange={(e) => setKeyword(t.value, e.target.value)} />
            </div>)}
        </div>;
    }

    renderConfigBar(columns) {
        if (!this.props.editable) return null;
        const { columnMapping } = this.state;
        const configs = [];
        for (const col of columns) {
            const target = columnMapping[col];
            if (target === "use_suffix") configs.push(this.renderSuffixConfig(col));
            if (target === "use_desc_keyword") configs.push(this.renderKeywordConfig(col));
        }
        if (configs.length === 0) return null;
        return <tr>
            <td colSpan={columns.length + (this.state.showExclude ? 1 : 0)} className="bg-light">
                <div className="d-flex flex-column gap-1 py-1 px-2 align-items-end">{configs}</div>
            </td>
        </tr>;
    }

    renderBodyCell(txn, col, rowIdx, txnIdx) {
        if (!this.props.editable) return <td key={col}>{this.getCell(txn, col)}</td>;
        const target = this.state.columnMapping[col];
        if (target === "date" && !txn[col]) {
            return <td key={col}>
                <input type="date" className="form-control form-control-sm" style={{ fontSize: "0.75rem" }}
                    value={this.state.manualDates[txnIdx] || ""}
                    onChange={(e) => this.notifyMapping({ manualDates: { ...this.state.manualDates, [txnIdx]: e.target.value } })} />
            </td>;
        }
        if (rowIdx === 0 && target === "infer_from_balance") {
            return <td key={col} className={this.state.inferFirstTxn ? "" : "table-warning"}>
                <div className="d-flex align-items-center gap-1">
                    <span>{this.getCell(txn, col)}</span>
                    <select className="form-select form-select-sm ms-auto" style={{ fontSize: "0.75rem", width: "auto" }}
                        value={this.state.inferFirstTxn || ""}
                        onChange={(e) => this.notifyMapping({ inferFirstTxn: e.target.value || null })}>
                        <option value="">Type?</option>
                        {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </td>;
        }
        return <td key={col}>{this.getCell(txn, col)}</td>;
    }

    renderRow(txn, i, columns, dateCol) {
        const txnIdx = this.props.transactions.indexOf(txn);
        const excluded = this.state.excludedRows[txnIdx];
        const noDate = dateCol && !txn[dateCol] && !this.state.manualDates[txnIdx];
        let className = "";
        if (excluded) className = "text-decoration-line-through text-muted";
        else if (noDate) className = "table-warning";
        return <tr key={i} className={className}>
            {this.state.showExclude && <td>
                <input type="checkbox" className="form-check-input"
                    checked={!!excluded}
                    onChange={() => {
                        const excludedRows = { ...this.state.excludedRows };
                        if (excluded) delete excludedRows[txnIdx]; else excludedRows[txnIdx] = true;
                        this.notifyMapping({ excludedRows });
                    }} />
            </td>}
            {columns.map(col => this.renderBodyCell(txn, col, i, txnIdx))}
        </tr>;
    }

    render() {
        const columns = getVisibleColumns(this.props.columns, this.state.showPageNumbers);
        const transactions = getFilteredTransactions(this.props.transactions, this.props.columns, this.state.showNoDateRows);
        const dateCol = Object.keys(this.state.columnMapping).find(k => this.state.columnMapping[k] === "date");
        return <div>
            {this.renderFilterBar()}
            <div style={{ overflowX: "auto" }}>
                <table className="table table-sm table-striped table-bordered small mb-2">
                    <thead>
                        <tr>
                            {this.state.showExclude && <th style={{ width: "1%" }}></th>}
                            {columns.map(col => this.renderHeaderCell(col))}
                        </tr>
                        {this.renderConfigBar(columns)}
                    </thead>
                    <tbody>
                        {transactions.map((txn, i) => this.renderRow(txn, i, columns, dateCol))}
                    </tbody>
                </table>
            </div>
        </div>;
    }
}

export default ColumnMappingTable;
