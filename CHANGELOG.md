# Changelog

All notable changes to ChronosFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-04

### Added
- **Partner Mode**: Link accounts via a 6-digit invite code to share real-time progress and activity feeds with an accountability partner.
- **Weekly Progress Dashboard**: Visual statistics, completion rates, and an interactive bar chart summarizing the last 7 days of activity.
- **Firebase Firestore Integration**: Completely migrated from Local Storage to Firestore, bringing offline-first capabilities, real-time sync, and cross-device availability.
- **User Profiles & Settings**: robust schemas to handle time zones, theme preferences, and notification settings directly in the cloud.
- **Audit Logging**: Added `createdAt`, `updatedAt`, and `createdBy` fields (using `serverTimestamp`) to all objects.
- **Native Notifications**: Background daemon automatically triggers desktop notifications and Android push notifications based on task start times.
- **Android App Support**: Integrated `@capacitor/android` for seamless mobile app generation.
- **Single Instance Lock**: The Windows desktop version now enforces a single instance and focuses the window if already opened.

### Changed
- Replaced the bright colorful floating orbs with an elegant, minimalist monochrome background animation.
- Moved Category reordering logic into a central, reusable utility function to reduce code duplication.
- Improved drag-and-drop mechanics in the Daily View.
- Wrapped list row components in `React.memo` to massively improve rendering performance on lower-end hardware.

### Fixed
- Fixed an issue where Firebase listeners would not unsubscribe properly upon logging out, preventing memory leaks.
- Added comprehensive error handling (via Toasts) for all CRUD database operations.
- Resolved various ESLint warnings and unused imports.
