"use strict";

import React from "react";
import { connect } from "react-redux";
import Modal from "@modal/Modal.jsx";
import CrudRuleModal from "@components/rules/CrudRuleModal.jsx";

const CREATE_NEW = "__CREATE_NEW__";

class AddKeywordToRuleModal extends React.Component {
    state = { selectedRuleId: "" };

    componentDidUpdate(prevProps) {
        if (prevProps.transaction !== this.props.transaction) {
            this.setState({ selectedRuleId: "" });
        }
    }

    handleSelect = (e) => {
        this.setState({ selectedRuleId: e.target.value });
    };

    getRule() {
        const { selectedRuleId } = this.state;
        const description = this.props.transaction?.description || "";
        const newKeyword = description ? { value: description, caseSensitive: false } : null;

        if (selectedRuleId === CREATE_NEW) {
            return { keywords: newKeyword ? [newKeyword] : [] };
        }

        const rule = _.find(this.props.rules, r => r._id === selectedRuleId);
        if (!rule) return null;
        return { ...rule, keywords: [...rule.keywords, ...(newKeyword ? [newKeyword] : [])] };
    }

    render() {
        if (!this.props.show) return null;
        const { selectedRuleId } = this.state;

        if (selectedRuleId) {
            return <CrudRuleModal show={true} rule={this.getRule()}
                onSave={this.props.onClose} onClose={() => this.setState({ selectedRuleId: "" })} />;
        }

        const body = (
            <div>
                <label className="form-label">Select a rule or create new</label>
                <select className="form-select" value="" onChange={this.handleSelect}>
                    <option value="">Select a rule</option>
                    {this.props.rules.map(rule => (
                        <option key={rule._id} value={rule._id}>{rule.tag}</option>
                    ))}
                    <option value={CREATE_NEW}>+ Create New Rule</option>
                </select>
            </div>
        );

        return <Modal show={true} title="Tag Transaction" body={body} onClose={this.props.onClose} />;
    }
}

export default connect(state => _.pick(state.user, ["rules"]))(AddKeywordToRuleModal);
