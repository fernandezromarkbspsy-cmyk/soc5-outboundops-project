# Design System Quick Reference

## Color Quick Reference

### Using Colors in CSS
```css
/* Primary Brand */
color: var(--navy);          /* #0d1b2a */
background: var(--indigo);   /* #2563eb */
border: 1px solid var(--line); /* #e5e7eb */

/* Interactive States */
:hover {
  color: var(--cyan);        /* #06b6d4 */
  border-color: var(--cyan);
}

:focus {
  outline: 3px solid rgba(37, 99, 235, 0.2);
  outline-offset: 2px;
}
```

### Common Color Usage
```css
/* Text */
color: var(--ink);      /* Primary text */
color: var(--muted);    /* Secondary text */
color: var(--subtle);   /* Tertiary text */

/* Backgrounds */
background: var(--canvas);      /* Page background */
background: var(--surface);     /* Card background */
background: var(--surface-soft);/* Light background */

/* Borders */
border-color: var(--line);        /* Normal border */
border-color: var(--line-strong); /* Strong border */

/* Status */
color: var(--success);  /* ✓ Positive */
color: var(--warning);  /* ⚠ Caution */
color: var(--danger);   /* ✗ Error */
```

---

## Typography Quick Reference

### Heading Hierarchy
```html
<!-- H1: Large page titles -->
<h1>Dashboard</h1>

<!-- H2: Section titles -->
<h2>Recent Requests</h2>

<!-- H3: Subsections -->
<h3>Driver Information</h3>

<!-- Body text -->
<p>Regular paragraph text</p>

<!-- Small labels -->
<small>Label text</small>
```

### Font Weights
```css
/* 600 - Body emphasis */
font-weight: 600;

/* 700 - Subheadings, important text */
font-weight: 700;

/* 800 - Main headings */
font-weight: 800;
```

---

## Spacing Quick Reference

### Standard Gaps
```css
/* Between items */
gap: 8px;

/* Between sections */
gap: 12px;

/* Between major sections */
gap: 16px;

/* Large spacing */
gap: 24px;
```

### Component Padding
```css
/* Button horizontal padding */
padding: 0 20px;

/* Card padding */
padding: 20px;
padding: 28px; /* Large cards */

/* Form field padding */
padding: 0 11px;
```

### Common Heights
```css
/* Button height */
height: 40px;

/* Small button */
height: 36px;

/* Large button */
height: 44px;

/* Avatar */
width: 40px;
height: 40px;
```

---

## Button Styles

### Primary Button
```html
<button class="primary-button">
  Create Request
</button>
```

```css
.primary-button {
  display: inline-flex;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  border: 0;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--indigo), var(--cyan-dark));
  color: white;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.03em;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
  cursor: pointer;
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.4);
}
```

### Secondary Button
```css
.secondary-button {
  display: inline-flex;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border: 1.5px solid var(--line-strong);
  border-radius: 9px;
  background: white;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  transition: all 0.2s ease;
  cursor: pointer;
}

.secondary-button:hover {
  border-color: var(--indigo);
  color: var(--indigo);
  background: rgba(37, 99, 235, 0.03);
}
```

---

## Card/Panel Styles

### Standard Card
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

### Card Header
```css
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(249,250,251,0.4));
}

.card-header h2 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.card-header p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}
```

---

## Input Fields

### Text Input
```css
input {
  display: block;
  width: 100%;
  height: 40px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: white;
  color: var(--ink);
  font-size: 11px;
  font-family: inherit;
  transition: all 0.2s ease;
}

input:focus {
  outline: 0;
  border-color: var(--indigo);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

input:hover {
  border-color: var(--line-strong);
}
```

---

## Animations

### Slide In Up
```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in-up {
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

### Float Effect
```css
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
}

.animate-float {
  animation: float 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Glow Effect
```css
@keyframes glow {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.2);
  }
}
```

---

## Common Patterns

### Hover Elevation
```css
element {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

element:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
}
```

### Focus Ring (Accessibility)
```css
element:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.2);
  outline-offset: 2px;
}
```

### Gradient Background
```css
background: linear-gradient(
  135deg,
  var(--indigo) 0%,
  var(--cyan-dark) 100%
);
```

### Glass Effect
```css
background: linear-gradient(
  180deg,
  rgba(255,255,255,0.95) 0%,
  rgba(249,250,251,0.92) 100%
);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.2);
```

---

## Dark Mode Support

### Automatic Dark Mode
```css
/* Light mode (default) */
:root {
  --background: #f6f8fb;
  --foreground: #0f1117;
}

/* Dark mode */
.dark {
  --background: #0d1b2a;
  --foreground: #f1f5f9;
}
```

### Using Dark Mode Values
```css
/* Uses automatic switching based on .dark class */
color: var(--foreground);
background: var(--background);

/* Or explicit dark mode targeting */
.dark .element {
  color: var(--foreground);
}
```

---

## Border Radius

### Sizing
```css
/* Small elements */
border-radius: 6px;

/* Default */
border-radius: 9px; /* Buttons, inputs */
border-radius: 12px; /* Cards */

/* Fully rounded */
border-radius: 99px; /* Badges, avatars */
```

---

## Shadow System

### Quick Shadow Reference
```css
/* Subtle shadow */
box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);

/* Medium shadow */
box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);

/* Strong shadow */
box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);

/* Multiple shadows for depth */
box-shadow: 
  0 6px 16px rgba(37, 99, 235, 0.3),
  inset 0 1px 0 rgba(255,255,255,0.2);
```

---

## Icons

### Icon Sizing
```css
/* Standard icon */
width: 18px;
height: 18px;
color: var(--muted);

/* Large icon */
width: 24px;
height: 24px;

/* Small icon */
width: 16px;
height: 16px;

/* Icon in button */
width: 20px;
height: 20px;
```

---

## Responsive Breakpoints

### Mobile First
```css
/* Mobile (default) */
.container {
  grid-template-columns: 1fr;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## Performance Tips

### GPU-Accelerated Properties (Use These)
```css
transform: translateY(-2px);
opacity: 0.5;
```

### Non-GPU Properties (Avoid for animations)
```css
/* Avoid animating these */
box-shadow: /* Slow */
color: /* Causes repaints */
width: /* Causes layout shift */
height: /* Causes layout shift */
```

---

## Accessibility Checklist

- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus states are visible
- [ ] Keyboard navigation works
- [ ] Icons have alt text or aria labels
- [ ] Form inputs have associated labels
- [ ] Motion reduces with prefers-reduced-motion
- [ ] Touch targets are at least 44x44px

---

## File References

- **Colors & Themes**: `frontend/app/globals.css`
- **Component Styles**: `frontend/app/soc5.css`
- **Design Tokens**: `DESIGN_TOKENS.md`
- **Full Documentation**: `UI_ENHANCEMENTS_SUMMARY.md`

---

**Last Updated**: 2025-07-05  
**Quick Reference Version**: 1.0
