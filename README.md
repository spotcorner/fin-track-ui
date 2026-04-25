# fin-track-ui

Frontend for fin-track — personal finance tracker.

## User Flow

```
Login (Google OAuth)
  │
  ├── Transactions ─────────────────────────────────────────────────┐
  │     │ List with filters, sort, search                          │
  │     ├── Create/Edit transaction                                │
  │     ├── Tag transaction (auto + manual)                        │
  │     └── Stats & Charts                                         │
  │                                                                │
  ├── Upload Statement ────────────────────────────────────────────┐
  │     │ Select extractor, upload PDF (password optional)         │
  │     │ Page range (optional)                                    │
  │     ▼                                                          │
  │     Extract ──► Multiple results (expand/collapse)             │
  │     │            │                                             │
  │     │            ├── Mapped result ──► Preview ──► Select      │
  │     │            │                                             │
  │     │            └── Unmapped result                           │
  │     │                 │ Column mapping (dropdowns in headers)  │
  │     │                 │ Config bar (suffix/keyword mapping)    │
  │     │                 │ Exclude rows, manual dates             │
  │     │                 ▼                                        │
  │     │                 Mapping complete ──► Preview ──► Select  │
  │     │                                                          │
  │     └── Select result + Account + Draft name ──► Save as Draft │
  │                                                                │
  ├── Drafts ──────────────────────────────────────────────────────┐
  │     │ Select draft batch                                       │
  │     ├── Review/edit transactions                               │
  │     ├── Save draft (finalize)                                  │
  │     └── Delete draft                                           │
  │                                                                │
  ├── Accounts ─── Create/Edit/Delete                              │
  │                                                                │
  └── Tags ─── Create/Edit/Delete (rules, priority, linked tags)   │
               Auto-applied on transaction render                   │
```

## Features

### Upload & Extract
- PDF upload with extractor selection (auto or specific)
- Password-protected PDF support
- Page range selection
- Source PDF preview (iframe)
- Multiple extractor results with expand/collapse
- Debit/credit total badges per result

### Column Mapping (Unmapped Results)
- Dropdown-based column mapping in table headers
- Mapping targets: Date, Debit, Credit, Use suffix, Use desc keyword, Amount (infer from balance), Balance, Ignore
- Single-use targets — used targets hidden from other columns
- Config bar for suffix→type and keyword→type mapping
- First-row inline dropdown for balance inference
- Auto-detect default mapping based on data patterns
- Date input for rows without dates
- Exclude rows toggle with per-row checkboxes
- Show/hide page numbers (multi-page only)
- Show/hide no-date rows with count
- Yellow highlight on incomplete columns and no-date rows
- Per-result mapping persistence across result switching
- Mapped transaction preview
- Mapper architecture: simpleMapper, suffixMapper, descKeywordMapper, balanceInferMapper

### Transactions
- List with filters: date range, amount range, account, type, tags, search (text/regex)
- Sort by date, amount
- Inline tag badges with manual apply/remove
- Create, edit, delete transactions
- Exclude from totals
- Split amount

### Drafts
- Select and review draft batches
- Edit individual draft transactions
- Save or delete entire draft

### Tags
- Create/edit with keyword and regex pattern rules
- Case-sensitive matching option
- Priority — higher priority wins on conflict
- Linked tags
- Auto-tagging on transaction list render

### Accounts
- Create/edit accounts with type, name, opening balance
- Account selection in transaction forms

### Stats & Charts
- Balance trends
- Transaction count/amount trends by type
- Tag-wise amount sum and count
- Transaction amount distribution

### Auth
- Google OAuth login
- Session expiry handling with user-friendly error messages

## Tech Stack
- **Framework**: React (class components)
- **State**: Redux (redux-toolkit)
- **Routing**: React Router
- **HTTP**: Axios with global error toast
- **UI**: Bootstrap 5, Bootstrap Icons
- **Charts**: Chart.js
- **Build**: Webpack, Babel

## Project Structure
```
src/
  components/
    accounts/         — Account CRUD
    dashboard/        — Dashboard view
    layout/           — App layout
    login/            — Google OAuth login
    tags/             — Tag CRUD, tag badges
    transactions/
      UploadView      — Upload flow orchestrator
      ColumnMappingTable — Column mapping UI
      TransactionPreview — Mapped transaction display
      TransactionsLayout — Transaction list with filters
      TransactionsView   — Transaction rows, tag modal, draft actions
      FiltersView        — Filter controls
      SummaryTable       — Debit/credit summary
      DraftsLayout       — Draft selection and review
      stats/             — Chart components
    ui/               — Reusable UI components (CheckDropdown, SortDropdown)
  services/           — API service layer (http, transaction, tag, account, draft, user)
  store/              — Redux store (user slice with accounts, tags)
  utils/
    columnMappingUtil — Mapper registry, targets, shared helpers
    transactionGroupUtil — Flattening, grouping, applyMapping
    mappers/          — Per-type mapping logic (simple, suffix, descKeyword, balanceInfer)
    tagUtil           — Auto-tagging with priority
    transactionUtil   — Filter application
    statsChartUtil    — Chart data preparation
    amountUtil        — Amount formatting
    labelUtil         — Account label formatting
```
