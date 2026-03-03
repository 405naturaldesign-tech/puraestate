# PuraEstate n8n Webhook URLs

## Base URL
All webhooks are served from your n8n instance:
```
https://n8n.puraestate.co.za/webhook/
```

## Active Webhook Endpoints

### 1. Listing Ingestion (External Sources)
```
POST https://n8n.puraestate.co.za/webhook/puraestate/listings/ingest
```
- **Auth**: Header `x-api-key: YOUR_WEBHOOK_API_KEY`
- **Workflow**: 05_webhook_ingestion.json
- **Use case**: External scrapers, partner feeds, manual uploads

**Request Body (JSON):**
```json
{
  "title": "3 Bedroom House in Constantia",
  "price": 4500000,
  "price_currency": "ZAR",
  "property_type": "house",
  "bedrooms": 3,
  "bathrooms": 2,
  "suburb": "Constantia",
  "city": "Cape Town",
  "province": "Western Cape",
  "size_sqm": 220,
  "url": "https://example.com/listing/123",
  "source": "your_source_name",
  "description": "Beautiful family home...",
  "agent_name": "Jane Smith",
  "agent_phone": "+27821234567",
  "agent_email": "jane@agency.co.za",
  "images": ["https://example.com/img1.jpg"],
  "listing_id": "optional_your_own_id"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "id": 1234,
  "listing_id": "webhook_1708123456_abc123",
  "message": "Listing received and stored successfully"
}
```

### 2. Inquiry Form Webhook
```
POST https://n8n.puraestate.co.za/webhook/puraestate/inquiry
```
- **Auth**: None (public webhook, CORS-restricted to puraestate.co.za)
- **Workflow**: 18_inquiry_form_processing.json
- **Use case**: Website contact/inquiry forms

**Request Body (JSON):**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "0821234567",
  "message": "I'm interested in this property...",
  "property_id": "listing_123",
  "property_url": "https://puraestate.co.za/properties/123",
  "property_title": "3 Bedroom House in Cape Town",
  "budget": 3000000,
  "bedrooms": 3,
  "province": "Western Cape",
  "city": "Cape Town",
  "timeline": "3_6_months",
  "financing_type": "bond_approved",
  "viewing_requested": true,
  "source": "website",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "cape-town-properties"
}
```

**Timeline options**: `immediate`, `1_3_months`, `3_6_months`, `6_12_months`, `just_browsing`
**Financing options**: `cash`, `bond_approved`, `bond_applying`, `unknown`

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Thank you for your inquiry! We'll be in touch within 24 hours.",
  "reference": "456"
}
```

## Webhook Security

### For Listing Ingestion (API Key Auth):
Add this header to all requests:
```
x-api-key: YOUR_WEBHOOK_API_KEY_1
```
Or use Bearer token:
```
Authorization: Bearer YOUR_WEBHOOK_API_KEY_1
```

### IP Allowlisting (Optional):
Add to nginx config to restrict webhook access:
```nginx
location /webhook/puraestate/listings/ {
    allow 10.0.0.0/8;       # Internal network
    allow 203.0.113.0/24;   # Partner IP range
    deny all;
    proxy_pass http://localhost:5678;
}
```

## Testing Webhooks

### Test Listing Ingestion:
```bash
curl -X POST https://n8n.puraestate.co.za/webhook/puraestate/listings/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_WEBHOOK_API_KEY_1" \
  -d '{
    "title": "Test Property",
    "price": 1500000,
    "property_type": "house",
    "city": "Cape Town",
    "province": "Western Cape",
    "source": "test"
  }'
```

### Test Inquiry Form:
```bash
curl -X POST https://n8n.puraestate.co.za/webhook/puraestate/inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@puraestate.co.za",
    "message": "Test inquiry",
    "province": "Western Cape"
  }'
```

## Webhook for Flask Scraper Callback
If you want the Flask scraper to notify n8n when scraping is complete (instead of n8n polling):

```
POST https://n8n.puraestate.co.za/webhook/puraestate/scraper/complete
```

Configure Flask to POST to this URL after each scraping job with:
```json
{
  "job_id": "daily_scrape_20260222",
  "status": "complete",
  "properties_found": 145,
  "timestamp": "2026-02-22T06:15:00Z"
}
```
