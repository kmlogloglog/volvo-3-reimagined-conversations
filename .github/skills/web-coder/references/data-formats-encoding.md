# Data Formats & Encoding Reference

Data formats, character encodings, and serialization for web development.

## JSON (JavaScript Object Notation)

Lightweight data interchange format.

### Syntax

```json
{
  "string": "value",
  "number": 42,
  "boolean": true,
  "null": null,
  "array": [1, 2, 3],
  "object": {
    "nested": "value"
  }
}
```

**Permitted Types**: string, number, boolean, null, array, object
**Not Permitted**: undefined, functions, dates, RegExp

### JavaScript Methods

```javascript
// Parse JSON string
const data = JSON.parse('{"name":"John","age":30}');

// Stringify object
const json = JSON.stringify({ name: 'John', age: 30 });

// Pretty print (indentation)
const json = JSON.stringify(data, null, 2);

// Custom serialization
const json = JSON.stringify(obj, (key, value) => {
  if (key === 'password') return undefined; // Exclude
  return value;
});
```

### JSON Type Representation

How JavaScript types map to JSON:
- String → string
- Number → number
- Boolean → boolean
- null → null
- Array → array
- Object → object
- undefined → omitted
- Function → omitted
- Symbol → omitted
- Date → ISO 8601 string

## XML (Extensible Markup Language)

Markup language for encoding documents.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user id="1">
    <name>John Doe</name>
    <email>john@example.com</email>
  </user>
</users>
```

**Use Cases**: Configuration files, data exchange, RSS/Atom feeds, SOAP web services

### Parsing XML in JavaScript

```javascript
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

const users = xmlDoc.querySelectorAll('user');
users.forEach(user => {
  const name = user.querySelector('name').textContent;
  console.log(name);
});
```

## Character Encoding

### UTF-8

Universal character encoding (recommended for web).

**Characteristics**:
- Variable-width (1-4 bytes per character)
- Backward compatible with ASCII
- Supports all Unicode characters

```html
<meta charset="UTF-8">
```

### UTF-16

2 or 4 bytes per character. JavaScript internally uses UTF-16.

```javascript
'A'.charCodeAt(0); // 65
String.fromCharCode(65); // 'A'
'😀'.length; // 2 (surrogate pair in UTF-16)
```

### ASCII

7-bit encoding (128 characters, 0-127).

### Code Point vs Code Unit

```javascript
// Code points
'A'.codePointAt(0); // 65
String.fromCodePoint(0x1F600); // '😀'

// Iterate code points
for (const char of 'Hello 😀') {
  console.log(char);
}
```

## Base64

Binary-to-text encoding scheme.

```javascript
// Encode
const encoded = btoa('Hello World'); // "SGVsbG8gV29ybGQ="

// Decode
const decoded = atob('SGVsbG8gV29ybGQ='); // "Hello World"

// Modern approach
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytes = encoder.encode('Hello 世界');
const decoded = decoder.decode(bytes);
```

**Use Cases**: Embed binary data in JSON/XML, Data URLs, Basic authentication headers

## URL Encoding (Percent Encoding)

```javascript
const encoded = encodeURIComponent('Hello World!'); // "Hello%20World%21"
const decoded = decodeURIComponent(encoded); // "Hello World!"

// Modern URL API
const url = new URL('http://example.com/search');
url.searchParams.set('q', 'hello world');
console.log(url.toString()); // Automatically encoded
```

## MIME Types

### Common MIME Types

| Type | MIME Type |
|------|-----------|
| HTML | `text/html` |
| CSS | `text/css` |
| JavaScript | `text/javascript` |
| JSON | `application/json` |
| XML | `application/xml` |
| JPEG | `image/jpeg` |
| PNG | `image/png` |
| SVG | `image/svg+xml` |
| PDF | `application/pdf` |
| MP4 Video | `video/mp4` |
| Form Data | `application/x-www-form-urlencoded` |
| Multipart | `multipart/form-data` |

## Data Structures

### Map

Keyed collections (any type as key):
```javascript
const map = new Map();
map.set('key', 'value');
map.set(obj, 'value');
map.get('key');
map.has('key');
map.delete('key');
```

### Set

Unique values:
```javascript
const set = new Set([1, 2, 2, 3]); // {1, 2, 3}
set.add(4);
set.has(2); // true
set.delete(1);
```

## Character References

HTML entities for special characters.

```html
&lt;    <!-- < -->
&gt;    <!-- > -->
&amp;   <!-- & -->
&quot;  <!-- " -->
&apos;  <!-- ' -->
&nbsp;  <!-- non-breaking space -->
&copy;  <!-- © -->
&#8364; <!-- € -->
```

## Data URLs

```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANS..." alt="Icon">
<img src="data:image/svg+xml,%3Csvg xmlns='...'%3E...%3C/svg%3E" alt="Logo">
```

```javascript
const canvas = document.querySelector('canvas');
const dataURL = canvas.toDataURL('image/png');
```

## Glossary Terms

**Key Terms Covered**:
- ASCII, Base64, Character, Character encoding
- Character reference, Character set, Code point
- Code unit, Data structure, Deserialization
- Enumerated, Escape character, JSON
- JSON type representation, MIME, MIME type
- Percent-encoding, Serialization, Serializable object
- Unicode, URI, URL, URN, UTF-8, UTF-16

## Additional Resources

- [JSON Specification](https://www.json.org/)
- [Unicode Standard](https://unicode.org/standard/standard.html)
- [MDN Character Encodings](https://developer.mozilla.org/en-US/docs/Glossary/Character_encoding)
- [MIME Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
