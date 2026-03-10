# Web APIs & DOM Reference

Browser APIs, DOM manipulation, and JavaScript Web APIs.

## DOM (Document Object Model)

Tree representation of an HTML document.

### Selecting Elements

```javascript
// Modern selectors (recommended)
document.querySelector('#id');
document.querySelector('.class');
document.querySelector('div[data-id="1"]');
document.querySelectorAll('.items');

// Legacy (still useful)
document.getElementById('id');
document.getElementsByClassName('class');
document.getElementsByTagName('div');
document.getElementsByName('form-field');
```

### Traversal

```javascript
const el = document.querySelector('.parent');

el.children;          // HTMLCollection of child elements
el.childNodes;        // NodeList of all child nodes
el.firstElementChild; // First element child
el.lastElementChild;  // Last element child
el.parentElement;     // Parent element
el.nextElementSibling;
el.previousElementSibling;

// Walking the DOM
el.closest('.ancestor'); // Find closest matching ancestor
```

### Manipulation

```javascript
// Content
el.textContent = 'text'; // Safe
el.innerHTML = '<span>html</span>'; // Dangerous with user input!

// Attributes
el.getAttribute('href');
el.setAttribute('data-id', '123');
el.removeAttribute('disabled');
el.hasAttribute('hidden');

// Classes
el.classList.add('active');
el.classList.remove('active');
el.classList.toggle('active');
el.classList.contains('active');
el.classList.replace('old', 'new');

// Styles
el.style.color = 'red';
el.style.cssText = 'color: red; font-size: 16px;';
getComputedStyle(el).color;

// Position/size
el.getBoundingClientRect(); // { top, left, width, height, ... }
el.offsetWidth, el.offsetHeight;
el.scrollTop, el.scrollLeft;
el.clientWidth, el.clientHeight;
```

### Creating/Removing Elements

```javascript
// Create
const div = document.createElement('div');
div.textContent = 'Hello';
div.classList.add('greeting');

// Insert
parent.appendChild(div);
parent.prepend(div);
parent.insertBefore(div, referenceEl);
referenceEl.insertAdjacentElement('beforebegin', div);
referenceEl.insertAdjacentHTML('afterend', '<span>HTML</span>');

// Remove
el.remove();
parent.removeChild(el);

// Clone
const clone = el.cloneNode(true); // Deep clone

// Fragment (batch insertions)
const fragment = document.createDocumentFragment();
data.forEach(item => {
  const el = document.createElement('li');
  el.textContent = item.name;
  fragment.appendChild(el);
});
list.appendChild(fragment); // Single reflow
```

## Events

### Event Handling

```javascript
// Basic
el.addEventListener('click', handler);
el.removeEventListener('click', handler);

// Options
el.addEventListener('click', handler, {
  once: true,      // Auto-remove after first fire
  passive: true,   // Hints won't call preventDefault (scroll perf)
  capture: true    // Capture phase (opposite of bubble)
});

// Event delegation
document.querySelector('#list').addEventListener('click', (e) => {
  const item = e.target.closest('li');
  if (item) {
    console.log('Clicked item:', item.dataset.id);
  }
});
```

### Event Properties

```javascript
event.target;           // Element that triggered event
event.currentTarget;    // Element with listener
event.preventDefault(); // Prevent default action (follow link, submit form)
event.stopPropagation(); // Stop event bubbling
event.stopImmediatePropagation(); // Stop other listeners too

// Mouse events
event.clientX, event.clientY;  // Viewport-relative
event.pageX, event.pageY;      // Page-relative
event.offsetX, event.offsetY;  // Element-relative

// Keyboard events
event.key;         // "Enter", "ArrowUp", "a"
event.code;        // "KeyA", "Space", "Enter"
event.ctrlKey, event.shiftKey, event.altKey, event.metaKey;
```

### Custom Events

```javascript
const event = new CustomEvent('update', {
  bubbles: true,
  cancelable: true,
  detail: { userId: 123, data: 'value' }
});

element.dispatchEvent(event);

// Listening
document.addEventListener('update', (e) => {
  console.log(e.detail.userId);
});
```

## Storage APIs

### localStorage

```javascript
localStorage.setItem('key', JSON.stringify(data));
const data = JSON.parse(localStorage.getItem('key'));
localStorage.removeItem('key');
localStorage.clear();
```

### sessionStorage

Same API as localStorage, but data clears on tab close.

### IndexedDB

Asynchronous client-side database.

```javascript
const request = indexedDB.open('myDB', 1);

request.onupgradeneeded = (e) => {
  const db = e.target.result;
  const store = db.createObjectStore('users', { keyPath: 'id' });
  store.createIndex('email', 'email', { unique: true });
};

request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('users', 'readwrite');
  const store = tx.objectStore('users');
  store.add({ id: 1, name: 'John', email: 'john@example.com' });
};
```

## Intersection Observer

Detect element visibility.

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // Stop observing
    }
  });
}, {
  threshold: 0.5,     // Trigger at 50% visibility
  rootMargin: '0px 0px -100px 0px' // Margin offset
});

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});
```

## Mutation Observer

Detect DOM changes.

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      console.log('Children changed');
    } else if (mutation.type === 'attributes') {
      console.log(`${mutation.attributeName} changed`);
    }
  });
});

observer.observe(element, {
  childList: true,
  attributes: true,
  subtree: true
});
```

## Resize Observer

Detect element size changes.

```javascript
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    const { width, height } = entry.contentRect;
    console.log(`Resized: ${width}x${height}`);
  });
});

observer.observe(element);
```

## History API

```javascript
// Push state (navigate without reload)
history.pushState({ page: 'about' }, 'About', '/about');
history.replaceState({ page: 'about' }, 'About', '/about');

// Navigate
history.back();
history.forward();
history.go(-2); // Go 2 pages back

// Handle back/forward
window.addEventListener('popstate', (e) => {
  console.log('State:', e.state);
  renderPage(e.state.page);
});
```

## Clipboard API

```javascript
// Copy
await navigator.clipboard.writeText('Text to copy');

// Paste
const text = await navigator.clipboard.readText();

// Copy rich content
await navigator.clipboard.write([
  new ClipboardItem({
    'text/plain': new Blob(['Plain text'], { type: 'text/plain' }),
    'text/html': new Blob(['<b>HTML</b>'], { type: 'text/html' })
  })
]);
```

## Geolocation API

```javascript
if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      console.log('Lat:', pos.coords.latitude);
      console.log('Lng:', pos.coords.longitude);
    },
    (error) => {
      console.error(error.message);
    },
    { timeout: 10000, maximumAge: 60000 }
  );

  // Watch position
  const id = navigator.geolocation.watchPosition(
    (pos) => updateMap(pos)
  );
  navigator.geolocation.clearWatch(id);
}
```

## Broadcast Channel API

Communication between tabs.

```javascript
const channel = new BroadcastChannel('my-channel');

channel.postMessage({ type: 'logout' });

channel.onmessage = (event) => {
  if (event.data.type === 'logout') {
    window.location.href = '/login';
  }
};
```

## Web Workers

Off-main-thread computation.

```javascript
// main.js
const worker = new Worker('/worker.js');
worker.postMessage({ data: largeArray });
worker.onmessage = (e) => console.log('Result:', e.data);

// worker.js
self.onmessage = (e) => {
  const result = processData(e.data.data);
  self.postMessage(result);
};
```

## Glossary Terms

**Key Terms Covered**:
- Accessibility tree, API, ARIA, Browsing context
- Click, Cookie, DOM, Element, Event, Event handler
- Fetch API, History API, IntersectionObserver
- localStorage, MutationObserver, Node (DOM)
- Payload, Service Worker, sessionStorage, SPA
- Web Components, WebSocket, XMLHttpRequest

## Additional Resources

- [MDN DOM Reference](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
- [Web APIs List](https://developer.mozilla.org/en-US/docs/Web/API)
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
