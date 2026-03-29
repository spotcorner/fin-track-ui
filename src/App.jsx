"use strict";

import React from "react";
import { useSelector } from "react-redux";
import { Switch, Route, Redirect } from "react-router-dom";
import LazyLoad from "@components/lazy-load/LazyLoad.jsx";
import HomeLayout from "@components/layout/HomeLayout.jsx";

const routes = [
    { path: '/accounts', component: () => import('@components/accounts/Accounts.jsx') },
    { path: '/tags', component: () => import('@components/tags/Tags.jsx') },
    { path: '/profile', component: () => import('@components/profile/Profile.jsx') },
    { path: '/', component: () => import('@components/transactions/TransactionsRoutes.jsx') },
];

function getRoutes() {
    return (
        <Switch>
            {routes.map((route, idx) => (
                <Route key={idx} path={route.path} exact={route.exact}
                    render={() => <LazyLoad component={route.component} />} />
            ))}
            <Redirect to="/" />
        </Switch>
    );
}

export default function App() {
    const userInfo = useSelector(state => state.user.info);

    if (!userInfo || !userInfo.email) {
        return <LazyLoad component={() => import('@components/login/Login.jsx')} />;
    }

    return (
        <HomeLayout LayoutBody={getRoutes()} />
    );
}
