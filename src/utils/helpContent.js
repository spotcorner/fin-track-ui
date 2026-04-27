import React from "react";

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
    tags: <><b>Amount by Tags</b> — debit (red) and credit (green) totals per tag. Stacked bars with counts. Sort by amount or name.</>,
    range: <><b>Amount by Range</b> — transaction amounts grouped by range brackets (e.g. 0-100, 100-500).</>,
    trends: <><b>Amount by Period</b> — debit vs credit over time. Use the period dropdown to group by day, week, month, year, or overall.</>,
    charts: <>Use the <b>Charts</b> dropdown to show/hide charts.</>,
};

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
