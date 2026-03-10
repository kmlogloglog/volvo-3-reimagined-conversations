# HTTP & Networking Reference

HTTP protocol, networking concepts, and web communication.

## HTTP (HyperText Transfer Protocol)

Application-layer protocol for transmitting hypermedia documents.

### HTTP Methods

| Method | Description | Idempotent | Body |
|--------|-------------|------------|------|
| GET | Retrieve resource | ✅ | ❌ |
| POST | Create resource | ❌ | ✅ |
| PUT | Replace resource | ✅ | ✅ |
| PATCH | Partially update | ❌ | ✅ |
| DELETE | Remove resource | ✅ | Optional |
| HEAD | GET without body | ✅ | ❌ |
| OPTIONS | Get allowed methods | ✅ | ❌ |

### HTTP Status Codes

**2xx Success**:
- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `204 No Content` - Success, no body
- `206 Partial Content` - Partial response

**3xx Redirection**:
- `301 Moved Permanently` - Permanent redirect
- `302 Found` - Temporary redirect
- `304 Not Modified` - Cache is fresh
- `307 Temporary Redirect` - Same method
- `308 Permanent Redirect` - Same method

**4xx Client Errors**:
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource doesn't exist
- `405 Method Not Allowed`
- `409 Conflict` - State conflict
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limited

**5xx Server Errors**:
- `500 Internal Server Error`
- `502 Bad Gateway`
- `503 Service Unavailable`
- `504 Gateway Timeout`

### HTTP Headers

**Request Headers**:
```http
GET /api/users HTTP/1.1
Host: api.example.com
Accept: application/json
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
User-Agent: Mozilla/5.0...
```

**Response Headers**:
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 1234
Cache-Control: max-age=3600, public
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Thu, 01 Jan 2023 00:00:00 GMT
Access-Control-Allow-Origin: *
Set-Cookie: session=abc123; HttpOnly; Secure
```

## HTTPS

HTTP over TLS (Transport Layer Security).

### TLS Handshake

1. Client sends "ClientHello" (TLS version, cipher suites)
2. Server responds "ServerHello" + certificate
3. Client verifies certificate
4. Key exchange (generate session key)
5. Encrypted communication begins

### Certificates

```javascript
// Check HTTPS in JavaScript
if (window.location.protocol === 'https:') {
  // Secure connection
}
```

## Fetch API

Modern web API for making HTTP requests.

```javascript
// Basic GET
const response = await fetch('/api/users');
const users = await response.json();

// POST with body
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});

// Error handling
const response = await fetch('/api/data');
if (!response.ok) {
  throw new Error(`HTTP error: ${response.status}`);
}
const data = await response.json();

// AbortController (cancel requests)
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

const response = await fetch('/api/data', {
  signal: controller.signal
});
```

## Caching

### Cache-Control

```http
Cache-Control: no-store         // Never cache
Cache-Control: no-cache         // Must revalidate
Cache-Control: private          // Browser only
Cache-Control: public           // Shared cache
Cache-Control: max-age=3600     // Cache for 1 hour
Cache-Control: s-maxage=3600    // Shared cache duration
Cache-Control: must-revalidate  // Validate when stale
Cache-Control: immutable        // Never changes
```

### ETag

Entity tag for cache validation.

```http
// Response
ETag: "abc123"

// Subsequent request
If-None-Match: "abc123"

// Server response if unchanged
304 Not Modified
```

## CORS (Cross-Origin Resource Sharing)

Security mechanism controlling cross-origin requests.

**Simple Requests**: GET, POST with standard headers

**Preflight Requests**: OPTIONS request sent first

```javascript
// CORS error example
// https://app.example.com fetching https://api.example.com
// ❌ Blocked by CORS if server doesn't allow it
```

**Server Configuration**:
```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

## Cookies

```javascript
// Setting cookies
document.cookie = "username=John; expires=Fri, 31 Dec 2023 23:59:59 GMT; path=/";

// Reading cookies
const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
  const [name, value] = cookie.split('=');
  acc[name] = value;
  return acc;
}, {});
```

**Cookie Attributes**:
- `HttpOnly`: Inaccessible to JavaScript
- `Secure`: Only sent over HTTPS
- `SameSite`: Controls cross-site sending (Strict, Lax, None)
- `Domain`: Which domain receives the cookie
- `Path`: Which paths include cookie
- `Expires/Max-Age`: When cookie expires

## HTTP/2 and HTTP/3

### HTTP/2

- Multiplexing (multiple requests over one connection)
- Header compression (HPACK)
- Server push
- Binary framing

### HTTP/3

- Based on QUIC (UDP, not TCP)
- Better connection establishment
- Improved performance on lossy connections

## WebSockets

Full-duplex communication over a single connection.

```javascript
const ws = new WebSocket('wss://example.com/socket');

ws.onopen = () => ws.send('Hello server!');
ws.onmessage = (event) => console.log('Received:', event.data);
ws.onclose = () => console.log('Disconnected');
ws.onerror = (error) => console.error('Error:', error);

ws.send(JSON.stringify({ type: 'message', data: 'Hello' }));
ws.close();
```

## Server-Sent Events (SSE)

One-way server to client streaming.

```javascript
const evtSource = new EventSource('/api/events');

evtSource.onmessage = (event) => {
  console.log('Event:', event.data);
};

evtSource.addEventListener('update', (event) => {
  console.log('Update:', event.data);
});

evtSource.onerror = () => evtSource.close();
```

## URL Structure

```
https://user:pass@api.example.com:8080/path/to/resource?q=search&page=1#section
└──┬──┘ └──┬────┘ └────────┬──────┘└───┬──┘ └────────┬──────────────┘ └──┬────┘
  scheme  userinfo        host    pathname    querystring               fragment
```

```javascript
const url = new URL('https://example.com/path?q=hello');
url.protocol; // "https:"
url.hostname; // "example.com"
url.pathname; // "/path"
url.searchParams.get('q'); // "hello"
url.hash; // ""
```

## REST API Design

```
GET    /api/posts        // List all posts
GET    /api/posts/1      // Get post by ID
POST   /api/posts        // Create a post
PUT    /api/posts/1      // Update post
PATCH  /api/posts/1      // Partial update
DELETE /api/posts/1      // Delete post

// Nested resources
GET    /api/posts/1/comments
POST   /api/posts/1/comments

// Filtering, sorting, pagination
GET    /api/posts?status=published&sort=createdAt&order=desc&page=2&limit=10
```

## Authentication

### Bearer Token

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Basic Auth

```http
Authorization: Basic dXNlcjpwYXNzd29yZA==
```

### API Key

```http
X-API-Key: your-api-key
```

## Glossary Terms

**Key Terms Covered**:
- CDN, Certificate, Connection, Cookie
- Domain, HTTPS, HTTP, Header, HTTP/2, HTTP/3
- Internet Protocol (IP), IP address, Latency
- Packet, Port, Protocol, Proxy, Request, Response
- Round Trip Time (RTT), Server, Status code
- TCP/IP, TLS, Transfer protocol, URL, WebSocket

## Additional Resources

- [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [HTTP Status Codes](https://httpstatuses.com/)
- [Everything You Need to Know About HTTP Security Headers](https://blog.appcanary.com/2017/http-security-headers.html)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
