# Web Protocols & Standards Reference

Web standards, protocols, and specifications.

## HTTP Versions

### HTTP/1.1

Text-based, one request per connection (with persistent connections).

**Limitations**:
- Head-of-line blocking
- No multiplexing
- Redundant headers

### HTTP/2

Binary protocol, multiplexing, header compression.

**Key Features**:
- Multiple requests over single connection
- Header compression (HPACK)
- Server push
- Request prioritization

```javascript
// HTTP/2 server push (server sends before client requests)
res.push('/style.css', (err, stream) => {
  stream.end(cssContent);
});
```

### HTTP/3 (QUIC)

HTTP over QUIC (UDP-based protocol).

**Benefits**:
- Faster connection establishment
- Better performance on packet loss
- 0-RTT connection resumption

## WebSockets

Full-duplex, bidirectional communication.

```javascript
const ws = new WebSocket('wss://example.com/socket');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'hello' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleMessage(data);
};

ws.onclose = (event) => {
  console.log('Disconnected:', event.code, event.reason);
  // Reconnect logic
};

ws.onerror = (error) => console.error(error);

// Server (Node.js ws library)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    // Broadcast to all clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});
```

## Server-Sent Events (SSE)

Efficient one-way server-to-client streaming.

```javascript
// Client
const es = new EventSource('/api/events');

es.onmessage = (event) => {
  console.log('Data:', event.data);
};

es.addEventListener('custom', (event) => {
  console.log('Custom event:', event.data);
});

es.onerror = () => {
  if (es.readyState === EventSource.CLOSED) {
    console.log('Connection closed');
  }
};

// Server (Node.js)
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data, event) => {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const interval = setInterval(() => {
    sendEvent({ time: new Date().toISOString() });
  }, 1000);

  req.on('close', () => clearInterval(interval));
});
```

**SSE vs WebSockets**:
| Feature | SSE | WebSockets |
|---------|-----|------------|
| Direction | Server → Client | Bidirectional |
| Protocol | HTTP | WebSocket |
| Auto-reconnect | ✅ Built-in | ❌ Manual |
| Binary data | ❌ | ✅ |
| Firewall friendly | ✅ | Sometimes |

## REST (Representational State Transfer)

Architectural style for distributed systems.

**Constraints**:
1. Client-server separation
2. Stateless
3. Cacheable
4. Uniform interface
5. Layered system
6. Code on demand (optional)

**REST Maturity Levels (Richardson Model)**:
- Level 0: One URI, one method
- Level 1: Multiple URIs
- Level 2: HTTP methods
- Level 3: Hypermedia (HATEOAS)

## GraphQL

Query language and runtime for APIs.

```graphql
# Schema definition
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  author: User!
}

type Query {
  user(id: ID!): User
  posts: [Post!]!
}

type Mutation {
  createUser(name: String!, email: String!): User!
}

type Subscription {
  newPost: Post!
}
```

```javascript
// Client (Apollo)
import { useQuery } from '@apollo/client';

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      posts {
        id
        title
      }
    }
  }
`;

function UserProfile({ userId }) {
  const { loading, error, data } = useQuery(GET_USER, {
    variables: { id: userId }
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error!</p>;
  return <div>{data.user.name}</div>;
}
```

## gRPC

High-performance RPC framework using Protocol Buffers.

```protobuf
// service.proto
syntax = "proto3";

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (stream User);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

**Use Cases**: Microservices, real-time streaming, internal APIs

## WebRTC

Real-time communication (audio, video, data).

```javascript
// Peer connection
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// Get media
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});
stream.getTracks().forEach(track => pc.addTrack(track, stream));

// Data channel
const channel = pc.createDataChannel('chat');
channel.onmessage = (e) => console.log(e.data);
channel.send('Hello!');
```

## Web Components

Browser-native custom elements.

```javascript
// Custom element
class MyButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        button { background: blue; color: white; }
      </style>
      <button><slot></slot></button>
    `;
  }

  static get observedAttributes() {
    return ['disabled'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'disabled') {
      this.shadowRoot.querySelector('button').disabled = newVal !== null;
    }
  }
}

customElements.define('my-button', MyButton);
```

```html
<my-button disabled>Click me</my-button>
```

## Web Standards Bodies

### W3C (World Wide Web Consortium)

- HTML/CSS standards
- Accessibility (WCAG)
- Privacy standards

### WHATWG (Web Hypertext Application Technology Working Group)

- Living HTML standard
- URL standard
- Fetch standard

### IETF (Internet Engineering Task Force)

- HTTP protocol
- URI/URL
- DNS

### ECMAScript (ECMA-262)

JavaScript standard (managed by ECMA TC39).

**TC39 Process**:
- Stage 0: Strawman
- Stage 1: Proposal
- Stage 2: Draft
- Stage 3: Candidate
- Stage 4: Finished (included in standard)

## CORS (Cross-Origin Resource Sharing)

```http
# Preflight request
OPTIONS /api/data HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type

# Preflight response
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400

# Actual response
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

## Same-Origin Policy

**Origin** = Protocol + Hostname + Port

- `https://example.com:443` = origin
- Cross-origin requests restricted by default
- CORS headers allow exceptions

## Content Security Policy (CSP)

```http
# Strict CSP
Content-Security-Policy:
  default-src 'none';
  script-src 'self' 'nonce-2726c7f26c';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://images.example.com;
  font-src 'self' https://fonts.googleapis.com;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  form-action 'self';
```

## Glossary Terms

**Key Terms Covered**:
- CORS, CSP, gRPC, GraphQL, HTTP, HTTPS
- HTTP/2, HTTP/3, IETF, MIME, Protocol
- Proxy, REST, RFC, Same-origin policy
- Server push, SSE, Standard, URI, URL, URN
- W3C, WHATWG, WebRTC, WebSocket

## Additional Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [web.dev](https://web.dev/)
- [WHATWG Standards](https://spec.whatwg.org/)
- [W3C Standards](https://www.w3.org/standards/)
- [RFC Index](https://www.rfc-editor.org/rfc-index.html)
