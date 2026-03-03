"""
AWS S3 integration — backup property data and store images.
"""

import json
import logging
import os
from datetime import datetime
from io import BytesIO
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False
    logger.warning("boto3 not installed — AWSS3Client disabled.")


class AWSS3Client:
    """
    Upload images and backups to AWS S3.

    Usage:
        s3 = AWSS3Client(bucket="pura-estate-images")
        url = s3.upload_image(image_data, "images/property_123.jpg")
        s3.backup_properties(properties_list)
    """

    def __init__(
        self,
        bucket: Optional[str] = None,
        region: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        prefix: str = "property-images/",
        public_read: bool = True,
    ):
        self.bucket = bucket or os.environ.get("S3_BUCKET", "pura-estate-images")
        self.region = region or os.environ.get("AWS_REGION", "us-east-1")
        self.prefix = prefix
        self.public_read = public_read
        self._client = None
        self._resource = None

        if HAS_BOTO3:
            kwargs = {"region_name": self.region}
            if access_key:
                kwargs["aws_access_key_id"] = access_key
                kwargs["aws_secret_access_key"] = secret_key
            try:
                self._client = boto3.client("s3", **kwargs)
                self._resource = boto3.resource("s3", **kwargs)
            except Exception as exc:
                logger.error("S3 client init error: %s", exc)

    def upload_image(self, image_data: bytes, key: str, content_type: str = "image/jpeg") -> Optional[str]:
        """
        Upload image bytes to S3.

        Args:
            image_data: Raw image bytes
            key: S3 object key (path within bucket)
            content_type: MIME type of the image

        Returns:
            Public URL of the uploaded image, or None on failure.
        """
        if not self._can_use():
            return None

        full_key = f"{self.prefix}{key}" if not key.startswith(self.prefix) else key

        try:
            kwargs = {
                "Body": image_data,
                "ContentType": content_type,
            }
            if self.public_read:
                kwargs["ACL"] = "public-read"

            self._client.put_object(Bucket=self.bucket, Key=full_key, **kwargs)
            url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{full_key}"
            logger.debug("S3: uploaded %s (%d bytes)", full_key, len(image_data))
            return url

        except ClientError as exc:
            logger.error("S3 upload error for %s: %s", key, exc)
            return None

    def upload_image_from_url(self, image_url: str, key: str) -> Optional[str]:
        """Download an image from URL and upload to S3."""
        try:
            import requests
            resp = requests.get(image_url, timeout=15)
            resp.raise_for_status()
            content_type = resp.headers.get("Content-Type", "image/jpeg").split(";")[0]
            return self.upload_image(resp.content, key, content_type)
        except Exception as exc:
            logger.error("S3 upload_from_url error [%s]: %s", image_url, exc)
            return None

    def backup_properties(self, properties: List[Dict], label: str = "") -> Optional[str]:
        """
        Serialize a list of properties to JSON and upload as a backup.

        Returns:
            S3 URL of the backup file, or None on failure.
        """
        if not self._can_use():
            return None

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        suffix = f"_{label}" if label else ""
        key = f"backups/properties_{timestamp}{suffix}.json"

        data = json.dumps(properties, indent=2, default=str).encode("utf-8")

        try:
            self._client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType="application/json",
            )
            url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{key}"
            logger.info("S3: backed up %d properties to %s", len(properties), key)
            return url
        except ClientError as exc:
            logger.error("S3 backup error: %s", exc)
            return None

    def list_images(self, property_id: int) -> List[str]:
        """List all S3 images for a given property ID."""
        if not self._can_use():
            return []

        prefix = f"{self.prefix}{property_id}/"
        try:
            response = self._client.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
            return [
                f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{obj['Key']}"
                for obj in response.get("Contents", [])
            ]
        except ClientError as exc:
            logger.error("S3 list_images error: %s", exc)
            return []

    def delete_object(self, key: str) -> bool:
        """Delete a single S3 object."""
        if not self._can_use():
            return False
        try:
            self._client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as exc:
            logger.error("S3 delete error for %s: %s", key, exc)
            return False

    def generate_presigned_url(self, key: str, expires_in: int = 3600) -> Optional[str]:
        """Generate a pre-signed URL for private objects."""
        if not self._can_use():
            return None
        try:
            url = self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
            return url
        except ClientError as exc:
            logger.error("S3 presign error for %s: %s", key, exc)
            return None

    def _can_use(self) -> bool:
        if not HAS_BOTO3:
            logger.debug("boto3 not installed.")
            return False
        if not self._client:
            logger.debug("S3 client not initialised.")
            return False
        return True
