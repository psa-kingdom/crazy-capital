# 🎨 Crazy Capital — Stitch Design Intelligence & Inspiration Map

---

## 1. Executive Summary & Core Principle

The `Stitch/` directory contains visual explorations and conceptual prototypes generated during early product ideation.

> ### 🏛️ Core Architectural Principle
> **Stitch is a REFERENCE LIBRARY, not a SOURCE OF TRUTH.**
> 
> - **Inspiration & UX Exploration:** Provides guidance on intended brand personality, information density, and user journey flow.
> - **Not a Rigid Constraint:** Production UI must evolve independently through structured **Design Tokens** and **Reusable Primitives** rather than hardcoded page-by-page visual values.
> - **No Direct Code Copying:** Stitch HTML is prototype reference material, not production React/Next.js architecture.

---

## 2. Comprehensive Stitch Reference Inventory

| # | Stitch Reference Directory | Target Product Area | Potential Future Usage | Inspiration Type | Priority | Core Insights & Notes |
|---|---|---|---|---|---|---|
| 1 | `crazy_capital_design_system` | Global Design System | Design token foundation | Design System & Tokens | **Critical** | Defines the dual-font strategy (Manrope + Inter), Bento Grid philosophy, high border radii (16–24px), and tonal color palette. |
| 2 | `homepage_crazy_capital` | Public Website (`@cc/web`) | Landing page & hero | Layout & Branding | **High** | Bento grid ecosystem presentation, hero value proposition with live dashboard widget preview, "What would you like to do today?" quick intent selector. |
| 3 | `homepage_mobile_view` | Public Website (`@cc/web`) | Mobile landing layout | Mobile Responsive UX | **High** | Compact stacking of bento widgets, sticky glassmorphic top navigation, thumb-friendly CTA buttons. |
| 4 | `about_crazy_capital_our_story` | Public Website (`@cc/web`) | About & Mission page | Brand Storytelling | **Medium** | "Ambitious Reliability" narrative, milestones timeline, leadership spotlight, India MSME growth statistics. |
| 5 | `all_services_discovery` | Public & Customer Portal | Service catalog catalog view | Catalog Navigation & Filtering | **High** | Category filter tabs, service cards with government-approved badges, pricing transparency badges ("+ Govt Fees"), deliverables checklists. |
| 6 | `service_detail_company_registration` | Service Catalog & Application | Service details & checkout | Information Hierarchy | **High** | Sticky pricing panel, document requirement checklist, step-by-step workflow process stepper, FAQ accordion, expert advisory CTA. |
| 7 | `for_business_growth_hub` | Public & Customer Portal | MSME lifecycle bundles | Business Lifecycle UX | **Medium** | 4-stage MSME journey (Incorporate ➔ Comply ➔ Fund ➔ Grow), service bundling cards, loan eligibility estimator. |
| 8 | `invest_insure_wealth_center` | Public & Customer Portal | Wealth & Insurance hub | Financial Calculator UX | **Medium** | SIP/Lumpsum return projections with dynamic growth curve, curated fund baskets, side-by-side corporate insurance matrix. |
| 9 | `get_started_consultation_form` | Public & CRM Lead Capture | Consultation & Lead capture | Multi-Step Wizard UX | **High** | 3-step intent-driven form (Intent ➔ Entity Type ➔ Contact Details) with trust badges (RBI compliant, 256-bit encryption). Directly feeds CRM Lead Engine. |
| 10 | `become_a_partner_opportunity` | Partner Acquisition (`@cc/web`) | Channel partner landing | Partner Value Proposition | **Medium** | Interactive commission earnings slider, tier progression (Silver 15%, Gold 20%, Diamond 25%), partner benefits bento cards. |
| 11 | `customer_dashboard_overview` | Customer Portal (`@cc/web`) | Customer home cockpit | Dashboard Composition | **High** | Application stage stepper (e.g. 75% complete on MCA filing), compliance calendar with upcoming tax deadlines, document vault preview, quick actions. |
| 12 | `customer_dashboard_mobile_view` | Customer Portal (`@cc/web`) | Mobile customer experience | Mobile App-like Navigation | **High** | Bottom fixed glassmorphic tab bar (Overview, Services, Vault, Payments, Profile), compact swipeable progress cards. |
| 13 | `partner_dashboard_franchise_hub` | Partner Portal (`@cc/web`) | Partner management hub | Partner Ops & Analytics | **Medium** | Real-time commission ledger, referral link generator, client application tracking table, marketing collateral downloads. |

---

## 3. "When to Use Stitch" Reference Guide

Before designing or implementing frontend modules, consult the corresponding Stitch references:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      WHEN TO CONSULT STITCH REFERENCES                 │
├────────────────────────────┬───────────────────────────────────────────┤
│ Product Area               │ Consult Stitch Folders                    │
├────────────────────────────┼───────────────────────────────────────────┤
│ 1. Public Marketing Site   │ • homepage_crazy_capital                  │
│                            │ • homepage_mobile_view                    │
│                            │ • about_crazy_capital_our_story           │
│                            │ • for_business_growth_hub                 │
├────────────────────────────┼───────────────────────────────────────────┤
│ 2. Service Catalog & Shop  │ • all_services_discovery                  │
│                            │ • service_detail_company_registration     │
├────────────────────────────┼───────────────────────────────────────────┤
│ 3. Lead Capture & Intake   │ • get_started_consultation_form           │
├────────────────────────────┼───────────────────────────────────────────┤
│ 4. Customer Portal         │ • customer_dashboard_overview             │
│                            │ • customer_dashboard_mobile_view          │
├────────────────────────────┼───────────────────────────────────────────┤
│ 5. Financial & Wealth      │ • invest_insure_wealth_center             │
├────────────────────────────┼───────────────────────────────────────────┤
│ 6. Partner Network         │ • become_a_partner_opportunity            │
│                            │ • partner_dashboard_franchise_hub         │
├────────────────────────────┼───────────────────────────────────────────┤
│ 7. Global Design System    │ • crazy_capital_design_system (DESIGN.md) │
└────────────────────────────┴───────────────────────────────────────────┘
```

---

## 4. Extracted Design Language & Characteristics

### 4.1 Brand Identity & Personality
- **Concept:** *"Ambitious Reliability"* — Corporate modern with a high-end tech-luxe finish.
- **Audience:** Indian MSME founders, startup entrepreneurs, CA/CS professionals, and retail investors.
- **Visual Style:** Clean light-mode foundation with high contrast, tonal layering, glassmorphism, and bento-grid composition.

### 4.2 Color Palette Hierarchy
| Token Name | Hex Code | Role & Psychological Trigger |
|---|---|---|
| `primary` / `surface-authority` | `#0B0E14` / `#1C1B1C` | Deep Midnight Navy. Institutional trust, primary headings, high authority. |
| `secondary` / `brand-action` | `#4F46E5` / `#4B41E1` | Rich Indigo. Digital innovation, primary interactive CTA buttons, active tabs. |
| `accent-teal` / `progress` | `#0D9488` / `#0C9488` | Progress indicators, success badges, "Filed" / "Verified" states. |
| `accent-gold` / `premium` | `#D97706` / `#FFB800` | Advisory calls, premium membership badges, high-value highlights. |
| `surface-bg` | `#FCF8F9` / `#F9FAFB` | Soft warm off-white background preventing harsh clinical contrast. |
| `surface-card` | `#FFFFFF` | Pure white elevated cards with diffuse ambient shadow. |
| `border-subtle` | `rgba(229, 231, 235, 0.6)` | 1px clean separation borders. |

### 4.3 Typography Strategy
- **Display & Headings:** `Manrope` (Weights: `700 Bold`, `800 ExtraBold`) — Geometric, modern, confident Indian fintech character.
- **Body, Data, & UI Labels:** `Inter` (Weights: `400 Regular`, `500 Medium`, `600 SemiBold`) — High legibility for dense numbers, tables, and form inputs.

### 4.4 Elevation & Depth (Tonal Layering)
- **Level 0 (Base Canvas):** `#F9FAFB`
- **Level 1 (Bento Cards):** `#FFFFFF` + `box-shadow: 0 4px 20px rgba(11, 14, 20, 0.04)` + `rounded-2xl` / `rounded-3xl` (16–24px).
- **Level 2 (Modals / Sticky Bars):** Glassmorphic `backdrop-filter: blur(12px)` with `rgba(255, 255, 255, 0.85)`.
- **Micro-Interaction:** Hover lift `-4px translateY` with `0 12px 32px rgba(11, 14, 20, 0.08)`.

---

## 5. Reusable Component Inventory

### ✅ Components Worth Extracting to `@cc/ui` (Reusable Primitives)
1. **`Button`:** Primary (Indigo), Premium (Gold), Secondary (Ghost/Outline), Destructive (Red), with loading spinner and icon slots.
2. **`Card` / `BentoCard`:** Base container with 16–24px radius, hover-lift micro-transition, and border styling.
3. **`Badge` / `StatusPill`:** Pill-shaped status indicators (`Filed/Verified` [Teal], `Pending/Action Required` [Gold], `Active/In-Progress` [Indigo], `Rejected` [Red]).
4. **`Input` / `Select` / `Textarea`:** Floating label or top-label inputs with 10–12px radius, focused Indigo ring, and error text.
5. **`ProgressBar` / `StepIndicator`:** Linear multi-step progress bar for application lifecycles and wizards.
6. **`StatCard` / `MetricWidget`:** KPI metric card showing value, title, trend percentage (+14.2%), and icon.
7. **`Tabs` / `PillFilter`:** Horizontal tab navigation with active sliding/solid indicator.
8. **`Modal` / `Drawer`:** Slide-over and centered modal dialogs with backdrop blur.
9. **`Accordion`:** Collapsible container for FAQs, document requirements, and workflow steps.

### ❌ Components NOT Worth Extracting (Keep Domain-Specific / One-Off)
1. **Hardcoded Hero Marketing Banners:** Keep in `@cc/web` page composition.
2. **Custom SIP / Loan Range Sliders:** Keep as specialized domain widgets in financial modules.
3. **Specific Testimonial Quoteboxes:** Page-level layout elements.
4. **Hardcoded MCA SPICe+ Stepper SVGs:** Render dynamically from backend `WorkflowStage` data rather than static HTML.

---

## 6. Design Token Architecture & Future Customization

To ensure Crazy Capital can be re-themed, brand-refreshed, or switched to dark mode without touching application logic, we enforce a strict CSS Variable Token Architecture:

```
┌────────────────────────────────────────────────────────┐
│                   DESIGN TOKEN PIPELINE                │
├────────────────────────────────────────────────────────┤
│ 1. Raw Brand Primitives (colors.indigo.600, etc.)      │
│                    ↓                                   │
│ 2. Semantic CSS Variables (--color-surface, etc.)      │
│                    ↓                                   │
│ 3. Tailwind Configuration (bg-surface, text-primary)   │
│                    ↓                                   │
│ 4. Reusable Primitives (@cc/ui: Button, Card, Badge)   │
│                    ↓                                   │
│ 5. Product Page Assemblies (Customer, Admin, Web)      │
└────────────────────────────────────────────────────────┘
```

### Semantic Token Schema
```css
:root {
  /* Surface & Canvas */
  --cc-bg: #f9fafb;
  --cc-surface: #ffffff;
  --cc-surface-elevated: #ffffff;
  --cc-surface-muted: #f3f4f6;

  /* Typography */
  --cc-text-primary: #0b0e14;
  --cc-text-secondary: #4b5563;
  --cc-text-muted: #9ca3af;
  --cc-font-display: 'Manrope', sans-serif;
  --cc-font-sans: 'Inter', sans-serif;

  /* Brand Accents */
  --cc-brand-primary: #4f46e5;
  --cc-brand-primary-hover: #4338ca;
  --cc-brand-gold: #d97706;
  --cc-brand-teal: #0d9488;
  --cc-brand-error: #dc2626;

  /* Borders & Shadows */
  --cc-border: #e5e7eb;
  --cc-border-strong: #d1d5db;
  --cc-radius-sm: 0.375rem; /* 6px */
  --cc-radius-md: 0.75rem;  /* 12px */
  --cc-radius-lg: 1.0rem;   /* 16px */
  --cc-radius-xl: 1.5rem;   /* 24px */
  --cc-radius-full: 9999px;
  --cc-shadow-card: 0 4px 20px rgba(11, 14, 20, 0.04);
  --cc-shadow-elevated: 0 12px 32px rgba(11, 14, 20, 0.08);
}
```

---

## 7. Frontend Domain Architecture Alignment

The monorepo structure cleanly accommodates future portals without architectural friction:

```
apps/
├── admin/          → Admin & Operations Cockpit (CRM, Services, Workflows, Applications 360)
└── web/            → Public Marketing Site, Customer Portal, Partner Portal
packages/
├── ui/             → Reusable UI Primitives (Button, Card, Badge, Modal, Input, Stepper)
├── types/          → Authoritative TypeScript Data Contracts & DTOs
├── validation/     → Zod Schemas & Sanitization
├── shared/         → Shared Formatters (Currency ₹, Date, Status Badges)
└── config/         → ESLint, Prettier, TypeScript & Tailwind Configs
```

---

## 8. UI/UX Governance & Decision Gate

In compliance with the **Critical UI/UX Governance Rule**:
- **Design Tokens & UI Primitives** provide the technical customization layer.
- **No major visual UX layout decisions** (e.g. Visual Workflow Builder, Operations Processing Cockpit layout, Customer Dashboard density) will be finalized without explicit founder review and design direction.

---
*Document maintained by Crazy Capital Engineering Architecture Team.*
