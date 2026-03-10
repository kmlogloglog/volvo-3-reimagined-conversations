# CSS & Styling Reference

Comprehensive reference for Cascading Style Sheets, layout systems, and modern styling techniques.

## Core Concepts

### CSS (Cascading Style Sheets)

Style sheet language used for describing the presentation of HTML documents.

**Three Ways to Apply CSS**:

1. **Inline**: `<div style="color: blue;">`
2. **Internal**: `<style>` tag in HTML
3. **External**: Separate `.css` file (recommended)

### The Cascade

The algorithm that determines which CSS rules apply when multiple rules target the same element.

**Priority Order** (highest to lowest):

1. Inline styles
2. ID selectors (`#id`)
3. Class selectors (`.class`), attribute selectors, pseudo-classes
4. Element selectors (`div`, `p`)
5. Inherited properties

**Important**: `!important` declaration overrides normal specificity (use sparingly)

### CSS Selectors

| Selector | Example | Description |
|----------|---------|-------------|
| Element | `p` | Selects all `<p>` elements |
| Class | `.button` | Selects elements with `class="button"` |
| ID | `#header` | Selects element with `id="header"` |
| Universal | `*` | Selects all elements |
| Descendant | `div p` | `<p>` inside `<div>` (any level) |
| Child | `div > p` | Direct child `<p>` of `<div>` |
| Adjacent Sibling | `h1 + p` | `<p>` immediately after `<h1>` |
| General Sibling | `h1 ~ p` | All `<p>` siblings after `<h1>` |
| Attribute | `[type="text"]` | Elements with specific attribute |
| Attribute Contains | `[href*="example"]` | Contains substring |
| Attribute Starts | `[href^="https"]` | Starts with string |
| Attribute Ends | `[href$=".pdf"]` | Ends with string |

### Pseudo-Classes

Target elements based on state or position:

```css
/* Link states */
a:link { color: blue; }
a:visited { color: purple; }
a:hover { color: red; }
a:active { color: orange; }
a:focus { outline: 2px solid blue; }

/* Structural */
li:first-child { font-weight: bold; }
li:last-child { border-bottom: none; }
li:nth-child(odd) { background: #f0f0f0; }
li:nth-child(3n) { color: red; }
p:not(.special) { color: gray; }

/* Form states */
input:required { border-color: red; }
input:valid { border-color: green; }
input:invalid { border-color: red; }
input:disabled { opacity: 0.5; }
input:checked + label { font-weight: bold; }
```

### Pseudo-Elements

Style specific parts of elements:

```css
/* First line/letter */
p::first-line { font-weight: bold; }
p::first-letter { font-size: 2em; }

/* Generated content */
.quote::before { content: '"'; }
.quote::after { content: '"'; }

/* Selection */
::selection { background: yellow; color: black; }

/* Placeholder */
input::placeholder { color: #999; }
```

## Box Model

Every element is a rectangular box with:

1. **Content**: The actual content (text, images)
2. **Padding**: Space around content, inside border
3. **Border**: Line around padding
4. **Margin**: Space outside border

```css
.box {
  width: 300px;
  height: 200px;
  padding: 20px;
  padding: 10px 20px; /* Vertical | Horizontal */
  padding: 10px 20px 15px 25px; /* Top | Right | Bottom | Left */
  border: 2px solid #333;
  border-radius: 8px;
  margin: 20px auto;
  box-sizing: border-box; /* Include padding/border in width/height */
}
```

## Layout Systems

### Flexbox

One-dimensional layout system (row or column):

```css
.container {
  display: flex;
  flex-direction: row; /* row | row-reverse | column | column-reverse */
  flex-wrap: wrap; /* nowrap | wrap | wrap-reverse */
  justify-content: center; /* flex-start | flex-end | center | space-between | space-around | space-evenly */
  align-items: center; /* flex-start | flex-end | center | stretch | baseline */
  align-content: center;
  gap: 1rem;
}

.item {
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 200px;
  flex: 1 1 200px; /* grow | shrink | basis */
  align-self: flex-end;
  order: 2;
}
```

### CSS Grid

Two-dimensional layout system (rows and columns):

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;
  grid-template-columns: repeat(3, 1fr);
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  grid-template-rows: 100px auto 50px;
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
  gap: 1rem;
  justify-items: start;
  align-items: start;
}

.item {
  grid-column: 1 / 3;
  grid-column: span 2;
  grid-row: 1 / 3;
  grid-area: header;
  justify-self: center;
  align-self: center;
}
```

### Grid vs Flexbox

| Use Case | Best Choice |
|----------|-------------|
| One-dimensional layout (row or column) | Flexbox |
| Two-dimensional layout (rows and columns) | Grid |
| Align items along one axis | Flexbox |
| Create complex page layouts | Grid |
| Distribute space between items | Flexbox |
| Precise control over rows and columns | Grid |

## Positioning

```css
.static { position: static; }

.relative {
  position: relative;
  top: 10px;
  left: 20px;
}

.absolute {
  position: absolute;
  top: 0;
  right: 0;
}

.fixed {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

.sticky {
  position: sticky;
  top: 0;
}
```

## Responsive Design

### Media Queries

```css
/* Mobile-first approach */
.container { padding: 1rem; }

@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .container { padding: 3rem; }
}

@media (orientation: landscape) {
  .header { height: 60px; }
}

@media (prefers-color-scheme: dark) {
  body { background: #222; color: #fff; }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Responsive Units

| Unit | Description | Example |
|------|-------------|---------|
| `px` | Pixels (absolute) | `16px` |
| `em` | Relative to parent font-size | `1.5em` |
| `rem` | Relative to root font-size | `1.5rem` |
| `%` | Relative to parent | `50%` |
| `vw` | Viewport width | `50vw` |
| `vh` | Viewport height | `100vh` |
| `ch` | Width of "0" character | `40ch` |
| `fr` | Fraction of available space (Grid only) | `1fr` |

## Typography

```css
.text {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: clamp(14px, 2vw, 20px);
  font-weight: bold;
  line-height: 1.5;
  letter-spacing: 0.05em;
  text-align: left;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: break-word;
}
```

## Animations and Transitions

```css
.button {
  transition: all 0.3s ease;
}

.button:hover {
  background: darkblue;
  transform: scale(1.05);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.element {
  animation: fadeIn 0.5s ease forwards;
}
```

## CSS Variables (Custom Properties)

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --spacing: 1rem;
  --border-radius: 4px;
}

.element {
  color: var(--primary-color);
  padding: var(--spacing);
  color: var(--accent-color, red); /* With fallback */
}
```

## Best Practices

### Do's
- ✅ Use external stylesheets
- ✅ Use class selectors over ID selectors
- ✅ Keep specificity low
- ✅ Use responsive units (rem, em, %)
- ✅ Mobile-first approach
- ✅ Use CSS variables for theming

### Don'ts
- ❌ Use `!important` excessively
- ❌ Use inline styles
- ❌ Use fixed pixel widths
- ❌ Over-nest selectors
- ❌ Use IDs for styling

## Glossary Terms

**Key Terms Covered**:
- Alignment container/subject, Aspect ratio, Baseline
- Block (CSS), Bounding box, Cross Axis, CSS
- CSS Object Model (CSSOM), CSS pixel, CSS preprocessor
- Descriptor (CSS), Fallback alignment, Flex, Flex container
- Flex item, Flexbox, Grid, Grid areas, Grid Axis
- Grid Cell, Grid Column, Grid container, Grid lines
- Grid Row, Grid Tracks, Gutters, Ink overflow
- Inset properties, Layout mode, Logical properties
- Main axis, Media query, Physical properties, Pixel
- Property (CSS), Pseudo-class, Pseudo-element
- Selector (CSS), Stacking context, Style origin
- Stylesheet, Vendor prefix

## Additional Resources

- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [CSS Tricks Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS Tricks Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Can I Use](https://caniuse.com/)
