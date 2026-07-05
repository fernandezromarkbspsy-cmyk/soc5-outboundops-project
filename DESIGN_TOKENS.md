# Design Tokens & CSS Variables

## Color System

### Core Colors
```css
/* Primary Colors */
--navy: #0d1b2a;        /* Main brand color */
--navy-2: #1a2b3d;      /* Darker navy for depth */
--indigo: #2563eb;      /* Action/interactive color */
--indigo-dark: #1e40af; /* Darker state */

/* Accent Colors */
--cyan: #06b6d4;        /* Modern, tech-forward accent */
--cyan-dark: #0891b2;   /* Darker cyan */
--orange: #ff6b35;      /* Alert/notification accent */
--orange-light: #ff8a50;/* Lighter orange */

/* Status Colors */
--success: #10b981;     /* Positive actions/states */
--warning: #f59e0b;     /* Caution/warning states */
--danger: #ef4444;      /* Critical/error states */
--sky: #0ea5e9;         /* Information color */

/* Neutral Colors */
--canvas: #f6f8fb;      /* Page background */
--surface: #ffffff;     /* Card backgrounds */
--surface-soft: #f9fafb;/* Light backgrounds */
--line: #e5e7eb;        /* Default borders */
--line-strong: #d1d5db; /* Stronger borders */
--ink: #0f1117;         /* Primary text */
--muted: #6b7280;       /* Secondary text */
--subtle: #9ca3af;      /* Tertiary text */
```

### Dark Mode Variants
```css
.dark {
  --background: oklch(0.1 0.01 260);      /* Very dark navy */
  --foreground: oklch(0.95 0.002 220);    /* Near white */
  --card: oklch(0.14 0.01 260);           /* Dark card background */
  --primary: oklch(0.65 0.15 195);        /* Bright cyan */
  --secondary: oklch(0.48 0.18 265);      /* Bright indigo */
}
```

---

## Typography Scale

### Font Sizes
```css
/* Headings */
h1 { font-size: 32px; }    /* Large page titles */
h2 { font-size: 24px; }    /* Section titles */
h3 { font-size: 18px; }    /* Subsection titles */

/* Body Text */
body { font-size: 14px; }  /* Default text */
p, span { font-size: 13px; }
small { font-size: 10-12px; } /* Labels, metadata */
```

### Font Weights
```css
/* Weight System */
--light: 400;      /* Rare, only fallback */
--normal: 500;     /* Not typically used */
--medium: 600;     /* Body text emphasis */
--bold: 700;       /* Subheadings, emphasis */
--xbold: 800;      /* Main headings */
```

### Font Families
```css
font-family: 
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI Variable",
  "Inter",
  "Helvetica Neue",
  sans-serif;
```

---

## Spacing Scale

### Margin & Padding
```css
/* 4px base unit */
4px   (1 unit)
8px   (2 units)
12px  (3 units)
16px  (4 units)   /* Most common */
20px  (5 units)
24px  (6 units)   /* Containers */
28px  (7 units)
32px  (8 units)   /* Large spacing */
```

### Gap Values
```css
gap: 8px;    /* Between items */
gap: 12px;   /* Between sections */
gap: 16px;   /* Between major sections */
gap: 24px;   /* Between containers */
```

### Padding
```css
/* Buttons */
padding: 0 20px; /* Horizontal padding */
height: 40px;    /* Vertical padding (implicit) */

/* Cards */
padding: 20-28px; /* Inside containers */

/* Forms */
padding: 0 11px;  /* Input fields */
```

---

## Shadow System

### Elevation Levels
```css
/* Level 1 - Subtle */
--shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.08);

/* Level 2 - Medium */
--shadow-md: 0 4px 16px rgba(15, 23, 42, 0.12);

/* Level 3 - Large */
--shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.16);

/* Inset for depth */
inset 0 1px 0 rgba(255,255,255,.2);
```

### Component Shadows
```css
/* Cards at rest */
box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);

/* Cards on hover */
box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);

/* Buttons */
box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);

/* On hover */
box-shadow: 0 10px 24px rgba(37, 99, 235, 0.4);
```

---

## Border Radius

### Radius Sizes
```css
--radius: 12px;      /* Default */

/* Component-specific */
Border radius sizes:
- Buttons: 9px (slightly rounded)
- Cards: 12px (standard)
- Inputs: 9px (slightly rounded)
- Small elements: 6-8px
- Fully rounded: 99px (badges, avatars)
```

---

## Transitions & Animations

### Timing Functions
```css
/* Primary easing - smooth, natural */
cubic-bezier(0.4, 0, 0.2, 1)

/* Secondary easing - ease-in-out */
ease-in-out

/* Durations */
0.2s   /* Quick interactions */
0.3s   /* Standard transitions */
0.6s   /* Entrances/exits */
1.5s   /* Continuous animations */
2s-3.5s /* Subtle, long animations */
```

### Animation Properties
```css
/* GPU-accelerated */
transform: translateY(-2px);
opacity: 0 → 1;

/* Avoid */
box-shadow: Can use (minimal performance impact)
color: Limited use
```

---

## Component-Specific Tokens

### Sidebar
```css
--sidebar: 280px;                          /* Width */
--sidebar-primary: oklch(0.65 0.15 195);   /* Cyan accent */
--sidebar-border: oklch(0.2 0.02 260);     /* Dark border */
```

### Buttons
```css
Primary Button:
  background: linear-gradient(135deg, var(--indigo), var(--cyan-dark));
  color: white;
  font-weight: 800;
  padding: 0 20px;
  height: 40px;

Secondary Button:
  background: white;
  border: 1.5px solid var(--line);
  color: var(--muted);
```

### Input Fields
```css
Input:
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 0 11px;
  height: 40px;
  
Focus:
  border-color: var(--indigo);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
```

### Cards
```css
Card Base:
  border: 1px solid var(--line);
  border-radius: 12px;
  background: linear-gradient(135deg, #fff, #f9fafb);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);

On Hover:
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
```

---

## Semantic Variables

### Light Mode (Default)
```css
:root {
  --foreground: oklch(0.15 0.02 220);    /* Main text */
  --background: oklch(0.98 0.002 220);   /* Page bg */
  --card: oklch(1 0 0);                  /* Card bg */
  --border: oklch(0.92 0.01 220);        /* Borders */
  --muted: oklch(0.5 0.02 220);          /* Muted text */
}
```

### Dark Mode
```css
.dark {
  --foreground: oklch(0.95 0.002 220);   /* Light text */
  --background: oklch(0.1 0.01 260);     /* Dark bg */
  --card: oklch(0.14 0.01 260);          /* Dark card */
  --border: oklch(0.22 0.01 260);        /* Light borders */
  --muted: oklch(0.68 0.02 220);         /* Light muted */
}
```

---

## Chart Colors

### Data Visualization Palette
```css
--chart-1: oklch(0.48 0.18 265);  /* Indigo (Primary) */
--chart-2: oklch(0.65 0.15 195);  /* Cyan (Secondary) */
--chart-3: oklch(0.5 0.18 25);    /* Orange (Accent) */
--chart-4: oklch(0.55 0.16 280);  /* Purple (Contrast) */
--chart-5: oklch(0.6 0.14 150);   /* Green (Status) */
```

### Usage
```css
Line charts: chart-1 (indigo)
Bar charts: gradient from chart-1 to chart-2
Status charts: chart-3 and chart-5
Mixed: Use all 5 colors for diversity
```

---

## Practical Examples

### Hover State Pattern
```css
element {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

element:hover {
  transform: translateY(-2px);
  border-color: var(--cyan);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.15);
}
```

### Button Pattern
```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  height: 40px;
  border-radius: 9px;
  border: 0;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.03em;
  transition: all 0.2s ease;
  cursor: pointer;
}

.button-primary {
  background: linear-gradient(135deg, var(--indigo), var(--cyan-dark));
  color: white;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.4);
}
```

### Card Pattern
```css
.card {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: linear-gradient(135deg, #fff, #f9fafb);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}
```

---

## Gradient Patterns

### Primary Gradient
```css
background: linear-gradient(135deg, 
  var(--indigo) 0%, 
  var(--cyan-dark) 100%);
```

### Subtle Gradient
```css
background: linear-gradient(135deg, 
  #fff 0%, 
  #f9fafb 100%);
```

### Glass Effect
```css
background: linear-gradient(180deg, 
  rgba(255,255,255,0.95) 0%, 
  rgba(249,250,251,0.92) 100%);
backdrop-filter: blur(12px);
```

---

## Browser Support

- **Modern Browsers**: Full support for all features
- **CSS Variables**: Required
- **Gradients**: Full support
- **Backdrop Filters**: Chrome 76+, Safari 9+, Firefox 103+ (with flag)
- **Animations**: Full GPU acceleration support

---

**Last Updated**: 2025-07-05  
**Version**: 1.0
