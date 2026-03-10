# Security & Authentication Reference

Web security concepts, authentication methods, and best practices.

## Common Vulnerabilities

### XSS (Cross-Site Scripting)

Injecting malicious scripts into web pages.

**Types**:
- **Stored XSS**: Malicious code saved in database
- **Reflected XSS**: Code reflected in URL/request
- **DOM XSS**: Manipulates DOM without server involvement

```javascript
// ❌ Vulnerable
element.innerHTML = userInput; // XSS risk!

// ✅ Safe
element.textContent = userInput; // Escaped automatically

// ✅ If you must use HTML, sanitize first
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

**Content Security Policy (CSP)**:

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'nonce-{random}'; style-src 'self'">
```

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com
```

### CSRF (Cross-Site Request Forgery)

Tricking user's browser into sending unauthorized requests.

**Protection**:

```javascript
// CSRF token in forms
<form method="POST">
  <input type="hidden" name="csrf_token" value="random-token">
</form>

// CSRF token in headers
headers: {
  'X-CSRF-Token': getCsrfToken()
}
```

**SameSite Cookie Attribute**:
```http
Set-Cookie: session=abc123; SameSite=Strict; Secure
```

### SQL Injection

Inserting SQL code into queries via user input.

```javascript
// ❌ Vulnerable
db.query(`SELECT * FROM users WHERE name = '${userInput}'`);

// ✅ Safe: parameterized queries
db.query('SELECT * FROM users WHERE name = $1', [userInput]);

// ✅ ORM approach
User.findOne({ where: { name: userInput } });
```

### Path Traversal

Accessing files outside intended directory.

```javascript
// ❌ Vulnerable
const file = fs.readFile(`./files/${userInput}`);

// ✅ Safe: validate and normalize paths
const safePath = path.normalize(userInput);
if (!safePath.startsWith('/safe-dir/')) {
  throw new Error('Invalid path');
}
```

### Open Redirects

Redirecting users to external malicious sites.

```javascript
// ❌ Vulnerable
res.redirect(req.query.url);

// ✅ Safe: validate redirect URL
const allowedDomains = ['example.com', 'www.example.com'];
const url = new URL(req.query.url);
if (allowedDomains.includes(url.hostname)) {
  res.redirect(req.query.url);
}
```

## Authentication

### JWT (JSON Web Token)

Compact, self-contained tokens for authentication.

**Structure**: `header.payload.signature`

```javascript
// Payload example
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022,
  "exp": 1516242622 // Expiration
}

// Verify token
const decoded = jwt.verify(token, secretKey);
const userId = decoded.sub;
```

**JWT Best Practices**:
- Use short expiration times
- Store in HttpOnly cookies (not localStorage)
- Rotate refresh tokens
- Invalidate on logout (token blocklist)

### Session Authentication

```javascript
// Express session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
}));
```

### OAuth 2.0

Authorization framework for third-party access.

**Flows**:
- **Authorization Code**: For server-side apps
- **PKCE**: For public clients (SPAs, mobile)
- **Client Credentials**: Server-to-server
- **Device Code**: Smart TVs, CLIs

```
1. User clicks "Sign in with GitHub"
2. Redirect to GitHub with client_id, redirect_uri, scope
3. User authorizes app
4. GitHub redirects with authorization code
5. Exchange code for access token
6. Use access token to access GitHub API
```

### OpenID Connect (OIDC)

Authentication layer on top of OAuth 2.0.

```javascript
// Parse ID Token claims
const { sub, email, name, picture } = parseIdToken(idToken);
```

### Multi-Factor Authentication (MFA)

```javascript
// TOTP (Time-based One-Time Password)
const otpauth = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;

// Generate QR code from otpauth URL
// User scans with authenticator app
```

## Password Security

### Hashing

```javascript
// Never store plain text passwords!

// bcrypt (recommended)
const bcrypt = require('bcrypt');
const saltRounds = 12;

const hash = await bcrypt.hash(password, saltRounds);
const match = await bcrypt.compare(password, hash);

// argon2 (more secure)
const argon2 = require('argon2');
const hash = await argon2.hash(password);
const match = await argon2.verify(hash, password);
```

### Password Policies

```javascript
function validatePassword(password) {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*]/.test(password);

  return (
    password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumbers &&
    hasSpecialChars
  );
}
```

## HTTPS and TLS

```javascript
// Force HTTPS
if (window.location.protocol !== 'https:') {
  window.location.replace(
    window.location.href.replace('http:', 'https:')
  );
}

// HSTS Header
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## Security Headers

```http
# Prevent clickjacking
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'

# Disable MIME sniffing
X-Content-Type-Options: nosniff

# XSS protection (legacy)
X-XSS-Protection: 1; mode=block

# Referrer policy
Referrer-Policy: strict-origin-when-cross-origin

# Permissions policy
Permissions-Policy: geolocation=(), camera=(), microphone=()

# HSTS
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## API Security

### Rate Limiting

```javascript
// Express rate limiter
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

### Input Validation

```javascript
// Validate all inputs
const { z } = require('zod');

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().max(120)
});

const result = UserSchema.safeParse(userInput);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

## Cookie Security

```javascript
// Secure cookie settings
res.cookie('session', token, {
  httpOnly: true,    // Not accessible via JavaScript
  secure: true,      // Only sent over HTTPS
  sameSite: 'strict', // CSRF protection
  maxAge: 3600000,   // 1 hour
  path: '/',
  domain: 'example.com'
});
```

## CORS Security

```javascript
// Restrictive CORS
app.use(cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight 24 hours
}));
```

## Sensitive Data Handling

```javascript
// ❌ Never log sensitive data
console.log('User:', user); // May include password, SSN, etc.

// ✅ Log only what you need
console.log('User logged in:', user.id);

// Environment variables for secrets
const apiKey = process.env.API_KEY; // ✅
const apiKey = 'hardcoded-key'; // ❌

// Redact sensitive fields when serializing
function redact(obj) {
  const sensitive = ['password', 'token', 'ssn', 'creditCard'];
  return JSON.stringify(obj, (key, val) =>
    sensitive.includes(key) ? '[REDACTED]' : val
  );
}
```

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set security headers (CSP, HSTS, etc.)
- [ ] Sanitize all user inputs
- [ ] Parameterize SQL queries
- [ ] Hash passwords with bcrypt/argon2
- [ ] Use HttpOnly, Secure, SameSite cookies
- [ ] Implement CSRF protection
- [ ] Validate all inputs server-side
- [ ] Rate limit APIs
- [ ] Keep dependencies updated
- [ ] Don't log sensitive data
- [ ] Use least-privilege principle

## Glossary Terms

**Key Terms Covered**:
- Access control, Authentication, Authorization
- CAPTCHA, Certificate, CORS, CSRF, CVE
- Encryption, Hashing, HTTPS, JWT, MFA
- OAuth, OWASP, Password, Phishing, PKI
- Same-origin policy, Salt, Session
- SQL injection, SSL, TLS, Token, XSS

## Additional Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [MDN Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Security Headers](https://securityheaders.com/)
- [NIST Guidelines](https://pages.nist.gov/800-63-3/)
