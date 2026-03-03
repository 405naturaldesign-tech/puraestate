# PuraEstate Infrastructure & Monitoring Guide

**Version:** 1.0
**Last Updated:** February 24, 2026
**Status:** Production-Ready

---

## Table of Contents

1. [Infrastructure Setup](#infrastructure-setup)
2. [Monitoring & Alerts](#monitoring--alerts)
3. [Logging Strategy](#logging-strategy)
4. [Backup & Disaster Recovery](#backup--disaster-recovery)
5. [Performance Metrics](#performance-metrics)
6. [Security Monitoring](#security-monitoring)

---

## Infrastructure Setup

### AWS Architecture

```
┌────────────────────────────────────────────────────┐
│              AWS Account (puraestate-prod)         │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │     CloudFront CDN                           │ │
│  │  - Cache static assets                       │ │
│  │  - DDoS protection                           │ │
│  │  - SSL/TLS termination                       │ │
│  └──────────────┬───────────────────────────────┘ │
│                 │                                  │
│  ┌──────────────▼───────────────────────────────┐ │
│  │     Application Load Balancer (ALB)          │ │
│  │  - Route to backend services                 │ │
│  │  - Health checks                             │ │
│  │  - SSL termination                           │ │
│  └──────────────┬───────────────────────────────┘ │
│                 │                                  │
│  ┌──────────────▼───────────────────────────────┐ │
│  │     ECS Cluster (puraestate-prod)            │ │
│  │                                              │ │
│  │  ┌─────────────────────────────────────┐   │ │
│  │  │ Task: Backend (Node.js)             │   │ │
│  │  │ - 3 replicas (high availability)    │   │ │
│  │  │ - Auto-scaling 1-10 instances       │   │ │
│  │  └─────────────────────────────────────┘   │ │
│  │                                              │ │
│  │  ┌─────────────────────────────────────┐   │ │
│  │  │ Task: Web Frontend (Next.js)        │   │ │
│  │  │ - 2 replicas                        │   │ │
│  │  │ - Auto-scaling 1-5 instances        │   │ │
│  │  └─────────────────────────────────────┘   │ │
│  └──────────────┬───────────────────────────────┘ │
│                 │                                  │
│     ┌───────────┼───────────────┬─────────────┐   │
│     │           │               │             │   │
│  ┌──▼──┐  ┌────▼────┐  ┌──────▼─┐  ┌───────▼─┐  │
│  │ RDS │  │ElastiC  │  │  S3    │  │ Secrets │  │
│  │ PG  │  │  Cache  │  │Buckets │  │ Manager │  │
│  │     │  │(Redis)  │  │ (CDN)  │  │         │  │
│  └─────┘  └─────────┘  └────────┘  └─────────┘  │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Terraform Infrastructure as Code

```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "puraestate-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "PuraEstate"
      Environment = "prod"
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "puraestate-vpc"
  }
}

# Public Subnets
resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "puraestate-public-1a"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "puraestate-public-1b"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "puraestate-prod"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  depends_on = [aws_cloudwatch_log_group.ecs]
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier     = "puraestate-prod-db"
  engine         = "postgres"
  engine_version = "14.7"
  instance_class = "db.t3.large"

  allocated_storage    = 100
  storage_encrypted    = true
  storage_type         = "gp3"
  iops                 = 3000
  backup_retention_period = 30
  backup_window        = "03:00-04:00"
  maintenance_window   = "mon:04:00-mon:05:00"

  db_name  = "puraestate"
  username = "puraestate"
  password = random_password.db_password.result

  multi_az            = true
  skip_final_snapshot = false
  final_snapshot_identifier = "puraestate-prod-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Performance Insights
  performance_insights_enabled = true

  enable_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name = "puraestate-prod-db"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "puraestate-prod"
  engine               = "redis"
  node_type            = "cache.r6g.large"
  num_cache_nodes      = 3
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis.name

  security_group_ids = [aws_security_group.redis.id]

  automatic_failover_enabled = true
  multi_az_enabled          = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = {
    Name = "puraestate-prod-redis"
  }
}

# S3 Bucket for uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "puraestate-prod-uploads"

  tags = {
    Name = "puraestate-prod-uploads"
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled = true

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB"

    forwarded_values {
      query_string = true
      headers      = ["Accept", "Accept-Encoding"]
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = false
    acm_certificate_arn            = aws_acm_certificate.main.arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name = "puraestate-prod-cdn"
  }
}
```

---

## Monitoring & Alerts

### Datadog Setup

```yaml
# datadog-agent-config.yaml
api_key: ${DD_API_KEY}
app_key: ${DD_APPLICATION_KEY}

# Hostname
hostname: puraestate-prod-api-01

# Tags
tags:
  - environment:prod
  - service:puraestate-backend
  - version:2.0.0

# APM Configuration
apm_config:
  enabled: true
  bind_host: 0.0.0.0
  bind_port: 8126

# Logs
logs_config:
  enabled: true

logs_enabled: true

# Processes
process_config:
  enabled: true

# Trace sampling
trace_config:
  sample_rate: 0.1  # 10% sampling

# Custom metrics
custom_metrics:
  - metric_name: puraestate.listings.created
    metric_type: count
  - metric_name: puraestate.messages.sent
    metric_type: count
```

### Dashboards

#### Main Dashboard

```json
{
  "dashboard": {
    "title": "PuraEstate Production Dashboard",
    "widgets": [
      {
        "type": "timeseries",
        "title": "Request Rate",
        "query": "avg:trace.web.request.hits{service:puraestate}",
        "yaxis": { "label": "Requests/sec" }
      },
      {
        "type": "gauge",
        "title": "API Latency (p99)",
        "query": "p99:trace.web.request.duration{service:puraestate}",
        "thresholds": {
          "warning": 500,
          "error": 1000
        }
      },
      {
        "type": "status_timeline",
        "title": "Service Health",
        "query": "avg:system.cpu{host:puraestate-prod-*}"
      },
      {
        "type": "number",
        "title": "Error Rate",
        "query": "avg:trace.web.request.errors{service:puraestate}",
        "format": "percent"
      },
      {
        "type": "heatmap",
        "title": "Response Time Distribution",
        "query": "trace.web.request.duration{service:puraestate}"
      },
      {
        "type": "table",
        "title": "Top Slow Endpoints",
        "query": "avg:trace.web.request.duration{service:puraestate} by {resource_name}"
      }
    ]
  }
}
```

### Alert Rules

```yaml
# High Error Rate Alert
alert:
  name: "High Error Rate - PuraEstate"
  type: "metric"
  query: |
    avg(last_5m): avg:trace.web.request.errors{service:puraestate} > 0.01
  threshold: 0.01
  message: |
    ERROR Rate exceeded 1%!
    Service: {{service.name}}
    Current: {{value}}%
    @pagerduty @ops-team@puraestate.com
  tags:
    - severity:critical
    - team:backend

# High Latency Alert
alert:
  name: "High API Latency - PuraEstate"
  type: "metric"
  query: |
    avg(last_10m): p99:trace.web.request.duration{service:puraestate} > 500
  threshold: 500
  message: |
    API latency high!
    p99: {{value}}ms
    @ops-team@puraestate.com
  tags:
    - severity:warning
    - team:backend

# Database Connection Pool Alert
alert:
  name: "High DB Connection Usage"
  type: "metric"
  query: |
    avg(last_5m): avg:postgres.active_connections{service:puraestate} > 45
  threshold: 45
  message: |
    Database connection pool near capacity!
    Active: {{value}}/50
    @database-team@puraestate.com
  tags:
    - severity:warning
    - team:database

# Memory Alert
alert:
  name: "High Memory Usage"
  type: "metric"
  query: |
    avg(last_5m): avg:system.mem.pct_usable{host:puraestate-prod-*} < 0.1
  threshold: 0.1
  message: |
    Low available memory!
    Available: {{value}}%
    @ops-team@puraestate.com
  tags:
    - severity:critical
    - team:infrastructure

# Disk Space Alert
alert:
  name: "Low Disk Space"
  type: "metric"
  query: |
    avg(last_5m): avg:system.disk.free{host:puraestate-prod-*} < 5
  threshold: 5
  message: |
    Low disk space on {{host.name}}!
    Free: {{value}}GB
    @ops-team@puraestate.com
  tags:
    - severity:critical
    - team:infrastructure
```

---

## Logging Strategy

### Structured Logging

```typescript
// logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'puraestate-backend' },
  transports: [
    // Console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File in production
    new winston.transports.File({
      filename: '/var/log/puraestate/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: '/var/log/puraestate/combined.log'
    })
  ]
})

export default logger

// Usage
logger.info('User login', { userId: 'user-123', ip: '192.168.1.1' })
logger.error('Failed to create listing', {
  error: err.message,
  userId: 'user-123',
  listingData: { title: '...' }
})
logger.warn('High API latency', { endpoint: '/api/search', duration: 1500 })
```

### Log Aggregation (ELK Stack)

```yaml
# docker-compose.elk.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=changeme
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=elastic
      - ELASTICSEARCH_PASSWORD=changeme
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.0.0
    volumes:
      - /var/log/puraestate:/var/log/puraestate:ro
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

### Log Analysis Queries

```sql
-- PostgreSQL logs
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Connection monitoring
SELECT datname, usename, state, COUNT(*)
FROM pg_stat_activity
GROUP BY datname, usename, state
ORDER BY count DESC;
```

---

## Backup & Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# backup.sh - Daily backup routine

# Database backup
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/puraestate/$BACKUP_DATE"

mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump -h prod-db.example.com -U puraestate_prod -d puraestate_prod | \
  gzip > $BACKUP_DIR/database.sql.gz

# S3 uploads backup
aws s3 sync s3://puraestate-prod-uploads/ \
  $BACKUP_DIR/s3-uploads/ \
  --region us-east-1

# Upload to S3 for durability
aws s3 sync $BACKUP_DIR \
  s3://puraestate-backups/$BACKUP_DATE/ \
  --region us-east-1

# Cleanup old local backups (keep 7 days)
find /backups/puraestate -type d -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR"
```

### Recovery Procedures

#### Database Recovery

```bash
#!/bin/bash
# recover-database.sh

BACKUP_FILE=$1  # e.g., /backups/puraestate/20240224_030000/database.sql.gz

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Create new database
createdb puraestate_restore

# Restore from backup
gunzip < $BACKUP_FILE | psql -h localhost -U puraestate_prod -d puraestate_restore

# Verify recovery
psql -h localhost -U puraestate_prod -d puraestate_restore -c "SELECT COUNT(*) FROM users;"

# If verified, rename databases
psql -h localhost -U postgres -c "
  ALTER DATABASE puraestate RENAME TO puraestate_old;
  ALTER DATABASE puraestate_restore RENAME TO puraestate;
"

echo "Database recovered successfully"
```

### RTO/RPO Targets

```
Service: PuraEstate Production

Recovery Time Objective (RTO):
- Full system: 4 hours
- Database: 30 minutes
- Cache: 5 minutes
- Static assets: 15 minutes

Recovery Point Objective (RPO):
- Database: 1 hour
- User files: 1 hour
- Configuration: 24 hours

Backup Schedule:
- Database: Every 6 hours (daily = 4 backups/day)
- Files: Daily
- Snapshots: Weekly
- Full backup: Monthly
```

---

## Performance Metrics

### Key Performance Indicators (KPIs)

```
API Performance:
- Request latency (p50, p95, p99): Target < 200ms, 500ms, 1000ms
- Error rate: Target < 0.5%
- Availability: Target > 99.9%
- Throughput: Target > 1000 req/sec

Database Performance:
- Query latency (p99): Target < 100ms
- Connection pool usage: Target < 80%
- Replication lag: Target < 1 second
- Cache hit rate: Target > 80%

Frontend Performance:
- Page load time (p75): Target < 3 seconds
- Largest Contentful Paint: Target < 2.5 seconds
- Cumulative Layout Shift: Target < 0.1
- First Input Delay: Target < 100ms

Business Metrics:
- Listings created/day
- Active users
- Conversion rate
- User retention
```

### Custom Metrics

```typescript
// Emit custom metrics to Datadog
import { StatsD } from 'node-dogstatsd'

const statsd = new StatsD()

// Track listing creation
app.post('/api/listings', (req: Request, res: Response) => {
  const startTime = Date.now()

  // ... create listing ...

  const duration = Date.now() - startTime

  // Increment counter
  statsd.increment('puraestate.listings.created')

  // Track timing
  statsd.timing('puraestate.listings.create_duration', duration)

  // Track gauge
  statsd.gauge('puraestate.listings.price', listing.price)
})

// Track search
app.post('/api/search', (req: Request, res: Response) => {
  // ... search logic ...

  statsd.increment('puraestate.search.queries')
  statsd.gauge('puraestate.search.results_count', results.length)
})
```

---

## Security Monitoring

### Security Event Logging

```typescript
// securityLogger.ts
import logger from './logger'

export const securityLogger = {
  // Authentication events
  loginAttempt: (email: string, ip: string, success: boolean) => {
    logger.info('Login attempt', { email, ip, success })
  },

  // Failed login attempts (brute force detection)
  loginFailed: (email: string, ip: string, attempts: number) => {
    logger.warn('Multiple failed login attempts', { email, ip, attempts })
    if (attempts > 5) {
      logger.error('Brute force attack detected', { email, ip })
      // Trigger alert
    }
  },

  // Authorization events
  permissionDenied: (userId: string, resource: string, action: string) => {
    logger.warn('Permission denied', { userId, resource, action })
  },

  // Data access events
  sensitiveDataAccess: (userId: string, dataType: string, recordId: string) => {
    logger.info('Sensitive data accessed', { userId, dataType, recordId })
  },

  // Configuration changes
  configChange: (userId: string, setting: string, oldValue: any, newValue: any) => {
    logger.info('Configuration changed', { userId, setting, oldValue, newValue })
  },

  // API key generation/rotation
  apiKeyRotation: (userId: string, keyId: string) => {
    logger.info('API key rotated', { userId, keyId })
  }
}
```

### Security Alerts

```yaml
# Brute Force Detection
alert:
  name: "Brute Force Attack Detection"
  type: "custom"
  condition: |
    failed_logins > 5 in last 15 minutes
  message: |
    Possible brute force attack detected!
    Email: {{email}}
    IP: {{ip}}
    Failed attempts: {{count}}
    @security-team@puraestate.com
  tags:
    - severity:critical
    - team:security

# Suspicious API Access
alert:
  name: "Suspicious API Access Pattern"
  type: "custom"
  condition: |
    api_requests > 1000 per minute from single IP
  message: |
    Suspicious API access detected!
    IP: {{ip}}
    Requests: {{count}}/min
    @security-team@puraestate.com
  tags:
    - severity:critical
    - team:security

# Data Exfiltration Detection
alert:
  name: "Potential Data Exfiltration"
  type: "custom"
  condition: |
    data_download > 100GB in last 1 hour from single user
  message: |
    Large data download detected!
    User: {{userId}}
    Amount: {{size}}GB
    @security-team@puraestate.com
  tags:
    - severity:critical
    - team:security
```

### Vulnerability Scanning

```bash
#!/bin/bash
# security-scan.sh - Weekly security scan

echo "=== Weekly Security Scan ==="

# 1. OWASP Dependency Check
dependency-check --project "PuraEstate" --scan ./node_modules

# 2. Snyk scan
snyk test --severity-threshold=high

# 3. SonarQube analysis
sonar-scanner \
  -Dsonar.projectKey=puraestate \
  -Dsonar.sources=src \
  -Dsonar.host.url=https://sonar.example.com

# 4. Container security scan
trivy image puraestate-backend:latest

# 5. Infrastructure scan
tfsec ./terraform

# 6. Generate report
echo "Security scan completed at $(date)"
```

---

## Monitoring Checklist

### Daily
- [ ] Check error rates (< 0.5%)
- [ ] Monitor API latency (p99 < 1s)
- [ ] Review database performance
- [ ] Check backup completion
- [ ] Review security logs

### Weekly
- [ ] Analyze performance trends
- [ ] Review slow queries
- [ ] Check disk usage
- [ ] Verify backup integrity
- [ ] Security vulnerability scan

### Monthly
- [ ] Capacity planning review
- [ ] Cost optimization analysis
- [ ] Disaster recovery drill
- [ ] Security audit
- [ ] Performance optimization

### Quarterly
- [ ] Full infrastructure audit
- [ ] Load testing
- [ ] Penetration testing
- [ ] Compliance review
- [ ] Disaster recovery test

---

**Version:** 1.0
**Status:** Production-Ready
**Last Updated:** February 24, 2026
