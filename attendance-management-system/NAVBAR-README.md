# Global Navbar Component

This navbar component provides consistent navigation across all pages of the Attendance Management System.

## Files Created:

- `navbar.css` - Navbar styling
- `navbar.js` - Navbar functionality and active state management
- `navbar-template.html` - Example template showing how to integrate

## How to Use:

### 1. Include the CSS and JS files in your HTML:

```html
<!-- In the <head> section -->
<link rel="stylesheet" href="navbar.css" />

<!-- Before closing </body> tag -->
<script src="navbar.js"></script>
```

### 2. Add the navbar HTML to your page:

```html
<div class="navbar">
  <a href="index.html"> <span class="icon">🏠</span> Home </a>
  <a href="add-employee.html"> <span class="icon">👤</span> Add Employee </a>
  <a href="view-employees.html">
    <span class="icon">👥</span> View Employees
  </a>
  <a href="attendance-records.html"> <span class="icon">📊</span> Records </a>
  <a href="fingerprint-verify.html"> <span class="icon">✋</span> Verify </a>
</div>
```

## Features:

1. **Automatic Active State**: The navbar automatically highlights the current page
2. **Responsive Design**: Works on desktop, tablet, and mobile devices
3. **Smooth Hover Effects**: Beautiful animations and transitions
4. **Glass Morphism Style**: Matches the existing design theme
5. **No Changes Required**: Existing files don't need to be modified

## Integration Steps:

1. Copy the navbar HTML block from `navbar-template.html`
2. Paste it into your existing HTML files (usually right after opening the `.glass-card` div)
3. Add the CSS and JS includes to your HTML files
4. The navbar will automatically work with active state detection

## Customization:

- **Colors**: Modify the CSS variables in `navbar.css`
- **Icons**: Change the emoji icons in the HTML
- **Links**: Update the href attributes to match your file structure
- **Responsive**: Adjust breakpoints in the CSS media queries

## Browser Support:

- Chrome, Firefox, Safari, Edge (modern versions)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Supports backdrop-filter for glass effect

No changes are needed to your existing files - just include the navbar component where you want navigation to appear!
