# Copilot Instructions

This file contains instructions for GitHub Copilot to help maintain consistency and follow project-specific guidelines when generating code suggestions.

## General Guidelines

### Code Style and Formatting
- **Naming Conventions**:
  - Use camelCase for variable and function names
  - Use PascalCase for component names
  - Use UPPER_SNAKE_CASE for constants
- **String Formatting**: Use single quotes for strings
- **Indentation**: Use 4 spaces for indentation
- **Line Breaks and Spacing**:
  - **CRITICAL**: Always preserve proper line breaks when editing code
  - When function parameters span multiple lines, each parameter should be on its own line
  - Always add line breaks after commas in multi-line function calls
  - Maintain consistent spacing in `<script>`, `<template>`, and `<style>` sections
  - Example of CORRECT formatting:
    ```javascript
    useIntersectionObserver(
        bottomTriggerRef,
        ([entry]) => {
            // function body
        },
        { threshold: 0.5 }
    );
    ```
  - Example of INCORRECT formatting (missing line break):
    ```javascript
    useIntersectionObserver(
        bottomTriggerRef,    ([entry]) => {
            // function body
        },
        { threshold: 0.5 }
    );
    ```
- **Functions**:
  - Use arrow functions for callbacks
  - Use function declarations instead of function expressions
- **Modern JavaScript**:
  - Use async/await for asynchronous code
  - Use const for constants and let for variables that will be reassigned
  - Use destructuring for objects and arrays
  - Use template literals for strings that contain variables
  - Use the latest JavaScript features (ES6+) where possible
    ```
- **Imports**:
  - Use `@/` as the base path for imports to avoid relative paths
  - Never use `./` for import paths - always use `@/` prefix
  - Do not use tilde `~` in import paths - use `@/` instead
  - **Do not import from Vue** - Nuxt provides auto imports for Vue APIs (ref, reactive, computed, etc.)
- **Comment Length Limits**:
  - General comments: Maximum 2 lines
  - JSDoc function documentation: No line limit (for detailed API documentation)
  - Always use `//` for comments, never use `/* */` block comments
- Keep functions and methods focused on a single responsibility

### Comment Behavior
  - Do not include inline comments in suggestions
  - Do not generate block comments or multi-line explanations
  - Do not add JSDoc comments unless explicitly requested
  - Developers will add documentation where necessary

### Command Line Usage
- **Always use CMD (Command Prompt)** for terminal commands, never PowerShell
- We do not have PowerShell admin permissions in this environment
- Use proper CMD syntax for command chaining (& for sequential, && for conditional)
- Prefer CMD native commands and tools over PowerShell-specific cmdlets

### Frontend Language Guidelines
- **JavaScript/TypeScript**: Use modern ES6+ syntax, prefer const/let over var, use async/await over promises
- **TypeScript**: Never use `type: any` - always provide proper type definitions or use union types for better type safety
- **HTML**: Use semantic HTML5 elements, maintain proper accessibility attributes, use line breaks for multiple attributes
- **CSS/SCSS**: Use modern CSS features
- **Vue 3**: Use Composition API, follow Vue 3 patterns and conventions, use `<script setup>` syntax

### CSS Color Variables
- **Prefer root CSS variables** for colors when they exist in the design system
- **Reference**: See `app/scss/colors.scss` for all available color variables in the `:root` selector
- **Usage**: Always use `var(--color-name)` syntax when referencing these colors
- **Fallback**: If a specific color is needed that doesn't exist in the root variables, hardcoded HEX colors are acceptable
- **Consistency**: Prioritize using existing root colors to maintain design consistency across the application
- **Template Syntax**: Use Vue 3 template syntax with proper reactivity and lifecycle hooks

## Refactoring Guidelines

### **IMPORTANT: No Backward Compatibility**
When refactoring existing features:
- **DO NOT** maintain backward compatibility for deprecated APIs
- **DO NOT** add compatibility layers or wrapper functions
- **DO NOT** preserve old parameter names or function signatures
- Remove deprecated code paths entirely
- Update all callers to use the new interface
- Clean up legacy configuration options
- Remove outdated documentation and comments

### Breaking Changes Are Acceptable
- Prioritize clean, maintainable code over backward compatibility
- Make breaking changes when they improve the overall design
- Update all dependent code in the same refactoring session
- Remove technical debt rather than working around it

## ESLint Configuration

### Code Organization
- Follow the established project structure
- Group related functionality together
- Use appropriate design patterns (Repository, Factory, Observer, etc.)
- Implement proper separation of concerns

### Dependencies
- Minimize external JavaScript packages and libraries
- Use well-maintained, popular npm packages
- Prefer native browser APIs over third-party libraries when possible
- Use tree-shaking friendly imports
- **Build Tool**: Project uses Vite for development and production builds

### Error Handling
- Implement comprehensive error handling
- Use appropriate exception types
- Log errors with sufficient context
- Fail fast and provide meaningful error messages

### Event Emit Strings
- **Always check emits.js constants file first** before creating new emit strings
- Look for existing event constants that can be reused for similar functionality
- If no appropriate existing strings are found:
  - Create new string constants in the emits.js constants file
  - Use descriptive, consistent naming following project patterns
  - Reference the constants from emits.js instead of using literal strings
- **Never use hardcoded string literals** for emit events - always use constants
- This ensures consistency, prevents typos, and makes refactoring easier

## Security Guidelines

- Use HTTPS for all external API calls
- Implement proper CORS policies


## Git and Version Control

- Write clear, descriptive commit messages
- Keep commits focused on a single change
- Use conventional commit format if adopted by the project

## Specific Project Guidelines

## Architecture and Design Patterns
- Component architecture patterns
- We use Pinia for state management
- CSS-in-JS libraries or CSS preprocessing
- Build tools configuration (Webpack, Vite, Rollup)
- Browser support requirements
- Accessibility standards (WCAG compliance)
- API integration patterns

## What NOT to Do

- Don't ignore existing Vue 3 patterns and Composition API conventions
- Don't add unused imports or reactive references
- Don't commit commented-out code
- Don't use magic numbers or hardcoded values for validation rules
- Don't create overly complex nested component structures
- **Don't add backward compatibility when refactoring**
- Don't preserve deprecated functionality
- Don't create wrapper functions for legacy support
- **Don't use double type assertion** (`value as unknown as TargetType`) - use proper type narrowing instead
- **NEVER remove line breaks when editing code** - always preserve proper formatting
- **Don't compress multi-line function parameters onto single lines**

## When in Doubt

Check existing codebase patterns first
Prioritize readability over cleverness
Ask for clarification on ambiguous requirements
Follow the principle of least surprise
Consider the maintainer who comes after you

## Review Checklist

Before suggesting code, ensure:
- [ ] Code follows Vue 3 and Composition API conventions
- [ ] No backward compatibility added during refactoring
- [ ] All deprecated code paths are removed
- [ ] Documentation is updated
- [ ] Security best practices are followed
- [ ] Performance implications are considered
- [ ] Error handling is appropriate
- [ ] Accessibility is maintained for interface components
- [ ] Command line instructions use proper CMD syntax
- [ ] **Line breaks and formatting are preserved in all code sections**
- [ ] **Multi-line function parameters are properly formatted with line breaks**
- [ ] **No double type assertions are used** - proper type narrowing is implemented instead