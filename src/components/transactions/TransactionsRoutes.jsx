"use strict";

import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import LazyLoad from "@components/lazy-load/LazyLoad.jsx";

const routes = [
    {
        path: '/cashflow',
        component: () => import("./TransactionsLayout.jsx"),
        props: {
            isDraft: 0,
            title: "Cashflow",
            startDateFilter: moment().startOf("year").format("YYYY-MM-DD"),
            endDateFilter: moment().format("YYYY-MM-DD"),
            sortByDate: 1,
            basePath: "/cashflow"
        },
        exact: false,
    },
    {
        path: '/drafts',
        component: () => import('./DraftsLayout.jsx'),
        exact: false,
    },
    {
        path: '/upload-statement',
        component: () => import('./UploadView.jsx')
    },
];

function getRoute(route, key) {
    return <Route key={key} exact={route.exact !== false} path={route.path} component={() => <LazyLoad component={route.component} {...route.props} />} />;
}

export default function getRoutes() {
    return <Switch>
        {routes.map(getRoute)}
        <Redirect exact from="/" to="/cashflow/stats" />
    </Switch>;
}
