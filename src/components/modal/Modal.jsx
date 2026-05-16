"use strict";

import React from "react";
import { CSSTransition } from "react-transition-group";

export default class Modal extends React.Component {

    getModalTitle() {
        return <h5 className="modal-title">{this.props.title}</h5>;
    }

    getCloseButton() {
        return <button type="button" className="btn-close" onClick={this.props.onClose}></button>;
    }

    getModalHeader() {
        return (
            <div className="modal-header">
                {this.getModalTitle()}
                {this.getCloseButton()}
            </div>
        );
    }

    getModalBody() {
        const { body } = this.props;
        return body && <div className="modal-body">{body}</div>;
    }

    getCancelButton() {
        return <button type="button" className="btn btn-outline-secondary" onClick={this.props.onClose}>Cancel</button>;
    }

    getSubmitButton() {
        return this.props.onSubmitClick && <button type="submit" className="btn btn-outline-dark" disabled={this.props.submitDisabled} onClick={this.props.onSubmitClick}>{this.props.submitLabel || "Submit"}</button>;
    }

    getModalFooter() {
        return (
            <div className="modal-footer">
                {this.getCancelButton()}
                {this.getSubmitButton()}
            </div>
        );
    }

    render() {
        return (
            <CSSTransition in={this.props.show} timeout={490} classNames="modal-container" unmountOnExit>
                <div>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                {this.getModalHeader()}
                                {this.getModalBody()}
                                {this.getModalFooter()}
                            </div>
                        </div>
                    </div>
                </div>
            </CSSTransition>
        );
    }
}
