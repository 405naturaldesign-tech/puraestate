#!/usr/bin/env python3
"""
scraper.py — RE.cr Costa Rica MLS Property Scraper CLI.

Usage:
    python scraper.py --run          # Scrape all listings and store in DB
    python scraper.py --list         # Show all stored properties
    python scraper.py --new          # Show properties since last run
    python scraper.py --stats        # Show database statistics
    python scraper.py --test         # Quick test run (1 page, no DB write)
"""

import argparse
import logging
import sys
import time

from database import (
    init_db,
    upsert_property,
    log_scrape,
    start_run,
    finish_run,
    get_all_properties,
    get_new_properties,
    get_stats,
)
from re_cr_scraper import RECrScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("scraper")


def cmd_run(max_pages: int = 5):
    """Scrape RE.cr listings and store in SQLite."""
    logger.info("Starting RE.cr scraper run...")
    init_db()

    run_id = start_run()
    if not run_id:
        logger.error("Failed to start run in database")
        return 1

    try:
        scraper = RECrScraper(max_pages=max_pages)

        start_time = time.time()
        properties = scraper.scrape_all()
        elapsed = int((time.time() - start_time) * 1000)

        logger.info("Scraped %d properties. Storing in database...", len(properties))

        new_count = 0
        updated_count = 0
        error_count = 0

        for prop in properties:
            try:
                is_new, prop_id = upsert_property(prop)
                if is_new:
                    new_count += 1
                else:
                    updated_count += 1
                log_scrape(prop["source_url"], "success", duration_ms=elapsed // max(1, len(properties)))
            except Exception as e:
                logger.error("Failed to store property %s: %s", prop.get("source_url", "unknown"), e)
                log_scrape(prop.get("source_url", ""), "error", str(e))
                error_count += 1

        finish_run(run_id, len(properties), new_count, updated_count, error_count)

        logger.info("=" * 50)
        logger.info("Run complete!")
        logger.info("  Total scraped: %d", len(properties))
        logger.info("  New:           %d", new_count)
        logger.info("  Updated:       %d", updated_count)
        logger.info("  Errors:        %d", error_count)
        logger.info("  Duration:      %.1fs", elapsed / 1000)
        logger.info("=" * 50)

        return 0

    except Exception as e:
        logger.exception("Fatal error during scrape run: %s", e)
        finish_run(run_id, error_count=1)
        return 1


def cmd_list(limit: int = 50):
    """Display stored properties."""
    init_db()
    properties = get_all_properties(limit=limit)

    if not properties:
        print("No properties in database. Run `python scraper.py --run` first.")
        return

    print(f"\n{'ID':>4} {'Title':<50} {'Price':>15} {'Bed':>4} {'Bath':>4} {'Area':>8} {'City':<20}")
    print("-" * 115)
    for p in properties:
        price_str = f"{p['price']:,.0f} {p['price_currency']}" if p['price'] else "N/A"
        beds = str(p['bedrooms']) if p['bedrooms'] is not None else "-"
        baths = str(p['bathrooms']) if p['bathrooms'] is not None else "-"
        area = f"{p['total_area_sqm']:.0f}m²" if p['total_area_sqm'] else "-"
        city = (p['city'] or p['province'] or "")[:20]
        print(f"{p['id']:>4} {p['title'][:50]:50s} {price_str:>15} {beds:>4} {baths:>4} {area:>8} {city:<20}")

    print(f"\nTotal: {len(properties)} properties shown\n")


def cmd_new():
    """Show properties added since the last run."""
    init_db()
    new_props = get_new_properties()

    if not new_props:
        print("No new properties since last run.")
        return

    print(f"\n{'Title':<50} {'Price':>15} {'Bed':>4} {'Bath':>4} {'Area':>8} {'City':<20}")
    print("-" * 110)
    for p in new_props:
        price_str = f"{p['price']:,.0f} {p['price_currency']}" if p['price'] else "N/A"
        beds = str(p['bedrooms']) if p['bedrooms'] is not None else "-"
        baths = str(p['bathrooms']) if p['bathrooms'] is not None else "-"
        area = f"{p['total_area_sqm']:.0f}m²" if p['total_area_sqm'] else "-"
        city = (p['city'] or p['province'] or "")[:20]
        print(f"{p['title'][:50]:50s} {price_str:>15} {beds:>4} {baths:>4} {area:>8} {city:<20}")

    print(f"\n{len(new_props)} new properties since last run.\n")


def cmd_stats():
    """Show database statistics."""
    init_db()
    stats = get_stats()

    print("\n   RE.cr Scraper Statistics")
    print("=" * 45)
    print(f"  Total properties:  {stats['total_properties']}")
    print(f"  Active listings:   {stats['active_listings']}")
    if stats['last_run']:
        r = stats['last_run']
        print(f"  Last run:          {r['started_at']}")
        print(f"  Status:            {r['status']}")
        print(f"  Scraped:           {r['total_count']}")
        print(f"  New:               {r['new_count']}")
        print(f"  Updated:           {r['updated_count']}")
        print(f"  Errors:            {r['error_count']}")
    else:
        print("  Last run:          Never")
    print("=" * 45)
    print()


def cmd_test():
    """Quick test: scrape 1 page, print results, don't save to DB."""
    logger.info("Running quick test (1 page, no DB write)...")
    scraper = RECrScraper(max_pages=1)
    properties = scraper.scrape_all()

    print(f"\n  Test Results: {len(properties)} properties found\n")
    print(f"{'Title':<50} {'Price':>15} {'Bed':>4} {'Bath':>4} {'Area':>8} {'City':<20}")
    print("-" * 110)
    for p in properties[:20]:
        price_str = f"{p['price']:,.0f} {p['price_currency']}" if p['price'] else "N/A"
        beds = str(p['bedrooms']) if p['bedrooms'] is not None else "-"
        baths = str(p['bathrooms']) if p['bathrooms'] is not None else "-"
        area = f"{p['total_area_sqm']:.0f}m²" if p['total_area_sqm'] else "-"
        city = (p['city'] or p['province'] or "")[:20]
        print(f"{p['title'][:50]:50s} {price_str:>15} {beds:>4} {baths:>4} {area:>8} {city:<20}")

    if len(properties) > 20:
        print(f"... and {len(properties) - 20} more")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="PuraEstate RE.cr Costa Rica MLS Property Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
Examples:
  python scraper.py --run          # Full scrape
  python scraper.py --run --pages 3  # Scrape 3 pages per search
  python scraper.py --list         # Show stored properties
  python scraper.py --new          # Show new properties since last run
  python scraper.py --stats        # Show database stats
  python scraper.py --test         # Quick test (no DB write)
        """,
    )

    parser.add_argument("--run", action="store_true", help="Scrape properties and store in database")
    parser.add_argument("--list", action="store_true", help="List stored properties")
    parser.add_argument("--new", action="store_true", help="Show new properties since last run")
    parser.add_argument("--stats", action="store_true", help="Show database statistics")
    parser.add_argument("--test", action="store_true", help="Quick test (scrape 1 page, no DB write)")
    parser.add_argument("--pages", type=int, default=5, help="Max pages per search URL (default: 5)")
    parser.add_argument("--limit", type=int, default=50, help="Max results for --list (default: 50)")

    args = parser.parse_args()

    if not any([args.run, args.list, args.new, args.stats, args.test]):
        parser.print_help()
        return 0

    if args.run:
        return cmd_run(max_pages=args.pages)
    elif args.list:
        cmd_list(limit=args.limit)
    elif args.new:
        cmd_new()
    elif args.stats:
        cmd_stats()
    elif args.test:
        cmd_test()

    return 0


if __name__ == "__main__":
    sys.exit(main())