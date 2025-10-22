# Development Guide

## Code Quality Improvements Implemented

This document outlines the performance and code quality improvements implemented in the fiscal obligations and taxes application.

## 🚀 Performance Improvements

### 1. Data Caching
- **Next.js Cache**: Implemented server-side caching using `unstable_cache` for dashboard and calendar data
- **SWR Client Cache**: Added client-side caching with SWR for better user experience
- **Cache Invalidation**: Proper cache tags for targeted invalidation

### 2. Server-Side Filtering
- **Database Queries**: Moved filtering, sorting, and pagination to Supabase
- **Indexed Queries**: Leverages existing database indexes for optimal performance
- **Reduced Data Transfer**: Only fetches necessary data with pagination

## 🛡️ Code Quality Improvements

### 3. Form Validation
- **Zod Schemas**: Comprehensive validation schemas for all forms
- **React Hook Form**: Integrated with React Hook Form for better UX
- **Real-time Validation**: Client-side validation with server-side backup
- **CNPJ Validation**: Custom CNPJ validation with proper formatting

### 4. Date Calculation Refactoring
- **Consolidated Logic**: All date calculations moved to `lib/date-utils.ts`
- **Removed Duplicates**: Eliminated duplicate functions across files
- **JSDoc Documentation**: Comprehensive documentation for all date functions

### 5. Documentation
- **JSDoc Comments**: Added to all utility functions and database operations
- **Type Safety**: Enhanced TypeScript configuration for better type checking
- **Error Handling**: Documented error handling patterns

### 6. Code Standardization
- **ESLint Configuration**: Strict rules for React Hooks and TypeScript
- **Prettier Integration**: Consistent code formatting
- **Import Organization**: Automatic import sorting and organization

## 📁 File Structure

```
lib/
├── cache.ts                    # Caching utilities
├── hooks/
│   ├── use-data.ts            # SWR data hooks
│   └── use-form-validation.ts # Form validation hooks
├── validation-schemas.ts       # Zod validation schemas
├── date-utils.ts              # Consolidated date utilities
├── dashboard-utils.ts         # Dashboard calculations
├── server-actions.ts          # Server actions with caching
└── supabase/
    └── database.ts            # Database operations with filtering
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation
```bash
# Install dependencies
pnpm install

# Install additional dev dependencies
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks prettier
```

### Available Scripts
```bash
# Development
pnpm dev

# Build
pnpm build

# Linting
pnpm lint          # Check for issues
pnpm lint:fix       # Fix auto-fixable issues

# Formatting
pnpm format         # Format code with Prettier
pnpm format:check   # Check formatting

# Type checking
pnpm type-check     # TypeScript type checking
```

## 🔧 Configuration Files

### ESLint (.eslintrc.json)
- React Hooks rules
- TypeScript strict rules
- Import organization
- Code quality rules

### Prettier (.prettierrc)
- Consistent formatting
- Single quotes
- Trailing commas
- 80 character line width

### TypeScript (tsconfig.json)
- Strict type checking
- Enhanced error detection
- Path mapping for imports

## 📊 Performance Metrics

### Before Improvements
- Client-side filtering on all data
- No caching mechanism
- Duplicate date calculations
- Basic form validation

### After Improvements
- Server-side filtering with pagination
- Multi-layer caching (server + client)
- Consolidated date utilities
- Comprehensive form validation with Zod
- Enhanced type safety
- Consistent code formatting

## 🚨 Breaking Changes

### Component Props
- `ObligationList` now expects `initialObligations` instead of `obligations`
- Form components now use React Hook Form with Zod validation

### Database Functions
- New filtering functions: `getObligationsFiltered`, `getObligationsWithDetailsFiltered`
- Enhanced error handling in all database operations

### Caching
- Server actions now use caching by default
- Client components should use SWR hooks for data fetching

## 🔍 Code Quality Checklist

- [ ] All functions have JSDoc comments
- [ ] TypeScript strict mode enabled
- [ ] ESLint rules passing
- [ ] Prettier formatting applied
- [ ] No console.log statements in production
- [ ] Proper error handling
- [ ] Consistent naming conventions
- [ ] Import organization

## 🐛 Troubleshooting

### Common Issues

1. **ESLint Errors**: Run `pnpm lint:fix` to auto-fix issues
2. **Type Errors**: Run `pnpm type-check` to identify type issues
3. **Formatting Issues**: Run `pnpm format` to fix formatting
4. **Cache Issues**: Clear Next.js cache with `rm -rf .next`

### Performance Issues

1. **Slow Queries**: Check database indexes
2. **Large Bundles**: Use dynamic imports for heavy components
3. **Memory Leaks**: Ensure proper cleanup in useEffect hooks

## 📈 Next Steps

1. **Testing**: Add unit tests for utility functions
2. **E2E Testing**: Implement end-to-end tests
3. **Monitoring**: Add performance monitoring
4. **Accessibility**: Enhance accessibility features
5. **Internationalization**: Add multi-language support

## 🤝 Contributing

1. Follow the established code style
2. Add JSDoc comments for new functions
3. Write tests for new features
4. Update documentation as needed
5. Run all quality checks before submitting
