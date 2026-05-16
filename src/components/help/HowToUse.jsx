"use strict";

import React from "react";
import {
    ACCOUNTS_HELP, TAGS_VIEW_HELP, TAG_MODAL_HELP,
    UPLOAD_HELP, JOBS_HELP, JOB_DETAIL_HELP, EXTRACTION_RESULT_HELP,
    DRAFTS_HELP, TRANSACTIONS_HELP, TRANSACTIONS_DRAFT_HELP, TRANSACTION_MODAL_HELP,
    MONEYFLOW_HELP, STATS_HELP, SUMMARY_HELP, BUDGETS_HELP,
    PROFILE_GRANTED_HELP, PROFILE_RECEIVED_HELP,
} from "@utils/helpContent";

const flow = [
    { label: "Create Accounts", options: ["Savings", "Credit Card", "Wallet", "Others"] },
    { label: "Set Up Tags", options: ["Keyword rules", "Regex patterns", "Priority", "Linked tags", "Monthly budget"] },
    { label: "Upload PDF Statement", options: ["Account", "Opening Balance", "Draft Name", "Password"] },
    { label: "Extraction Job", options: ["Queued", "Started", "Extracting", "Extracted / Failed"] },
    { label: "Review Extraction", options: ["Tables with header", "Tables without header", "Text"] },
    { label: "Map Columns (if unmapped)", options: ["Debit/Credit", "Suffix mapper", "Keyword mapper", "Balance inference", "Manual date"] },
    { label: "Save as Draft" },
    { label: "Review & Edit Drafts", options: ["Budgets", "Stats", "Summary", "Edit / delete", "Tag transactions", "Save All → Moneyflow"] },
    { label: "Moneyflow", options: ["Budgets", "Stats", "Summary", "Transactions", "Split", "Smart Search", "Tag / edit / delete"] },
    { label: "Share Access", options: ["Read Only", "Full Access", "Nicknames", "View As"] },
];

const steps = [
    {
        title: "1. Create Accounts",
        intro: ["Go to Accounts and create your bank accounts."],
        help: ACCOUNTS_HELP,
    },
    {
        title: "2. Set Up Tags",
        intro: [
            "Go to Tags and create tags with auto-tagging rules.",
        ],
        help: [
            ...TAGS_VIEW_HELP,
            { label: "Auto-tagging", items: [...TAG_MODAL_HELP.overview, ...TAG_MODAL_HELP.rules] },
            "Set a monthly budget per tag to track spending in the Budgets tab.",
        ],
    },
    {
        title: "3. Upload Bank Statements",
        intro: [
            "Go to Upload and select a PDF bank statement.",
            "Fill in the account, opening balance (optional), and draft name, then submit the extraction job.",
        ],
        help: UPLOAD_HELP,
    },
    {
        title: "3.1 Extraction Jobs",
        intro: [
            "Go to Jobs to see all extraction jobs and their progress.",
            "Jobs run in the background — the page auto-refreshes until extraction completes.",
        ],
        help: JOBS_HELP,
    },
    {
        title: "3.2 Review Extraction",
        intro: [
            "Open a completed job to review extraction results.",
            "The system tries three extraction engines on your PDF:",
            "— Tables with header: detects table structures with column headers (e.g. Date, Description, Amount). Produces mapped results ready to save.",
            "— Tables without header: detects table structures without recognizable headers. Produces unmapped results that need column mapping.",
            "— Text: reads raw text line by line when no table structure is found. Produces unmapped results.",
            "All results are shown as preview tables. Compare them and pick the one that looks most accurate.",
        ],
        help: JOB_DETAIL_HELP,
    },
    {
        title: "3.3 Map Columns (Unmapped Results)",
        intro: [],
        help: EXTRACTION_RESULT_HELP.unmapped,
    },
    {
        title: "4. Review Drafts",
        intro: [
            "Go to Drafts to review extracted transactions before finalizing.",
        ],
        help: [
            ...DRAFTS_HELP,
            { label: "Transactions", items: [...TRANSACTIONS_HELP, ...TRANSACTIONS_DRAFT_HELP] },
        ],
    },
    {
        title: "5. Track in Moneyflow",
        intro: [],
        help: [
            ...MONEYFLOW_HELP,
            { label: "Budgets", items: BUDGETS_HELP },
            { label: "Stats", items: STATS_HELP.overview },
            { label: "Summary", items: SUMMARY_HELP() },
            { label: "Transactions", items: [
                ...TRANSACTIONS_HELP,
                ...TRANSACTION_MODAL_HELP.overview,
            ] },
        ],
    },
    {
        title: "6. Share Access (Optional)",
        intro: [
            "Go to Profile to share your data with family members.",
            "Use the View As dropdown in the navbar to switch between your data and shared accounts. Your selection persists across reloads.",
        ],
        help: [...PROFILE_GRANTED_HELP, ...PROFILE_RECEIVED_HELP],
    },
];

function FlowDiagram() {
    return <div className="d-flex flex-column align-items-center gap-1">
        {flow.map((step, i) => <React.Fragment key={i}>
            {i > 0 && <i className="bi bi-arrow-down text-muted"></i>}
            <div className="text-center">
                <div className="badge bg-dark px-3 py-2">{step.label}</div>
                {step.options && <div className="mt-1 d-flex flex-wrap justify-content-center gap-1">
                    {step.options.map((opt, j) => <span key={j} className="badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: "0.7rem" }}>{opt}</span>)}
                </div>}
            </div>
        </React.Fragment>)}
    </div>;
}

export default function HowToUse() {
    return <div>
        <div className="text-muted small mb-3 page-header">How to Use</div>
        <div className="row">
            <div className="col-lg-8 order-2 order-lg-1">
                {steps.map((step, i) => <div key={i} className="mb-3">
                    <div className="fw-bold">{step.title}</div>
                    <ul className="text-muted small mb-0 ps-3">
                        {[...step.intro, ...step.help].map((d, j) => d?.label
                            ? <li key={j}>{d.label}<ul className="ps-3">{d.items.map((item, k) => <li key={k}>{item}</li>)}</ul></li>
                            : <li key={j}>{d}</li>
                        )}
                    </ul>
                </div>)}
            </div>
            <div className="col-lg-4 order-1 order-lg-2 mb-3 mb-lg-0">
                <div className="position-sticky" style={{ top: 20 }}>
                    <FlowDiagram />
                </div>
            </div>
        </div>
    </div>;
}
