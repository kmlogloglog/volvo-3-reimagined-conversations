# Servers & Infrastructure Reference

Web servers, hosting, deployment, and infrastructure concepts.

## Web Servers

### Nginx

High-performance HTTP server and reverse proxy.

```nginx
# Basic configuration
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache control
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SSL
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
}
```

### Apache

Traditional web server with `.htaccess` configuration.

```apache
# .htaccess
Options -Indexes
DirectoryIndex index.html index.php

# Redirects
Redirect 301 /old-page /new-page
RewriteEngine On
RewriteRule ^([^.]+)$ $1.html [NC,L]

# Compression
AddOutputFilterByType DEFLATE text/plain text/css application/json

# Cache
ExpiresActive On
ExpiresByType image/jpeg "access plus 1 year"
```

## Node.js HTTP Server

```javascript
// Built-in http module
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Hello World</h1>');
  } else if (req.url === '/api/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: 'value' }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000, () => console.log('Server running on port 3000'));
```

### Express.js

```javascript
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/api/users', async (req, res) => {
  const users = await db.getUsers();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const user = await db.createUser(req.body);
  res.status(201).json(user);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000);
```

## DNS (Domain Name System)

Translates domain names to IP addresses.

### Record Types

| Record | Purpose | Example |
|--------|---------|---------|
| A | Maps domain to IPv4 | `example.com → 93.184.216.34` |
| AAAA | Maps domain to IPv6 | `example.com → 2001:db8::1` |
| CNAME | Alias to another domain | `www → example.com` |
| MX | Mail server | `example.com → mail.example.com` |
| TXT | Text records (SPF, DKIM) | `"v=spf1 include:..."` |
| NS | Nameservers | `example.com → ns1.provider.com` |
| SOA | Start of authority | Zone metadata |

### DNS Lookup Process

1. Browser cache
2. OS cache / hosts file
3. Recursive resolver (ISP)
4. Root nameservers
5. TLD nameservers
6. Authoritative nameserver

## CDN (Content Delivery Network)

Geographically distributed servers for static assets.

**Benefits**:
- Reduced latency
- Faster content delivery
- DDoS protection
- Reduced origin server load

**Providers**: Cloudflare, AWS CloudFront, Fastly, Akamai

## Containerization

### Docker

```dockerfile
# Dockerfile for Node.js app
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t my-app .
docker run -p 3000:3000 my-app

# Docker Compose
docker-compose up -d
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports: ['3000:3000']
    environment:
      NODE_ENV: production
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: mydb
```

### Kubernetes

Container orchestration.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: my-app:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

## Cloud Platforms

### Deployment Options

| Platform | Type | Best For |
|----------|------|---------|
| Vercel | Edge/Serverless | Next.js, static sites |
| Netlify | Edge/Serverless | JAMstack, static sites |
| AWS | Full cloud | Any scale |
| Google Cloud | Full cloud | Any scale |
| Azure | Full cloud | Enterprise |
| Heroku | PaaS | Simple deployments |
| Fly.io | PaaS | Containerized apps |
| Railway | PaaS | Simple deployments |

### Static Site Hosting

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# GitHub Pages
# Just push to gh-pages branch
```

## Environment Configuration

```javascript
// .env (never commit to git!)
DATABASE_URL=postgresql://localhost:5432/mydb
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-key
API_KEY=abc123
NODE_ENV=production
PORT=3000

// process.env
const dbUrl = process.env.DATABASE_URL;
const port = process.env.PORT || 3000;
```

## Load Balancing

Distribute traffic across multiple servers.

**Algorithms**:
- **Round robin**: Sequential distribution
- **Least connections**: Route to least busy
- **IP hash**: Same client → same server
- **Weighted**: Priority-based distribution

**Nginx Load Balancer**:
```nginx
upstream backend {
    server server1.example.com weight=5;
    server server2.example.com weight=3;
    server server3.example.com weight=2;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

## Process Management

### PM2 (Node.js)

```bash
pm2 start app.js -i max  # Cluster mode
pm2 start app.js --watch
pm2 logs
pm2 monit
pm2 save
pm2 startup
```

## Health Checks

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Liveness/readiness checks
app.get('/ready', async (req, res) => {
  try {
    await db.ping();
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});
```

## Glossary Terms

**Key Terms Covered**:
- Certificate, CDN, Cloud, Container
- Database, Deployment, DNS, Domain
- Environment variable, HTTPS, Infrastructure
- IPv4, IPv6, Load balancer, Microservices
- Middleware, Node.js, Proxy, Serverless
- Server, SSH, SSL/TLS, Static site

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Docs](https://kubernetes.io/docs/home/)
- [Vercel Documentation](https://vercel.com/docs)
