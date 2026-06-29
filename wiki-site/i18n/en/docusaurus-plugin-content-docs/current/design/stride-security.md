---
sidebar_position: 3
---

# Security Threat Model (STRIDE)

Systematize threats with STRIDE and align with ISMS / Privacy Mark controls.

| Threat (STRIDE) | Target | Assumed Threat | Countermeasure |
| --- | --- | --- | --- |
| **Spoofing** | Authentication | Impersonation login | Entra SSO/MFA · token validation · no credential storage in-house |
| **Tampering** | Data | Post/points tampering | RBAC · input validation · append-only `point_event` · integrity constraints |
| **Repudiation** | Operations | Operation denial | Audit log (Audit Catalog) · append-only ledger · `trace_id` |
| **Information Disclosure** | Confidentiality | Confidential mis-publication/leak | Confidentiality level + permission filter · encryption at rest · confidential body not sent to AI |
| **Denial of Service** | Availability | Overload/abuse | Rate limiting · TPS caps · WAF · auto-scale |
| **Elevation of Privilege** | Authorization | Privilege escalation | Least privilege · high-severity audit on permission changes · DB account separation |

## AI-Specific Countermeasures

**Prompt injection countermeasures**:

- Separate external input from system instructions
- Default: do not pass confidential data to AI (Gateway control)
- Block `CONFIDENTIAL` level at AI Gateway

## Error Code Example

```json
{
  "code": "SELF_VOTE_FORBIDDEN",
  "message": "Voting on your own post is forbidden",
  "traceId": "abc-123"
}
```

Format: `{DOMAIN}_{REASON}` — see [Coding Standard](../devops/coding-standard).
