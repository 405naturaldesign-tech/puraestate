# Error Handling Audit — PuraEstate Integration Test Suite

**Date:** 2026-06-23  
**Scope:** All source code in `integrations/`, `backend/blueprints/`, and selected `backend/utils/`  
**Test files reviewed:** `tests/integration/test_integrations.py`, `integrations/tests/test_integrations.py`, `tests/fixtures/mocks.py`

---

## 1. Catalog of `side_effect` Error Simulations in Tests

| # | Test File | Test Class / Method | Error Type Simulated | Source Function Tested |
|---|-----------|---------------------|---------------------|----------------------|
| 1 | `tests/integration/test_integrations.py:77` | `TestN8nClient.test_trigger_webhook_failure_returns_none` | `mock_failure_response()` → generic `Exception("Connection refused")` | `N8nClient.trigger_webhook()` |
| 2 | `integrations/tests/test_integrations.py:72` | `TestN8nClient.test_trigger_webhook_failure_returns_none` | `mock_failure_response()` → generic `Exception("Connection refused")` | `N8nClient.trigger_webhook()` |
| 3 | `tests/integration/test_integrations.py:265-266` | `TestAWSS3Client.test_upload_image_client_error` | `botocore.exceptions.ClientError({"Error": {"Code": "403", "Message": "Forbidden"}}, "PutObject")` | `AWSS3Client.upload_image()` |
| 4 | `integrations/tests/test_integrations.py:270-271` | `TestAWSS3Client.test_upload_image_client_error` | `botocore.exceptions.ClientError({"Error": {"Code": "403", "Message": "Forbidden"}}, "PutObject")` | `AWSS3Client.upload_image()` |

**Shared factory** (`tests/fixtures/mocks.py:40-53`): `mock_failure_response()` returns a plain `Exception("Connection refused")`.

---

## 2. Source Code Error Handling — Module-by-Module Analysis

### 2.1 `integrations/n8n_client.py` — ✅ Good

| Method | Catches | Specific Types | Logging | Returns |
|--------|---------|----------------|---------|---------|
| `trigger_webhook` | `requests.RequestException` | ✅ (covers `ConnectionError`, `Timeout`, `HTTPError`) | ✅ `logger.error` | `None` |
| `_api_get` | `Exception` | ❌ bare catch-all | ✅ | `None` |
| `_api_post` | `Exception` | ❌ bare catch-all | ✅ | `None` |
| `_api_patch` | `Exception` | ❌ bare catch-all | ✅ | `None` |

**Issue:** REST API helpers use bare `Exception` instead of `requests.RequestException`.

### 2.2 `integrations/webhooks.py` — ✅ Good

| Method | Catches | Notes |
|--------|---------|-------|
| `_deliver` | `requests.RequestException` | ✅ Full retry logic with exponential backoff. HTTP status codes (2xx=ok, 5xx=retry, other=fail) handled explicitly. |
| `handle_incoming` | `Exception` around handlers | ✅ Per-handler isolation, errors collected, logged, returned as `"partial"`. |
| `create_flask_app` | ImportError | ✅ Explicit helpful error message. |

### 2.3 `integrations/slack_bot.py` — ✅ Good (minor nit)

| Method | Catches | Types |
|--------|---------|-------|
| `_send_message` | `SlackApiError` → `Exception` | ✅ Specific then catch-all |
| `_send_blocks` | `Exception` | ✅ Catch-all with logging |

**Nit:** The `_send_blocks` webhook path uses bare `Exception`, but the Slack SDK path could raise `SlackApiError` which is also caught by the catch-all. Functionally fine.

### 2.4 `integrations/whatsapp_twilio.py` — ✅ Good

| Method | Catches | Types |
|--------|---------|-------|
| `send_message` | `TwilioRestException` → `Exception` | ✅ Specific then catch-all |

### 2.5 `integrations/aws_s3.py` — ⚠️ Gaps

| Method | Catches | Missing Types |
|--------|---------|---------------|
| `upload_image` | `ClientError` | ❌ `NoCredentialsError`, `EndpointConnectionError`, `ParamValidationError`, `ConnectTimeoutError` |
| `backup_properties` | `ClientError` | ❌ Same as above |
| `list_images` | `ClientError` | ❌ Same as above |
| `delete_object` | `ClientError` | ❌ Same as above |
| `generate_presigned_url` | `ClientError` | ❌ Same as above |
| `upload_image_from_url` | `Exception` | ✅ Catch-all |
| `__init__` (boto3 init) | `Exception` | ✅ Catch-all with logging |

**Issue:** Only `ClientError` is caught in S3 methods. Other `botocore.exceptions` (e.g., `NoCredentialsError`, `EndpointConnectionError`) would propagate as unhandled exceptions.

### 2.6 `integrations/stripe_payments.py` — ✅ Good

| Method | Catches | Notes |
|--------|---------|-------|
| All Stripe API methods | `stripe.error.StripeError` | ✅ Correct specific exception hierarchy |
| `handle_webhook` | `stripe.error.SignatureVerificationError` → `Exception` | ✅ Specific first, then catch-all |

### 2.7 `integrations/pipedrive_crm.py` — 🔴 CRITICAL GAPS

| Method | Catches | Logging | Notes |
|--------|---------|---------|-------|
| `_find_person` | `Exception` | ✅ `logger.error` | OK |
| `_create_person` | `Exception` | ✅ `logger.error` | OK |
| `_find_deal_by_title` | `Exception` | ❌ **`pass` — no log** | 🔴 Silent failure |
| `_create_deal` | `Exception` | ✅ `logger.error` | OK |
| `_update_deal` | `Exception` | ✅ `logger.error` | OK |
| `_add_note` | `Exception` | ❌ **`pass` — no log** | 🔴 Silent failure |
| `sync_properties` | `Exception` | ✅ `logger.error` | OK |

**Issue:** If `_find_deal_by_title` or `_add_note` fails, the error is completely swallowed. Debugging failures in deal creation and note attachment is impossible without logs.

### 2.8 `integrations/sendgrid_email.py` — ✅ Good

| Method | Catches | Notes |
|--------|---------|-------|
| `_send` | `Exception` | ✅ Logged, returns False |

### 2.9 `integrations/google_sheets.py` — ⚠️ Gaps

| Method | Catches | Logging | Notes |
|--------|---------|---------|-------|
| `ensure_headers` | `Exception` | ✅ | OK |
| `upsert_property` | `Exception` | ✅ | OK |
| `bulk_append` | `Exception` | ✅ | OK |
| `append_scraper_stats` | `Exception` | ✅ | OK |
| `_find_row_by_url` | `Exception` | ❌ **`pass` — no log** | 🔴 Silent failure |

**Issue:** If `_find_row_by_url` fails (network error, API hiccup), the method returns `None` silently. This means a failed lookup falls through to an `append` instead of an `update`, causing data duplication with no alert to operators.

### 2.10 `backend/blueprints/` — ✅ Good (with minor issues)

| File | Issue |
|------|-------|
| `integrations.py` | All endpoints have try/except with logging. Good. |
| `properties.py` | View count increment and bookmark checks catch `Exception` with rollback or `pass`. Bookmark check has no log. Minor. |
| `contacts.py` | JWT verification catch `Exception: pass` — silent. Minor (optional auth). |
| `utils/cache.py` | Uses `except Exception: return False` throughout. Acceptable for cache fallback pattern. |

---

## 3. Gap Analysis: What Tests Simulate vs. What Source Handles

| Error Type | Simulated in Tests? | Handled in Source? | Gap? |
|------------|---------------------|--------------------|-------|
| Generic `Exception` | ✅ N8nClient | ✅ (`requests.RequestException`) | ⚠️ Test uses generic Exception, source expects `requests.RequestException` — not a perfect match |
| `ClientError` (S3) | ✅ AWSS3Client | ✅ | ✅ Match |
| `requests.ConnectionError` | ❌ Not tested | Partial (only n8n & webhooks catch `requests.RequestException`) | ⚠️ SlackBot webhook path, Pipedrive, GoogleSheets use bare `Exception` |
| `requests.Timeout` | ❌ Not tested | Same as above | ⚠️ Same |
| HTTP 4xx/5xx status | ❌ Not tested | Partial (webhooks handles status explicitly; others via `raise_for_status()` → `HTTPError`) | ⚠️ Only webhooks tests code paths for non-2xx status codes |
| `NoCredentialsError` (boto3) | ❌ Not tested | ❌ Not handled | 🔴 **GAP** |
| Pipedrive API errors | ❌ Not tested | ✅ (bare Exception with logging for most) | ⚠️ No test coverage |
| Slack API errors | ❌ Not tested | ✅ (SlackApiError caught) | ⚠️ No test coverage |
| SendGrid API errors | ❌ Not tested | ✅ (bare Exception caught) | ⚠️ No test coverage |
| Google Sheets API errors | ❌ Not tested | ✅ (bare Exception with logging) | ⚠️ No test coverage |
| Stripe webhook errors | ❌ Not tested | ✅ (SignatureVerificationError then Exception) | ⚠️ No test coverage |
| WhatsApp/Twilio errors | ❌ Not tested | ✅ (TwilioRestException then Exception) | ⚠️ No test coverage |

---

## 4. Three Biggest Gaps

### 🔴 GAP 1: Pipedrive CRM — Silent Failures in `_find_deal_by_title` and `_add_note`

**Files:** `integrations/pipedrive_crm.py` lines 118 and 184  
**Pattern:** `except Exception: pass` — zero logging  
**Impact:** Deal deduplication and note attachment failures are invisible. A property may get duplicated as a new deal (because `_find_deal_by_title` silently returns `None` on error) without anyone knowing.  
**Fix:** Add `logger.error(...)` before `pass` in both locations, then `return None`.  
**Test coverage:** Zero tests for any Pipedrive error scenario.

### 🔴 GAP 2: AWS S3 — Only Catches `ClientError`, Misses Other boto3 Exceptions

**File:** `integrations/aws_s3.py` — all S3 methods  
**Missing types:** `NoCredentialsError`, `EndpointConnectionError`, `ParamValidationError`, `ConnectTimeoutError`, `ReadTimeoutError`  
**Impact:** A credential rotation or transient network issue would raise an unhandled `NoCredentialsError` or `EndpointConnectionError`, potentially crashing the calling code.  
**Fix:** Either catch `botocore.exceptions.BotoCoreError` (the base class for all boto3 exceptions) as a fallback, or add explicit catches for the most common boto3 exceptions.  
**Test coverage:** Only `ClientError` is tested. No test for `NoCredentialsError`, `EndpointConnectionError`, etc.

### 🔴 GAP 3: Google Sheets `_find_row_by_url` Silent Failure → Data Duplication

**File:** `integrations/google_sheets.py` lines 237-238  
**Pattern:** `except Exception: pass`  
**Impact:** When `_find_row_by_url` fails (API hiccup, quota exceeded), it silently returns `None`. The caller `upsert_property` then interprets this as "no existing row found" and appends a new row, creating a duplicate of an existing property with zero visibility to operators.  
**Fix:** Add `logger.error(...)` before `pass` and document the silent-fallback-to-append behavior.  
**Test coverage:** Zero tests for error scenarios in Google Sheets.

---

## 5. Secondary Issues

| Severity | Issue | Location |
|----------|-------|----------|
| ⚠️ Medium | Generic `Exception` in n8n REST API helpers instead of `requests.RequestException` | `n8n_client.py` lines 111, 120, 129 |
| ⚠️ Medium | `mock_failure_response()` returns plain `Exception`, not `requests.exceptions.ConnectionError` | `tests/fixtures/mocks.py:40-53` — the test doesn't perfectly match what production code expects |
| ⚠️ Medium | No error simulation tests for 6 of 9 integration modules | Pipedrive, Slack, WhatsApp, SendGrid, GoogleSheets, Stripe — all tested only on success paths |
| ⚠️ Low | `backend/blueprints/properties.py:223` bookmark check — `except Exception: pass` without log | Silent JWT/auth failure in bookmarking |

---

## 6. Summary Statistics

- **Integration modules reviewed:** 9
- **Modules with adequate error handling:** 6 (n8n_client, webhooks, slack_bot, whatsapp_twilio, stripe_payments, sendgrid_email)
- **Modules with gaps:** 3 (aws_s3 ⚠️, pipedrive_crm 🔴, google_sheets ⚠️)
- **Total `except Exception: pass` (silent failures) found:** 3 (pipedrive ×2, google_sheets ×1)
- **Test functions with error simulation:** 2 (of 25 total test functions)
- **Error types simulated in tests:** 2 (`Exception`, `ClientError`)
- **Error types handled in source:** 5+ (`requests.RequestException`, `ClientError`, `SlackApiError`, `TwilioRestException`, `StripeError`, and generic `Exception` catch-alls)