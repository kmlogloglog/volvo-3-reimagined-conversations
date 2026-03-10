# Performance Optimization Reference

Web performance techniques, metrics, and best practices.

## Core Web Vitals

Google's metrics for user experience quality.

### LCP (Largest Contentful Paint)

Time to render largest visible content.

**Good**: ≤ 2.5s | **Needs Improvement**: ≤ 4.0s | **Poor**: > 4.0s

**Optimizations**:
- Optimize server response time
- Remove render-blocking resources
- Optimize resource load times
- Preload important resources

### FID (First Input Delay)

Time between user interaction and browser response.

**Good**: ≤ 100ms | **Needs Improvement**: ≤ 300ms | **Poor**: > 300ms

**Optimizations**:
- Break up long tasks
- Code splitting
- Remove unused JavaScript
- Defer non-critical JavaScript

### CLS (Cumulative Layout Shift)

Unexpected layout shifts score.

**Good**: ≤ 0.1 | **Needs Improvement**: ≤ 0.25 | **Poor**: > 0.25

**Optimizations**:
- Set dimensions on images/videos
- Reserve space for dynamic content
- Avoid inserting content above existing

### INP (Interaction to Next Paint)

Responsiveness to all user interactions.

**Good**: ≤ 200ms | **Needs Improvement**: ≤ 500ms | **Poor**: > 500ms

## Loading Performance

### Resource Hints

```html
<!-- Preconnect to required origins -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://cdn.example.com" crossorigin>

<!-- Prefetch for next navigation -->
<link rel="prefetch" href="/about.html">

<!-- Preload critical resources -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="hero.jpg" as="image">
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- DNS prefetch -->
<link rel="dns-prefetch" href="https://api.example.com">
```

### Critical Rendering Path

```html
<!-- Inline critical CSS -->
<head>
  <style>
    /* Critical above-the-fold styles */
    body { margin: 0; font-family: sans-serif; }
    header { height: 64px; background: #fff; }
  </style>
  <!-- Load non-critical CSS asynchronously -->
  <link rel="preload" href="main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
</head>

<!-- Defer non-critical JS -->
<script defer src="app.js"></script>
<script async src="analytics.js"></script>
```

### Image Optimization

```html
<!-- Lazy loading -->
<img loading="lazy" src="image.jpg" alt="..." width="800" height="600">

<!-- Modern formats with fallbacks -->
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="..." width="800" height="600">
</picture>

<!-- Priority for LCP image -->
<img fetchpriority="high" src="hero.jpg" alt="..." width="1920" height="1080">
```

### Code Splitting

```javascript
// Dynamic imports (webpack/vite)
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Route-based splitting (Next.js automatically)
// Each page becomes its own chunk

// Manual chunking (vite)
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns']
        }
      }
    }
  }
};
```

## Runtime Performance

### Avoid Forced Layout (Reflow)

```javascript
// ❌ Bad: read-write cycle causes forced reflow
for (const el of elements) {
  el.style.width = el.offsetWidth + 10 + 'px'; // Forces reflow!
}

// ✅ Good: batch reads, then writes
const widths = elements.map(el => el.offsetWidth); // Batch reads
elements.forEach((el, i) => {
  el.style.width = widths[i] + 10 + 'px'; // Batch writes
});

// ✅ Better: use CSS transforms (don't trigger layout)
el.style.transform = 'translateX(10px)';
```

### RequestAnimationFrame

```javascript
// For animations and DOM updates
function animate() {
  // Update logic here
  element.style.transform = `translateX(${position}px)`;
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

### Debouncing and Throttling

```javascript
// Debounce: delay execution until settled
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const handleResize = debounce(() => {
  recalculateLayout();
}, 250);

// Throttle: limit execution rate
function throttle(fn, interval) {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn(...args);
    }
  };
}

const handleScroll = throttle(() => {
  updateScrollPosition();
}, 100);
```

### Web Workers

```javascript
// main.js - Off-load heavy work to worker
const worker = new Worker('/worker.js');
worker.postMessage({ data: heavyData });
worker.onmessage = (e) => {
  console.log('Worker result:', e.data);
};

// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};
```

## Caching

### HTTP Caching

```http
# Cache static assets long-term (content-hashed filenames)
Cache-Control: public, max-age=31536000, immutable

# Never cache HTML (so updates propagate)
Cache-Control: no-cache

# Stale-while-revalidate
Cache-Control: max-age=60, stale-while-revalidate=60
```

### Service Worker Cache

```javascript
// sw.js
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll(['/index.html', '/app.js', '/style.css']);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request);
    })
  );
});
```

## Measurement Tools

### Performance API

```javascript
// Navigation timing
const nav = performance.getEntriesByType('navigation')[0];
const loadTime = nav.loadEventEnd - nav.startTime;

// Resource timing
const resources = performance.getEntriesByType('resource');
resources.forEach(r => {
  console.log(`${r.name}: ${r.duration.toFixed(0)}ms`);
});

// User timing (custom marks)
performance.mark('my-start');
doSomeWork();
performance.mark('my-end');
performance.measure('my-work', 'my-start', 'my-end');
```

### Long Tasks API

```javascript
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    if (entry.duration > 50) {
      console.warn(`Long task: ${entry.duration.toFixed(0)}ms`);
    }
  });
});
observer.observe({ type: 'longtask', buffered: true });
```

## JavaScript Performance

### Memoization

```javascript
function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

const expensiveFn = memoize((n) => n * n);
```

### Virtual DOM / Virtualization

List virtualization for long lists:

```javascript
// react-window example
import { FixedSizeList } from 'react-window';

function Row({ index, style }) {
  return <div style={style}>Row {index}</div>;
}

function LongList() {
  return (
    <FixedSizeList
      height={400}
      itemCount={10000}
      itemSize={35}
      width="100%">
      {Row}
    </FixedSizeList>
  );
}
```

## CSS Performance

```css
/* Use GPU-composited properties for animations */
.element {
  transform: translateZ(0); /* Force GPU layer */
  will-change: transform; /* Hint browser (use sparingly) */
}

/* Prefer transform/opacity for animation (no layout/paint) */
.animate {
  /* ✅ Composite only */
  transition: transform 0.3s, opacity 0.3s;
}

/* ❌ Avoid (triggers layout) */
.bad-animate {
  transition: width 0.3s, height 0.3s, left 0.3s;
}

/* Content visibility */
.off-screen {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```

## Glossary Terms

**Key Terms Covered**:
- Bandwidth, Bottleneck, Bundle, Cache, CDN
- CLS, Core Web Vitals, Debounce, FOUT/FOIT
- FCP, FID, INP, Jank, LCP, Lazy load, Main thread
- Memoization, Minify, Paint, Prefetch, Preload
- Progressive loading, Render blocking, Reflow
- Throttle, Time to Interactive (TTI), TTFB
- Tree shaking, Virtualization, Web Vitals

## Additional Resources

- [web.dev Performance](https://web.dev/performance/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse Metrics](https://web.dev/metrics/)
- [Core Web Vitals](https://web.dev/vitals/)
