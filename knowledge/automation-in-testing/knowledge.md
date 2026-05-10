# Automation in Testing — Verified Knowledge

> **⚠️ Append-only file.** Add new observations under `## Run` headings.
> Do NOT modify `## Human-Curated` or previous `## Run` sections.
> Do NOT duplicate observations already present in the file.

---

## Human-Curated

### App Identity

- Public practice site: `https://automationintesting.online/`
- App slug: `automation-in-testing`
- Base URL env var: `AUTOMATION_IN_TESTING_BASE_URL`

### Testing Policy

- First pipeline run should be read-only public smoke coverage.
- First run may inspect page structure, navigation, listings, forms, and non-submitting validation.
- First run should not submit bookings or contact messages.
- Second and later runs may add safe demo submissions using obvious test data, if the flow does not require real credentials, payment, or email/SMS delivery.

---

## Runs

*(Populated by pipeline runs.)*

## Run 2026-05-09T135109Z

### Verified UI Facts

- The public home page exposes the level-1 heading "Welcome to Shady Meadows B&B".
- The page has a navigation landmark with links named "Rooms", "Booking", "Amenities", "Location", "Contact", and "Admin".
- Header navigation links expose these hrefs: `/`, `/#rooms`, `/#booking`, `/#amenities`, `/#location`, `/#contact`, and `/admin`.
- The hero "Book Now" link scrolls or targets the booking/availability area without submitting a booking.
- The availability section heading is "Check Availability & Book Your Stay".
- The default availability dates observed in this run were Check In `09/05/2026` and Check Out `10/05/2026`.
- Availability date textboxes can be edited and retain entered values without continuing to a reservation.
- The rooms section exposes room headings "Single", "Double", and "Suite".
- Observed room prices were "£100 per night", "£150 per night", and "£225 per night".
- Room reservation links target `/reservation/1`, `/reservation/2`, and `/reservation/3` with `checkin=2026-05-09` and `checkout=2026-05-10` query parameters.
- The location section exposes map attribution links "Pigeon" and "OpenStreetMap".
- Contact information includes address text for Shady Meadows B&B in Newingtonfordburyshire, phone number `012345678901`, and email `fake@fakeemail.com`.
- The contact form exposes named textboxes for Name, Email, Phone, and Subject, plus an unnamed message textarea with id `description`.
- Contact form fields start empty and retain values when filled without clicking Submit.
- The footer exposes quick links Home, Rooms, Booking, and Contact, plus Cookie-Policy, Privacy-Policy, Admin panel, and Mark Winteringham links.
- The discovered public home page has no table role; table-content verification is not applicable for this page.

### Verified Test Coverage

- 17 read-only smoke scenarios passed against the public site.
- No booking, contact-message submission, credential entry, or authenticated action was performed.

## Run 2026-05-09T235844Z

### Verified UI Facts

- The default availability dates observed in this run were Check In `10/05/2026` and Check Out `11/05/2026`.
- Availability search can be initiated with editable stay dates and still leaves room booking options visible without completing a reservation.
- Room reservation links in this run targeted `/reservation/1`, `/reservation/2`, and `/reservation/3` with `checkin=2026-05-10` and `checkout=2026-05-11` query parameters.
- The hero CTA text `Book Now` and repeated room link text `Book now` are distinct to users but require exact role-name matching in Playwright to avoid ambiguity.
- Contact form fields accepted and retained obvious test data before submission.
- The contact form Submit button was visible and enabled, and an alert region was attached for validation/submission feedback.

### Verified Test Coverage

- 18 public smoke scenarios passed against the public site.
- One availability search was initiated, but no booking was completed.
- No room reservation link was clicked, no credentials were entered, and no authenticated action was attempted.
