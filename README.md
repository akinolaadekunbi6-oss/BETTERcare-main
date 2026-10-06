# Campus Clinic — Telemedicine Portal

A plain HTML/CSS multi-page site for a university school clinic, centred on
virtual consultations.

## Folder structure

```
campus-clinic-telemedicine/
├── index.html              Home — overview, quick actions, latest notices
├── telemedicine.html        How virtual consultations work, step by step
├── appointments.html        Booking form (virtual or in-person)
├── doctors.html              Clinician directory with availability
├── services.html             Full service list with virtual/in-person tags
├── health-resources.html     Lab test information and booking guidance
├── pharmacy.html             Prescription pickup information
├── contact.html               Clinic hours, emergency numbers, contact form + FAQ
├── css/
│   └── style.css              Shared stylesheet (all pages link to this one file)
└── assets/
    └── images/                 Put doctor photos, favicon, etc. here
```

## How to edit

- **Colors and fonts**: all defined once as CSS variables at the top of
  `css/style.css` (`:root { ... }`). Change a value there and it updates
  across every page.
- **Emergency banner**: the `.emergency-strip` block at the top of every
  page — edit the phone number/text once per file, or find-and-replace
  across all files if the number changes.
- **Navigation**: the header/footer markup is repeated at the top and
  bottom of each HTML file. If you add a new page, copy the header/footer
  block from an existing page and update the `aria-current="page"`
  attribute to match.
- **Doctors**: `doctors.html` uses a repeating `.doctor` block — copy one
  and edit the text to add a new clinician.
- **Services**: `services.html` uses a repeating `.service-row` block, each
  with a `.mode-tag` showing virtual/in-person/phone.

## Notes

- No JavaScript or build step is required — open any `.html` file directly
  in a browser, or serve the folder with any static file server.
- Both forms (`appointments.html`, `contact.html`) are static markup only;
  wire up the `<form>` `action`/`method` (or a form/booking service) to
  actually receive submissions and manage real scheduling.
- The "virtual consultation" flow described here (video link, e-prescriptions,
  health portal) assumes a real telemedicine backend — this site only
  provides the booking form and explanatory content around it.
- Fonts are loaded from Google Fonts via `@import` in `style.css`; if the
  site needs to work fully offline, download the font files and self-host
  them instead.
- This is a demonstration site. Nothing here should be treated as real
  medical advice or a substitute for an actual clinic's emergency systems.
