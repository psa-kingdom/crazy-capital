---
name: Crazy Capital Design System
colors:
  surface: '#fcf8f9'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf8f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f3'
  surface-container: '#f1eded'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e2'
  on-surface: '#1c1b1c'
  on-surface-variant: '#45474b'
  inverse-surface: '#313031'
  inverse-on-surface: '#f3f0f0'
  outline: '#76777b'
  outline-variant: '#c6c6cb'
  surface-tint: '#5c5e66'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#191c22'
  on-primary-container: '#81848c'
  inverse-primary: '#c4c6cf'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00201d'
  on-tertiary-container: '#0c9488'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e2eb'
  primary-fixed-dim: '#c4c6cf'
  on-primary-fixed: '#191c22'
  on-primary-fixed-variant: '#44474e'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#fcf8f9'
  on-background: '#1c1b1c'
  surface-variant: '#e5e2e2'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 64px
---

## Brand & Style

The design system is engineered to evoke a sense of "Ambitious Reliability." It bridges the gap between traditional Indian financial institutionalism and the fast-paced innovation of the global fintech landscape. The aesthetic is **Corporate Modern with a Tech-Luxe edge**, utilizing high-end finishing details like glassmorphism and bento-grid structures to signal a premium, data-driven experience.

The system targets high-growth MSMEs, startup founders, and sophisticated individual investors. The visual language moves away from the cluttered, high-density interfaces common in traditional banking, favoring spaciousness, clarity, and intentional hierarchy to reduce cognitive load during complex financial decision-making.

## Colors

The palette is anchored by **Deep Midnight Navy (#0B0E14)**, used for primary typography and high-authority surfaces to establish trust. **Rich Indigo (#4F46E5)** serves as the primary action color, representing innovation and the digital-first nature of the platform.

**Teal (#0D9488)** is reserved for "Progress" indicators—growth charts, "Active" statuses, and success states—while **Warm Gold (#D97706)** is applied sparingly for premium calls-to-action (CTAs) and membership-tier highlights. Backgrounds utilize a soft **Off-White (#F9FAFB)** with subtle **Light Lavender (#F3F4F6)** washes for section differentiation, ensuring that white content cards "pop" with distinct elevation.

## Typography

This design system employs a dual-font strategy. **Manrope** is used for headlines and display text to provide a modern, geometric character that feels both welcoming and authoritative. **Inter** is utilized for body text, data points, and labels to ensure maximum legibility at smaller scales, particularly for complex financial dashboards.

For mobile, display sizes scale down aggressively to maintain a single-screen narrative without excessive scrolling. Use **Bold (700)** or **ExtraBold (800)** for primary headings to create a strong visual anchor against the spacious layout.

## Layout & Spacing

The system follows a **Fluid Grid** model with a maximum container width of 1280px for desktop. It uses a 12-column structure on desktop, 8-column on tablet, and 4-column on mobile. 

Layouts should favor the **Bento Grid** philosophy—grouping related financial data into distinct, rounded containers of varying sizes. This modularity allows for a responsive reflow where widgets can stack vertically on mobile while maintaining their internal proportions. Spacing is generous; "White Space" is treated as a premium asset to prevent the interface from feeling "cheap" or "crowded."

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Glassmorphism**.
- **Level 0 (Background):** Soft Off-White (#F9FAFB).
- **Level 1 (Cards):** Pure White (#FFFFFF) with a very soft, diffused shadow (0px 4px 20px rgba(11, 14, 20, 0.04)).
- **Level 2 (Modals/Popovers):** White with a 1px border (#E5E7EB) and a deeper shadow (0px 12px 32px rgba(11, 14, 20, 0.08)).
- **Glass Effects:** Used for sticky headers and navigation bars. Apply a `backdrop-filter: blur(12px)` with a semi-transparent white background (rgba(255, 255, 255, 0.8)) to maintain context while scrolling.

## Shapes

The design system features a distinctive **Rounded** aesthetic to appear approachable and modern. 
- **Standard Cards/Sections:** 24px corner radius.
- **Buttons & Inputs:** 12px corner radius.
- **Status Badges:** Fully pill-shaped (100px) for immediate visual distinction from other interactive elements.

This high radius count softens the "hard math" often associated with finance, making the platform feel more like a lifestyle tool than a tax ledger.

## Components

### Service Cards
Elegant containers for MSME services. Use 24px padding, Manrope Bold for titles, and a subtle icon in the top right. On hover, the card should lift slightly with an increased shadow.

### Status Badges
- **Filed:** Teal background (10% opacity) with Teal text.
- **Pending:** Warm Gold background (10% opacity) with Gold text.
- **Active:** Rich Indigo background (10% opacity) with Indigo text.

### Buttons
- **Primary:** Rich Indigo background with White text.
- **Premium CTA:** Warm Gold background with White text; use for "Upgrade" or "Consult Expert."
- **Secondary:** Ghost style with a 1px border of Deep Midnight Navy.

### Interactive Calculators
Use large, thumb-friendly range sliders with Indigo accents. Result displays should use `display-lg` typography to emphasize the value proposition (e.g., "You can save ₹50,000").

### Mobile Navigation
A fixed-bottom **Sticky Navigation Bar** using glassmorphism. Icons should be 24px with active states highlighted in Rich Indigo. Ensure a "safe area" at the bottom for modern gesture-based smartphones.