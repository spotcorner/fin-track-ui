"use strict";

import React from "react";
import { useSelector } from "react-redux";
import { Switch, Route, Redirect } from "react-router-dom";
import LazyLoad from "./components/lazy-load/LazyLoad.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";

const moneyflowComponent = () => import("./components/transactions/TransactionsLayout.jsx");
const draftsListComponent = () => import("./components/drafts/DraftsView.jsx");
const draftDetailComponent = () => import("./components/drafts/DraftDetailView.jsx");
const moneyflowProps = { isDraft: 0, title: "Moneyflow", sortByDate: 1, basePath: "/moneyflow" };

const routes = [
    { path: '/', component: () => import('./components/home/Home.jsx') },
    { path: '/moneyflow/:tab?', component: moneyflowComponent, props: moneyflowProps },
    { path: '/drafts', component: draftsListComponent },
    { path: '/drafts/:id/:tab?', component: draftDetailComponent },
    { path: '/accounts', component: () => import('./components/accounts/Accounts.jsx') },
    { path: '/tags', component: () => import('./components/tags/Tags.jsx') },
    { path: '/activity', component: () => import('./components/activity/ActivityView.jsx') },
    { path: '/profile', component: () => import('./components/profile/Profile.jsx') },
    { path: '/how-to-use', component: () => import('./components/help/HowToUse.jsx') },
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
        return <LazyLoad component={() => import('./components/login/Login.jsx')} />;
    }

    return <AppLayout LayoutBody={getRoutes()} />;
}
