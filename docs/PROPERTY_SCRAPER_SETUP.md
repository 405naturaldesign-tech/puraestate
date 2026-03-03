# Costa Rica Real Estate Property Scraper Setup Guide

Complete guide to scrape, filter, and organize Costa Rica property listings with distance calculations.

---

## 📋 What This Does

✅ Scrapes properties from multiple Costa Rica real estate sites
✅ Filters by: size (1+ acres), price ($100k and $50k categories)
✅ Calculates distances from LIR Airport and Tamarindo
✅ Extracts: price, location, contact info, listings links
✅ Exports to CSV, JSON, and formatted reports
✅ Logs all activity for transparency and debugging

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

**Required Libraries:**
- `requests` - HTTP requests
- `beautifulsoup4` - HTML parsing
- `lxml` - XML/HTML processing
- `selenium` - JavaScript-heavy site automation (optional)
- `pandas` - Data processing
- `geopy` - Geocoding (optional)

### 2. Run the Scraper

```bash
python3 costa_rica_property_scraper.py
```

### 3. View Results

**Files Generated:**
```
├── costa_rica_properties_100k.csv     # Properties under $100,000
├── costa_rica_properties_50k.csv      # Properties under $50,000
├── costa_rica_properties_100k.json    # JSON format (100k)
├── costa_rica_properties_50k.json     # JSON format (50k)
├── report_100k.txt                    # Summary report (100k)
├── report_50k.txt                     # Summary report (50k)
└── scraper.log                        # Detailed activity log
```

---

## 📊 Data Output Format

### CSV Columns
```
title                   - Property title/description
price                   - Price in USD
currency                - Currency type
acres                   - Land size in acres
location                - City/town location
province                - Costa Rica province
latitude                - GPS latitude
longitude               - GPS longitude
distance_to_lir_km      - Distance from Liberia airport (km)
distance_to_tamarindo_km - Distance from Tamarindo (km)
url                     - Direct link to listing
contact_name            - Owner/agent name
contact_phone           - Phone number
contact_email           - Email address
source                  - Website scraped from
scraped_date            - When data was collected
```

### Example CSV Row
```
Beautiful Land Lot,35000,USD,1.5,Nosara,Guanacaste,9.7369,-85.5915,87.45,22.10,https://properati.com/property/123,Juan García,+506-8765-4321,juan@realestate.cr,Properati.com.cr,2026-02-22T15:30:00
```

---

## 🌍 Data Sources

### Primary Sources (Configured)
1. **Properati.com.cr** - Large national platform
2. **Vivanuncios.com.cr** - Popular classifieds

### Additional Sources (Can Add)
3. **Facebook Marketplace** - Use Graph API
4. **CasasYTerrenos.com** - Local listings
5. **Fincasdecr.com** - Rural properties
6. **Zillow International** - Large listings database

---

## 🔧 Customization

### Change Price Filters

**Edit scraper.py:**
```python
# Modify in main() function
filtered_100k = scraper.filter_properties(min_acres=1.0, max_price=100000.0)
filtered_75k = scraper.filter_properties(min_acres=1.0, max_price=75000.0)
filtered_50k = scraper.filter_properties(min_acres=1.0, max_price=50000.0)
```

### Change Minimum Acreage

```python
# Default is 1.0 acre, change to:
filtered = scraper.filter_properties(min_acres=2.5, max_price=100000.0)
```

### Add New Scraper Source

```python
class MyRealestateScraper(PropertyScraper):
    """Scraper for my-realsite.com"""

    BASE_URL = "https://www.my-realsite.com"

    def scrape(self, pages: int = 5) -> int:
        """Scrape listings."""
        count = 0
        for page in range(1, pages + 1):
            url = f"{self.BASE_URL}/properties?page={page}"
            soup = self._get_page(url)
            if not soup:
                continue

            listings = soup.find_all('div', class_='property-card')
            for listing in listings:
                prop = self._extract_property(listing)
                if prop:
                    self.properties.append(prop)
                    count += 1
            time.sleep(2)

        return count

    def _extract_property(self, listing) -> Optional[Dict]:
        """Extract data from listing."""
        # Implement based on site HTML structure
        return {...}
```

### Change Key Locations

**Edit in script:**
```python
COORDINATES = {
    'lir_airport': (10.5928, -85.5427),      # Your latitude, longitude
    'tamarindo': (10.3064, -85.8382),
    'san_jose': (9.9281, -84.0907),          # Add more locations
    'manuel_antonio': (9.3889, -84.4149),
}
```

---

## 📍 Distance Reference

Distance calculations use Haversine formula (great-circle distance):

```
LIR Airport (Liberia): 10.5928°N, 85.5427°W
Tamarindo: 10.3064°N, 85.8382°W

Example distances from properties:
- Nosara to LIR: ~87 km
- Nosara to Tamarindo: ~22 km
- San José to LIR: ~215 km
```

---

## 🔐 Respectful Scraping Guidelines

### What We Do
✅ Respect `robots.txt`
✅ Add delays between requests (2 seconds)
✅ Use realistic User-Agent
✅ Identify ourselves as a scraper
✅ Check Terms of Service
✅ Handle errors gracefully

### Retry Strategy
- Automatic retries on server errors
- Backoff delays (1s, 2s, 4s, etc.)
- Max 3 retries per request
- Timeout: 10 seconds per request

### Rate Limiting
```python
time.sleep(2)  # Between page requests
time.sleep(5)  # Between different sites
```

---

## 📊 Data Analysis Examples

### Find Cheapest Properties

```python
import pandas as pd

df = pd.read_csv('costa_rica_properties_50k.csv')
print(df.nsmallest(10, 'price')[['title', 'price', 'location', 'distance_to_lir_km']])
```

### Group by Province

```python
by_province = df.groupby('province').agg({
    'price': ['count', 'mean', 'min', 'max'],
    'distance_to_lir_km': 'mean'
})
print(by_province)
```

### Filter by Distance

```python
# Properties close to Tamarindo
close_to_tamarindo = df[df['distance_to_tamarindo_km'] < 50]
print(f"Found {len(close_to_tamarindo)} properties within 50km of Tamarindo")
```

### Export for Google Maps

```python
# Create KML for Google Maps
for idx, row in df.iterrows():
    if row['latitude'] and row['longitude']:
        print(f"Lat: {row['latitude']}, Lon: {row['longitude']}, Title: {row['title']}")
```

---

## 🐛 Troubleshooting

### No Properties Found
- **Issue:** Websites may have changed HTML structure
- **Solution:** Update CSS selectors in `_extract_property()` methods
- **Check:** View page source and identify new class names

### Permission Denied Error
- **Issue:** Firewall or rate limiting
- **Solution:** Add longer delays between requests
- **Alternative:** Use VPN or rotate IP addresses

### Encoding Issues
- **Issue:** Spanish characters display incorrectly
- **Solution:** Already handled with `encoding='utf-8'`
- **Check:** Open CSV with: `pd.read_csv(file, encoding='utf-8')`

### Import Errors
```bash
# Install missing package
pip install beautifulsoup4

# Verify installation
python3 -c "import bs4; print(bs4.__version__)"
```

---

## 📈 Running Scheduled Scrapes

### Linux/Mac - Cron Job

```bash
# Edit crontab
crontab -e

# Run weekly (every Sunday at 2 AM)
0 2 * * 0 cd /home/tjdavis && python3 costa_rica_property_scraper.py >> scraper_log.txt 2>&1
```

### Windows - Task Scheduler

```cmd
# Create scheduled task
schtasks /create /tn "CostaRicaScraper" /tr "python C:\path\costa_rica_property_scraper.py" /sc weekly /d SUN /st 02:00:00
```

---

## 🔍 Advanced Features

### Add Geocoding

```python
from geopy.geocoders import Nominatim

geocoder = Nominatim(user_agent="property_scraper")

# Convert address to coordinates
try:
    location = geocoder.geocode(prop['location'])
    prop['latitude'] = location.latitude
    prop['longitude'] = location.longitude
except:
    logger.warning(f"Could not geocode {prop['location']}")
```

### Add Database Storage

```python
import sqlite3

def save_to_database(properties):
    conn = sqlite3.connect('properties.db')
    cursor = conn.cursor()

    cursor.execute('''CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY,
        title TEXT,
        price REAL,
        location TEXT,
        scraped_date TIMESTAMP
    )''')

    for prop in properties:
        cursor.execute('''INSERT INTO properties VALUES (NULL, ?, ?, ?, ?)''',
                      (prop['title'], prop['price'], prop['location'], prop['scraped_date']))

    conn.commit()
    conn.close()
```

### Create Interactive Dashboard

```python
import plotly.express as px
import pandas as pd

df = pd.read_csv('costa_rica_properties_100k.csv')

# Price distribution map
fig = px.scatter_geo(df,
    lat='latitude', lon='longitude',
    hover_name='title',
    hover_data={'price': True, 'location': True},
    color='price',
    title='Costa Rica Properties Under $100,000'
)
fig.show()
```

---

## 📞 Contact & Support

### Configuration Issues
- Check `scraper.log` for detailed errors
- Verify all URLs are accessible
- Test selector with: `soup.find_all('div', class_='property-card')`

### Adding New Sites
1. Identify HTML structure with browser DevTools
2. Find repeating elements (property cards)
3. Extract relevant data (title, price, location)
4. Create new Scraper class
5. Add to `main()` function

---

## 🎯 Next Steps

1. **Run initial scrape** to collect baseline data
2. **Review results** in CSV files
3. **Customize filters** for your specific needs
4. **Set up scheduled scraping** for weekly updates
5. **Integrate with dashboard** for monitoring
6. **Export to real estate platform** or CRM

---

## 📄 License & Terms

This scraper is for educational and personal use. Respect:
- Website Terms of Service
- robots.txt directives
- Rate limiting guidelines
- Data privacy regulations (GDPR, etc.)

Always:
- Disclose bot activity
- Respect copyright
- Don't overload servers
- Use data responsibly

---

Generated: 2026-02-22
Version: 1.0
Status: Ready to Deploy
