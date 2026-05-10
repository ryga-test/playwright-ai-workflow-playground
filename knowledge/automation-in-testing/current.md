# Automation in Testing — Current Knowledge

## Scope

- App slug: `automation-in-testing`
- Public URL: `https://automationintesting.online/`
- Env var: `AUTOMATION_IN_TESTING_BASE_URL`

## Current Testing Policy

- Public smoke coverage should remain safe for a live demo site.
- Safe interactions include page load, section navigation, availability search, room option visibility, contact field filling without submission, and public policy link inspection.
- Avoid real credentials, payment data, email/SMS dependent assertions, admin login attempts, final booking submission, and contact message submission unless explicitly approved for a state-changing run.

## Current Verified Runtime Observations

- The public home page exposes the heading "Welcome to Shady Meadows B&B".
- Primary navigation exposes Rooms, Booking, Amenities, Location, Contact, and Admin links.
- The hero "Book Now" link reaches the availability search area.
- Availability search can be initiated with editable stay dates while keeping room booking options visible and without completing a reservation.
- Room options include Single, Double, and Suite.
- Contact fields accept and retain obvious test data before submission.
- Cookie-Policy and Privacy-Policy links are visible and route to `/cookie` and `/privacy`.

## Current Selector Rules

- Prefer role locators for named navigation links, headings, buttons, and public links.
- Use exact matching to distinguish hero `Book Now` from repeated room `Book now` links.
- Use `data-testid` locators for contact form fields.
- Date inputs remain positional textboxes until stable labels/test ids are available.
- Scope duplicate contact/address text to a stable section or footer region.
