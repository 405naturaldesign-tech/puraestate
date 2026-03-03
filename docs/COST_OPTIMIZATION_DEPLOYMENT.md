# PuraEstate Firebase Backend - Cost Optimization & Deployment Guide

## COST OPTIMIZATION SETTINGS

### 1. Firestore Optimization

#### Document Structure Best Practices
```
# Good: Nested data to reduce reads
/properties/{propertyId}/
  - title: string
  - address: {...}
  - images: array

# Avoid: Separate collections for highly related data
/property_titles/{propertyId}
/property_addresses/{propertyId}
```

#### Index Optimization
```
- Use composite indexes only when necessary
- Monitor unused indexes (remove monthly)
- Set auto-delete on old snapshots to 7 days
- Use collection group queries instead of duplicating data
```

#### Query Optimization
```javascript
// Good: Limit and paginate
db.collection('properties')
  .where('listingStatus', '==', 'active')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()

// Avoid: Fetching entire collection
db.collection('properties').get() // 1M+ reads!
```

#### Data Retention Policies
```
- User activity logs: 90 days (auto-delete)
- Analytics events: 180 days
- Backup metadata: 30 days
- Notifications: 14 days
```

### 2. Cloud Functions Optimization

#### Memory & Timeout Settings
```json
{
  "matchProperties": {
    "memory": "512MB",
    "timeout": "540s",
    "minInstances": 0,
    "maxInstances": 100
  },
  "processPayment": {
    "memory": "256MB",
    "timeout": "60s",
    "minInstances": 1,
    "maxInstances": 50
  },
  "sendNotification": {
    "memory": "128MB",
    "timeout": "30s",
    "minInstances": 0,
    "maxInstances": 100
  }
}
```

#### Cost Reduction Strategies
```
1. Use pub/sub for batch operations (cheaper than HTTP triggers)
2. Consolidate small functions into larger ones
3. Cache data in memory (use layer caching)
4. Use Cloud Tasks for delayed operations
5. Implement connection pooling for databases
```

#### Example Cost Comparison

| Operation | HTTP | Pub/Sub | Savings |
|-----------|------|---------|---------|
| 1M invocations | $4 | $1 | 75% |
| 1M reads | $0.06 | - | - |
| Data transfer | $0.12/GB | - | - |

### 3. Storage Optimization

#### Storage Tiering
```
- Recent files (< 30 days): Standard
- Archive files (> 30 days): Nearline
- Backups (> 90 days): Coldline
- Rarely accessed: Archive

Cost: Standard $0.020/GB → Archive $0.004/GB (80% savings)
```

#### Image Optimization
```javascript
// Good: Resize and compress on upload
const sharp = require('sharp');

exports.optimizePropertyImage = functions.storage
  .object()
  .onFinalize(async (object) => {
    const image = await sharp(object.name)
      .resize(1200, 800, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    // Saves: Original 2MB → Optimized 200KB (90% compression)
  });
```

#### Cleanup Policies
```
- Delete temporary uploads after 24 hours
- Archive property images after 1 year
- Delete invoice PDFs after 7 years
```

### 4. Database Optimization

#### Sharding Hot Collections
```
// Instead of single 'counters' doc:
/counters/bookings -> High write rate

// Use sharding:
/counters_sharded/bookings_0 ... bookings_99
// Reduces contention by 100x
```

#### Subcollections vs Root Collections
```
# Use subcollections for:
- Property images (limited queries needed)
- User notifications (per-user access)
- Booking history (one user at a time)

# Use root collections for:
- Properties (global queries)
- Users (frequent reads)
- Analytics events (aggregation queries)
```

### 5. Bandwidth Optimization

#### Data Compression
```javascript
// Compress API responses
const compression = require('compression');
app.use(compression());

// Savings: 100MB → 15MB (85% reduction)
```

#### Caching Strategy
```
- CDN cache for static assets: 1 hour
- Browser cache for images: 7 days
- API response cache: 5 minutes
- Database query cache: 10 seconds (in-memory)
```

### 6. Authentication Optimization

#### Session Management
```
- Use custom tokens instead of ID tokens for backend
- Cache auth token validation (5 minutes)
- Refresh tokens every 1 hour
```

### 7. Monthly Cost Estimates

```
Small Scale (1K users):
- Firestore: ~$50/month
- Cloud Functions: ~$15/month
- Storage: ~$5/month
- Total: ~$70/month

Medium Scale (100K users):
- Firestore: ~$500/month
- Cloud Functions: ~$100/month
- Storage: ~$50/month
- Total: ~$650/month

Large Scale (1M users):
- Firestore: ~$2,000/month (with optimizations)
- Cloud Functions: ~$400/month
- Storage: ~$200/month
- Total: ~$2,600/month
```

## DEPLOYMENT GUIDE

### Prerequisites
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Install dependencies
cd functions
npm install

# Authenticate
firebase login
firebase use puraestate-backend
```

### Step 1: Deploy Firestore Rules

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Verify deployment
firebase firestore:indexes
```

### Step 2: Deploy Storage Rules

```bash
# Deploy storage security rules
firebase deploy --only storage

# Check status
firebase storage:get-rules
```

### Step 3: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:matchProperties

# Monitor deployment
firebase functions:log --follow
```

### Step 4: Configure Realtime Database

```bash
# Deploy RTDB rules
firebase database:set rules rtdb-rules.json

# Enable multi-region writes (optional)
gcloud database instances patch puraestate-backend --enable-multi-region
```

### Step 5: Setup Environment Variables

```bash
# Create .env.local in functions directory
cat > functions/.env.local << EOF
STRIPE_SECRET_KEY=sk_live_...
TWILIO_ACCOUNT_SID=AC...
SENDGRID_API_KEY=SG...
EOF

# Deploy functions with env vars
firebase deploy --only functions
```

### Step 6: Verify Deployment

```bash
# Health check
curl https://us-central1-puraestate-backend.cloudfunctions.net/healthCheck

# Check logs
firebase functions:log

# List deployed functions
firebase functions:list
```

### Step 7: Setup Monitoring & Alerts

```bash
# Create monitoring dashboard
gcloud monitoring dashboards create --config-from-file=monitoring-dashboard.json

# Setup alerts
gcloud alpha monitoring policies create --notification-channels=CHANNEL_ID
```

### Step 8: Production Readiness Checklist

```
✓ All security rules deployed and tested
✓ Backup jobs scheduled
✓ Monitoring alerts configured
✓ Error logging setup
✓ Performance baseline established
✓ Capacity planning complete
✓ Disaster recovery plan documented
✓ Load testing completed
✓ Rate limiting configured
✓ CORS properly configured
```

## MONITORING & METRICS

### Key Metrics to Track

```javascript
// Firestore
- Read operations per second
- Write operations per second
- Query latency (p50, p99)
- Document storage size

// Cloud Functions
- Invocations per second
- Function execution time
- Memory usage
- Error rate

// Storage
- Data transferred (GB)
- Object count
- Request rate
```

### Setting Up Alerts

```bash
# High error rate (>5%)
gcloud alpha monitoring policies create \
  --display-name="High Function Error Rate" \
  --condition-threshold-value=0.05 \
  --condition-threshold-comparison=COMPARISON_GT

# High latency (>30s)
gcloud alpha monitoring policies create \
  --display-name="High Function Latency" \
  --condition-threshold-value=30000 \
  --condition-threshold-comparison=COMPARISON_GT
```

## ROLLBACK PROCEDURES

### Function Rollback

```bash
# List function versions
gcloud functions list --filter="runtime:nodejs18"

# Rollback to previous version
gcloud functions deploy matchProperties \
  --source gs://puraestate-backend-functions/backup/v1/

# Verify rollback
firebase functions:log --follow
```

### Data Rollback

```bash
# Restore from backup
gsutil -m cp -r \
  gs://puraestate-backend-backups/backup-firestore-2024-02-20.json \
  .

# Verify backup integrity
firebase firestore:import backup-firestore-2024-02-20.json --merge=true
```

## SCALING STRATEGIES

### Horizontal Scaling

```
1. Increase max instances for functions
2. Implement database sharding
3. Use Cloud CDN for static assets
4. Add read replicas for Firestore (multi-region)
```

### Vertical Scaling

```
1. Increase function memory (improves CPU)
2. Increase timeout for long operations
3. Optimize database queries
4. Implement caching layer
```

### Auto-Scaling Configuration

```json
{
  "functions": {
    "matchProperties": {
      "minInstances": 0,
      "maxInstances": 1000,
      "concurrency": 500
    },
    "handleBooking": {
      "minInstances": 5,
      "maxInstances": 100,
      "concurrency": 100
    }
  }
}
```

## DISASTER RECOVERY

### Backup Strategy

```
Daily incremental backups → Weekly full backups → Monthly archive

Recovery Time Objective (RTO): 1 hour
Recovery Point Objective (RPO): 1 day
```

### Failover Plan

```bash
# Switch to backup region
gcloud config set project puraestate-backend-backup
firebase database:set rules rtdb-rules.json

# Verify data integrity
firebase firestore:import backup-latest.json --merge=true
```

## Performance Tuning

### Query Optimization

```javascript
// Before (2000ms)
db.collection('bookings')
  .where('userId', '==', userId)
  .get()

// After (200ms) - with index
db.collection('bookings')
  .where('userId', '==', userId)
  .where('status', '==', 'confirmed')
  .orderBy('scheduledDate', 'desc')
  .limit(20)
  .get()
```

### Function Optimization

```javascript
// Before (5000ms)
const users = await db.collection('users').get(); // 1000ms
const bookings = await db.collection('bookings').get(); // 2000ms
const payments = await db.collection('payments').get(); // 2000ms

// After (1500ms) - parallel
const [users, bookings, payments] = await Promise.all([
  db.collection('users').get(),
  db.collection('bookings').get(),
  db.collection('payments').get()
]);
```

## Maintenance Schedule

```
Daily:
- Monitor error rates
- Check disk usage
- Verify backups

Weekly:
- Review performance metrics
- Cleanup old logs
- Update security patches

Monthly:
- Optimize database indexes
- Review cost analysis
- Update documentation
- Test disaster recovery

Quarterly:
- Capacity planning
- Load testing
- Security audit
- Update dependencies
```

## Support & Resources

- Firebase Documentation: https://firebase.google.com/docs
- Cloud Functions Guide: https://cloud.google.com/functions/docs
- Pricing Calculator: https://firebase.google.com/pricing-calculator
- Support: https://firebase.google.com/support
