# PuraEstate — Properati.com.cr Property Scraper

Scrapes property listings from [Properati.com.cr](https://www.properati.com.cr) (Costa Rica's real estate portal) and stores them in a SQLite database.

Part of the **PuraEstate** platform — feeding property leads into a pipeline for WhatsApp notifications.

## Quick Start

### Prerequisites

- Python 3.10+
- pip

### Install

```bash
cd scraper/
pip install -r requirements.txt
```

### Usage

```bash
# Scrape all listings (stores in SQLite)
python scraper.py --run

# Scrape with limited pages (for testing)
python scraper.py --run --pages 2

# List stored properties
python scraper.py --list

# Show new properties since last run
python scraper.py --new

# Show database statistics
python scraper.py --stats

# Quick test (scrape 1 page, no DB write)
python scraper.py --test
```

## Docker

### Build

```bash
docker build -t puraestate-properati-scraper .
```

### Run

```bash
# Run the scraper
docker run --rm \
  -v $(pwd)/data:/app/data \
  puraestate-properati-scraper \
  python scraper.py --run

# List results
docker run --rm \
  -v $(pwd)/data:/app/data \
  puraestate-properati-scraper \
  python scraper.py --list
```

## Database

The scraper uses SQLite (stored in `properati.db` by default, or `data/properati.db` in Docker).

Set the `PROPERATI_DB` environment variable to use a custom path:

```bash
export PROPERATI_DB=/path/to/custom.db
python scraper.py --run
```

Properties are deduplicated on `source_url` — running the scraper multiple times will update existing listings rather than creating duplicates.

## Extracted Data

| Field | Source |
|-------|--------|
| Title | Listing card title |
| Price | Price display |
| Location | Location text |
| Bedrooms | Property features |
| Bathrooms | Property features |
| Area (m²) | Property features |
| Agency | Agency name |
| Published date | Listing timestamp |
| Source URL | Link to property |
| Price per m² | Calculated |
| JSON-LD data | Structured data (lat/lng, address components) |

## Project Structure

```
scraper/
├── scraper.py              # CLI entry point
├── properati_scraper.py    # Properati extraction logic
├── database.py             # SQLite database layer
├── Dockerfile              # Container build
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

## Swarm Deployment

To deploy on the Docker Swarm (PVE1: 192.168.1.222, PVE2: 192.168.1.223):

```bash
# Build and push to a registry, or build on the manager
docker build -t puraestate-properati-scraper .
docker tag puraestate-properati-scraper 192.168.1.222:5000/properati-scraper:latest
docker push 192.168.1.222:5000/properati-scraper:latest

# Deploy as a cron job service
docker service create \
  --name properati-scraper \
  --restart-condition any \
  --mount type=volume,source=properati-data,destination=/app/data \
  --env PROPERATI_DB=/app/data/properati.db \
  192.168.1.222:5000/properati-scraper:latest \
  python scraper.py --run
```
