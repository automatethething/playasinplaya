# Intake retention

Run `cleanup_expired_intake_data()` on a protected daily schedule once the database is provisioned.

- Unapproved submission contact details are removed after 90 days.
- Approved submission contact details (stored with the approved listing) and report contact/details are removed after 180 days.
- Moderation events keep only an anonymized aggregate history after 180 days.
- Inactive or unsubscribed opt-ins are removed after 24 months.

Public directory reads never include contacts, reports, submission payloads, or moderation records.
