# Compliance Checklist

Use this checklist to track compliance status across major regulatory frameworks and standards.

**Last Updated:** March 12, 2026
**Review Frequency:** Quarterly
**Owner:** [Compliance/Legal Team]

---

## GDPR (General Data Protection Regulation)

Applies to: Processing personal data of EU residents

### Data Protection Framework

- [ ] Privacy Policy published and accessible
- [ ] Privacy Policy is clear and understandable
- [ ] Privacy Policy discloses all data uses
- [ ] Consent mechanisms implemented
- [ ] Consent is freely given, specific, informed, unambiguous
- [ ] Consent storage/logging implemented
- [ ] Ability to withdraw consent implemented
- [ ] Pre-ticked consent boxes not used
- [ ] Cookie consent banner implemented
- [ ] Essential cookies exempt from consent
- [ ] Marketing/analytics cookies require consent

### User Rights Implementation

- [ ] Data access/export functionality (within 30 days)
- [ ] Export format is machine-readable (CSV/JSON)
- [ ] Data correction functionality available
- [ ] Data deletion/right-to-be-forgotten implemented
- [ ] Deletion occurs within 30 days
- [ ] Processing restriction capability implemented
- [ ] Data portability functionality implemented
- [ ] Objection to processing mechanism available
- [ ] Automated decision-making opt-out available

### Third-Party Management

- [ ] Data Processing Agreements (DPAs) in place with all processors
- [ ] Sub-processor list maintained and published
- [ ] Standard Contractual Clauses (SCCs) in place for non-EU transfers
- [ ] Supplementary safeguards documented for US transfers
- [ ] Sub-processor change notification process implemented
- [ ] DPA audit rights documented
- [ ] Processor liability terms included in DPA

### Data Protection Governance

- [ ] Data Protection Officer (DPO) appointed or contracted
- [ ] DPO contact information published
- [ ] Record of Processing Activities (ROPA) maintained
- [ ] ROPA includes: purposes, data types, legal basis, recipients, retention
- [ ] Data Protection Impact Assessments (DPIAs) conducted for high-risk processing
- [ ] Data retention policies documented
- [ ] Automated data deletion implemented
- [ ] Data minimization principles applied
- [ ] Purpose limitation enforced

### Security & Breach Response

- [ ] Encryption of data in transit (TLS 1.2+)
- [ ] Encryption of data at rest (AES-256 or equivalent)
- [ ] Access controls and authentication mechanisms
- [ ] Multi-factor authentication available/enabled
- [ ] Regular security patches applied
- [ ] Penetration testing conducted annually
- [ ] Incident response procedure documented
- [ ] Breach notification procedure implemented
- [ ] Breach log maintained
- [ ] 72-hour breach notification timeline established

### Employee/Vendor Management

- [ ] Privacy training completed by data handlers
- [ ] Confidentiality agreements in place
- [ ] Access restricted to authorized personnel only
- [ ] Background checks conducted where applicable
- [ ] Vendor security requirements documented
- [ ] Vendor audits conducted

**Status:** [ ] Compliant  [ ] Partially Compliant  [ ] Non-Compliant  [ ] N/A

**Notes:**
```
[Document any gaps or findings]
```

---

## CCPA (California Consumer Privacy Act)

Applies to: Businesses collecting personal data of California residents and meeting threshold requirements

### Consumer Rights

- [ ] Privacy Policy discloses CCPA rights
- [ ] Right to Know mechanism implemented (access data)
- [ ] Right to Delete mechanism implemented
- [ ] Right to Opt-Out of sale/sharing mechanism implemented
- [ ] Right to Correct mechanism implemented
- [ ] Right to Limit Use mechanism implemented
- [ ] Response to requests within 45 days
- [ ] Request verification process implemented
- [ ] Appeals process for denied requests implemented

### Data Handling

- [ ] Categories of personal information listed
- [ ] Categories of sources listed
- [ ] Categories of third parties listed
- [ ] Business purposes for collection disclosed
- [ ] Retention periods disclosed
- [ ] Do Not Sell/Share preference signal honored (GPC)
- [ ] Opt-out authorization tokens honored

### Financial Incentives

- [ ] Loyalty/rewards program terms disclosed
- [ ] Opt-in mechanism for incentive programs
- [ ] Ability to opt-out of programs
- [ ] Price/service non-discrimination verified

### Children's Privacy (CCPA)

- [ ] Services not directed to children under 13
- [ ] Or: Parental consent obtained for children 13-16
- [ ] Or: COPPA compliance if applicable

### Vendor Management

- [ ] Service provider agreements include CCPA terms
- [ ] Service providers contractually prohibited from using data
- [ ] Contractors agreements include CCPA terms

### Documentation

- [ ] Data collection practices documented
- [ ] Categories of personal information identified
- [ ] Data retention periods documented
- [ ] Data sharing practices documented
- [ ] Opt-out mechanism documented

**Status:** [ ] Compliant  [ ] Partially Compliant  [ ] Non-Compliant  [ ] N/A

**Notes:**
```
[Document any gaps or findings]
```

---

## PCI-DSS (Payment Card Industry Data Security Standard)

Applies to: Organizations storing, processing, or transmitting credit card data

**Note:** If using third-party payment processors (Stripe, PayPal, etc.), verify their compliance instead.

### Scope & Compliance Level

- [ ] Compliance Level identified (based on transaction volume)
- [ ] Assessment method selected (self-assessment/QSA audit)
- [ ] Compliance deadline documented

### Network Security

- [ ] Firewall configuration and rules documented
- [ ] Wireless access points secured/encrypted
- [ ] Default credentials changed
- [ ] Network segmentation implemented
- [ ] Cardholder data segregated from other systems
- [ ] Network architecture documented (network diagram)
- [ ] Public information security assessed

### Access Control

- [ ] Access restricted to need-to-know basis
- [ ] User IDs assigned to each user
- [ ] Default accounts disabled/changed
- [ ] Password policy documented and enforced
- [ ] User access provisioning documented
- [ ] User access removal documented
- [ ] Inactive accounts disabled/removed (every 90 days)
- [ ] Physical/logical access controls

### Vulnerability Management

- [ ] Anti-malware installed and maintained
- [ ] Security patches applied promptly
- [ ] Regular vulnerability scans conducted
- [ ] Annual penetration testing conducted
- [ ] Security testing after changes

### Monitoring & Logging

- [ ] Audit logs maintained
- [ ] Log retention minimum 1 year
- [ ] Logs backed up, encrypted, protected
- [ ] Unauthorized access monitoring
- [ ] Intrusion detection systems implemented
- [ ] File integrity monitoring implemented

### Encryption

- [ ] Encryption in transit for cardholder data
- [ ] Encryption at rest for cardholder data
- [ ] Encryption keys secured
- [ ] Key rotation schedule established

### Data Retention

- [ ] Card data retention policy (minimize storage)
- [ ] Full PAN not logged
- [ ] Payment processing compliant with standards

### Third-Party Management

- [ ] Service provider assessment completed
- [ ] Service provider security practices verified
- [ ] Service provider agreements include PCI requirements

### Testing & Validation

- [ ] Annual compliance testing performed
- [ ] Compliance validation documented (attestation/report)
- [ ] Remediation for failures documented
- [ ] Compliance maintained year-round

**Status:** [ ] Compliant  [ ] Partially Compliant  [ ] Non-Compliant  [ ] N/A

**Notes:**
```
[Document any gaps or findings]
```

---

## Google Play Store Requirements

Applies to: Mobile applications on Google Play Store

### Data Privacy

- [ ] Privacy Policy published
- [ ] Privacy Policy includes what data is collected
- [ ] Privacy Policy includes how data is used
- [ ] Privacy Policy includes third-party sharing
- [ ] Privacy Policy disclosed in app's data safety section
- [ ] Data safety section completed accurately
- [ ] User consent obtained before collecting data
- [ ] Sensitive data handling disclosed

### App Permissions

- [ ] Permissions align with functionality
- [ ] Rationale provided for unusual permissions
- [ ] Runtime permissions implemented (Android 6.0+)
- [ ] Permission requests are contextual
- [ ] Users can revoke permissions

### Restricted Content

- [ ] No illegal content
- [ ] Prohibited activities compliance checked
- [ ] Deceptive practices not used
- [ ] Spam compliance verified
- [ ] Malware/exploits not present
- [ ] Developer agreement terms accepted

### Children's Safety

- [ ] Targeting classification accurate
- [ ] COPPA compliance if applicable
- [ ] Family Policy compliance if targeting children
- [ ] Age-appropriate content
- [ ] No inappropriate ads
- [ ] No tracking of children under 13

### Specific Policy Areas

- [ ] Developer program policies accepted
- [ ] Content ratings applied correctly
- [ ] Ads and monetization compliant
- [ ] User-generated content moderated
- [ ] Ratings and reviews policy followed
- [ ] Location data handling disclosed
- [ ] Emergency services not disrupted
- [ ] Accessibility features considered

### Security

- [ ] App signing certificate maintained
- [ ] Updates signed with same certificate
- [ ] No security vulnerabilities
- [ ] API key security (not hardcoded)
- [ ] Authentication secure
- [ ] Data encryption in transit

### App Store Listing

- [ ] App description accurate
- [ ] Screenshots represent actual app
- [ ] Content rating questionnaire completed
- [ ] Contact information provided
- [ ] Privacy policy link in store listing
- [ ] Terms of service link (if applicable)

**Status:** [ ] Compliant  [ ] Partially Compliant  [ ] Non-Compliant  [ ] N/A

**Notes:**
```
[Document any gaps or findings]
```

---

## Apple App Store Requirements

Applies to: Mobile applications on Apple App Store (iOS)

### App Review Guidelines

- [ ] App is useful and functional
- [ ] Misleading information not present
- [ ] Performance is stable
- [ ] App doesn't crash or have major bugs
- [ ] UI is appropriate and functional

### Data & Privacy

- [ ] Privacy Policy published
- [ ] Privacy Policy is clear and accessible
- [ ] Data collection disclosed
- [ ] Third-party data sharing disclosed
- [ ] User consent obtained before collection
- [ ] Privacy labels completed accurately
- [ ] Data minimization principle applied
- [ ] Sensitive data handled appropriately

### Kids Category (if applicable)

- [ ] Compliant with COPPA (if US-based)
- [ ] Age-appropriate content only
- [ ] No tracking of children under 13
- [ ] No third-party analytics
- [ ] No behavioral advertising
- [ ] No persistent user identifiers
- [ ] Age gate if necessary

### Security

- [ ] App doesn't contain security vulnerabilities
- [ ] Code is secure
- [ ] No malware
- [ ] Authentication is secure
- [ ] Encryption used appropriately
- [ ] API keys not hardcoded
- [ ] No plain-text storage of sensitive data

### Sign In with Apple (if applicable)

- [ ] Sign in with Apple implemented for SSO
- [ ] OR: Alternative authentication method provided
- [ ] User privacy protected with Sign in with Apple

### App Limitations & Restrictions

- [ ] No illegal content
- [ ] No deceptive practices
- [ ] No spam
- [ ] No external links for payment
- [ ] No in-app purchases for in-app features
- [ ] No unauthorized device access

### Health & Fitness Data (if applicable)

- [ ] HealthKit data accessed appropriately
- [ ] Privacy notice provided
- [ ] Data not shared without consent
- [ ] Secure handling of health data

### Accessories & Hardware (if applicable)

- [ ] Device capabilities disclosed
- [ ] Compatible devices listed
- [ ] Hardware requirements accurate
- [ ] Peripheral compatibility tested

**Status:** [ ] Compliant  [ ] Partially Compliant  [ ] Non-Compliant  [ ] N/A

**Notes:**
```
[Document any gaps or findings]
```

---

## WCAG 2.1 Accessibility (Level AA)

Applies to: Web and mobile applications

### Perceivable

**Text Alternatives**
- [ ] All images have alt text
- [ ] Alt text is descriptive
- [ ] Decorative images marked appropriately
- [ ] Icons have labels or aria-label

**Adaptable**
- [ ] Content can be presented in different ways
- [ ] Info not relying on shape/color/position alone
- [ ] Reading order is logical
- [ ] Instructions don't rely solely on sensory characteristics

**Distinguishable**
- [ ] Color contrast ratio at least 4.5:1 for text
- [ ] Color contrast ratio at least 3:1 for UI elements
- [ ] Text can be resized up to 200%
- [ ] Text spacing adjustable without loss of functionality
- [ ] No content flickering/flashing (exceeding 3/sec)
- [ ] Page has clear heading structure
- [ ] Links have underline or other visual indicator

### Operable

**Keyboard Accessible**
- [ ] All functionality available via keyboard
- [ ] No keyboard trap
- [ ] Focus order is logical
- [ ] Focus indicator visible
- [ ] Keyboard shortcuts don't conflict with browser shortcuts

**Enough Time**
- [ ] No time limits required to use content
- [ ] Or: Time limit can be extended
- [ ] Auto-update content can be paused/stopped
- [ ] Auto-play content can be paused

**Seizures and Physical Reactions**
- [ ] No content flashes more than 3 times per second
- [ ] No known seizure triggers

**Navigability**
- [ ] Purpose of link evident
- [ ] Page title descriptive
- [ ] Focus order logical
- [ ] Purpose of each input field labeled
- [ ] Error messages clear
- [ ] Consistent navigation

### Understandable

**Readable**
- [ ] Language of page identified (lang attribute)
- [ ] Abbreviations expanded on first use
- [ ] Unusual words defined or explained
- [ ] Text readability level appropriate

**Predictable**
- [ ] Navigation consistent
- [ ] Components behave consistently
- [ ] No unexpected context changes
- [ ] Form behavior predictable

**Input Assistance**
- [ ] Error messages provided
- [ ] Error locations identified
- [ ] Form validation clear
- [ ] Help available
- [ ] Data entry error correction possible

### Robust

**Compatible**
- [ ] Valid HTML (no major syntax errors)
- [ ] Elements have complete start and end tags
- [ ] Elements properly nested
- [ ] IDs unique
- [ ] Attributes have no duplicate names
- [ ] ARIA used appropriately
- [ ] Role/state/property values valid

**Testing**
- [ ] Tested with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Tested with keyboard navigation
- [ ] Tested with zoom/magnification
- [ ] Tested with color blind filters
- [ ] Tested on mobile devices
- [ ] Automated accessibility testing tools used
- [ ] Manual testing completed

### Authoring & Maintenance

- [ ] Accessibility embedded in development process
- [ ] Team trained on accessibility
- [ ] Design system includes accessible components
- [ ] Accessibility testing in QA process
- [ ] Accessibility audit scheduled

**Status:** [ ] Compliant (AA)  [ ] Partially Compliant  [ ] Non-Compliant  [ ] N/A

**Notes:**
```
[Document any gaps or findings]
Accessibility Audit Date: [Date]
External Auditor: [Name] (if applicable)
Remediation Plan: [Link to tracker]
```

---

## HIPAA (Health Insurance Portability & Accountability Act)

Applies to: Organizations handling protected health information (PHI)

**Status:** [ ] Applicable  [ ] Not Applicable

If Not Applicable, mark N/A for all items below.

### Privacy Rule

- [ ] Privacy policies include HIPAA requirements
- [ ] Notice of Privacy Practices published
- [ ] Patient consent obtained for uses/disclosures
- [ ] Authorization obtained for non-routine uses
- [ ] Uses limited to treatment, payment, operations
- [ ] Minimum necessary standard applied
- [ ] Individual access rights implemented
- [ ] Amendment processes implemented
- [ ] Accounting of disclosures available
- [ ] Confidential communications maintained

### Security Rule

**Administrative**
- [ ] Security officer designated
- [ ] Security risk assessment conducted
- [ ] Security policies documented
- [ ] Workforce security program implemented
- [ ] Information access management documented
- [ ] Security awareness training conducted
- [ ] Security incident procedures documented

**Physical**
- [ ] Facility access controlled
- [ ] Visitor log maintained
- [ ] Workstations secure
- [ ] Device/media controls implemented
- [ ] Environmental controls documented

**Technical**
- [ ] Access controls and unique IDs implemented
- [ ] Emergency access procedures documented
- [ ] Encryption for data in transit and at rest
- [ ] Audit logs maintained
- [ ] Integrity controls implemented
- [ ] Transmission security implemented

### Breach Notification Rule

- [ ] Breach notification procedures documented
- [ ] Breaches reported to individuals within 60 days
- [ ] Breaches reported to media if 500+ individuals affected
- [ ] Breach report filed with HHS
- [ ] Notification includes: date, extent, measures taken, next steps
- [ ] Breach log maintained

### Business Associate Agreements (BAA)

- [ ] BAA in place with all business associates
- [ ] BAA includes required safeguard provisions
- [ ] Business associates evaluated for compliance
- [ ] Sub-contractor BAAs obtained

**Status:** [ ] Compliant  [ ] Partially Compliant  [ ] Non-Compliant  [ ] N/A

**Notes:**
```
[Document any gaps or findings]
HIPAA Risk Assessment Date: [Date]
Audit Date: [Date]
```

---

## SOC 2 Type II Certification

Applies to: Service providers handling customer data

**Status:** [ ] Certified  [ ] Pursuing  [ ] Not Required  [ ] N/A

### Security (CC)

- [ ] Logical/physical access controls
- [ ] Encryption of data in transit and at rest
- [ ] Regular security patching
- [ ] Vulnerability assessments
- [ ] Penetration testing
- [ ] Security incident response
- [ ] Change management

### Availability (A)

- [ ] System availability monitored
- [ ] Uptime SLA maintained
- [ ] Disaster recovery plan
- [ ] Business continuity plan
- [ ] Regular backup/restore testing
- [ ] Geographic redundancy

### Processing Integrity (PI)

- [ ] Data accuracy verified
- [ ] Completeness controls
- [ ] Timeliness of processing
- [ ] Access controls to processing systems
- [ ] Monitoring of processing

### Confidentiality (C)

- [ ] Encryption of sensitive data
- [ ] Access controls
- [ ] Information classification
- [ ] Non-disclosure agreements
- [ ] Confidentiality training

### Privacy (P)

- [ ] Privacy policies
- [ ] Data collection consent
- [ ] Data use restrictions
- [ ] Individual rights implementation
- [ ] Data breach notification

### Auditor & Certificate

- [ ] SOC 2 auditor engaged
- [ ] Annual audit scheduled
- [ ] Certificate current and valid
- [ ] Certificate shared with customers
- [ ] Audit findings tracked and remediated

**Status:** [ ] Compliant  [ ] Pursuing Certification  [ ] N/A

**Notes:**
```
SOC 2 Auditor: [Firm Name]
Certification Period: [Dates]
Next Audit Date: [Date]
```

---

## Summary Dashboard

| Framework | Status | Owner | Last Review | Next Review |
|-----------|--------|-------|-------------|------------|
| GDPR | [ ] | [Owner] | [Date] | [Date] |
| CCPA | [ ] | [Owner] | [Date] | [Date] |
| PCI-DSS | [ ] | [Owner] | [Date] | [Date] |
| Google Play Store | [ ] | [Owner] | [Date] | [Date] |
| Apple App Store | [ ] | [Owner] | [Date] | [Date] |
| WCAG 2.1 (AA) | [ ] | [Owner] | [Date] | [Date] |
| HIPAA | [ ] | [Owner] | [Date] | [Date] |
| SOC 2 | [ ] | [Owner] | [Date] | [Date] |

---

## Action Items & Remediation Tracking

| Item | Framework | Status | Owner | Due Date | Completion Date |
|------|-----------|--------|-------|----------|-----------------|
| [Action] | [Framework] | [ ] Pending | [Owner] | [Date] | [Date] |
| [Action] | [Framework] | [ ] In Progress | [Owner] | [Date] | [Date] |
| [Action] | [Framework] | [ ] Completed | [Owner] | [Date] | [Date] |

---

## Approval & Sign-Off

**Completed by:** [Name], [Title]
**Date:** [Date]
**Reviewed by:** [Name], [Title]
**Review Date:** [Date]
**Next Review:** [Date]

---

**Document Version:** 1.0
**Last Updated:** March 12, 2026
**Review Frequency:** Quarterly
