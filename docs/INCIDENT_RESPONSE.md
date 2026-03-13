# Incident Response Playbook

## Overview

This document provides procedures for detecting, responding to, and recovering from security incidents. All team members should be familiar with this playbook.

## Incident Classification

Security incidents are classified into four severity levels:

### Critical (CVSS 9.0-10.0)

**Definition:** Incidents that pose an immediate threat to system availability, data integrity, or user safety.

**Examples:**
- Active data breach with sensitive user information exposed
- Complete service outage affecting all users
- Ransomware infection or encryption of critical data
- Unauthorized access to production systems
- Loss of payment card data
- Loss of personally identifiable information (PII) at scale

**Response Time:** Immediate response required (within 15 minutes)
**Escalation:** CEO, Legal, Customer Success, All Hands

### High (CVSS 7.0-8.9)

**Definition:** Incidents that significantly impact system security or user experience.

**Examples:**
- Unauthorized access to limited user data (100-1000 users)
- Service degradation affecting 50%+ of users for 1+ hour
- Successful exploitation of a major vulnerability
- Compromise of a non-production system with sensitive data
- Data loss of non-critical but important information
- Email account compromise of team member with access

**Response Time:** Within 1 hour
**Escalation:** Security Lead, Engineering Lead, Customer Success

### Medium (CVSS 4.0-6.9)

**Definition:** Incidents that require attention but do not pose immediate critical risk.

**Examples:**
- Unauthorized access to limited user data (< 100 users)
- Service degradation affecting 10-50% of users
- Successful exploitation of a minor vulnerability
- Configuration error exposing non-sensitive data
- Failed attack attempt with detection
- Suspicious activity requiring investigation

**Response Time:** Within 4 hours
**Escalation:** Security Lead, Affected Team Lead

### Low (CVSS 0.1-3.9)

**Definition:** Incidents with minimal security impact requiring monitoring and documentation.

**Examples:**
- Brute force attempts against authentication system
- Suspicious but unsuccessful probing
- Minor security misconfiguration with limited exposure
- Failed social engineering attempts
- Security warning from monitoring tools
- Policy violation without successful exploit

**Response Time:** Within 24 hours
**Escalation:** Security Team

## Response Procedures

### Critical Incident Response

#### Step 1: Immediate Actions (First 15 minutes)

```
1. [ ] Activate incident command center
     - Create incident channel: #incident-YYYYMMDD-HHmm
     - Invite: CEO, CTO, Security Lead, Engineering Lead, Legal

2. [ ] Assess scope and impact
     - What systems are affected?
     - How many users impacted?
     - What data may be exposed?
     - How long has this been occurring?

3. [ ] Initiate containment
     - PAUSE deployment pipeline
     - Take affected systems offline if necessary
     - DO NOT make assumptions about cause

4. [ ] Assign roles
     - Incident Commander (usually CTO)
     - Technical Lead (investigation)
     - Communications Lead (external)
     - Legal Liaison (compliance & notification)

5. [ ] BEGIN timeline documentation
     - Document all actions and timestamps
     - Save logs and evidence
     - DO NOT DELETE anything
```

#### Step 2: Investigation (First 1 hour)

```
1. [ ] Collect evidence
     - Preserve logs from all affected systems
     - Snapshot affected systems (if possible)
     - Document system state before any changes

2. [ ] Determine root cause
     - How was access gained?
     - What vulnerabilities were exploited?
     - Were other systems affected?

3. [ ] Assess data exposure
     - What data was accessed?
     - How long was access available?
     - Was data exfiltrated?

4. [ ] Identify entry point
     - How did attacker gain access?
     - When did access occur?
     - Were credentials compromised?

5. [ ] Update severity level if needed
     - Provide updated assessment to team
```

#### Step 3: Containment (Ongoing)

```
1. [ ] Stop the attack
     - Block malicious IPs/accounts
     - Revoke compromised credentials
     - Close open vulnerabilities
     - Monitor for re-entry attempts

2. [ ] Preserve evidence
     - Maintain isolated copies of affected systems
     - Keep logs for forensic analysis
     - Document all evidence chain-of-custody

3. [ ] Prevent further damage
     - Disable affected user accounts if necessary
     - Reset passwords for all access points
     - Force re-authentication of all active sessions
```

#### Step 4: Communication (First hour + ongoing)

```
1. [ ] Internal notification
     - Notify Executive Team
     - Brief all Staff (facts only, no speculation)
     - Establish status update cadence (every 30 min)

2. [ ] External notification (if required)
     - Notify affected customers
     - Notify relevant authorities if legally required
     - Prepare press statement (if needed)
     - Contact law enforcement if criminal activity suspected

3. [ ] Use communication templates (see below)
```

#### Step 5: Recovery (1-24 hours)

```
1. [ ] Develop fix for root cause
     - Create patch if vulnerability exists
     - Prepare fix for testing
     - Plan deployment strategy

2. [ ] Test fix in isolated environment
     - Verify fix resolves issue
     - Verify fix doesn't introduce new issues
     - Performance test if applicable

3. [ ] Deploy to production
     - Follow change control procedures
     - Monitor closely during/after deployment
     - Have rollback plan ready

4. [ ] Verify system recovery
     - All systems operating normally
     - No signs of continued breach
     - Data integrity verified
```

#### Step 6: Post-Incident (24 hours after resolution)

```
1. [ ] Secure compromised credentials
     - Reset all potentially compromised passwords
     - Rotate all API keys
     - Force re-authentication of all users

2. [ ] Notify customers if data exposed
     - Individual emails to affected users
     - Include: what happened, impact, steps taken, resources
     - Provide identity protection if credit card data exposed

3. [ ] Schedule post-incident review
     - Within 3 business days
     - Include all response team members
     - Focus on: what went well, what to improve

4. [ ] File incident report
     - Document complete timeline
     - Include root cause analysis
     - List preventive measures
```

### High Incident Response

#### Step 1: Immediate Actions (First hour)

```
1. [ ] Create incident channel and notify team leads
2. [ ] Assess scope and impact (detailed analysis)
3. [ ] Begin timeline documentation
4. [ ] Assign Incident Commander and Technical Lead
5. [ ] Take preliminary containment measures
```

#### Step 2: Investigation (First 4 hours)

```
1. [ ] Collect logs and evidence from affected systems
2. [ ] Determine root cause
3. [ ] Identify affected data/users
4. [ ] Check for lateral movement
5. [ ] Develop remediation plan
```

#### Step 3: Remediation (4-24 hours)

```
1. [ ] Implement fix/patch
2. [ ] Test in staging environment
3. [ ] Deploy to production with monitoring
4. [ ] Verify resolution
5. [ ] Rotate relevant credentials
```

#### Step 4: Communication

```
1. [ ] Notify affected team members
2. [ ] Notify Security Lead
3. [ ] Notify affected customers (if data exposed)
4. [ ] Provide status updates every 2 hours until resolved
```

### Medium Incident Response

#### Step 1: Triage (First 4 hours)

```
1. [ ] Acknowledge and document incident
2. [ ] Assess scope and business impact
3. [ ] Determine if further action needed
4. [ ] Assign investigator
```

#### Step 2: Investigation (4-24 hours)

```
1. [ ] Collect relevant logs
2. [ ] Determine root cause
3. [ ] Develop fix or remediation
4. [ ] Plan implementation
```

#### Step 3: Implementation (Ongoing)

```
1. [ ] Implement remediation
2. [ ] Verify fix in staging
3. [ ] Deploy to production
4. [ ] Monitor for issues
```

### Low Incident Response

#### Process

```
1. [ ] Log incident with details
2. [ ] Assign to security team for investigation
3. [ ] Investigate within 24 hours
4. [ ] Document findings
5. [ ] Close incident with notes
6. [ ] Review in next security meeting
```

## Escalation Procedures

### On-Call Escalation Chain

**Note:** Customize these contacts with actual team member information.

**Level 1 - On-Call Engineer**
- Name: [On-Call Engineer]
- Phone: [Phone Number]
- Email: [Email]
- Availability: 24/7 during on-call week
- Escalate to Level 2 if: Cannot reach incident commander or issue is Critical

**Level 2 - Security Lead**
- Name: [Security Lead]
- Phone: [Phone Number]
- Email: [Email]
- Escalate to Level 3 if: Issue is Critical or High and unresolved in 30 minutes

**Level 3 - CTO / VP Engineering**
- Name: [CTO/VP Engineering]
- Phone: [Phone Number]
- Email: [Email]
- Escalate to Level 4 if: Issue is Critical and unresolved in 1 hour

**Level 4 - CEO**
- Name: [CEO]
- Phone: [Phone Number]
- Email: [Email]

### Escalation Triggers

Escalate up the chain if:
- No response within SLA time
- Issue severity increases
- Scope expands unexpectedly
- Media inquiries received
- Legal/compliance notification required
- Customer/partner notification needed

## Communication Templates

### Internal - Critical Incident Declared

```
Subject: CRITICAL INCIDENT DECLARED - [BRIEF_DESCRIPTION]

Team,

A critical security incident has been declared. All executives and on-call staff have been notified.

Incident Details:
- Type: [Security breach / Outage / Data Loss / etc.]
- Affected Systems: [List systems]
- Impact: [Describe impact]
- Declared At: [Timestamp UTC]
- Incident Channel: #incident-YYYYMMDD-HHmm

Do NOT:
- Make public statements
- Contact press
- Post on social media
- Discuss details outside incident channel

Do:
- Monitor #incident-* channel for updates
- Continue normal work unless directly involved
- Notify your manager if you have relevant information
- Preserve any logs or evidence you may have

Status updates: Every 30 minutes until incident declared resolved.

More info: See #incident-* channel
```

### Internal - Status Update

```
Subject: Incident Update - [INCIDENT_ID] - Status: [INVESTIGATING/CONTAINED/RECOVERING]

Incident ID: [YYYYMMDD-HHmm]
Severity: [CRITICAL/HIGH/MEDIUM/LOW]
Status: [INVESTIGATING/CONTAINED/RECOVERING/RESOLVED]
Last Update: [Time] UTC

SITUATION:
[Brief summary of what happened]

CURRENT STATUS:
[What is the current state - is service operational?]

ACTIONS TAKEN:
- [Action 1]
- [Action 2]
- [Action 3]

IMPACT:
- Users affected: [Number/estimate]
- Systems affected: [List]
- Data potentially exposed: [Yes/No/Describe]

NEXT STEPS:
- [Next action]
- [Next action]

ETA TO RESOLUTION: [Time] UTC
NEXT UPDATE: [Time] UTC

Contact: [Incident Commander Name] in #incident-* for questions
```

### Customer - Data Breach Notification

```
Subject: Important Security Notice - Action Required

Dear [Customer Name],

We are writing to inform you that on [DATE], we discovered a security incident
affecting your account.

WHAT HAPPENED:
[Clear, factual description of what occurred]

WHAT DATA WAS AFFECTED:
[Specific description of data - name, email, etc.]

WHAT WE'VE DONE:
- Immediately isolated the affected systems
- Revoked unauthorized access
- Secured all compromised credentials
- Launched a full forensic investigation
- [Any other actions taken]

WHAT YOU SHOULD DO:
1. Change your password immediately at: https://puraestate.com/reset-password
2. Enable two-factor authentication: https://puraestate.com/security/2fa
3. Monitor your accounts for suspicious activity
4. Consider credit monitoring if financial information was exposed

We apologize for this incident and any inconvenience it may cause. Security is
our top priority, and we are committed to preventing similar incidents.

Questions or concerns?
- Email: security@puraestate.com
- Phone: [Phone Number]
- More info: https://puraestate.com/security-incident

[Signature Block]
```

### Customer - Service Outage Notification

```
Subject: Service Update - We Are Currently Investigating an Issue

Dear [Customer/User],

At [TIME] UTC on [DATE], we detected unusual activity affecting our service.
We immediately took systems offline to prevent further issues.

CURRENT STATUS:
[Service is down / Degraded / Partially available]

WHAT WE KNOW:
[Brief factual description]

WHAT WE'RE DOING:
[Technical response measures]

TIMELINE:
- [TIME]: Incident detected
- [TIME]: Systems isolated
- [TIME]: Investigation began
- [TIME]: Expected update

We will post updates every [30 minutes / 1 hour] until service is fully restored.
Monitor our status page: https://status.puraestate.com

We apologize for the disruption and appreciate your patience.

Questions: support@puraestate.com or status.puraestate.com
```

### Media / Public Statement

```
[USE ONLY IF INCIDENT IS PUBLIC AND MEDIA IS INQUIRING]

Statement from [Company Name] Regarding Security Incident

[Company] takes security very seriously. On [DATE], we identified and immediately
responded to a security incident.

FACTS:
- Incident type: [Description]
- Discovery: [When discovered]
- Response: [Immediate actions taken]
- Impact: [Factual description of impact]

RESOLUTION:
- Root cause: [If known]
- Remediation: [What was done]
- Prevention: [What will be done to prevent recurrence]

We are committed to transparency and will provide additional details as the
investigation concludes. Customer security remains our highest priority.

For questions, contact: [PR Contact] at [email] or [phone]
```

## Post-Incident Review Process

### Schedule

Conduct post-incident review meeting within **3 business days** of incident resolution.

### Participants

- Incident Commander
- All technical responders
- Manager of affected team
- Security Lead (for all incidents)
- CEO (for Critical incidents)

### Agenda (60-90 minutes)

1. **Timeline Review (15 min)**
   - Walk through chronological events
   - Verify facts and sequence
   - Identify any missing details

2. **Root Cause Analysis (15 min)**
   - What was the root cause?
   - Why were we vulnerable?
   - Could we have detected it sooner?

3. **What Went Well (10 min)**
   - Recognize good decisions made
   - Identify effective procedures
   - Praise team members

4. **What Could Be Improved (15 min)**
   - Process improvements
   - Technical improvements
   - Detection improvements
   - Response improvements

5. **Action Items (15 min)**
   - List of improvements needed
   - Assign owners
   - Set target completion dates
   - Track in issue tracking system

6. **Documentation (5 min)**
   - Ensure incident report is complete
   - Review timeline accuracy
   - Finalize findings

### Follow-Up

- [ ] Document action items in project management system
- [ ] Assign owners to each action item
- [ ] Set completion deadlines
- [ ] Schedule follow-up review in 30 days
- [ ] Send minutes to all attendees and stakeholders
- [ ] Publish sanitized summary to team (optional)

## Post-Incident Actions

### Security Improvements

- Implement fixes to prevent recurrence
- Update detection rules/alerts
- Add monitoring for similar issues
- Conduct security training if applicable

### Systems/Process Improvements

- Update runbooks/playbooks
- Improve change control procedures
- Enhance testing procedures
- Improve logging/monitoring

### Customer Communication

- Notify customers of improvements (as appropriate)
- Offer identity protection services (if data breach)
- Provide security updates/guidance

### Legal/Compliance

- File required incident reports
- Update incident log
- Notify insurance if applicable
- Preserve evidence per retention requirements

## Incident Log Template

```markdown
## Incident Report

**Incident ID:** [YYYYMMDD-HHmm]
**Severity:** [CRITICAL/HIGH/MEDIUM/LOW]
**Status:** [OPEN/RESOLVED/CLOSED]

### Summary
[Brief description of incident]

### Timeline
- [TIME]: Detection/Report
- [TIME]: Triage
- [TIME]: Investigation began
- [TIME]: Root cause identified
- [TIME]: Fix developed
- [TIME]: Fix deployed
- [TIME]: Verification complete
- [TIME]: Incident closed

### Impact
- Users affected: [Number]
- Systems affected: [List]
- Duration: [Duration]
- Data exposed: [Yes/No/Description]

### Root Cause
[Technical description of root cause]

### Resolution
[How was the incident resolved]

### Prevention
[How will this be prevented in the future]

### Resources
- Investigation logs: [Link]
- Evidence: [Link]
- Forensic report: [Link]
```

---

**Last Updated:** March 12, 2026
**Next Review Date:** June 12, 2026
**Review Frequency:** After each incident + annually
