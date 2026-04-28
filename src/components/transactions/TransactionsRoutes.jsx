"use strict";

import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import LazyLoad from "@components/lazy-load/LazyLoad.jsx";

const cashflowProps = {
    isDraft: 0,
    title: "Cashflow",
    sortByDate: 1,
    basePath: "/cashflow",
};

const cashflowComponent = () => import("./TransactionsLayout.jsx");
const draftsComponent = () => import("./DraftsLayout.jsx");

const routes = [
    { path: '/cashflow', component: cashflowComponent, props: { ...cashflowProps, tab: "stats" } },
    { path: '/cashflow/summary', component: cashflowComponent, props: { ...cashflowProps, tab: "summary" } },
    { path: '/cashflow/transactions', component: cashflowComponent, props: { ...cashflowProps, tab: "transactions" } },
    { path: '/drafts', component: draftsComponent, props: { tab: "stats" } },
    { path: '/drafts/summary', component: draftsComponent, props: { tab: "summary" } },
    { path: '/drafts/transactions', component: draftsComponent, props: { tab: "transactions" } },
    { path: '/upload-statement', component: () => import('./UploadView.jsx') },
];

function getRoute(route, key) {
    return <Route key={key} exact path={route.path}
        render={() => <LazyLoad component={route.component} {...route.props} />} />;
}

export default function getRoutes() {
    return <Switch>
        {routes.map(getRoute)}
        <Redirect from="/" to="/cashflow" />
    </Switch>;
}
