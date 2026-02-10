# TonicsTools UI/UX Revamp - Design Reference

## Design Inspiration
Source: Dribbble - "Zarss" Dashboard Design

---

## Color Palette

### Primary Colors
```css
--color-background: #F5F3EE;        /* Light beige/cream - main background */
--color-sidebar: #1E1E1E;           /* Dark charcoal - sidebar background */
--color-sidebar-dark: #171717;      /* Darker shade for sidebar header */
--color-primary: #7D8B4A;           /* Olive/army green - primary accent */
--color-primary-light: #8FA055;     /* Lighter olive for hover states */
--color-primary-dark: #6B7B3A;      /* Darker olive for active states */
```

### Neutral Colors
```css
--color-white: #FFFFFF;
--color-card: #FFFFFF;
--color-text-primary: #1A1A1A;      /* Main headings */
--color-text-secondary: #6B6B6B;    /* Secondary text */
--color-text-muted: #9CA3AF;        /* Muted/placeholder text */
--color-text-light: #FFFFFF;        /* Text on dark backgrounds */
--color-border: #E5E5E5;            /* Subtle borders */
--color-divider: #F0F0F0;           /* Dividers */
```

### Accent Colors
```css
--color-success: #4CAF50;           /* Green - completed/success */
--color-success-light: #E8F5E9;     /* Light green background */
--color-warning: #D4A846;           /* Gold/yellow - warnings/highlights */
--color-warning-light: #FFF8E1;     /* Light yellow background */
--color-error: #EF4444;             /* Red - errors */
--color-error-light: #FEE2E2;       /* Light red background */
--color-info: #3B82F6;              /* Blue - info */
--color-info-light: #EFF6FF;        /* Light blue background */
```

### Chart Colors
```css
--chart-bar: #2D2D2D;               /* Dark bars */
--chart-bar-hover: #1A1A1A;         /* Darker on hover */
--chart-donut-1: #D4A846;           /* Gold segment */
--chart-donut-2: #7D8B4A;           /* Green segment */
--chart-donut-3: #E5E5E5;           /* Gray segment */
```

---

## Typography

### Font Family
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
/* Alternative options: 'Poppins', 'DM Sans', 'Plus Jakarta Sans' */
```

### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px - badges, small labels */
--text-sm: 0.875rem;     /* 14px - secondary text, captions */
--text-base: 1rem;       /* 16px - body text */
--text-lg: 1.125rem;     /* 18px - subheadings */
--text-xl: 1.25rem;      /* 20px - card titles */
--text-2xl: 1.5rem;      /* 24px - section titles */
--text-3xl: 1.875rem;    /* 30px - page titles */
--text-4xl: 2.25rem;     /* 36px - large stats */
--text-5xl: 3rem;        /* 48px - hero numbers */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

---

## Spacing System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## Border Radius

```css
--radius-sm: 0.375rem;   /* 6px - small elements */
--radius-md: 0.5rem;     /* 8px - buttons, inputs */
--radius-lg: 0.75rem;    /* 12px - cards */
--radius-xl: 1rem;       /* 16px - large cards */
--radius-2xl: 1.5rem;    /* 24px - modals, large containers */
--radius-full: 9999px;   /* Pills, avatars */
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04);  /* Subtle card shadow */
```

---

## Layout Structure

### Sidebar
- Width: 260px (desktop), collapsible to 80px
- Background: Dark charcoal (#1E1E1E)
- User profile section at top with avatar
- Navigation items with icons
- Active state: Olive green background with white text
- Hover state: Subtle lighter background

### Main Content Area
- Background: Light beige (#F5F3EE)
- Padding: 24px - 32px
- Max content width: 1400px (centered)

### Cards
- Background: White
- Border radius: 12px - 16px
- Padding: 20px - 24px
- Shadow: Subtle (shadow-card)
- No borders, rely on shadow for depth

### Grid System
- 12-column grid
- Gap: 24px
- Responsive breakpoints:
  - Mobile: < 640px (1 column)
  - Tablet: 640px - 1024px (2 columns)
  - Desktop: > 1024px (3-4 columns)

---

## Component Styles

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: background 0.2s ease;
}
.btn-primary:hover {
  background: var(--color-primary-dark);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 12px 24px;
  border-radius: var(--radius-md);
}
```

#### Ghost Button (Sidebar)
```css
.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
  padding: 12px 16px;
  border-radius: var(--radius-md);
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}
.btn-ghost.active {
  background: var(--color-primary);
  color: white;
}
```

### Inputs
```css
.input {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: var(--text-sm);
}
.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(125, 139, 74, 0.1);
}
```

### Search Bar
```css
.search {
  background: white;
  border-radius: var(--radius-full);
  padding: 12px 20px 12px 48px;
  border: none;
  box-shadow: var(--shadow-sm);
}
```

### Stat Cards
```css
.stat-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-card .label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
.stat-card .value {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}
.stat-card .badge {
  background: var(--color-primary-light);
  color: white;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
}
```

### Badge/Tag
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}
.badge-success {
  background: var(--color-success-light);
  color: var(--color-success);
}
.badge-warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}
```

### Avatar
```css
.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
}
.avatar-lg {
  width: 64px;
  height: 64px;
}
```

### Table
```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.table th {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  text-align: left;
}
.table td {
  padding: 16px;
  border-bottom: 1px solid var(--color-divider);
}
.table tr:hover {
  background: rgba(0, 0, 0, 0.02);
}
```

---

## Charts

### Bar Chart
- Bar color: Dark charcoal (#2D2D2D)
- Bar radius: 4px (top corners)
- Grid lines: Light gray, dashed
- Labels: Small, muted gray

### Donut Chart
- Segments: Gold, Olive, Light gray
- Center text: Large, bold number
- Legend: Small text with colored indicators

### Line Chart (for sparklines)
- Line: Olive green
- Fill: Gradient olive to transparent
- Smooth curves

---

## Icons
- Style: Outlined/linear (not filled)
- Size: 20px - 24px
- Color: Inherit from parent
- Recommended: Lucide React, Heroicons, or Phosphor Icons

---

## Animations & Transitions

```css
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;

/* Common transitions */
.hover-lift {
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

---

## Page-Specific Guidelines

### Dashboard
- Top stats row with 3-4 cards
- Main chart (bar chart) showing weekly/monthly data
- Recent activity list
- Quick actions section

### Phone Numbers Page
- Search and filter bar at top
- Country/service selector with flags
- Pricing cards with clear CTAs
- Active orders list

### eSIM Page
- Package cards with data amounts
- Country selector with flags
- Purchase flow modal
- My eSIMs list with status badges

### Wallet Page
- Balance card (prominent)
- Quick fund buttons
- Transaction history table
- Fund wallet modal

### Settings Page
- Sectioned layout
- Toggle switches for boolean options
- Input groups for related settings
- Save button fixed at bottom

---

## Responsive Design

### Mobile (< 640px)
- Sidebar: Hidden, hamburger menu
- Cards: Full width, stacked
- Tables: Horizontal scroll or card view
- Navigation: Bottom tab bar option

### Tablet (640px - 1024px)
- Sidebar: Collapsible icon-only mode
- Cards: 2-column grid
- Reduced padding

### Desktop (> 1024px)
- Full sidebar visible
- 3-4 column grids
- All features visible

---

## Implementation Priority

### Phase 1: Foundation
1. Set up CSS variables (colors, typography, spacing)
2. Create base Tailwind config
3. Update global styles

### Phase 2: Layout
1. Revamp sidebar navigation
2. Update main layout wrapper
3. Implement responsive grid

### Phase 3: Components
1. Buttons and inputs
2. Cards and badges
3. Tables and lists
4. Charts

### Phase 4: Pages
1. Dashboard
2. Phone Numbers
3. eSIM
4. Wallet
5. Settings

---

## Files to Update
- `frontend/tailwind.config.js` - Add custom theme
- `frontend/src/index.css` - Global styles
- `frontend/src/components/layout/` - Layout components
- `frontend/src/components/ui/` - UI components
- All page components in `frontend/src/pages/`

---

## Notes
- Maintain accessibility (WCAG 2.1 AA)
- Ensure dark mode compatibility in future
- Use CSS Grid for complex layouts
- Prefer Tailwind utilities over custom CSS
- Keep bundle size in mind - use tree-shaking
