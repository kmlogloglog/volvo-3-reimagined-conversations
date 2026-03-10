# HTML & Markup Reference

HTML5 elements, attributes, and markup best practices.

## HTML5 Document Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Page description for SEO">
  <title>Page Title</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <header>
    <nav>...</nav>
  </header>
  <main>
    <article>
      <section>...</section>
    </article>
    <aside>...</aside>
  </main>
  <footer>...</footer>
  <script src="app.js"></script>
</body>
</html>
```

## Semantic HTML5 Elements

### Document Structure

| Element | Purpose |
|---------|---------|
| `<header>` | Introductory content or navigation |
| `<nav>` | Navigation links |
| `<main>` | Main content (one per page) |
| `<article>` | Self-contained content |
| `<section>` | Thematic grouping of content |
| `<aside>` | Related, supplementary content |
| `<footer>` | Footer content |
| `<h1>–<h6>` | Heading levels (use hierarchy!) |

### Content Elements

| Element | Purpose |
|---------|---------|
| `<p>` | Paragraph |
| `<ul>`, `<ol>`, `<li>` | Lists |
| `<dl>`, `<dt>`, `<dd>` | Description lists |
| `<figure>`, `<figcaption>` | Image with caption |
| `<blockquote>`, `<cite>` | Quotations |
| `<pre>`, `<code>` | Code blocks |
| `<time>` | Date/time |
| `<address>` | Contact information |

### Inline Elements

| Element | Purpose |
|---------|---------|
| `<a>` | Hyperlink |
| `<strong>` | Important text |
| `<em>` | Emphasized text |
| `<abbr>` | Abbreviation |
| `<span>` | Generic inline container |
| `<mark>` | Highlighted text |
| `<small>` | Small print |
| `<sub>`, `<sup>` | Subscript, superscript |
| `<ins>`, `<del>` | Inserted/deleted text |

## Forms

```html
<form action="/submit" method="POST">
  <fieldset>
    <legend>Personal Info</legend>

    <!-- Text input -->
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required autocomplete="name">

    <!-- Email -->
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>

    <!-- Password -->
    <label for="password">Password:</label>
    <input type="password" id="password" minlength="8">

    <!-- Phone -->
    <label for="phone">Phone:</label>
    <input type="tel" id="phone" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}">

    <!-- Number -->
    <label for="quantity">Quantity:</label>
    <input type="number" id="quantity" min="1" max="100" step="1">

    <!-- Date -->
    <label for="birthday">Birthday:</label>
    <input type="date" id="birthday">

    <!-- Textarea -->
    <label for="bio">Bio:</label>
    <textarea id="bio" name="bio" rows="5" cols="30"></textarea>

    <!-- Select -->
    <label for="country">Country:</label>
    <select id="country" name="country">
      <option value="">Select...</option>
      <optgroup label="Europe">
        <option value="uk">United Kingdom</option>
        <option value="de">Germany</option>
      </optgroup>
    </select>

    <!-- Checkboxes -->
    <fieldset>
      <legend>Interests:</legend>
      <label><input type="checkbox" name="interests" value="code"> Coding</label>
      <label><input type="checkbox" name="interests" value="music"> Music</label>
    </fieldset>

    <!-- Radio -->
    <fieldset>
      <legend>Gender:</legend>
      <label><input type="radio" name="gender" value="m"> Male</label>
      <label><input type="radio" name="gender" value="f"> Female</label>
    </fieldset>

    <!-- Range slider -->
    <label for="volume">Volume:</label>
    <input type="range" id="volume" min="0" max="100">

    <!-- File upload -->
    <label for="avatar">Avatar:</label>
    <input type="file" id="avatar" accept="image/*" multiple>

    <!-- Hidden field -->
    <input type="hidden" name="csrf_token" value="abc123">

    <!-- Search -->
    <input type="search" name="q" placeholder="Search...">

    <!-- URL -->
    <input type="url" name="website" placeholder="https://example.com">

    <!-- Color -->
    <input type="color" name="favoriteColor">

    <!-- Submit button -->
    <button type="submit">Submit</button>
    <button type="reset">Reset</button>
  </fieldset>
</form>
```

### Form Validation

```html
<input
  type="email"
  required
  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
  minlength="5"
  maxlength="100"
  title="Enter a valid email address">
```

## Tables

```html
<table>
  <caption>Sales Data</caption>
  <thead>
    <tr>
      <th scope="col">Product</th>
      <th scope="col">Q1</th>
      <th scope="col">Q2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Widget A</td>
      <td>100</td>
      <td>150</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td>Total</td>
      <td colspan="2">250</td>
    </tr>
  </tfoot>
</table>
```

## Media Elements

```html
<!-- Images -->
<img
  src="image.jpg"
  alt="Description"
  width="800"
  height="600"
  loading="lazy"
  decoding="async">

<!-- Responsive images -->
<picture>
  <source media="(min-width: 800px)" srcset="large.webp" type="image/webp">
  <source media="(min-width: 400px)" srcset="medium.webp" type="image/webp">
  <img src="small.jpg" alt="Description">
</picture>

<!-- Srcset for pixel density -->
<img
  srcset="image-300.jpg 300w, image-600.jpg 600w, image-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
  src="image-600.jpg"
  alt="Description">

<!-- Video -->
<video controls width="800" autoplay muted loop>
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English">
  Your browser doesn't support video.
</video>

<!-- Audio -->
<audio controls>
  <source src="audio.ogg" type="audio/ogg">
  <source src="audio.mp3" type="audio/mpeg">
</audio>

<!-- SVG -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="blue"/>
  <text x="50" y="55" text-anchor="middle">SVG</text>
</svg>
```

## Links and Navigation

```html
<!-- External link -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External link
</a>

<!-- Internal link -->
<a href="/about">About page</a>

<!-- Anchor link -->
<a href="#section-1">Jump to section</a>

<!-- Tel/Email -->
<a href="tel:+1234567890">Call us</a>
<a href="mailto:info@example.com?subject=Hello&body=Message">Email us</a>

<!-- Download -->
<a href="report.pdf" download="annual-report">Download PDF</a>
```

## Metadata

```html
<head>
  <!-- Character encoding -->
  <meta charset="UTF-8">

  <!-- Viewport -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- SEO -->
  <meta name="description" content="Page description, 150-160 chars">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://example.com/page">

  <!-- Open Graph (social media) -->
  <meta property="og:title" content="Page Title">
  <meta property="og:description" content="Description">
  <meta property="og:image" content="https://example.com/image.jpg">
  <meta property="og:url" content="https://example.com/page">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Page Title">

  <!-- Preloading -->
  <link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">

  <!-- Icons -->
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">

  <!-- Styles -->
  <link rel="stylesheet" href="styles.css">
</head>
```

## Custom Data Attributes

```html
<div
  data-id="123"
  data-user-name="John"
  data-active="true">
  Content
</div>
```

```javascript
const div = document.querySelector('div');
div.dataset.id; // "123"
div.dataset.userName; // "John"
div.dataset.active; // "true"
```

## Template & Slot (Web Components)

```html
<template id="my-template">
  <style>p { color: blue; }</style>
  <p><slot name="content">Default text</slot></p>
</template>

<my-component>
  <span slot="content">Custom content</span>
</my-component>
```

## Glossary Terms

**Key Terms Covered**:
- Accessible name, Attribute, Block-level content
- Boolean attribute, CDATA, Character reference
- Deprecated, DOCTYPE, Element, Empty element
- Global attribute, HTML, HTML comment
- Hyperlink, Inline-level content, Markup, MathML
- Metadata, Origin, Port, Quirks mode
- Semantics, Tag, Valid

## Additional Resources

- [MDN HTML Reference](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [HTML Living Standard](https://html.spec.whatwg.org/)
- [Web Almanac - HTML](https://almanac.httparchive.org/en/2022/markup)
