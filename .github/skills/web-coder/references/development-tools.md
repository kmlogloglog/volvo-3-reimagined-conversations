# Development Tools Reference

Tools and workflows for web development.

## Version Control

### Git

Distributed version control system.

**Basic Commands**:
```bash
git init
git clone https://github.com/user/repo.git
git status
git add file.js
git add . # All files
git commit -m "commit message"
git push origin main
git pull origin main
git branch feature-name
git checkout -b feature-name # Create and switch
git merge feature-name
git log --oneline --graph
```

**Best Practices**:
- Commit often with meaningful messages
- Use branches for features
- Pull before push
- Review changes before committing
- Use .gitignore for generated files

### GitHub/GitLab/Bitbucket

Git hosting platforms with collaboration features:
- Pull requests / Merge requests
- Code review
- Issue tracking
- CI/CD integration
- Project management

## Package Managers

### npm (Node Package Manager)

```bash
npm init -y
npm install package-name
npm install -D package-name # Dev dependency
npm install -g package-name # Global
npm update
npm run build
npm test
npm audit fix
```

**package.json**:
```json
{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "build": "webpack",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "webpack": "^5.75.0"
  }
}
```

### Yarn

```bash
yarn add package-name
yarn remove package-name
yarn upgrade
yarn build
```

### pnpm

```bash
pnpm install
pnpm add package-name
pnpm remove package-name
```

## Build Tools

### Webpack

```javascript
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      { test: /\.js$/, use: 'babel-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  }
};
```

### Vite

```bash
npm create vite@latest my-app
npm run dev
npm run build
```

### Parcel

```bash
parcel index.html
parcel build index.html
```

## Testing Frameworks

### Jest

```javascript
const sum = require('./sum');

describe('sum function', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
```

### Vitest

```javascript
import { describe, test, expect } from 'vitest';

describe('math', () => {
  test('addition', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Playwright

```javascript
import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});
```

## Linters & Formatters

### ESLint

```javascript
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error'
  }
};
```

### Prettier

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Stylelint

```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "indentation": 2,
    "color-hex-length": "short"
  }
}
```

## TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email?: string; // Optional
}

function getUser(id: number): User {
  return { id, name: 'John' };
}

function identity<T>(arg: T): T {
  return arg;
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Continuous Integration (CI/CD)

### GitHub Actions

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
```

## Debugging

### Browser DevTools

```javascript
debugger; // Pause execution
console.log('value:', value);
console.error('error:', error);
console.trace(); // Stack trace
```

### Node.js Debugging

```bash
node inspect app.js
node --inspect app.js
node --inspect-brk app.js # Break on start
```

## Developer Workflow

1. **Setup**: Clone repo, install dependencies
2. **Develop**: Write code, run dev server
3. **Test**: Run unit/integration tests
4. **Lint/Format**: Check code quality
5. **Commit**: Git commit and push
6. **CI/CD**: Automated tests and deployment
7. **Deploy**: Push to production

### Environment Variables

```bash
# .env
DATABASE_URL=postgres://localhost/db
API_KEY=secret-key-here
NODE_ENV=development
```

```javascript
const dbUrl = process.env.DATABASE_URL;
```

## Glossary Terms

**Key Terms Covered**:
- Bun, Continuous integration, Deno, Developer tools
- Fork, Fuzz testing, Git, IDE, Node.js
- Repo, Rsync, SCM, SDK, Smoke test, SVN, TypeScript

## Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [npm Documentation](https://docs.npmjs.com/)
- [Webpack Guides](https://webpack.js.org/guides/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
