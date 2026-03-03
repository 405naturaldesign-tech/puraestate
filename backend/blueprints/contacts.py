"""
Contacts / Leads blueprint.
Routes: /api/v1/contacts/
"""

import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from database import db, get_or_404, commit_or_rollback, paginate_query
from models import Contact, ContactStatus, Property, Agent, User
from utils.auth_helpers import require_role

logger = logging.getLogger(__name__)
contacts_bp = Blueprint("contacts", __name__)


# ---------------------------------------------------------------------------
# POST /api/v1/contacts  – public inquiry form
# ---------------------------------------------------------------------------

@contacts_bp.route("", methods=["POST"])
def create_contact():
    """
    Submit a property inquiry / contact form.
    Works for both authenticated users and guests.
    """
    data = request.get_json(silent=True) or {}

    if not data.get("message"):
        return jsonify(error="validation_error", message="Message is required."), 400

    # Determine authenticated user (optional)
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        pass

    # Guests must provide at least a name and email
    if not user_id:
        if not data.get("guest_name") or not data.get("guest_email"):
            return jsonify(
                error="validation_error",
                message="guest_name and guest_email are required for unauthenticated submissions.",
            ), 400

    contact = Contact(
        property_id=data.get("property_id"),
        agent_id=data.get("agent_id"),
        user_id=user_id,
        guest_name=data.get("guest_name"),
        guest_email=data.get("guest_email"),
        guest_phone=data.get("guest_phone"),
        subject=data.get("subject"),
        message=data["message"],
        source=data.get("source", "website"),
        preferred_contact_method=data.get("preferred_contact_method"),
        preferred_contact_time=data.get("preferred_contact_time"),
        budget_min=data.get("budget_min"),
        budget_max=data.get("budget_max"),
        timeline=data.get("timeline"),
        ip_address=request.remote_addr,
        user_agent=request.headers.get("User-Agent"),
    )
    db.session.add(contact)

    # Increment property inquiry count
    if data.get("property_id"):
        prop = db.session.get(Property, data["property_id"])
        if prop:
            prop.inquiry_count = (prop.inquiry_count or 0) + 1

    commit_or_rollback()
    logger.info("New contact inquiry id=%s property=%s", contact.id, contact.property_id)

    return jsonify(
        message="Your inquiry has been submitted. An agent will be in touch shortly.",
        contact_id=contact.id,
    ), 201


# ---------------------------------------------------------------------------
# GET /api/v1/contacts/<id>  – get single contact
# ---------------------------------------------------------------------------

@contacts_bp.route("/<int:contact_id>", methods=["GET"])
@jwt_required()
@require_role("admin", "agent")
def get_contact(contact_id):
    """Return a single contact record."""
    contact = get_or_404(Contact, contact_id)
    return jsonify(contact.to_dict()), 200


# ---------------------------------------------------------------------------
# PATCH /api/v1/contacts/<id>  – update status, notes
# ---------------------------------------------------------------------------

@contacts_bp.route("/<int:contact_id>", methods=["PATCH"])
@jwt_required()
@require_role("admin", "agent")
def update_contact(contact_id):
    """Update a contact's status and/or notes."""
    contact = get_or_404(Contact, contact_id)
    data = request.get_json(silent=True) or {}

    if "status" in data:
        try:
            contact.status = ContactStatus(data["status"])
        except ValueError:
            return jsonify(error="validation_error", message=f"Invalid status: {data['status']}"), 400

    if "notes" in data:
        contact.notes = data["notes"]
    if "agent_id" in data:
        contact.agent_id = data["agent_id"]

    from datetime import datetime
    if contact.status == ContactStatus.CONTACTED and not contact.replied_at:
        contact.replied_at = datetime.utcnow()

    commit_or_rollback()
    return jsonify(message="Contact updated.", contact=contact.to_dict()), 200
