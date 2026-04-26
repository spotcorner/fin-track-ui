"use strict";

import React, { Suspense, lazy } from "react";
import uiUtil from "@utils/uiUtil";

export default class LazyLoad extends React.Component {

    constructor(props) {
        super(props);
        this.LazyComponent = lazy(props.component);
    }

    render() {
        const { LazyComponent } = this;
        return <Suspense fallback={uiUtil.spinnerLoader("text-primary")}>
            <LazyComponent {...this.props}/>
        </Suspense>;
    }
}
