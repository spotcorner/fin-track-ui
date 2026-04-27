import React from "react";

export const ACCOUNTS_HELP = [
    "Create and manage your bank accounts used for tracking transactions.",
    "Supported types: Savings, Credit Card, Wallet, Others.",
    "Opening balance is used to calculate closing balance in the Summary tab.",
];

export const ACCOUNT_MODAL_HELP = [
    <><b>Account Type</b> — category of the account. Credit cards don't have opening balance.</>,
    <><b>Opening Balance</b> — starting balance used to calculate closing balance in Summary.</>,
];

export const FILTERS_HELP = [
    <><b>Date</b> — filter by date range. Changing dates refetches from server.</>,
    <><b>Tags</b> — show transactions matching selected tags. "Untagged" shows transactions with no tags.</>,
    <><b>₹ Min/Max</b> — filter by transaction amount range.</>,
    <><b>Search</b> — search in description. Supports case-sensitive (Aa) and regex (.*) modes.</>,
    <><b>Type</b> — filter by Debit or Credit.</>,
    <><b>Totals</b> — Active: counts in summaries. Excluded: flagged to not count.</>,
    <><b>Account Type</b> — filter by account category (Savings, Credit Card, etc.).</>,
    <><b>Account</b> — filter by specific account.</>,
    <><b>Chips</b> — active filters shown as badges below. Click a chip to remove that filter.</>,
    <><b>Clear All</b> — removes all filters including defaults.</>,
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
    <><b>Close Draft</b> — removes the draft from the list.</>,
];

export const TRANSACTIONS_HELP = [
    "Full list of transactions with date, account, amount, description, and tags.",
    "Edit, delete, or tag transactions using the action buttons on each row.",
    "Quick-apply: after tagging one transaction, the same tag appears as a one-click option on other untagged transactions.",
];

export const TRANSACTIONS_DRAFT_HELP = [
    <><b>Save All</b> — finalize and move all draft transactions to Cashflow.</>,
    <><b>Delete All</b> — discard all draft transactions.</>,
];

export const SUMMARY_HELP = [
    "Account-wise balance breakdown — opening, debit, credit, and closing balance.",
    "Credit card accounts show spends and payments separately.",
    "Split summary shows owed vs settled amounts for shared expenses.",
];

export const CASHFLOW_HELP = [
    "View and manage your saved transactions across three tabs: Stats, Summary, and Transactions.",
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

export const TAG_SELECTION_HELP = [
    <><b>Badges</b> — currently applied tags. Click × to remove. Greyed-out tags were removed — click to restore.</>,
    <><b>Search</b> — filter the tag list by name.</>,
    <><b>Tag icon</b> — directly apply a tag to this transaction.</>,
    <><b>Pencil icon</b> — edit the tag's rules. Pre-fills the transaction description as a new keyword.</>,
    <><b>+ button</b> — create a new tag with the description pre-filled.</>,
];
