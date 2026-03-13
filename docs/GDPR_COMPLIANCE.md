# GDPR Compliance Guide

## Overview

The General Data Protection Regulation (GDPR) is EU legislation regulating data protection and privacy. This guide outlines PuraEstate's GDPR compliance measures.

**Applicability:** GDPR applies to PuraEstate if we:
- Process personal data of EU residents
- Offer services/products to EU residents
- Monitor behavior of EU residents

Since PuraEstate operates globally, GDPR applies.

## Key GDPR Principles

PuraEstate commits to the following data protection principles:

1. **Lawfulness, Fairness, Transparency** - Process data lawfully with user consent
2. **Purpose Limitation** - Collect data only for specified purposes
3. **Data Minimization** - Collect only necessary data
4. **Accuracy** - Keep data accurate and up-to-date
5. **Storage Limitation** - Delete data when no longer needed
6. **Integrity and Confidentiality** - Protect data from unauthorized access
7. **Accountability** - Demonstrate compliance with these principles

## Data Processing Requirements

### 1. Legal Basis for Processing

PuraEstate must establish a legal basis before processing any personal data:

**Consent**
- Explicit, informed, freely given, specific, unambiguous
- Required for: marketing, analytics, non-essential cookies
- User can withdraw consent at any time
- Record proof of consent

**Contractual Necessity**
- Processing necessary to provide services
- Example: user account information, payment data
- No explicit consent required
- User must be informed via Privacy Policy

**Legal Obligation**
- Processing required by law
- Example: tax records, fraud prevention
- Documented legal obligation required

**Vital Interests**
- Processing necessary to protect vital interests
- Rare use case: emergency situations

**Public Task**
- Processing necessary for official authority
- Not applicable to most commercial services

**Legitimate Interests**
- Processing necessary for legitimate business purpose
- Must not override user rights/interests
- Requires balancing test

### 2. Data Processing Agreements (DPA)

For all third-party processors:

```
Required DPA Clauses:
✓ Description of processing (what, why, where, for how long)
✓ Data categories being processed
✓ Subject categories (types of users)
✓ Processor obligations
✓ Sub-processor approval requirements
✓ Data subject rights assistance
✓ Security measures
✓ Deletion/return of data
✓ Audit rights
✓ Compliance with GDPR
```

**Processors Requiring DPA:**
- Firebase (authentication, database)
- Stripe (payment processing)
- OpenRouter (API provider)
- AWS (infrastructure)
- Any analytics/tracking tools

**Action Items:**
- [ ] Verify DPA in place with Firebase
- [ ] Verify DPA in place with Stripe
- [ ] Verify DPA in place with OpenRouter
- [ ] Verify DPA in place with AWS
- [ ] Review DPA terms for Standard Contractual Clauses
- [ ] Document DPA execution dates

### 3. Data Protection Impact Assessment (DPIA)

Conduct DPIA for high-risk processing:

**Trigger:** Processing likely to result in high risk to rights/freedoms

**Examples requiring DPIA:**
- Large-scale processing of personal data
- Processing of special categories of data
- Automated decision-making with legal effect
- Systematic monitoring
- Biometric data
- Location tracking
- Processing involving vulnerable groups

**DPIA Process:**
1. Identify processing activities
2. Assess necessity and proportionality
3. Identify risks to data subjects
4. Evaluate existing measures
5. Identify additional measures needed
6. Document findings
7. Consult with supervisory authority if risks remain

**Current Status:**
- [ ] Conduct initial DPIA for real estate data processing
- [ ] Conduct DPIA for AI/LLM processing (OpenRouter)
- [ ] Review DPIA findings
- [ ] Document DPIAs in records

## User Data Access & Export

### User Right to Access

EU users have the right to:
- Confirm whether we process their data
- Access their data in a readable format
- Know why we collect it
- Know how long we keep it
- Know who we share it with

### Access Request Procedure

**User Request:**
1. User submits access request via: privacy@puraestate.com or in-app request form
2. User provides: email address + identification proof

**Verification:**
1. Verify user identity (email verification + ID check if necessary)
2. Confirm user account status
3. Search for all data related to user

**Compilation:**
1. Gather data from all systems: application database, backups, logs, analytics
2. Review for references to other users (redact if necessary)
3. Format in clear, readable format (structured data, CSV, JSON, etc.)

**Delivery:**
1. Provide data within 30 days of request
2. Deliver in machine-readable format (CSV, JSON, XML)
3. Ensure data is complete and accurate
4. Keep proof of delivery

**Documentation:**
```
- Request date: [Date]
- Request ID: [Unique ID]
- User verified: [Yes/No - method]
- Data compiled: [Date]
- Data provided: [Date]
- Format: [CSV/JSON/Other]
- Records: [Number of records]
```

### Data Export Implementation

**Technical Requirements:**
```javascript
// Example: Endpoint for user data export
GET /api/user/export
Header: Authorization: Bearer [JWT]
Response: {
  "user": {
    "id": "...",
    "email": "...",
    "created_at": "...",
    "updated_at": "..."
  },
  "properties": [
    {
      "id": "...",
      "address": "...",
      "data": "..."
    }
  ],
  "activity_logs": [
    {
      "timestamp": "...",
      "action": "..."
    }
  ],
  "export_date": "...",
  "export_format": "JSON"
}
```

## Right to Deletion (Right to Be Forgotten)

### When Deletion Required

- User requests deletion
- Purpose for collection no longer applies
- Legal obligation to delete
- Special category data and consent withdrawn
- Children's data (if applicable)

### When Deletion NOT Required

- Legal obligation to keep data
- Exercise of freedom of expression
- Compliance with legal obligations
- Archiving in public interest
- Fraud prevention

### Deletion Procedure

**Step 1: Request & Verification**
```
1. User submits deletion request
2. Verify user identity
3. Check for legal hold reasons
4. Check for ongoing disputes/claims
```

**Step 2: Impact Assessment**
```
1. Identify all systems containing user data
2. Check dependencies (other records referencing user)
3. Verify no legal reason to retain
4. Plan deletion across all systems
```

**Step 3: Execution**
```
1. Delete from primary database
2. Delete from backups (wait for backup cycle)
3. Delete from analytics systems
4. Delete from third-party systems
5. Delete from logs (if feasible)
6. Delete from caches
```

**Step 4: Verification**
```
1. Verify deletion from all systems
2. Test that user data is not retrievable
3. Document deletion
4. Notify user of completion
```

**Special Considerations:**
- Legal holds may prevent deletion
- Some data retained for tax/compliance reasons
- Backups may retain data temporarily
- Processing logs may reference user (anonymize instead of delete)

## Data Retention Policies

### Default Retention Periods

| Data Type | Retention Period | Reason | Owner |
|-----------|------------------|--------|-------|
| User account data | Duration of account + 30 days | Service delivery | Backend Team |
| Transaction records | 7 years | Tax/legal requirements | Finance |
| Payment details | Until dispute resolved | PCI-DSS, fraud | Finance/Stripe |
| Login logs | 90 days | Security/fraud detection | Security |
| API logs | 30 days | Debugging, compliance | Backend |
| Backup data | 30 days | Disaster recovery | DevOps |
| Customer support tickets | 3 years | Dispute resolution | Support |
| Marketing data | Until opt-out + 30 days | Consent-based | Marketing |
| Analytics data | 2 years | Performance analysis | Analytics |
| Error logs | 30 days | Debugging | Development |
| Audit logs | 7 years | Compliance | Security |

### Automated Deletion

```javascript
// Example: Scheduled job for data retention
const RETENTION_POLICIES = {
  'user_deleted_accounts': { retention_days: 30, action: 'delete' },
  'login_logs': { retention_days: 90, action: 'delete' },
  'api_logs': { retention_days: 30, action: 'anonymize' },
  'expired_sessions': { retention_days: 1, action: 'delete' }
};

// Run daily
schedule.daily('data-retention-cleanup', async () => {
  for (const [data_type, policy] of Object.entries(RETENTION_POLICIES)) {
    const cutoff_date = new Date(Date.now() - policy.retention_days * 86400000);
    if (policy.action === 'delete') {
      await deleteDataBefore(data_type, cutoff_date);
    } else if (policy.action === 'anonymize') {
      await anonymizeDataBefore(data_type, cutoff_date);
    }
  }
});
```

## Privacy Impact Assessment

### Purpose

- Identify data protection risks
- Assess necessity of processing
- Evaluate user impacts
- Plan safeguards

### Template

```markdown
## Privacy Impact Assessment

**Date:** [Date]
**Assessor:** [Name]
**Processing Activity:** [Description]

### 1. Data Description
- Type of data: [Personal, Special Category, etc.]
- Volume: [Estimated number of records]
- Categories of subjects: [Employees, Customers, etc.]
- Countries: [Geographic scope]

### 2. Processing Description
- Purpose: [Why we collect]
- Legal basis: [Consent/Contract/etc.]
- Duration: [How long we keep]
- Recipients: [Who has access]
- International transfers: [Yes/No]

### 3. Necessity Assessment
- Is processing necessary for stated purpose? [Yes/No]
- Are there less intrusive alternatives? [Yes/No/Alternatives]
- Is processing proportionate? [Yes/No]

### 4. Risk Assessment
- Risk to confidentiality: [None/Low/Medium/High]
- Risk to integrity: [None/Low/Medium/High]
- Risk to availability: [None/Low/Medium/High]
- Risk to data subject rights: [None/Low/Medium/High]

### 5. Safeguards
- Technical safeguards: [Encryption, access controls, etc.]
- Organizational safeguards: [Training, policies, etc.]
- Legal safeguards: [Contracts, terms, etc.]

### 6. Recommendations
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

### 7. Decision
- [Approved / Approved with conditions / Rejected]
```

## Consent Mechanisms

### Consent Requirements

Valid consent must be:
- **Freely given** - No coercion or pressure
- **Specific** - For specific purpose(s)
- **Informed** - User understands what they consent to
- **Unambiguous** - Clear affirmative action (not pre-ticked boxes)
- **Documented** - Proof of consent retained

### Consent Implementation

**At Sign-Up:**
```html
<!-- Example: Clear consent checkbox -->
<label>
  <input type="checkbox" id="consent-processing" required>
  I agree that PuraEstate may process my personal data as described in the
  <a href="/privacy">Privacy Policy</a> to provide services to me.
</label>

<label>
  <input type="checkbox" id="consent-marketing">
  I would like to receive marketing emails from PuraEstate about products
  and services that may interest me.
</label>
```

**Consent Logging:**
```javascript
{
  user_id: "...",
  consent_type: "service_processing",
  consent_given: true,
  timestamp: "2026-03-12T10:30:00Z",
  user_agent: "Mozilla/5.0...",
  ip_address: "192.168.1.1",
  version: "v1.2 (2026-01-15)"
}
```

**Managing Consent:**
- [ ] User can view consent preferences in settings
- [ ] User can withdraw consent at any time
- [ ] User can re-consent after withdrawal
- [ ] Withdrawal takes effect immediately
- [ ] Consent history is retained

### Withdrawal Mechanism

```javascript
// Endpoint for consent withdrawal
POST /api/user/consent/withdraw
{
  "consent_type": "marketing_emails"
}

// Action: Remove user from marketing list
// Stop sending marketing emails within 24 hours
// Retain audit log of withdrawal
```

## Data Protection Officer (DPO)

**DPO Designation:**
- [ ] Appoint or contract a DPO (required for certain organizations)
- [ ] Publish DPO contact information on website
- [ ] Make DPO contact easily accessible to data subjects

**DPO Responsibilities:**
- Monitor GDPR compliance
- Cooperate with supervisory authorities
- Serve as point of contact for data subjects
- Advise organization on compliance

**DPO Contact:**
```
Data Protection Officer
PuraEstate Inc.
Email: dpo@puraestate.com
Address: [Physical address if applicable]
Phone: [Phone number]
```

## Third-Party Data Processing

### Sub-Processor Approval

Users must be informed of sub-processors. Current sub-processors:

| Service | Purpose | Data Processed | DPA Status |
|---------|---------|-----------------|-----------|
| Firebase | Authentication, Database | User profiles, property data | [Verify] |
| Stripe | Payment Processing | Email, payment method | [Verify] |
| OpenRouter | AI Assistance | User inputs, context | [Verify] |
| AWS | Infrastructure | All data | [Verify] |
| Google Analytics | Analytics | Usage data, session IDs | [Verify] |

**Action Items:**
- [ ] Verify DPA with Firebase
- [ ] Verify DPA with Stripe
- [ ] Verify DPA with OpenRouter
- [ ] Verify DPA with AWS
- [ ] Review Google Analytics for GDPR compliance
- [ ] Add Standard Contractual Clauses for US-based processors
- [ ] Document all third-party processors in Privacy Policy

### International Data Transfers

Data transfers to non-EU countries require safeguards:

**Transfer Mechanisms:**
1. **Standard Contractual Clauses (SCCs)** - Approved EU model clauses
2. **Binding Corporate Rules (BCRs)** - For multinational groups
3. **Adequacy Decision** - EU finds country has adequate protection

**Current Transfers:**
- Firebase (Google) - USA - Requires SCCs
- Stripe - USA - Requires SCCs
- OpenRouter - USA - Requires SCCs
- AWS - Varies by region - Requires SCCs for US regions

**Action Items:**
- [ ] Verify SCCs in place with US-based processors
- [ ] Review Schrems II implications
- [ ] Document transfer mechanisms
- [ ] Assess supplementary measures needed

## Data Breach Notification

### Notification Obligations

**Timeline:**
- Without undue delay
- No later than 72 hours after becoming aware
- Unless unlikely to pose risk (document risk assessment)

**Who to Notify:**
1. Supervisory Authority (DPA)
2. Affected Data Subjects (if high risk)
3. Media (if more than 1000 affected) - optional but recommended

**What to Include:**
- Nature and scope of breach
- Categories of data affected
- Likely consequences
- Measures taken or proposed
- DPA contact information
- Organization contact information

### Breach Response Procedure

```
1. DETECT: Discover or become aware of breach
2. RESPOND: Contain and assess impact
3. INVESTIGATE: Determine scope and cause
4. EVALUATE: Assess risk to data subjects
5. NOTIFY: Inform DPA within 72 hours if required
6. INFORM: Notify affected individuals if high risk
7. DOCUMENT: Record incident and response
8. IMPROVE: Implement preventive measures
```

**Breach Log Entry:**
```
Date Discovered: [Date/Time]
Date Reported to DPA: [Date/Time] or [Not required - low risk]
Nature: [Unauthorized access/deletion/etc.]
Data Affected: [Types and volume]
Individuals Affected: [Number]
Cause: [Root cause]
Measures Taken: [List]
```

## Audit & Compliance

### Record of Processing Activities

Maintain a Record of Processing Activities (ROPA) including:

```markdown
## Record of Processing Activities

| Activity | Legal Basis | Data Categories | Retention | Recipients | Safeguards |
|----------|-------------|-----------------|-----------|------------|------------|
| User Authentication | Necessity | Email, password hash | Duration | Firebase | Encryption, 2FA |
| Payment Processing | Necessity | Email, payment details | 7 years | Stripe, Finance | Encryption, PCI-DSS |
| Property Data | Necessity | Address, details | Duration | Users | Access controls |
```

### Compliance Audits

- [ ] Quarterly internal compliance review
- [ ] Annual comprehensive audit
- [ ] Maintain audit logs and documentation
- [ ] Corrective action tracking

### Supervisory Authority Cooperation

- Respond to data subject complaints
- Cooperate with supervisory authority investigations
- Maintain documentation of compliance
- Notify DPA of data processing activities

## Employee Training

All staff handling personal data must complete:

- [ ] GDPR overview and key principles
- [ ] Data protection obligations
- [ ] Privacy by design concepts
- [ ] Incident reporting procedures
- [ ] Data subject rights handling
- [ ] Annual refresher training

## Compliance Checklist

- [ ] Legal basis documented for all processing
- [ ] DPA in place with all third-party processors
- [ ] DPIA conducted for high-risk processing
- [ ] Privacy Policy published and up-to-date
- [ ] Consent mechanisms implemented
- [ ] User access/export functionality implemented
- [ ] Deletion functionality implemented
- [ ] Data retention policies documented and automated
- [ ] DPO appointed/contacted
- [ ] Sub-processor list maintained
- [ ] SCCs in place for international transfers
- [ ] Breach response procedure documented
- [ ] Record of Processing Activities maintained
- [ ] Staff training completed
- [ ] Audit logs enabled
- [ ] Monitoring systems in place

## Resources

- GDPR Text: https://gdpr-info.eu/
- EDPB Guidelines: https://edpb.ec.europa.eu/our-work/our-documents_en
- Data Protection Impact Assessment Template: https://ec.europa.eu/info/law/law-topic/data-protection_en
- Standard Contractual Clauses: https://ec.europa.eu/info/law/law-topic/data-protection/standard-contractual-clauses_en

---

**Last Updated:** March 12, 2026
**Next Review Date:** June 12, 2026
**Review Frequency:** Annually or when processing changes
