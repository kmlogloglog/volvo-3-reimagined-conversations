# JavaScript Programming Reference

Comprehensive JavaScript reference for web development.

## Variables and Data Types

```javascript
// Variable declarations
let mutableVar = 'can change';    // Block-scoped
const immutableRef = 'cannot reassign';  // Block-scoped
var legacyVar = 'avoid this';     // Function-scoped (use let/const)

// Primitive types
const str = 'string';
const num = 42;
const float = 3.14;
const bool = true;
const nothing = null;
const notDefined = undefined;
const id = Symbol('unique');
const bigInt = 9007199254740991n;

// Reference types
const arr = [1, 2, 3];
const obj = { key: 'value' };
const fn = () => {};
```

### Type Checking

```javascript
typeof 'string'; // "string"
typeof 42; // "number"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof null; // "object" (historical bug!)
typeof Symbol(); // "symbol"
typeof BigInt(1); // "bigint"
typeof {}; // "object"
typeof []; // "object"
typeof () => {}; // "function"

// Better type checking
Array.isArray([]); // true
value instanceof Date; // true
Object.prototype.toString.call(null); // "[object Null]"
```

## Functions

```javascript
// Function declaration (hoisted)
function greet(name) {
  return `Hello, ${name}!`;
}

// Function expression
const greet = function(name) {
  return `Hello, ${name}!`;
};

// Arrow function
const greet = (name) => `Hello, ${name}!`;
const double = n => n * 2; // Single param, no parens needed
const getObject = () => ({ key: 'value' }); // Return object literal

// Default parameters
function connect(url, port = 3000) {
  return `${url}:${port}`;
}

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

// Destructuring parameters
function printUser({ name, email, role = 'user' }) {
  console.log(`${name} (${role}): ${email}`);
}
```

## Arrays

```javascript
// Creation
const nums = [1, 2, 3];
const range = Array.from({ length: 5 }, (_, i) => i + 1); // [1, 2, 3, 4, 5]

// Transformation
nums.map(n => n * 2);           // [2, 4, 6]
nums.filter(n => n > 1);       // [2, 3]
nums.reduce((acc, n) => acc + n, 0); // 6

// Search
nums.find(n => n > 1);         // 2 (first match)
nums.findIndex(n => n > 1);    // 1 (first match index)
nums.some(n => n > 2);         // true
nums.every(n => n > 0);        // true
nums.includes(2);               // true

// Sorting
[3, 1, 2].sort((a, b) => a - b); // [1, 2, 3]
['b', 'a', 'c'].sort();           // ['a', 'b', 'c']

// Flat
[[1, 2], [3, 4]].flat();       // [1, 2, 3, 4]
[[1, [2]], [3]].flat(Infinity); // [1, 2, 3]

// Spread and destructuring
const copy = [...arr];
const combined = [...arr1, ...arr2];
const [first, second, ...rest] = arr;
```

## Objects

```javascript
// Creation
const person = { name: 'John', age: 30 };
const { name, age } = person; // Destructuring
const { name: firstName } = person; // Rename

// Methods
Object.keys(person);         // ['name', 'age']
Object.values(person);       // ['John', 30]
Object.entries(person);      // [['name', 'John'], ['age', 30]]
Object.assign({}, obj1, obj2); // Shallow merge
Object.freeze(obj);          // Make immutable

// Spread
const extended = { ...person, email: 'john@example.com' };
const updated = { ...person, age: 31 };

// Dynamic keys
const key = 'dynamic';
const obj = { [key]: 'value' }; // { dynamic: 'value' }
```

## Async JavaScript

### Promises

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve('data'), 1000);
});

// Chaining
fetchUser(id)
  .then(user => fetchPosts(user.id))
  .then(posts => console.log(posts))
  .catch(error => console.error(error))
  .finally(() => console.log('Done'));

// Multiple promises
Promise.all([fetch('/a'), fetch('/b')]);          // All or fail
Promise.allSettled([fetch('/a'), fetch('/b')]);   // All, with status
Promise.race([fetchFast(), fetchSlow()]);         // First to settle
Promise.any([fetch('/a'), fetch('/b')]);          // First to succeed
```

### Async/Await

```javascript
async function loadUser(id) {
  try {
    const user = await fetchUser(id);
    const posts = await fetchPosts(user.id);
    return { user, posts };
  } catch (error) {
    throw new Error(`Failed: ${error.message}`);
  }
}

// Parallel execution
async function loadData() {
  const [users, products] = await Promise.all([
    fetchUsers(),
    fetchProducts()
  ]);
  return { users, products };
}
```

## Classes

```javascript
class Animal {
  #name; // Private field

  constructor(name) {
    this.#name = name;
    this.type = 'animal';
  }

  get name() { return this.#name; }

  speak() {
    return `${this.#name} makes a sound`;
  }

  static create(name) {
    return new Animal(name);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }

  speak() {
    return `${this.name} barks`;
  }
}

const dog = new Dog('Rex', 'Labrador');
console.log(dog.speak()); // "Rex barks"
console.log(dog instanceof Dog); // true
console.log(dog instanceof Animal); // true
```

## Modules (ES Modules)

```javascript
// Named exports
export const PI = 3.14;
export function greet(name) { return `Hello, ${name}!`; }

// Default export
export default class App { ... }

// Re-export
export { something } from './module';
export * from './utils';

// Imports
import App from './App.js';
import { PI, greet } from './math.js';
import * as math from './math.js';
import { default as App, greet } from './app.js';

// Dynamic import
const module = await import('./heavy-module.js');
```

## Iterators & Generators

```javascript
// Custom iterator
const range = {
  [Symbol.iterator]() {
    let n = 1;
    return {
      next() {
        return n <= 5
          ? { value: n++, done: false }
          : { done: true };
      }
    };
  }
};

for (const n of range) console.log(n); // 1, 2, 3, 4, 5

// Generator
function* fibonacci() {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
fib.next().value; // 0
fib.next().value; // 1
fib.next().value; // 1
```

## Error Handling

```javascript
try {
  throw new Error('Something went wrong');
} catch (error) {
  console.error(error.message);
} finally {
  console.log('Always runs');
}

// Custom error
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

throw new ValidationError('Invalid email', 'email');
```

## Closures

```javascript
function makeCounter(start = 0) {
  let count = start;

  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count
  };
}

const counter = makeCounter();
counter.increment(); // 1
counter.increment(); // 2
```

## Event Handling

```javascript
// addEventListener
element.addEventListener('click', handleClick);
element.addEventListener('click', handleClick, { once: true });
element.removeEventListener('click', handleClick);

// Event delegation
document.querySelector('#list').addEventListener('click', (e) => {
  if (e.target.matches('li')) {
    console.log('Clicked:', e.target.textContent);
  }
});

// Custom events
const event = new CustomEvent('update', { detail: { data: 'value' } });
element.dispatchEvent(event);
```

## Proxy & Reflect

```javascript
const handler = {
  get(target, key) {
    console.log(`Getting ${key}`);
    return Reflect.get(target, key);
  },
  set(target, key, value) {
    console.log(`Setting ${key} = ${value}`);
    return Reflect.set(target, key, value);
  }
};

const proxy = new Proxy(obj, handler);
```

## Glossary Terms

**Key Terms Covered**:
- Abstraction, AJAX, Argument, Array, Asynchronous
- Callback function, Class, Closure, Compile, Constant
- Constructor, Control flow, Coercion, Data structure
- Destructuring, DOM, Encapsulation, Event, Event handler
- Exception, Expression, First-class function, Function
- Garbage collection, Generator, Hoisting, Idempotent
- Immediately Invoked Function Expressions (IIFE)
- Inheritance, Instance, Iterator, JavaScript, JSON
- Literal, Memoization, Method, Mutation, Namespace
- Null, Object, Operator, Parameter, Polyfill
- Primitive, Promise, Prototype, Pure function
- Recursion, Scope, Statement, String, Symbol
- Synchronous, Type coercion, Undefined, Variable

## Additional Resources

- [MDN JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference)
- [JavaScript.info](https://javascript.info/)
- [Eloquent JavaScript](https://eloquentjavascript.net/)
- [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS)
