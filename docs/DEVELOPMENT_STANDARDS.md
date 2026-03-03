# PuraEstate Development Standards & Best Practices

**Version:** 1.0
**Last Updated:** February 24, 2026
**Status:** Production-Ready

---

## Table of Contents

1. [Code Style Guide](#code-style-guide)
2. [Git Workflow](#git-workflow)
3. [Testing Standards](#testing-standards)
4. [Performance Guidelines](#performance-guidelines)
5. [Security Standards](#security-standards)
6. [Documentation Standards](#documentation-standards)

---

## Code Style Guide

### TypeScript Conventions

#### Type Definitions

```typescript
// GOOD: Explicit types with meaningful names
interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  profilePhotoUrl?: string
  createdAt: Date
}

type UserRole = 'ADMIN' | 'SELLER' | 'BUYER'
type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'ARCHIVED'

// BAD: Using 'any' type
interface User {
  id: any
  profile: any
}
```

#### Functions

```typescript
// GOOD: Explicit return types
export async function fetchUserById(userId: string): Promise<User> {
  try {
    const response = await db.query('SELECT * FROM users WHERE id = $1', [userId])
    return response.rows[0]
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }
}

// GOOD: Arrow functions for callbacks
const users = data.map((item: any): User => ({
  id: item.id,
  email: item.email
}))

// BAD: Missing return types
function getUser(id) {
  return users.find(u => u.id === id)
}
```

#### Error Handling

```typescript
// GOOD: Custom error classes
class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User ${userId} not found`)
    this.name = 'UserNotFoundError'
  }
}

async function getUser(id: string): Promise<User> {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id])
  if (!user.rows.length) {
    throw new UserNotFoundError(id)
  }
  return user.rows[0]
}

// BAD: Generic error messages
function getUser(id) {
  const user = db.query('SELECT * FROM users WHERE id = $1', [id])
  if (!user) throw new Error('Error')
}
```

### React/NextJS Conventions

#### Component Structure

```typescript
// GOOD: Clear component structure
import { FC, ReactNode } from 'react'

interface ListingCardProps {
  listing: Listing
  onSelect: (listing: Listing) => void
  isSelected?: boolean
}

export const ListingCard: FC<ListingCardProps> = ({ listing, onSelect, isSelected = false }) => {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await onSelect(listing)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer p-4 rounded-lg transition ${isSelected ? 'ring-2 ring-blue-600' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick()
      }}
    >
      <h3 className="font-semibold text-lg">{listing.title}</h3>
      <p className="text-gray-600">${listing.price.toLocaleString()}</p>
    </div>
  )
}

// BAD: Missing types, poor structure
export function ListingCard(props) {
  return (
    <div onClick={() => props.onSelect(props.listing)}>
      <h3>{props.listing.title}</h3>
      <p>${props.listing.price}</p>
    </div>
  )
}
```

#### Hooks Usage

```typescript
// GOOD: Custom hooks with clear naming
export function useListings(filter?: ListingFilter) {
  const [listings, setListings] = React.useState<Listing[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const data = await api.get('/listings', { params: filter })
        setListings(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [filter])

  return { listings, loading, error }
}

// BAD: Unclear state, missing error handling
export function useListings() {
  const [l, setL] = React.useState([])
  const [s, setS] = React.useState(false)

  React.useEffect(() => {
    fetch('/listings').then((d) => {
      setL(d)
      setS(true)
    })
  }, [])

  return [l, s]
}
```

### SQL Conventions

#### Query Formatting

```sql
-- GOOD: Clear, formatted queries
SELECT
  u.id,
  u.email,
  u.first_name,
  COUNT(l.id) as listing_count,
  AVG(r.rating) as average_rating
FROM users u
LEFT JOIN listings l ON u.id = l.user_id
LEFT JOIN reviews r ON u.id = r.reviewed_user_id
WHERE u.status = 'ACTIVE'
  AND u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id
ORDER BY listing_count DESC
LIMIT 10 OFFSET 0;

-- BAD: Hard to read
SELECT u.id, u.email, u.first_name, COUNT(l.id) as listing_count FROM users u LEFT JOIN listings l ON u.id = l.user_id WHERE u.status = 'ACTIVE' ORDER BY listing_count DESC;
```

#### Index Best Practices

```sql
-- Create indexes on frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

-- Composite indexes for common WHERE + ORDER BY
CREATE INDEX idx_listings_status_created ON listings(status, created_at DESC);

-- BRIN indexes for very large tables
CREATE INDEX idx_listings_location ON listings USING BRIN (location_lat, location_lng);

-- Partial indexes for specific subsets
CREATE INDEX idx_active_listings ON listings(id) WHERE status = 'ACTIVE';
```

---

## Git Workflow

### Branch Naming

```bash
# Feature branches
feature/user-authentication
feature/listing-search
feature/payment-integration

# Bug fix branches
bugfix/fix-login-redirect
bugfix/null-pointer-exception

# Hotfix branches (production only)
hotfix/critical-security-issue

# Release branches
release/v1.0.0
release/v1.1.0
```

### Commit Messages

```bash
# Format: <type>(<scope>): <subject>
# Types: feat, fix, docs, style, refactor, perf, test, chore

# Feature
git commit -m "feat(auth): implement JWT refresh token logic"

# Bug fix
git commit -m "fix(listings): correct price calculation for negotiable items"

# Documentation
git commit -m "docs(api): add authentication endpoints documentation"

# Performance improvement
git commit -m "perf(search): optimize full-text search with indexing"

# Test
git commit -m "test(auth): add unit tests for token validation"

# Chore
git commit -m "chore(deps): update TypeScript to v5.2.0"
```

### Pull Request Process

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

## Screenshots/Videos
[If applicable]

## Related Issues
Fixes #123

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] No new warnings generated
- [ ] Added comments for complex logic
- [ ] Documentation updated
- [ ] Tests passing
```

### Code Review Standards

```
1. Functionality
   - Does the code work as intended?
   - Are edge cases handled?
   - Is error handling appropriate?

2. Code Quality
   - Does it follow naming conventions?
   - Is the code DRY (Don't Repeat Yourself)?
   - Is it properly formatted?

3. Performance
   - Are there any N+1 queries?
   - Is unnecessary computation avoided?
   - Are large data structures handled efficiently?

4. Security
   - Are inputs validated?
   - Are secrets properly handled?
   - Is authentication/authorization correct?

5. Testing
   - Is there adequate test coverage?
   - Are tests meaningful?
   - Do tests cover error cases?

6. Documentation
   - Is the code self-documenting?
   - Are complex sections commented?
   - Is the API documented?
```

---

## Testing Standards

### Unit Test Template

```typescript
describe('ListingService', () => {
  let service: ListingService
  let mockDb: jest.Mocked<Database>
  let mockCache: jest.Mocked<Cache>

  beforeEach(() => {
    mockDb = createMockDatabase()
    mockCache = createMockCache()
    service = new ListingService(mockDb, mockCache)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createListing', () => {
    it('should create a new listing with valid data', async () => {
      const input = {
        userId: 'user-123',
        title: 'Beautiful House',
        description: 'A great home',
        price: 250000
      }

      const result = await service.createListing(input)

      expect(result.id).toBeDefined()
      expect(result.title).toBe(input.title)
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO listings'),
        expect.any(Array)
      )
    })

    it('should throw error with invalid title', async () => {
      const input = {
        userId: 'user-123',
        title: '', // Empty title
        description: 'A great home',
        price: 250000
      }

      await expect(service.createListing(input)).rejects.toThrow('Title is required')
    })

    it('should throw error with negative price', async () => {
      const input = {
        userId: 'user-123',
        title: 'Beautiful House',
        description: 'A great home',
        price: -100 // Negative price
      }

      await expect(service.createListing(input)).rejects.toThrow('Price must be positive')
    })
  })
})
```

### Integration Test Template

```typescript
describe('Listings API', () => {
  let app: Express.Application
  let db: Database

  beforeAll(async () => {
    app = createApp()
    db = new Database(TEST_DATABASE_URL)
    await db.initialize()
  })

  beforeEach(async () => {
    await db.truncateAllTables()
  })

  afterAll(async () => {
    await db.close()
  })

  describe('POST /api/listings', () => {
    it('should create a listing with valid data', async () => {
      const token = generateTestToken()
      const listing = {
        title: 'Beautiful House',
        description: 'A great home',
        price: 250000,
        category: 'property'
      }

      const response = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${token}`)
        .send(listing)

      expect(response.status).toBe(201)
      expect(response.body.listing).toHaveProperty('id')
      expect(response.body.listing.title).toBe(listing.title)
    })

    it('should return 400 with invalid data', async () => {
      const token = generateTestToken()
      const invalidListing = {
        title: '', // Empty title
        price: -100 // Negative price
      }

      const response = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidListing)

      expect(response.status).toBe(400)
      expect(response.body.error).toBeDefined()
    })
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('Listing Creation Flow', () => {
  test('should complete full listing creation', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3001/login')

    // Login
    await page.fill('input[name="email"]', 'seller@example.com')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard')

    // Navigate to create listing
    await page.click('button:has-text("Create Listing")')
    await page.waitForURL('**/listings/create')

    // Fill form
    await page.fill('input[name="title"]', 'Beautiful 3-Bedroom House')
    await page.fill('textarea[name="description"]', 'Spacious family home with garden')
    await page.fill('input[name="price"]', '250000')
    await page.selectOption('select[name="category"]', 'property')

    // Upload image
    await page.setInputFiles('input[type="file"]', 'test-image.jpg')

    // Submit
    await page.click('button:has-text("Create Listing")')

    // Verify listing created
    await page.waitForURL('**/listings/**')
    await expect(page.locator('h1')).toContainText('Beautiful 3-Bedroom House')
    await expect(page.locator('text=250000')).toBeVisible()
  })
})
```

---

## Performance Guidelines

### Database Optimization

#### Analyze Query Performance

```sql
-- Enable query analysis
EXPLAIN ANALYZE
SELECT * FROM listings
WHERE status = 'ACTIVE'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Add missing indexes if "Seq Scan" is used
CREATE INDEX idx_listings_status_created
ON listings(status, created_at DESC)
WHERE status = 'ACTIVE';
```

#### Query Optimization Checklist

- [ ] Use WHERE clauses to filter early
- [ ] Use appropriate indexes
- [ ] Avoid SELECT * (select only needed columns)
- [ ] Use LIMIT for pagination
- [ ] Use EXPLAIN ANALYZE to verify efficiency
- [ ] Avoid N+1 queries (use JOINs)
- [ ] Use connection pooling

### Frontend Performance

#### Bundle Size Optimization

```typescript
// Dynamic imports for code splitting
const AdminDashboard = dynamic(() => import('@/pages/admin/dashboard'), {
  loading: () => <div>Loading...</div>,
  ssr: false
})

// Analyze bundle
// Run: next/bundle-analyzer --analyze
```

#### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/listings/property-01.jpg"
  alt="Property"
  width={400}
  height={300}
  placeholder="blur"
  priority={false}
/>

// Set up CloudFlare for image optimization
// Format conversion, resizing, etc.
```

#### Caching Strategy

```typescript
// Static generation (builds once)
export const getStaticProps = async () => {
  const listings = await fetchListings()
  return {
    props: { listings },
    revalidate: 3600 // Regenerate every hour
  }
}

// Server-side rendering (per request)
export const getServerSideProps = async () => {
  const listings = await fetchListings()
  return {
    props: { listings }
  }
}

// Set cache headers
res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
```

---

## Security Standards

### Authentication & Authorization

```typescript
// Strong password requirements
interface PasswordPolicy {
  minLength: 8
  requireUppercase: true
  requireLowercase: true
  requireNumbers: true
  requireSpecialChars: true
}

function validatePassword(password: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return regex.test(password)
}

// JWT Token Security
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m', algorithm: 'HS256' } // Short expiry
  )

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: '7d', algorithm: 'HS256' }
  )

  return { accessToken, refreshToken }
}
```

### Input Validation

```typescript
// Use Joi for validation
import Joi from 'joi'

const listingSchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(20).max(5000).required(),
  price: Joi.number().positive().required(),
  category: Joi.string().valid('property', 'service').required(),
  imageUrls: Joi.array().items(Joi.string().uri()).max(50)
})

app.post('/listings', (req: Request, res: Response) => {
  const { error, value } = listingSchema.validate(req.body)

  if (error) {
    res.status(400).json({ error: error.details })
    return
  }

  // Process validated data
})
```

### SQL Injection Prevention

```typescript
// GOOD: Use parameterized queries
const result = await db.query(
  'SELECT * FROM users WHERE email = $1 AND status = $2',
  [email, status]
)

// BAD: String concatenation (VULNERABLE)
const result = await db.query(
  `SELECT * FROM users WHERE email = '${email}' AND status = '${status}'`
)
```

### XSS Prevention

```typescript
// Sanitize user input
import DOMPurify from 'isomorphic-dompurify'

const sanitizedDescription = DOMPurify.sanitize(userInput)

// Escape in templates
export function ListingDetail({ listing }) {
  return (
    <div>
      <h1>{listing.title}</h1> {/* Automatically escaped in JSX */}
      <p dangerouslySetInnerHTML={{ __html: sanitizedHtml }} /> {/* Only if sanitized */}
    </div>
  )
}
```

### Environment Variables

```bash
# NEVER commit secrets
# Use .env.local (ignored by git)

# Good practices:
# 1. Use AWS Secrets Manager or similar
# 2. Rotate secrets regularly
# 3. Limit secret access by role
# 4. Audit secret access logs

# For CI/CD:
# Store secrets in GitHub Actions / GitLab CI secrets
# Reference as: ${{ secrets.SECRET_NAME }}
```

---

## Documentation Standards

### Code Comments

```typescript
// GOOD: Explain WHY, not WHAT
// Use exponential backoff to handle rate limiting
const getBackoffDelay = (attempt: number): number => Math.pow(2, attempt) * 1000

// BAD: Stating the obvious
// Loop through array
for (const item of items) {
  // Increment counter
  count++
}
```

### Function Documentation

```typescript
/**
 * Fetches listings with advanced filtering and pagination
 * @param filter - Filtering criteria (price range, location, etc.)
 * @param pagination - Pagination parameters (page, limit)
 * @returns Promise<PaginatedListings> - Paginated results with metadata
 * @throws {ValidationError} - If filter parameters are invalid
 * @throws {DatabaseError} - If database query fails
 * @example
 * const results = await getListings(
 *   { priceMax: 500000, category: 'property' },
 *   { page: 1, limit: 20 }
 * )
 */
export async function getListings(
  filter: ListingFilter,
  pagination: PaginationParams
): Promise<PaginatedListings> {
  // Implementation
}
```

### README Standards

```markdown
# PuraEstate Backend

Brief description of what this service does.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Installation
```bash
npm install
npm run build
```

### Running Locally
```bash
npm run dev
```

## Architecture

Overview of service structure and key components.

## API Endpoints

### Authentication
- POST /api/auth/signup
- POST /api/auth/login

## Testing

```bash
npm test
npm run test:coverage
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT
```

---

## Development Checklist

Before pushing code:

- [ ] Code follows naming conventions
- [ ] ESLint passing (`npm run lint`)
- [ ] Prettier formatted (`npm run format`)
- [ ] TypeScript compiling (`npm run build`)
- [ ] All tests passing (`npm test`)
- [ ] No console.log statements
- [ ] Comments added for complex logic
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] No hardcoded secrets
- [ ] Git commit message follows conventional commits
- [ ] PR description complete
- [ ] Reviewed by peer

---

**Version:** 1.0
**Status:** Production-Ready
**Last Updated:** February 24, 2026
