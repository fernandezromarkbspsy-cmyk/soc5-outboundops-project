# UI Modernization Plan

## Color Palette (Light & Clean)
- **Brand**: `#2563eb` (blue-600) - primary actions, links, active states
- **Brand Soft**: `#eff6ff` (blue-50)
- **Background**: `#f8fafc` (slate-50)
- **Surface**: `#ffffff` with refined shadows
- **Ink**: `#0f172a` (slate-900)
- **Muted**: `#64748b` (slate-500)
- **Line**: `#e2e8f0` (slate-200)
- **Line Strong**: `#cbd5e1` (slate-300)
- **Success**: `#059669` (emerald-600)
- **Warning**: `#d97706` (amber-600)
- **Danger**: `#dc2626` (red-600)

## Files to Modify

### Step 1: `_variables.scss` - Color token refresh
- Update SCSS variables with new modern palette
- Update CSS custom properties with refined colors

### Step 2: `_base.scss` - Base typography & reset
- Refined font sizes with better hierarchy
- Improved letter-spacing and line-height
- Modern button reset styling

### Step 3: `_theme.scss` - Core component styles
- Sidebar: lighter, cleaner design
- Topbar: refined spacing, modern look
- Metric cards: cleaner with consistent radius
- Panels & tables: refined borders, spacing, hover states
- Forms & inputs: cleaner focus states
- Remove hardcoded `::after` percentages on metric cards

### Step 4: `_shell-legacy.scss` - Merge & cleanup
- Merge necessary styles into `_theme.scss`
- Remove conflicting/duplicate definitions
- Remove hardcoded metric card `::after` content
- Standardize border-radius values

### Step 5: `_auth.scss` - Auth page polish
- Cleaner login card design
- Refined toggle styles
- Better spacing and typography

### Step 6: `_skeleton.scss` - Loading states
- Polish skeleton pulse animation
- Refined skeleton colors

### Step 7: `_overrides.scss` - Override refinements
- Clean up chart tabs, toggles
- Refined preference controls

### Step 8: `_dark.scss` - Dark mode tune
- Adjust for new brand palette
- Better contrast in dark mode

## Progress Tracking
- [x] Step 1: _variables.scss - ✅ Color token refresh
- [x] Step 2: _base.scss - ✅ Base typography & reset
- [x] Step 3: _theme.scss - Core component style overhaul
- [x] Step 4: _shell-legacy.scss - Merge & cleanup
- [x] Step 5: _auth.scss - Auth page polish
- [x] Step 6: _skeleton.scss - Loading states
- [x] Step 7: _overrides.scss - Override refinements
- [x] Step 8: _dark.scss - Dark mode tune
