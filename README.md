# Tutor Match

A web-based tutoring platform for Whitman College that connects students with approved tutors. This is a prototype demonstrating the core workflows for student requests, tutor applications, and admin oversight.

## Features

**For Students:**
- Search and request tutors for specific courses
- Track tutoring requests and see assigned tutors
- Simple, intuitive interface for finding help

**For Tutors:**
- Apply for courses with GPA and transcript submission
- Add weekly availability blocks
- Manage student requests (accept/decline)
- Log tutoring hours with automatic rounding

**For Admins:**
- Review and approve tutor applications
- Monitor all tutoring requests and assignments
- View analytics on tutor hours by course and date range
- Filter time logs to track productivity

## How It Works

The app uses a smart auto-assignment system: when a student requests tutoring, an approved tutor is automatically selected based on:
- Current workload (prefers less busy tutors)
- Availability (more availability blocks = tiebreaker)
- GPA (highest performing tutors = final tiebreaker)

This keeps the matching fair and efficient without manual intervention.

## Tech Stack

- **Frontend:** Vanilla JavaScript (no frameworks)
- **Storage:** Browser localStorage (works offline, data persists locally)
- **Design:** Custom CSS for a clean, responsive UI

## Getting Started

1. Open `index.html` in your browser
2. Choose a role (Student, Tutor, or Admin)
3. Create a profile or select an existing user
4. Start exploring the platform

The prototype includes demo data to get you started right away.

## File Structure

- `index.html` - Single-page app structure with all screens
- `app.js` - All application logic and state management
- `styles.css` - Complete styling and responsive layout

## Note

This is a frontend prototype. All data is stored locally in the browser and will not persist across devices.
