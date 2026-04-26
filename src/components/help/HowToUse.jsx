"use strict";

import React from "react";

const flow = [
    {
        label: "Create Accounts",
        options: ["Savings", "Credit Card", "Wallet", "Others"],
    },
    {
        label: "Set Up Tags",
        options: ["Keyword rules", "Regex patterns", "Priority", "Linked tags"],
    },
    {
        label: "Upload PDF Statement",
        options: ["Password protected"],
    },
    {
        label: "Auto Extraction",
        options: ["Table with headers", "Table without headers", "Text-based"],
    },
    {
        label: "Map Columns (if unmapped)",
        options: ["Debit/Credit", "Suffix mapper", "Keyword mapper", "Balance inference", "Manual date"],
    },
    {
        label: "Save as Drafts",
    },
    {
        label: "Review & Edit Drafts",
        options: ["Stats", "Summary", "Edit / delete", "Tag transactions", "Save All → Cashflow"],
    },
    {
        label: "Cashflow",
        options: ["Stats", "Summary", "Transactions", "Tag / edit / delete"],
    },
];

const steps = [
    {
        title: "1. Create Accounts",
        details: [
            "Go to Accounts and create your bank accounts.",
            "Supported types: Savings, Credit Card, Wallet, Others.",
            "Set an opening balance — this is used to calculate closing balance in the Summary tab.",
        ],
    },
    {
        title: "2. Set Up Tags",
        details: [
            "Go to Tags and create tags with auto-tagging rules.",
            "Rule types: keyword (exact match) or regex pattern.",
            "Case-sensitive matching is optional per rule.",
            "Priority: when multiple tags match, the highest priority tag wins.",
            "Linked tags: set a parent tag that auto-applies when the child tag matches.",
            "Tags are auto-applied when transactions are loaded. You can also manually apply or remove tags per transaction in Drafts or Cashflow.",
        ],
    },
    {
        title: "3. Upload Bank Statements",
        details: [
            "Go to Upload Statement and select a PDF bank statement.",
            "Choose the account the statement belongs to.",
            "Supports password-protected PDFs — check the password option and enter it.",
            "Click Extract — the system runs multiple extraction engines and shows all results.",
            "Use the Source Preview toggle to view the original PDF alongside the extracted data.",
        ],
    },
    {
        title: "4. Pick an Extraction Result",
        details: [
            "The system tries three extraction engines on your PDF:",
            "— Table with headers: detects table structures with column headers (e.g. Date, Description, Amount). Produces mapped results ready to save.",
            "— Table without headers: detects table structures without recognizable headers. Produces unmapped results that need column mapping.",
            "— Text-based: reads raw text line by line when no table structure is found. Produces unmapped results.",
            "Each engine may produce multiple results — the system groups extracted data by page ranges and number of amount columns. For example, a statement where page 1-3 has 4 columns and page 4-5 has 3 columns will appear as two separate results.",
            "All results are shown as preview tables. Compare them and pick the one that looks most accurate for your statement format.",
            "Mapped results are ready to save. Unmapped results need column mapping first.",
        ],
    },
    {
        title: "5. Map Columns (Unmapped Results)",
        details: [
            "For unmapped results, use the dropdowns in each column header to assign: Date, Description, Amount, Balance.",
            "Choose how amounts are classified into Debit/Credit:",
            "— Suffix: amount values end with Cr/Dr or similar suffixes.",
            "— Description keyword: a keyword in the description indicates the type.",
            "— Balance inference: compare with the balance column to determine type.",
            "— Simple: two separate amount columns, one for debit and one for credit.",
            "For rows without a date, use the inline date picker or toggle to exclude them.",
            "Yellow highlights indicate incomplete columns or missing dates.",
        ],
    },
    {
        title: "6. Review Drafts",
        details: [
            "Extracted transactions are saved as drafts with a name you provide.",
            "Go to Drafts to review them. Each draft is a batch you can select from the dropdown.",
            "Drafts have the same Stats, Summary, and Transactions tabs as Cashflow — use it as a sandbox to verify everything looks correct before finalizing.",
            "Edit or delete individual transactions. Create new transactions manually using the + button.",
            "Tags are auto-applied based on your rules. Manually apply or remove tags per transaction. Quick-apply: after tagging one transaction, the same tag appears as a one-click option on other untagged transactions.",
            "Use Save All to finalize — transactions move to Cashflow. Use Delete All to discard.",
            "Close Draft when you're done to remove it from the list.",
        ],
    },
    {
        title: "7. Track in Cashflow",
        details: [
            "Cashflow has three tabs: Stats, Summary, and Transactions.",
            "Stats: visual charts for spending analysis. Pick which charts to show, group by time period (daily/weekly/monthly/yearly), expand charts to fullscreen, and sort chart data.",
            "Summary: account-wise balance breakdown — opening, debit, credit, closing. Split summary shows owed vs settled amounts.",
            "Transactions: full list with edit, delete, and tag actions. Create new transactions manually using the + button.",
            "Use filters: date range, tags, search (with regex support), amount range, account, transaction type.",
            "Sort by date, amount, or last updated.",
            "Quick-apply lets you rapidly tag multiple transactions with the same tag.",
            "Split amount: track shared expenses (owed/settled). Comments: add notes to any transaction.",
            "Exclude from totals: flag transactions that shouldn't count in summaries.",
        ],
    },
    {
        title: "8. Share Access (Optional)",
        details: [
            "Go to Profile to share your data with family members.",
            "Grant access by email — choose Read Only or Full Access.",
            "Read Only: can view all data but cannot make changes.",
            "Full Access: can view and edit everything (transactions, accounts, tags, drafts).",
            "Use the View As dropdown in the navbar to switch between your data and shared accounts.",
        ],
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
                        {step.details.map((d, j) => <li key={j}>{d}</li>)}
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
