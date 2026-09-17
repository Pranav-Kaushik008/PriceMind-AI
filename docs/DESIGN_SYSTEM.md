# PriceMind AI — Design System Specification

> **Visual Direction:** Premium Enterprise Pricing Intelligence  
> **Aesthetic:** Financial Analytics Terminals & Operations Platforms  
> **Theme Model:** Dark-first with complete Light Mode support

---

## 1. Visual Principles

1. **Analytical Clarity Over Decoration** — No excessive gradients, no decorative blobs, no glassmorphic blur, no neon glow, and no robot illustrations.
2. **High Information Density** — Compact line heights, restrained padding, tabular numerals (`tabular-nums font-mono`), and dense data tables.
3. **Restrained Borders & Minimal Shadows** — Thin $1\text{px}$ separators (`var(--pm-border-default)`, `var(--pm-border-subtle)`) and subtle elevation shadows.
4. **Editorial Hierarchy** — Clear progression from primary financial figures down to micro timestamps and confidence intervals.
5. **Accessibility & Keyboard Navigability** — Visible focus rings (`focus-visible:ring-2 focus-visible:ring-pm-accent`), ARIA roles, and ESC key dismissals for dialogs.

---

## 2. Centralized Design Tokens

All tokens are defined in [`frontend/src/styles/tokens.css`](file:///c:/Users/DELL/Desktop/My%20PROJECTS/PriceMind%20AI/frontend/src/styles/tokens.css), mapped in [`frontend/tailwind.config.js`](file:///c:/Users/DELL/Desktop/My%20PROJECTS/PriceMind%20AI/frontend/tailwind.config.js), and exported as programmatic constants in [`frontend/src/styles/tokens.js`](file:///c:/Users/DELL/Desktop/My%20PROJECTS/PriceMind%20AI/frontend/src/styles/tokens.js).

### Surface & Background Tokens
| Token | Dark (Default) | Light Mode | Description |
|---|---|---|---|
| `--pm-bg-app` | `#07090E` | `#F4F6F9` | Deepest application canvas / base |
| `--pm-bg-surface` | `#0D111A` | `#FFFFFF` | Primary cards, panels, and data containers |
| `--pm-bg-elevated` | `#131A27` | `#FFFFFF` | Dropdown menus, popovers, and dialogs |
| `--pm-bg-subtle` | `#0B0E17` | `#F8FAFC` | Recessed table headers and well insets |
| `--pm-bg-hover` | `#172032` | `#F1F5F9` | Row and item hover highlight |
| `--pm-bg-selected` | `#1E293B` | `#EFF6FF` | Selected table row / active item |

### Border & Separator Tokens
| Token | Dark (Default) | Light Mode | Description |
|---|---|---|---|
| `--pm-border-subtle` | `#182030` | `#E2E8F0` | Ultra-thin data grid lines, horizontal dividers |
| `--pm-border-default` | `#222D42` | `#CBD5E1` | Card outlines, input borders |
| `--pm-border-strong` | `#334155` | `#94A3B8` | Emphasized boundaries, active tabs |
| `--pm-border-focus` | `#6366F1` | `#4F46E5` | Keyboard navigation focus indicator |

### Text & Typography Tokens
| Token | Dark (Default) | Light Mode | Description |
|---|---|---|---|
| `--pm-text-primary` | `#F8FAFC` | `#0F172A` | Primary figures, table values, section titles |
| `--pm-text-secondary` | `#CBD5E1` | `#334155` | Body copy, row labels, cell descriptions |
| `--pm-text-muted` | `#94A3B8` | `#64748B` | KPI subheadings, secondary metric annotations |
| `--pm-text-dim` | `#64748B` | `#94A3B8` | Timestamps, micro captions, disabled items |

### Semantic State Tokens
| Semantic Role | Token Base | Dark Subtle / Text | Light Subtle / Text |
|---|---|---|---|
| **Positive / Lift** | `--pm-positive` (`#10B981`) | `rgba(16, 185, 129, 0.12)` / `#34D399` | `#ECFDF5` / `#065F46` |
| **Negative / Risk** | `--pm-negative` (`#EF4444`) | `rgba(239, 68, 68, 0.12)` / `#F87171` | `#FEF2F2` / `#991B1B` |
| **Warning / Review** | `--pm-warning` (`#F59E0B`) | `rgba(245, 158, 11, 0.12)` / `#FBBF24` | `#FFFBEB` / `#92400E` |
| **Information / Telemetry** | `--pm-info` (`#0284C7`) | `rgba(2, 132, 199, 0.12)` / `#38BDF8` | `#F0F9FF` / `#075985` |
| **Accent / Platform** | `--pm-accent` (`#6366F1`) | `rgba(99, 102, 241, 0.12)` / `#818CF8` | `#EEF2FF` / `#3730A3` |

---

## 3. Component Catalog

All components are centrally exported from [`frontend/src/components/ui/index.js`](file:///c:/Users/DELL/Desktop/My%20PROJECTS/PriceMind%20AI/frontend/src/components/ui/index.js).

### Form Controls
- **`Button`** & **`ButtonGroup`** — Enterprise button variants (`primary`, `secondary`, `subtle`, `outline`, `ghost`, `positive`, `negative`, `warning`), loading states, and icon positions.
- **`Input`**, **`SearchInput`**, **`NumberInput`**, **`TextArea`** — Labelled fields, error hints, hotkey badges, clear buttons, and numeric steppers.
- **`Select`** & **`NativeSelect`** — Searchable custom select and compact native select.
- **`DateRangePicker`** — Institutional financial horizon presets (`24H`, `7D`, `30D`, `90D`, `QTD`, `YTD`, `Custom`).

### Indicators & Badges
- **`Badge`** & **`StatusBadge`** — Semantic status pills (`active`, `pending`, `approved`, `rejected`, `simulated`, `syncing`).
- **`StatusDot`**, **`TrendIndicator`**, **`HealthGauge`** — Real-time telemetry indicators with $+/-$ delta, percent, and basis points (`bps`).
- **`ConfidenceIndicator`** — Tiered statistical confidence metric (`High`, `Moderate`, `Low`) with sample size $N$.
- **`Tooltip`** — Accessible hover/focus tooltip with configurable positions and ESC dismissal.

### Overlays & Navigation
- **`Tabs`** — Segmented terminal group, underline, and pill tabs.
- **`DropdownMenu`** — Contextual action menus with headers, hotkey shortcuts, and destructive items.
- **`FilterBar`** & **`FilterPill`** — Query filter toolbar with active filter counts and reset triggers.
- **`Modal`** & **`Drawer`** — Dialogs and slide-overs with trapped focus and backdrop dismissal.
- **`Toast`** & **`ToastProvider`** (`useToast`) — Global notification system for asynchronous ERP sync and validation feedback.

### Data Presentation & States
- **`DataTable`** — Sortable columns, density toggles (`compact`, `standard`, `relaxed`), pagination, row selection, sticky headers, and tabular numeral alignment.
- **`KPIDisplay`** & **`MetricCard`** — Financial KPI cards with primary tabular figures, delta badges, target comparisons, and micro sparklines.
- **`AnalyticalChartContainer`** — Chart container with time grain switchers, metric selectors, CSV export, fullscreen inspection modal, and summary legend.
- **`Skeleton`** — Shimmer loading loaders for cards, table rows, and metrics.
- **`EmptyState`** & **`ErrorState`** — Clean editorial state fallbacks with diagnostics and retry handlers.

### Domain Pricing Intelligence
- **`RecommendationCard`** & **`RecommendationPanel`** — Actionable pricing opportunities with current vs recommended ASP, expected lift, margin shift, and ERP push triggers.
- **`DecisionSummary`** — Portfolio-level impact banner with pending, approved, and rejected counters.
- **`EvidencePanel`** & **`EvidenceDrawer`** — Empirical elasticity curve graph ($Q = f(P)$), SHAP waterfall driver decomposition, and guardrail checklists.
- **`SKUDetailDrawer`** — Deep-dive SKU panel with inventory velocity, competitor spread slider, and price elasticity diagnostics.
- **`StrategyHeatmap`** — 4-quadrant portfolio action matrix (Protect Margin, Maximize Margin, Harvest Volume, Reposition).
