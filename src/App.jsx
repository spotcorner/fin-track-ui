"use strict";

import React from "react";
import { useSelector } from "react-redux";
import { Switch, Route, Redirect } from "react-router-dom";
import LazyLoad from "@components/lazy-load/LazyLoad.jsx";
import HomeLayout from "@components/layout/HomeLayout.jsx";

const cashflowComponent = () => import("@components/transactions/TransactionsLayout.jsx");
const draftsComponent = () => import("@components/transactions/DraftsLayout.jsx");
const cashflowProps = { isDraft: 0, title: "Cashflow", sortByDate: 1, basePath: "/cashflow" };

const routes = [
    { path: '/', component: () => import('@components/home/Home.jsx') },
    { path: '/cashflow', component: cashflowComponent, props: { ...cashflowProps, tab: "stats" } },
    { path: '/cashflow/summary', component: cashflowComponent, props: { ...cashflowProps, tab: "summary" } },
    { path: '/cashflow/transactions', component: cashflowComponent, props: { ...cashflowProps, tab: "transactions" } },
    { path: '/drafts', component: draftsComponent, props: { tab: "stats" } },
    { path: '/drafts/summary', component: draftsComponent, props: { tab: "summary" } },
    { path: '/drafts/transactions', component: draftsComponent, props: { tab: "transactions" } },
    { path: '/upload-statement', component: () => import('@components/transactions/UploadView.jsx') },
    { path: '/accounts', component: () => import('@components/accounts/Accounts.jsx') },
    { path: '/tags', component: () => import('@components/tags/Tags.jsx') },
    { path: '/profile', component: () => import('@components/profile/Profile.jsx') },
    { path: '/how-to-use', component: () => import('@components/help/HowToUse.jsx') },
];

function getRoutes() {
    return <Switch>
        {routes.map((route, i) => <Route key={i} exact path={route.path}
            render={() => <LazyLoad component={route.component} {...route.props} />} />)}
        <Redirect to="/" />
    </Switch>;
}

export default function App() {
    const userInfo = useSelector(state => state.user.info);

    if (!userInfo || !userInfo.email) {
        return <LazyLoad component={() => import('@components/login/Login.jsx')} />;
    }

    return <HomeLayout LayoutBody={getRoutes()} />;
}
