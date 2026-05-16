"use strict";

import React from "react";
import { Link } from "react-router-dom";

const features = [
    { icon: "bi-graph-up", title: "Moneyflow", desc: "Track spending with budgets, stats, summaries, and split transactions", to: "/moneyflow" },
    { icon: "bi-file-earmark-pdf", title: "Upload Statement", desc: "Extract transactions from bank PDF statements automatically", to: "/upload-statement" },
    { icon: "bi-journal-check", title: "Drafts", desc: "Review and edit extracted transactions before finalizing", to: "/drafts" },
    { icon: "bi-wallet2", title: "Accounts", desc: "Manage bank accounts, credit cards, and wallets", to: "/accounts" },
    { icon: "bi-tags", title: "Tags", desc: "Auto-tag transactions with keyword and regex rules", to: "/tags" },
    { icon: "bi-people", title: "Family Sharing", desc: "Share access with family — read-only or full access", to: "/profile" },
    { icon: "bi-question-circle", title: "How to Use", desc: "Step-by-step guide to get started", to: "/how-to-use" },
];

function FeatureCard({ feature, linkable, dark }) {
    const card = <div className={`card shadow-sm h-100 border-0 ${dark ? "bg-secondary bg-opacity-10" : ""}`} style={{ borderLeft: "3px solid #0d6efd" }}>
        <div className="card-body text-center">
            <i className={`bi ${feature.icon} fs-2 text-primary mb-2 d-block`}></i>
            <h6 className={`fw-bold ${dark ? "text-light" : ""}`}>{feature.title}</h6>
            <p className={`small mb-0 ${dark ? "text-secondary" : "text-muted"}`}>{feature.desc}</p>
        </div>
    </div>;
    if (linkable) return <Link to={feature.to} className="text-decoration-none text-dark">{card}</Link>;
    return card;
}

export function AboutHeader({ dark }) {
    return <div className="text-center mb-4">
        <img src={`${process.env.ASSET_BASE}/assets/images/favicon.png`} alt="" style={{ width: 60, height: 60 }} />
        <h4 className="fw-bold">fin-track</h4>
        <p className={dark ? "text-secondary" : "text-muted"}>Extract, tag, and track your spending from bank statements</p>
    </div>;
}

export default function About({ linkable, dark }) {
    return <div className="row g-3 justify-content-center">
        {features.map((f, i) => <div key={i} className="col-sm-6 col-lg-4">
            <FeatureCard feature={f} linkable={linkable} dark={dark} />
        </div>)}
    </div>;
}
