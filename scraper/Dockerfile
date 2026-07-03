FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY scraper.py properati_scraper.py database.py README.md ./

# Create a volume for the SQLite database
VOLUME ["/app/data"]

# Default command: show help
CMD ["python", "scraper.py", "--help"]

# Example docker run:
#   docker run --rm -v $(pwd)/data:/app/data puraestate-properati-scraper python scraper.py --run
#   docker run --rm -v $(pwd)/data:/app/data puraestate-properati-scraper python scraper.py --list