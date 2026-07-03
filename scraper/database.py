"""
database.py — SQLite backend with upsert deduplication on source_url.

Matches the PuraEstate schema patterns (properties + contacts + scrape_logs).
Stores results locally for fast iteration. Swappable to PostgreSQL later.
"""

import sqlite3
import os
from datetime import datetime, timezone
from typing import Optional

DB_PATH = os.environ.get("PROPERATI_DB", os.path.join(os.path.dirname(__file__), "properati.db"))


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS properties (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                source_url      TEXT NOT NULL UNIQUE,
                source_name     TEXT NOT NULL DEFAULT 'properati',
                external_id     TEXT,
                listing_type    TEXT,
                property_type   TEXT,
                title           TEXT,
                description     TEXT,
                price           REAL,
                price_currency  TEXT DEFAULT 'USD',
                price_per_sqm   REAL,
                address         TEXT,
                neighborhood    TEXT,
                city            TEXT,
                province        TEXT,
                country         TEXT DEFAULT 'Costa Rica',
                lat             REAL,
                lng             REAL,
                bedrooms        INTEGER,
                bathrooms       INTEGER,
                parking         INTEGER,
                total_area_sqm  REAL,
                built_area_sqm  REAL,
                lot_area_sqm    REAL,
                status          TEXT DEFAULT 'active',
                is_featured     INTEGER DEFAULT 0,
                is_verified     INTEGER DEFAULT 0,
                amenities       TEXT,
                features        TEXT,
                contact_name    TEXT,
                contact_phone   TEXT,
                contact_email   TEXT,
                agency_name     TEXT,
                published_date  TEXT,
                created_at      TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS scrape_logs (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                source_url      TEXT,
                source_name     TEXT NOT NULL DEFAULT 'properati',
                status          TEXT NOT NULL DEFAULT 'success',
                error           TEXT,
                duration_ms     INTEGER,
                scraped_at      TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS scraper_runs (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                source_name     TEXT NOT NULL DEFAULT 'properati',
                started_at      TEXT NOT NULL,
                finished_at     TEXT,
                status          TEXT NOT NULL DEFAULT 'running',
                total_count     INTEGER DEFAULT 0,
                new_count       INTEGER DEFAULT 0,
                updated_count   INTEGER DEFAULT 0,
                error_count     INTEGER DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_properties_source_url ON properties(source_url);
            CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);
            CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
        """)
        conn.commit()
    finally:
        conn.close()


def upsert_property(prop: dict) -> tuple[bool, int | None]:
    """
    Insert or update a property row. Returns (is_new, property_id).
    Deduplication is done via source_url.
    """
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM properties WHERE source_url = ?",
            (prop["source_url"],),
        ).fetchone()

        is_new = existing is None

        if is_new:
            cursor = conn.execute(
                """INSERT INTO properties (
                    source_url, source_name, external_id,
                    listing_type, property_type, title, description,
                    price, price_currency, price_per_sqm,
                    address, neighborhood, city, province, country,
                    lat, lng,
                    bedrooms, bathrooms, parking,
                    total_area_sqm, built_area_sqm, lot_area_sqm,
                    status, is_featured, is_verified,
                    amenities, features,
                    contact_name, contact_phone, contact_email,
                    agency_name, published_date,
                    updated_at
                ) VALUES (
                    :source_url, :source_name, :external_id,
                    :listing_type, :property_type, :title, :description,
                    :price, :price_currency, :price_per_sqm,
                    :address, :neighborhood, :city, :province, :country,
                    :lat, :lng,
                    :bedrooms, :bathrooms, :parking,
                    :total_area_sqm, :built_area_sqm, :lot_area_sqm,
                    :status, :is_featured, :is_verified,
                    :amenities, :features,
                    :contact_name, :contact_phone, :contact_email,
                    :agency_name, :published_date,
                    datetime('now')
                )""",
                prop,
            )
            property_id = cursor.lastrowid
        else:
            property_id = existing["id"]
            conn.execute(
                """UPDATE properties SET
                    price = :price,
                    price_currency = :price_currency,
                    price_per_sqm = :price_per_sqm,
                    title = :title,
                    description = :description,
                    address = :address,
                    neighborhood = :neighborhood,
                    city = :city,
                    province = :province,
                    lat = :lat,
                    lng = :lng,
                    bedrooms = :bedrooms,
                    bathrooms = :bathrooms,
                    parking = :parking,
                    total_area_sqm = :total_area_sqm,
                    built_area_sqm = :built_area_sqm,
                    status = :status,
                    contact_name = :contact_name,
                    contact_phone = :contact_phone,
                    agency_name = :agency_name,
                    published_date = :published_date,
                    updated_at = datetime('now')
                WHERE id = :id""",
                {**prop, "id": property_id},
            )

        conn.commit()
        return (is_new, property_id)
    finally:
        conn.close()


def log_scrape(source_url: str, status: str = "success", error: Optional[str] = None,
               duration_ms: Optional[int] = None):
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO scrape_logs (source_url, source_name, status, error, duration_ms) VALUES (?, ?, ?, ?, ?)",
            (source_url, "properati", status, error, duration_ms),
        )
        conn.commit()
    finally:
        conn.close()


def start_run() -> int | None:
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO scraper_runs (source_name, started_at) VALUES ('properati', datetime('now'))"
        )
        run_id = cursor.lastrowid
        conn.commit()
        return run_id
    finally:
        conn.close()


def finish_run(run_id: int, total: int = 0, new_count: int = 0,
               updated_count: int = 0, error_count: int = 0):
    conn = get_connection()
    try:
        conn.execute(
            """UPDATE scraper_runs SET
                finished_at = datetime('now'),
                status = 'completed',
                total_count = ?,
                new_count = ?,
                updated_count = ?,
                error_count = ?
            WHERE id = ?""",
            (total, new_count, updated_count, error_count, run_id),
        )
        conn.commit()
    finally:
        conn.close()


def get_all_properties(limit: int = 50, offset: int = 0) -> list[dict]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM properties ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_new_properties(since_run_id: Optional[int] = None) -> list[dict]:
    """Get properties created since the last run (or all if no runs exist)."""
    conn = get_connection()
    try:
        if since_run_id:
            row = conn.execute(
                "SELECT finished_at FROM scraper_runs WHERE id = ? AND finished_at IS NOT NULL",
                (since_run_id,),
            ).fetchone()
            if row:
                rows = conn.execute(
                    "SELECT * FROM properties WHERE created_at > ? ORDER BY created_at DESC",
                    (row["finished_at"],),
                ).fetchall()
                return [dict(r) for r in rows]

        # Fallback: get properties from the last scraper run
        run = conn.execute(
            "SELECT finished_at FROM scraper_runs WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 1"
        ).fetchone()
        if run:
            rows = conn.execute(
                "SELECT * FROM properties WHERE created_at > ? ORDER BY created_at DESC",
                (run["finished_at"],),
            ).fetchall()
            return [dict(r) for r in rows]

        return []
    finally:
        conn.close()


def get_stats() -> dict:
    conn = get_connection()
    try:
        total = conn.execute("SELECT COUNT(*) as c FROM properties").fetchone()["c"]
        active = conn.execute("SELECT COUNT(*) as c FROM properties WHERE status='active'").fetchone()["c"]
        last_run = conn.execute(
            "SELECT * FROM scraper_runs ORDER BY id DESC LIMIT 1"
        ).fetchone()
        return {
            "total_properties": total,
            "active_listings": active,
            "last_run": dict(last_run) if last_run else None,
        }
    finally:
        conn.close()