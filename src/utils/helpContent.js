import React from "react";

export const ACCOUNTS_HELP = [
    "Create and manage your bank accounts used for tracking transactions.",
    "Supported types: Savings, Credit Card, Wallet, Others.",
    "Opening balance is used to calculate closing balance in the Summary tab.",
];

export const ACCOUNT_MODAL_HELP = {
    overview: [
        "Create and manage bank accounts for tracking transactions.",
        "Supported types: Savings, Credit Card, Wallet, Others.",
    ],
    type: "Credit cards don't have opening balance.",
    openingBalance: "Used with pre-period totals to compute effective opening balance for the selected date range.",
};

export const FILTERS_HELP = (isDraft) => [
    <><b>Date</b> — filter by date range. Changing dates refetches from server.</>,
    <><b>Tags</b> — show transactions matching selected tags. "Untagged" shows transactions with no tags.</>,
    <><b>₹ Min/Max</b> — filter by transaction amount range.</>,
    <><b>Search</b> — press Enter to add search terms. Multiple terms use AND logic. Each term captures its own case-sensitive (Aa) and regex (.*) settings. Smart suggestions appear for dates, amounts, tags, accounts, and types.</>,
    <><b>Type</b> — filter by Debit or Credit.</>,
    <><b>Skip excluded</b> — when checked, transactions flagged as "exclude from totals" are hidden from all views.</>,
    ...(!isDraft ? [
        <><b>Account Type</b> — filter by account category (Savings, Credit Card, etc.).</>,
        <><b>Account</b> — filter by specific account.</>,
    ] : []),
    <><b>Chips</b> — active filters shown as badges below. Click × to remove. Filter count badge toggles chip visibility.</>,
    <><b>Clear All</b> — shown in chips area when filters are active. Removes all filters.</>,
    <><b>Reset</b> — restores filters to default state.</>,
    <><b>Pin</b> — toggle to keep filters sticky on scroll.</>,
    <><b>Collapse</b> — hide/show the filter controls.</>,
];

export const STATS_HELP = {
    overview: [
        "Visual charts for spending analysis across your transactions.",
        <>Use the <b>Charts</b> dropdown to show/hide charts.</>,
    ],
    tags: "Debit (red) and credit (green) totals per tag. Stacked bars with counts. Sort by amount or name.",
    range: "Transaction amounts grouped by range brackets (e.g. 0-100, 100-500).",
    trends: "Debit vs credit over time. Use the period dropdown to group by day, week, month, year, or overall.",
};
export const DRAFTS_HELP = [
    "Drafts are extracted transactions saved for review before finalizing.",
    "Use Stats, Summary, and Transactions tabs as a sandbox to verify data.",
    "Use Save All and Delete All in the Transactions tab to finalize or discard.",
    <><b>Opening Balance</b> — shown as a badge for bank accounts. Used in Summary to calculate closing balance.</>,
    <><b>Edit draft</b> — use the pencil button to update draft name or opening balance.</>,
    <><b>Close Draft</b> — removes the draft from the list.</>,
];

export const BUDGETS_HELP = [
    "Track spending against monthly budgets set on tags.",
    <><b>Overall</b> — combined budget and spending across all budgeted tags.</>,
    <><b>Progress bars</b> — green (&lt;75%), yellow (75-100%), cyan (exactly 100%), red (over budget).</>,
    <><b>Pro-rated</b> — when the date range isn't an exact month, budgets are scaled to daily rate × days.</>,
    <><b>Expand</b> — click the chevron on any card to see matching transactions.</>,
    "Set a monthly budget on any tag from the tag edit modal.",
];

export const UNBUDGETED_HELP = [
    "Tags without budgets that have spending in the selected period.",
    "Includes untagged transactions.",
];

export const TRANSACTIONS_HELP = [
    "Full list of transactions with date, account, amount, description, and tags.",
    "Edit, delete, or tag transactions using the action buttons on each row.",
    <><b>Split transactions</b> — shown with a Split badge. Parent is hidden, children display individually with ↳ icon.</>,
    "Quick-apply: after tagging one transaction, the same tag appears as a one-click option on other untagged transactions.",
];

export const TRANSACTIONS_DRAFT_HELP = [
    <><b>Save All</b> — finalize and move all draft transactions to Moneyflow.</>,
    <><b>Delete All</b> — discard all draft transactions.</>,
];

export const SUMMARY_HELP = (isDraft) => [
    "Account-wise balance breakdown — opening, debit, credit, and closing balance.",
    ...(isDraft ? ["Opening balance comes from the draft setting instead of the account."] : []),
    "When filters are active, shows filtered/total format — filtered amount (muted) and total amount (badge).",
    "Closing balance always uses total for accuracy.",
    "Credit card accounts show spends and payments separately.",
];

export const MONEYFLOW_HELP = [
    "View and manage your saved transactions across tabs: Budgets, Stats, Summary, and Transactions.",
    "Use filters to narrow down by date, tags, amount, account, and more.",
    "Transactions can be created, edited, deleted, and tagged.",
];

export const TAGS_VIEW_HELP = [
    "Tags are auto-applied to transactions when their rules match the description.",
    "Tags can also be applied manually from the tag selection modal.",
    "Each tag shows its name, rules (keywords/patterns), and linked tags.",
];

export const TAG_MODAL_HELP = {
    overview: [
        "Define rules to auto-tag transactions based on their description.",
        "Link child tags so this tag auto-applies when they match.",
        "Set priority to control which tag wins when multiple match.",
        <><b>Monthly Budget</b> — set a spending limit to track in the Budgets tab.</>,
    ],
    rules: [
        <><b>Keyword</b> — matches if description contains this text.</>,
        <><b>Pattern</b> — matches using a regex pattern.</>,
        <><b>Aa</b> — toggle case-sensitive matching.</>,
        "Multiple rules act as OR — any match applies the tag.",
    ],
    linkedTags: "When any linked tag matches a transaction, this tag is also auto-applied.",
    priority: "When multiple tags match a transaction, only the highest priority tag is applied.",
};

export const UPLOAD_HELP = [
    "Upload a bank PDF statement to submit an extraction job.",
    <><b>File</b> — select a PDF bank statement. Supports password-protected files.</>,
    <><b>Password protected</b> — checked by default. Enter the PDF password if encrypted. Password is never stored.</>,
    <><b>Account</b> — select the account this statement belongs to. Opening balance auto-fills from the account's closing balance.</>,
    <><b>Opening Balance</b> — shown for non-credit-card accounts. Used to calculate closing balance in drafts.</>,
    <><b>Draft Name</b> — auto-fills as "Account - filename" when both are set. Editable.</>,
    <><b>Submit</b> — creates an extraction job that runs in the background. View progress on the Jobs page.</>,
];

export const JOBS_HELP = [
    "View all extraction jobs — past and in-progress.",
    <><b>Status</b> — Queued (waiting), Started (extracting), Extracted (ready to review), Failed (error).</>,
    <><b>Timeline</b> — expand any job to see step-by-step progress with per-extractor timing.</>,
    <><b>Open</b> — navigate to the Review Extraction page for extracted jobs.</>,
    <><b>Edit</b> — update draft name, account, or opening balance before saving as draft.</>,
    <><b>Delete</b> — remove extracted or failed jobs from history.</>,
    "Jobs auto-refresh while queued or started.",
];

export const JOB_DETAIL_HELP = [
    "Review extraction results and save as draft.",
    <><b>Job Card</b> — shows draft name, file, account, opening balance, status, and duration. Edit or delete from here.</>,
    <><b>Extractor results</b> — multiple extraction methods are tried. Select the most accurate result.</>,
    <><b>Unmapped results</b> — need column mapping before saving. Yellow badge indicates incomplete mapping.</>,
    <><b>Save as Draft</b> — creates a draft with the selected transactions. Job is deleted and you're redirected to Drafts.</>,
];

export const SOURCE_PREVIEW_HELP = "View the uploaded PDF inline. Use this to cross-check extracted transactions against the original statement.";

export const EXTRACTION_RESULT_HELP = {
    mapped: "Transactions were auto-detected with date, description, amount, and type. Select this result and save as draft.",
    unmapped: [
        "Raw table data — date and amount columns need to be mapped before saving. Description is auto-detected.",
        <><b>Date columns</b> — map to Date or Ignore.</>,
        <><b>Amount columns</b> — choose how amounts are classified into Debit/Credit:</>,
        "— Debit/Credit: two separate amount columns, one for each.",
        "— Use suffix: amount values end with CR/DR or similar suffixes.",
        "— Use desc keyword: a keyword in the description indicates the type.",
        "— Infer from balance: derive type by comparing with the balance column.",
        <><b>Preview</b> — after mapping, preview the final transactions before saving.</>,
        "For rows without a date, use the inline date picker or toggle to exclude them.",
        "Yellow highlights indicate incomplete columns or missing dates.",
    ],
};

export const PROFILE_GRANTED_HELP = [
    "Share your financial data with other users.",
    <><b>Full Access</b> — can view and modify your transactions, accounts, and tags.</>,
    <><b>Read Only</b> — can only view your data.</>,
    <><b>Nickname</b> — a private label only you see, to identify this person.</>,
];

export const PROFILE_RECEIVED_HELP = [
    "Data shared with you by other users. Use the View As dropdown in the header to switch.",
    <><b>Nickname</b> — a private label only you see, to identify this person's data.</>,
];

export const ACCESS_MODAL_HELP = {
    accessType: "Full Access allows viewing and modifying data. Read Only is view-only.",
    nickname: "A private label only you see. Each side sets their own.",
};

export const TRANSACTION_MODAL_HELP = {
    overview: [
        "Create or edit a transaction with date, account, type, amount, and description.",
        "Transactions can be split, excluded from totals, and commented.",
    ],
    split: "Split a transaction into parts for shared expenses or categorization. Each part gets its own tags.",
    excludeFromTotals: "Excluded transactions are hidden by default and don't count in summaries or budgets.",
};

export const TAG_SELECTION_HELP = [
    <><b>Badges</b> — currently applied tags. Click × to remove. Greyed-out tags were removed — click to restore.</>,
    <><b>Search</b> — filter the tag list by name.</>,
    <><b>Tag icon</b> — directly apply a tag to this transaction.</>,
    <><b>Pencil icon</b> — edit the tag's rules. Pre-fills the transaction description as a new keyword.</>,
    <><b>+ button</b> — create a new tag with the description pre-filled.</>,
];
