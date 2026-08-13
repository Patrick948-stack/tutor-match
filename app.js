/* ==========================================================================
   app.js
   ======
   This file contains ALL the behavior (logic) for the prototype.

   IMPORTANT: This is a "vanilla" (plain) JavaScript prototype:
   - No frameworks (no React, no Vue, no Django).
   - Data is stored in localStorage (the browser’s built-in storage).
   - That means:
       * It works on YOUR computer in YOUR browser.
       * If you open it on another computer, it won’t have the same data.

   WHAT THIS APP DOES (feature summary):
   1) "Login" (prototype-style):
      - You choose role: student / tutor / admin
      - You enter name/email (+ optional phone)
      - We save a user profile and set it as the "current user"

   2) Tutor application:
      - Tutor selects courses + enters GPA (optional)
      - Tutor can upload profile photo (optional, stored as base64 string)
      - Tutor can select a transcript PDF (prototype stores only file name)
      - Admin approves/rejects tutor

   3) Student tutoring request:
      - Student selects a course and clicks "Request tutoring"
      - The app AUTO-ASSIGNS an approved tutor for that course
      - The auto-assignment tries to be fair:
        - it prefers tutors with fewer assigned requests (lower load)
        - ties broken by availability blocks count, then by GPA

   4) Tutor handles requests:
      - Tutor sees assigned requests and can accept/decline

   5) Availability:
      - Tutor adds weekly blocks (Mon 3-5 etc.)
      - Used for tie-breaking in auto-assign

   6) Time logs (hours reporting):
      - Tutor submits minutes worked
      - We round UP to nearest 0.25 hours (15 minutes)
      - Admin can view all logs (filter optional)

   DESIGN PRINCIPLE (very important for learning):
   - We separate our code into three "layers":
     A) State Layer: load/save data in localStorage
     B) Logic Layer: functions that change the state
     C) UI Layer: functions that render the state to the HTML

   If you understand those three layers, you can rebuild this project later.
   ========================================================================== */


/* --------------------------------------------------------------------------
   0) HELPER: "STRICT MODE"
   -------------------------------------------------------------------------- */
/*
  "use strict" makes JavaScript more strict.
  It prevents some silent bugs and forces safer coding.
*/
"use strict";


/* --------------------------------------------------------------------------
   1) CONSTANTS (names that never change)
   -------------------------------------------------------------------------- */

/*
  localStorage is like a small "database" inside the browser.
  We store everything under one key so it's easy to load/save.
*/
const STORAGE_KEY = "whitmanTutorMatchState_v1";

/*
  A default avatar SVG (simple silhouette) as a DATA URL.
  Why?
  - If a tutor doesn't upload a profile photo, we still want an avatar.
  - A "data URL" means the image is embedded in the code (no separate file needed).

  NOTE:
  - encodeURIComponent makes sure special characters are safe in the URL string.
*/
const DEFAULT_AVATAR_DATA_URL =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#6CB2E2" stop-opacity="0.25"/>
          <stop offset="1" stop-color="#EFF2F9" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="128" height="128" fill="url(#g)"/>
      <circle cx="64" cy="50" r="24" fill="#002868" fill-opacity="0.25"/>
      <path d="M20,122c6-30,26-46,44-46s38,16,44,46" fill="#002868" fill-opacity="0.18"/>
    </svg>
  `);


/* --------------------------------------------------------------------------
   2) STATE (our in-memory copy of the app data)
   -------------------------------------------------------------------------- */

/*
  This is the SINGLE source of truth while the app is running.
  We load it from localStorage, modify it, then save it back.
*/
let state = null;


/* --------------------------------------------------------------------------
   3) DOM REFERENCES (grab HTML elements once)
   -------------------------------------------------------------------------- */
/*
  DOM = Document Object Model (the webpage elements).
  We use document.getElementById to grab the elements we need.
  This makes our code faster and cleaner than searching repeatedly.
*/
const el = {
    // Header UI
    currentUserBadge: document.getElementById("currentUserBadge"),
    btnLogout: document.getElementById("btnLogout"),

    // Screens
    screenAuth: document.getElementById("screenAuth"),
    screenStudent: document.getElementById("screenStudent"),
    screenTutor: document.getElementById("screenTutor"),
    screenAdmin: document.getElementById("screenAdmin"),

    // Auth elements
    authName: document.getElementById("authName"),
    authEmail: document.getElementById("authEmail"),
    authPhone: document.getElementById("authPhone"),
    btnCreateProfile: document.getElementById("btnCreateProfile"),
    btnChooseExisting: document.getElementById("btnChooseExisting"),
    existingUsersPanel: document.getElementById("existingUsersPanel"),
    existingUsersList: document.getElementById("existingUsersList"),
    btnResetDemo: document.getElementById("btnResetDemo"),

    // Student elements
    studentCourseSearch: document.getElementById("studentCourseSearch"),
    studentCourseSelect: document.getElementById("studentCourseSelect"),
    studentRequestNote: document.getElementById("studentRequestNote"),
    btnStudentRequestTutor: document.getElementById("btnStudentRequestTutor"),
    studentRequestsList: document.getElementById("studentRequestsList"),

    // Tutor elements
    tutorAvatar: document.getElementById("tutorAvatar"),
    tutorPhotoInput: document.getElementById("tutorPhotoInput"),
    tutorEmailDisplay: document.getElementById("tutorEmailDisplay"),
    tutorPhoneDisplay: document.getElementById("tutorPhoneDisplay"),
    tutorGpa: document.getElementById("tutorGpa"),
    tutorCourseSelect: document.getElementById("tutorCourseSelect"),
    tutorTranscriptInput: document.getElementById("tutorTranscriptInput"),
    tutorTranscriptName: document.getElementById("tutorTranscriptName"),
    tutorApplicationStatus: document.getElementById("tutorApplicationStatus"),
    btnTutorSubmitApplication: document.getElementById("btnTutorSubmitApplication"),

    availDay: document.getElementById("availDay"),
    availStart: document.getElementById("availStart"),
    availEnd: document.getElementById("availEnd"),
    btnAddAvailability: document.getElementById("btnAddAvailability"),
    tutorAvailabilityList: document.getElementById("tutorAvailabilityList"),

    tutorRequestsList: document.getElementById("tutorRequestsList"),

    logDate: document.getElementById("logDate"),
    logCourse: document.getElementById("logCourse"),
    logType: document.getElementById("logType"),
    logMinutes: document.getElementById("logMinutes"),
    btnSubmitTimeLog: document.getElementById("btnSubmitTimeLog"),
    tutorTimeLogsList: document.getElementById("tutorTimeLogsList"),

    // Admin elements
    adminApplicationsList: document.getElementById("adminApplicationsList"),
    adminRequestsList: document.getElementById("adminRequestsList"),
    adminWeekStart: document.getElementById("adminWeekStart"),
    btnAdminFilterLogs: document.getElementById("btnAdminFilterLogs"),
    btnAdminClearLogFilter: document.getElementById("btnAdminClearLogFilter"),
    adminTimeLogsList: document.getElementById("adminTimeLogsList"),
};


/* --------------------------------------------------------------------------
   4) INITIALIZATION (start the app)
   -------------------------------------------------------------------------- */

/*
  When the page loads, we want to:
  1) Load state from localStorage (or create a new state)
  2) Hook up event listeners (button clicks, typing, etc.)
  3) Render the correct screen
*/
initApp();

function initApp() {
    // Step 1: load or create data
    state = loadStateOrCreate();

    // Step 2: connect UI events to logic functions
    bindEventListeners();

    // Step 3: show the right screen + fill UI based on data
    renderApp();
}


/* --------------------------------------------------------------------------
   5) STATE LAYER: LOAD / SAVE / DEFAULT STATE
   -------------------------------------------------------------------------- */

/*
  Loads state from localStorage.
  If nothing is found, we create a new default state.
*/
function loadStateOrCreate() {
    // localStorage.getItem returns a string or null
    const raw = localStorage.getItem(STORAGE_KEY);

    // If there's nothing stored, build a fresh default state
    if (!raw) {
        const fresh = createDefaultState();
        saveState(fresh); // save it immediately so we have seed data
        return fresh;
    }

    // If we DO have stored data, parse the JSON string back into an object
    try {
        return JSON.parse(raw);
    } catch (err) {
        // If parsing fails (corrupted data), start over cleanly
        console.warn("State was corrupted; resetting.", err);
        const fresh = createDefaultState();
        saveState(fresh);
        return fresh;
    }
}

/*
  Saves our current state to localStorage.
  JSON.stringify turns an object into a string we can store.
*/
function saveState(nextState = state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

/*
  Creates the initial state of the app (seed data).
  This is like our "database schema" for the prototype.
*/
function createDefaultState() {
    return {
        // currentUserId stores who is "logged in"
        currentUserId: null,

        // Simple data arrays (like tables in a database)
        users: [
            // Example users (demo)
            {
                id: makeId(),
                role: "admin",
                name: "ARC Admin",
                email: "arc_admin@whitman.edu",
                phone: "",
            },
            {
                id: makeId(),
                role: "student",
                name: "Demo Student",
                email: "student@whitman.edu",
                phone: "",
            },
            {
                id: makeId(),
                role: "tutor",
                name: "Demo Tutor",
                email: "tutor@whitman.edu",
                phone: "",
            },
        ],

        // Courses available in the app
        courses: [
            { id: makeId(), code: "CS 167", title: "Intro to Computer Science II" },
            { id: makeId(), code: "MATH 125", title: "Calculus I" },
            { id: makeId(), code: "PHYS 155", title: "General Physics I" },
            { id: makeId(), code: "CHEM 125", title: "General Chemistry I" },
            { id: makeId(), code: "SPAN 204", title: "Intermediate Spanish" },
        ],

        /*
          Tutor applications:
          - 1 application per tutor user
          - status: "not_submitted" | "pending" | "approved" | "rejected"
          - selectedCourseIds: list of course IDs they want to tutor
          - approvedCourseIds: list of course IDs admin approved
        */
        tutorApplications: [
            // We will auto-create one when a tutor submits for the first time.
        ],

        /*
          Tutor profiles:
          - Stores tutor-specific info (photo, GPA, transcript filename)
          - We keep it separate from users to keep user table simple.
        */
        tutorProfiles: [
            // Created when tutor submits application first time
        ],

        /*
          Availability blocks:
          - Tutor can add blocks like { day:"Mon", start:"15:00", end:"17:00" }
        */
        availability: [
            // { tutorId, day, start, end }
        ],

        /*
          Tutoring requests:
          - A student requests tutoring for a course
          - The app automatically assigns a tutorId from approved tutors
          - status: "pending" | "accepted" | "declined"
        */
        requests: [
            // { id, studentId, courseId, tutorId, note, status, createdAt }
        ],

        /*
          Time logs:
          - Tutor reports time worked
          - minutes + roundedHours stored
        */
        timeLogs: [
            // { id, tutorId, date, courseId, type, minutes, roundedHours, createdAt }
        ],

        // Admin filter state (optional UI convenience)
        adminLogFilterWeekStart: null,
    };
}


/* --------------------------------------------------------------------------
   6) EVENT LISTENERS (connect UI -> logic)
   -------------------------------------------------------------------------- */

function bindEventListeners() {
    /* ---------------------------
       Header: Logout
       --------------------------- */
    el.btnLogout.addEventListener("click", () => {
        // Clear the current user
        state.currentUserId = null;

        // Save to localStorage
        saveState();

        // Re-render UI to show auth screen
        renderApp();
    });

    /* ---------------------------
       Auth: Create profile & continue
       --------------------------- */
    el.btnCreateProfile.addEventListener("click", () => {
        // Create user from form fields
        const newUser = buildUserFromAuthForm();

        // If form validation fails, buildUserFromAuthForm returns null
        if (!newUser) return;

        // Add user to state
        state.users.push(newUser);

        // Log in as this user
        state.currentUserId = newUser.id;

        // Save changes
        saveState();

        // Re-render
        renderApp();
    });

    /* ---------------------------
       Auth: Toggle existing users panel
       --------------------------- */
    el.btnChooseExisting.addEventListener("click", () => {
        // Toggle = if hidden -> show, if shown -> hide
        el.existingUsersPanel.classList.toggle("hidden");

        // Always refresh the list when panel opens
        if (!el.existingUsersPanel.classList.contains("hidden")) {
            renderExistingUsersList();
        }
    });

    /* ---------------------------
       Demo: Reset demo data
       --------------------------- */
    el.btnResetDemo.addEventListener("click", () => {
        // Confirm is a built-in browser pop-up (OK/Cancel)
        const ok = confirm("Reset all demo data? This cannot be undone.");
        if (!ok) return;

        // Replace state with a fresh default
        state = createDefaultState();

        // Save it
        saveState();

        // Re-render
        renderApp();
    });

    /* ---------------------------
       Student: Course search typing
       --------------------------- */
    el.studentCourseSearch.addEventListener("input", () => {
        // When user types, update course select options
        renderStudentCourseOptions();
    });

    /* ---------------------------
       Student: Request tutoring
       --------------------------- */
    el.btnStudentRequestTutor.addEventListener("click", () => {
        const user = getCurrentUser();
        if (!user) return;

        // Get selected courseId
        const courseId = el.studentCourseSelect.value;
        if (!courseId) {
            alert("Please select a course first.");
            return;
        }

        // Create request (auto-assign happens inside)
        createTutoringRequest(user.id, courseId, el.studentRequestNote.value.trim());

        // Clear note box (nice UX)
        el.studentRequestNote.value = "";

        // Save + render
        saveState();
        renderApp();
    });

    /* ---------------------------
       Tutor: Profile picture upload
       --------------------------- */
    el.tutorPhotoInput.addEventListener("change", async () => {
        const user = getCurrentUser();
        if (!user) return;

        // Get the selected file
        const file = el.tutorPhotoInput.files[0];
        if (!file) return; // user cancelled

        // Convert image to base64 data URL (so we can store it)
        const dataUrl = await fileToDataURL(file);

        // Ensure tutor profile exists
        ensureTutorProfile(user.id);

        // Save photo in tutor profile
        const profile = getTutorProfile(user.id);
        profile.photoDataUrl = dataUrl;

        // Save + render
        saveState();
        renderApp();
    });

    /* ---------------------------
       Tutor: Transcript selection
       --------------------------- */
    el.tutorTranscriptInput.addEventListener("change", () => {
        const user = getCurrentUser();
        if (!user) return;

        const file = el.tutorTranscriptInput.files[0];
        if (!file) {
            el.tutorTranscriptName.textContent = "None";
            return;
        }

        // Ensure tutor profile exists
        ensureTutorProfile(user.id);

        // Store ONLY the filename in prototype
        const profile = getTutorProfile(user.id);
        profile.transcriptFileName = file.name;

        // Update UI now (instant feedback)
        el.tutorTranscriptName.textContent = file.name;

        // Save
        saveState();
    });

    /* ---------------------------
       Tutor: Submit application
       --------------------------- */
    el.btnTutorSubmitApplication.addEventListener("click", () => {
        const user = getCurrentUser();
        if (!user) return;

        // Read GPA field (optional)
        const gpaValue = parseFloat(el.tutorGpa.value);
        const gpa = Number.isFinite(gpaValue) ? gpaValue : null;

        // Read selected courses from multi-select
        const selectedCourseIds = getSelectedOptions(el.tutorCourseSelect);

        if (selectedCourseIds.length === 0) {
            alert("Please select at least one course to tutor.");
            return;
        }

        // Ensure profile exists and store GPA
        ensureTutorProfile(user.id);
        const profile = getTutorProfile(user.id);
        profile.gpa = gpa;

        // Create/update application
        submitTutorApplication(user.id, selectedCourseIds);

        // Save + render
        saveState();
        renderApp();
    });

    /* ---------------------------
       Tutor: Add availability block
       --------------------------- */
    el.btnAddAvailability.addEventListener("click", () => {
        const user = getCurrentUser();
        if (!user) return;

        const day = el.availDay.value;
        const start = el.availStart.value;
        const end = el.availEnd.value;

        if (!start || !end) {
            alert("Please choose both a start and end time.");
            return;
        }

        if (start >= end) {
            alert("End time must be after start time.");
            return;
        }

        // Add availability to state
        state.availability.push({
            id: makeId(),
            tutorId: user.id,
            day,
            start,
            end,
        });

        // Save + render
        saveState();
        renderApp();
    });

    /* ---------------------------
       Tutor: Submit time log
       --------------------------- */
    el.btnSubmitTimeLog.addEventListener("click", () => {
        const user = getCurrentUser();
        if (!user) return;

        const date = el.logDate.value;
        const courseId = el.logCourse.value;
        const type = el.logType.value;

        const minutesValue = parseInt(el.logMinutes.value, 10);
        const minutes = Number.isFinite(minutesValue) ? minutesValue : 0;

        if (!date) {
            alert("Please choose a date.");
            return;
        }
        if (!courseId) {
            alert("Please choose a course.");
            return;
        }
        if (minutes <= 0) {
            alert("Please enter minutes worked (a positive number).");
            return;
        }

        // Convert minutes -> rounded hours (rounded UP to nearest 0.25)
        const roundedHours = roundUpToQuarterHourHours(minutes);

        // Create time log
        state.timeLogs.push({
            id: makeId(),
            tutorId: user.id,
            date,
            courseId,
            type,
            minutes,
            roundedHours,
            createdAt: new Date().toISOString(),
        });

        // Clear minutes input (nice UX)
        el.logMinutes.value = "";

        // Save + render
        saveState();
        renderApp();
    });

    /* ---------------------------
       Admin: Filter logs
       --------------------------- */
    el.btnAdminFilterLogs.addEventListener("click", () => {
        const date = el.adminWeekStart.value;
        state.adminLogFilterWeekStart = date || null;
        saveState();
        renderApp();
    });

    /* ---------------------------
       Admin: Clear filter
       --------------------------- */
    el.btnAdminClearLogFilter.addEventListener("click", () => {
        state.adminLogFilterWeekStart = null;
        el.adminWeekStart.value = "";
        saveState();
        renderApp();
    });
}


/* --------------------------------------------------------------------------
   7) LOGIC LAYER: AUTH HELPERS
   -------------------------------------------------------------------------- */

/*
  Builds a user object from the auth form inputs.
  Returns:
    - user object if valid
    - null if validation fails
*/
function buildUserFromAuthForm() {
    // Find selected role radio input
    const role = document.querySelector('input[name="role"]:checked')?.value;

    // Read fields
    const name = el.authName.value.trim();
    const email = el.authEmail.value.trim();
    const phone = el.authPhone.value.trim();

    // Validate required fields
    if (!role) {
        alert("Please select a role.");
        return null;
    }
    if (!name) {
        alert("Please enter your full name.");
        return null;
    }
    if (!email) {
        alert("Please enter your email (required).");
        return null;
    }

    // Create user object
    return {
        id: makeId(),
        role,
        name,
        email,
        phone,
    };
}

/*
  Returns the currently logged-in user object, or null.
*/
function getCurrentUser() {
    const id = state.currentUserId;
    if (!id) return null;
    return state.users.find((u) => u.id === id) || null;
}

/*
  Convenience helper: get a course object by its ID.
*/
function getCourseById(courseId) {
    return state.courses.find((c) => c.id === courseId) || null;
}


/* --------------------------------------------------------------------------
   8) LOGIC LAYER: TUTOR PROFILES + APPLICATIONS
   -------------------------------------------------------------------------- */

/*
  Ensure a tutor profile exists for tutorId.
  If not, create it.
*/
function ensureTutorProfile(tutorId) {
    const exists = state.tutorProfiles.some((p) => p.tutorId === tutorId);
    if (exists) return;

    state.tutorProfiles.push({
        tutorId,
        gpa: null,
        photoDataUrl: "", // empty means "no photo"
        transcriptFileName: "",
    });
}

/*
  Get tutor profile object for tutorId (assumes it exists).
*/
function getTutorProfile(tutorId) {
    return state.tutorProfiles.find((p) => p.tutorId === tutorId) || null;
}

/*
  Submit tutor application:
  - Creates new application if none exists
  - Or updates existing
  - Sets status to "pending" (waiting for admin)
*/
function submitTutorApplication(tutorId, selectedCourseIds) {
    // Find existing application (if any)
    let app = state.tutorApplications.find((a) => a.tutorId === tutorId);

    // If none exists, create one
    if (!app) {
        app = {
            id: makeId(),
            tutorId,
            status: "pending",
            selectedCourseIds: [...selectedCourseIds],
            approvedCourseIds: [], // admin fills this when approving
            reviewedByAdminId: null,
            reviewedAt: null,
            adminNote: "",
        };
        state.tutorApplications.push(app);
        return;
    }

    // If application exists, update it
    app.status = "pending";
    app.selectedCourseIds = [...selectedCourseIds];

    // If tutor edits courses after being approved, we reset approvals for safety.
    // (Admin must re-approve the new list.)
    app.approvedCourseIds = [];

    app.reviewedByAdminId = null;
    app.reviewedAt = null;
    app.adminNote = "";
}

/*
  Approve tutor application (admin action).
  For simplicity, we approve ALL selected courses.
*/
function approveTutorApplication(adminId, applicationId) {
    const app = state.tutorApplications.find((a) => a.id === applicationId);
    if (!app) return;

    app.status = "approved";
    app.approvedCourseIds = [...app.selectedCourseIds]; // approve all selected
    app.reviewedByAdminId = adminId;
    app.reviewedAt = new Date().toISOString();
}

/*
  Reject tutor application (admin action).
*/
function rejectTutorApplication(adminId, applicationId) {
    const app = state.tutorApplications.find((a) => a.id === applicationId);
    if (!app) return;

    app.status = "rejected";
    app.approvedCourseIds = [];
    app.reviewedByAdminId = adminId;
    app.reviewedAt = new Date().toISOString();
}


/* --------------------------------------------------------------------------
   9) LOGIC LAYER: AUTO-ASSIGN TUTOR + REQUESTS
   -------------------------------------------------------------------------- */

/*
  Create a new tutoring request and auto-assign a tutor.

  "Auto-assign" rule:
  - Only tutors APPROVED for the requested course can be assigned.
  - We try to pick a tutor fairly using a score.

  Score idea (simple + teachable):
  - Lower current load is better (fewer assigned requests)
  - More availability blocks is better (more open schedule)
  - Higher GPA is slightly better (optional)
*/
function createTutoringRequest(studentId, courseId, note) {
    // Find an auto-assigned tutor from approved tutors
    const tutorId = autoAssignTutor(courseId);

    if (!tutorId) {
        // No approved tutors for this course
        alert("No approved tutors are available for this course yet.");
        return;
    }

    // Create request object
    state.requests.push({
        id: makeId(),
        studentId,
        courseId,
        tutorId,
        note,
        status: "pending",
        createdAt: new Date().toISOString(),
    });
}

/*
  Returns a tutorId (string) for best tutor for a course, or null if none.
*/
function autoAssignTutor(courseId) {
    // Step 1: find all tutor applications that are approved for this course
    const eligibleTutorIds = state.tutorApplications
        .filter((a) => a.status === "approved" && a.approvedCourseIds.includes(courseId))
        .map((a) => a.tutorId);

    if (eligibleTutorIds.length === 0) return null;

    // Step 2: score each eligible tutor
    const scored = eligibleTutorIds.map((tutorId) => {
        const load = countActiveTutorRequests(tutorId);
        const availabilityCount = countTutorAvailabilityBlocks(tutorId);
        const gpa = getTutorProfile(tutorId)?.gpa ?? 0;

        /*
          Build a score where higher is better.
          We want fewer requests => higher score, so we subtract load.
          Example weights:
          - load weight: -10 each
          - availability weight: +2 each block
          - gpa weight: +1 each GPA point (small)
        */
        const score = (0 - load * 10) + (availabilityCount * 2) + (gpa * 1);

        return { tutorId, score, load, availabilityCount, gpa };
    });

    // Step 3: pick the tutor with the highest score
    scored.sort((a, b) => b.score - a.score);

    // Tie-breaking:
    // If scores are equal, pick the one with lower load first
    // (We already include load in score, but this makes it extra fair.)
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.load !== b.load) return a.load - b.load;
        if (b.availabilityCount !== a.availabilityCount) return b.availabilityCount - a.availabilityCount;
        return b.gpa - a.gpa;
    });

    return scored[0].tutorId;
}

/*
  Count how many "active" requests a tutor has.
  We'll count:
   - pending
   - accepted
  (Declined doesn't count as "load".)
*/
function countActiveTutorRequests(tutorId) {
    return state.requests.filter(
        (r) => r.tutorId === tutorId && (r.status === "pending" || r.status === "accepted")
    ).length;
}

/*
  Count how many availability blocks a tutor has.
*/
function countTutorAvailabilityBlocks(tutorId) {
    return state.availability.filter((a) => a.tutorId === tutorId).length;
}

/*
  Tutor accepts/declines a request.
*/
function setRequestStatus(requestId, newStatus) {
    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return;

    // Only allow certain statuses
    if (!["accepted", "declined"].includes(newStatus)) return;

    req.status = newStatus;
}


/* --------------------------------------------------------------------------
   10) LOGIC LAYER: TIME LOG ROUNDING
   -------------------------------------------------------------------------- */

/*
  Rounds UP to the nearest quarter hour in HOURS.

  Examples:
  - 5 minutes  -> 0.25 hours (round up)
  - 15 minutes -> 0.25 hours
  - 25 minutes -> 0.50 hours
  - 60 minutes -> 1.00 hours
  - 61 minutes -> 1.25 hours

  How it works:
  - Convert minutes to hours: minutes / 60
  - A quarter hour in hours is 0.25
  - Divide by 0.25, round up, then multiply back by 0.25
*/
function roundUpToQuarterHourHours(minutes) {
    const hours = minutes / 60;
    const quarter = 0.25;
    return Math.ceil(hours / quarter) * quarter;
}


/* --------------------------------------------------------------------------
   11) UI LAYER: RENDER THE APP
   -------------------------------------------------------------------------- */

/*
  This is the "master render function".
  It decides which screen to show based on the current user.
*/
function renderApp() {
    const user = getCurrentUser();

    // Update header badge + logout visibility
    renderHeader(user);

    // If no user, show auth screen
    if (!user) {
        showOnlyScreen("auth");
        renderExistingUsersList(); // helpful to see users
        return;
    }

    // Show the screen based on role
    if (user.role === "student") {
        showOnlyScreen("student");
        renderStudentUI(user);
    } else if (user.role === "tutor") {
        showOnlyScreen("tutor");
        renderTutorUI(user);
    } else if (user.role === "admin") {
        showOnlyScreen("admin");
        renderAdminUI(user);
    } else {
        // Unknown role fallback
        showOnlyScreen("auth");
    }
}

/*
  Header rendering:
  - Shows who is logged in
  - Hides logout when not logged in
*/
function renderHeader(user) {
    if (!user) {
        el.currentUserBadge.textContent = "Not logged in";
        el.btnLogout.style.display = "none";
        return;
    }

    el.currentUserBadge.textContent = `Logged in as: ${user.name} (${capitalize(user.role)})`;
    el.btnLogout.style.display = "inline-flex";
}

/*
  Show only one screen and hide the others.
*/
function showOnlyScreen(which) {
    // First hide all
    el.screenAuth.classList.add("hidden");
    el.screenStudent.classList.add("hidden");
    el.screenTutor.classList.add("hidden");
    el.screenAdmin.classList.add("hidden");

    // Then show the chosen one
    if (which === "auth") el.screenAuth.classList.remove("hidden");
    if (which === "student") el.screenStudent.classList.remove("hidden");
    if (which === "tutor") el.screenTutor.classList.remove("hidden");
    if (which === "admin") el.screenAdmin.classList.remove("hidden");
}


/* --------------------------------------------------------------------------
   12) UI: AUTH EXISTING USERS LIST
   -------------------------------------------------------------------------- */

/*
  Renders a list of users so you can click to login as them.
*/
function renderExistingUsersList() {
    // Clear old list
    el.existingUsersList.innerHTML = "";

    // If no users, show message
    if (state.users.length === 0) {
        el.existingUsersList.textContent = "No users found.";
        return;
    }

    // Create a button for each user
    state.users.forEach((u) => {
        const item = document.createElement("div");
        item.className = "list-item";

        const title = document.createElement("h4");
        title.textContent = `${u.name} — ${capitalize(u.role)}`;

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = u.email;

        const btn = document.createElement("button");
        btn.className = "btn btn-primary";
        btn.type = "button";
        btn.textContent = "Log in as this user";

        // Click handler logs in
        btn.addEventListener("click", () => {
            state.currentUserId = u.id;
            saveState();
            renderApp();
        });

        item.appendChild(title);
        item.appendChild(meta);
        item.appendChild(btn);

        el.existingUsersList.appendChild(item);
    });
}


/* --------------------------------------------------------------------------
   13) UI: STUDENT
   -------------------------------------------------------------------------- */

function renderStudentUI(studentUser) {
    // Render course dropdown options (with search filter)
    renderStudentCourseOptions();

    // Render student's requests list
    renderStudentRequests(studentUser.id);
}

/*
  Builds the course select options based on search input.
*/
function renderStudentCourseOptions() {
    const query = el.studentCourseSearch.value.trim().toLowerCase();

    // Clear existing options
    el.studentCourseSelect.innerHTML = "";

    // Filter courses by query (code or title contains query)
    const filtered = state.courses.filter((c) => {
        const haystack = `${c.code} ${c.title}`.toLowerCase();
        return haystack.includes(query);
    });

    // If none found, add a disabled option
    if (filtered.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No courses match your search";
        opt.disabled = true;
        opt.selected = true;
        el.studentCourseSelect.appendChild(opt);
        return;
    }

    // Create option for each course
    filtered.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.code} — ${c.title}`;
        el.studentCourseSelect.appendChild(opt);
    });
}

/*
  Renders all requests for one student.
*/
function renderStudentRequests(studentId) {
    el.studentRequestsList.innerHTML = "";

    const requests = state.requests
        .filter((r) => r.studentId === studentId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (requests.length === 0) {
        el.studentRequestsList.textContent = "No requests yet. Create one above!";
        return;
    }

    requests.forEach((r) => {
        const course = getCourseById(r.courseId);
        const tutor = state.users.find((u) => u.id === r.tutorId);

        const item = document.createElement("div");
        item.className = "list-item";

        const title = document.createElement("h4");
        title.textContent = `${course?.code ?? "Course"} — Request`;

        const meta = document.createElement("div");
        meta.className = "meta";

        // Show tutor + status
        const tutorLine = document.createElement("div");
        tutorLine.textContent = `Assigned tutor: ${tutor ? tutor.name : "Unknown"}`;

        const statusLine = document.createElement("div");
        statusLine.textContent = `Status: ${capitalize(r.status)}`;

        meta.appendChild(tutorLine);
        meta.appendChild(statusLine);

        // Show tutor contact info (email required, phone optional)
        const contact = document.createElement("p");
        contact.className = "muted";
        contact.style.marginTop = "10px";
        if (tutor) {
            contact.textContent = `Contact: ${tutor.email}${tutor.phone ? " • " + tutor.phone : ""}`;
        } else {
            contact.textContent = "Contact: —";
        }

        // Show student's note if any
        if (r.note) {
            const note = document.createElement("p");
            note.textContent = `Note: ${r.note}`;
            item.appendChild(note);
        }

        item.appendChild(title);
        item.appendChild(meta);
        item.appendChild(contact);

        el.studentRequestsList.appendChild(item);
    });
}


/* --------------------------------------------------------------------------
   14) UI: TUTOR
   -------------------------------------------------------------------------- */

function renderTutorUI(tutorUser) {
    // Ensure tutor profile exists so UI can read it safely
    ensureTutorProfile(tutorUser.id);

    // Render tutor profile picture (photo or default)
    renderTutorAvatar(tutorUser.id);

    // Show contact info (from user object)
    el.tutorEmailDisplay.textContent = tutorUser.email || "—";
    el.tutorPhoneDisplay.textContent = tutorUser.phone || "—";

    // Render tutor application status + form values
    renderTutorApplicationSection(tutorUser.id);

    // Populate courses in tutor multi-select and in time log select
    renderAllCourseOptionsForTutor();

    // Render availability list
    renderTutorAvailability(tutorUser.id);

    // Render assigned requests list
    renderTutorRequests(tutorUser.id);

    // Render tutor time logs
    renderTutorTimeLogs(tutorUser.id);
}

/*
  Show tutor avatar.
*/
function renderTutorAvatar(tutorId) {
    const profile = getTutorProfile(tutorId);

    // If tutor uploaded a photo, show it; else show default avatar
    const src = profile?.photoDataUrl ? profile.photoDataUrl : DEFAULT_AVATAR_DATA_URL;
    el.tutorAvatar.src = src;
}

/*
  Render application status and transcript name.
*/
function renderTutorApplicationSection(tutorId) {
    const profile = getTutorProfile(tutorId);
    const app = state.tutorApplications.find((a) => a.tutorId === tutorId);

    // Fill transcript name display
    el.tutorTranscriptName.textContent = profile?.transcriptFileName || "None";

    // Fill GPA field
    el.tutorGpa.value = profile?.gpa ?? "";

    // Application status text
    if (!app) {
        el.tutorApplicationStatus.textContent = "Not submitted";
        return;
    }

    // Show status
    el.tutorApplicationStatus.textContent = capitalize(app.status);

    // If approved, show approved courses in a helpful way
    if (app.status === "approved") {
        const names = app.approvedCourseIds
            .map((id) => getCourseById(id))
            .filter(Boolean)
            .map((c) => c.code);

        // Small extra note
        el.tutorApplicationStatus.textContent += ` (Approved for: ${names.join(", ")})`;
    }
}

/*
  Populate course options for tutor course multi-select and time log course select.
*/
function renderAllCourseOptionsForTutor() {
    // Tutor application multi-select
    el.tutorCourseSelect.innerHTML = "";

    // Time log course select
    el.logCourse.innerHTML = "";

    // Add option for each course
    state.courses.forEach((c) => {
        // Multi-select option
        const opt1 = document.createElement("option");
        opt1.value = c.id;
        opt1.textContent = `${c.code} — ${c.title}`;
        el.tutorCourseSelect.appendChild(opt1);

        // Single select option for time log
        const opt2 = document.createElement("option");
        opt2.value = c.id;
        opt2.textContent = `${c.code} — ${c.title}`;
        el.logCourse.appendChild(opt2);
    });

    // If tutor has an existing application, pre-select their courses
    const user = getCurrentUser();
    if (!user) return;

    const app = state.tutorApplications.find((a) => a.tutorId === user.id);
    if (!app) return;

    // Set selected options based on app.selectedCourseIds
    setMultiSelectValues(el.tutorCourseSelect, app.selectedCourseIds);
}

/*
  Render tutor availability blocks list.
*/
function renderTutorAvailability(tutorId) {
    el.tutorAvailabilityList.innerHTML = "";

    const blocks = state.availability.filter((a) => a.tutorId === tutorId);

    if (blocks.length === 0) {
        el.tutorAvailabilityList.textContent = "No availability blocks yet. Add one above.";
        return;
    }

    blocks.forEach((b) => {
        const item = document.createElement("div");
        item.className = "list-item";

        const title = document.createElement("h4");
        title.textContent = `${b.day} ${b.start}–${b.end}`;

        // Remove button (lets tutor delete a block)
        const btn = document.createElement("button");
        btn.className = "btn btn-secondary";
        btn.type = "button";
        btn.textContent = "Remove";

        btn.addEventListener("click", () => {
            state.availability = state.availability.filter((x) => x.id !== b.id);
            saveState();
            renderApp();
        });

        item.appendChild(title);
        item.appendChild(btn);
        el.tutorAvailabilityList.appendChild(item);
    });
}

/*
  Render requests assigned to tutor with accept/decline actions.
*/
function renderTutorRequests(tutorId) {
    el.tutorRequestsList.innerHTML = "";

    const reqs = state.requests
        .filter((r) => r.tutorId === tutorId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (reqs.length === 0) {
        el.tutorRequestsList.textContent = "No assigned requests yet.";
        return;
    }

    reqs.forEach((r) => {
        const course = getCourseById(r.courseId);
        const student = state.users.find((u) => u.id === r.studentId);

        const item = document.createElement("div");
        item.className = "list-item";

        const title = document.createElement("h4");
        title.textContent = `${course?.code ?? "Course"} — Student Request`;

        const meta = document.createElement("div");
        meta.className = "meta";

        const studentLine = document.createElement("div");
        studentLine.textContent = `Student: ${student ? student.name : "Unknown"}`;

        const statusLine = document.createElement("div");
        statusLine.textContent = `Status: ${capitalize(r.status)}`;

        meta.appendChild(studentLine);
        meta.appendChild(statusLine);

        // Show note if included
        const note = document.createElement("p");
        note.className = "muted";
        note.textContent = r.note ? `Note: ${r.note}` : "Note: (none)";

        // Buttons only if pending
        const actions = document.createElement("div");
        actions.className = "actions";

        if (r.status === "pending") {
            const btnAccept = document.createElement("button");
            btnAccept.className = "btn btn-primary";
            btnAccept.type = "button";
            btnAccept.textContent = "Accept";

            btnAccept.addEventListener("click", () => {
                setRequestStatus(r.id, "accepted");
                saveState();
                renderApp();
            });

            const btnDecline = document.createElement("button");
            btnDecline.className = "btn btn-danger";
            btnDecline.type = "button";
            btnDecline.textContent = "Decline";

            btnDecline.addEventListener("click", () => {
                setRequestStatus(r.id, "declined");
                saveState();
                renderApp();
            });

            actions.appendChild(btnAccept);
            actions.appendChild(btnDecline);
        }

        item.appendChild(title);
        item.appendChild(meta);
        item.appendChild(note);
        if (actions.childNodes.length > 0) item.appendChild(actions);

        el.tutorRequestsList.appendChild(item);
    });
}

/*
  Render tutor time logs.
*/
function renderTutorTimeLogs(tutorId) {
    el.tutorTimeLogsList.innerHTML = "";

    const logs = state.timeLogs
        .filter((t) => t.tutorId === tutorId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (logs.length === 0) {
        el.tutorTimeLogsList.textContent = "No hours submitted yet.";
        return;
    }

    logs.forEach((t) => {
        const course = getCourseById(t.courseId);

        const item = document.createElement("div");
        item.className = "list-item";

        const title = document.createElement("h4");
        title.textContent = `${t.date} — ${course?.code ?? "Course"} (${t.type})`;

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${t.minutes} minutes → ${t.roundedHours.toFixed(2)} hours (rounded up)`;

        item.appendChild(title);
        item.appendChild(meta);

        el.tutorTimeLogsList.appendChild(item);
    });
}


/* --------------------------------------------------------------------------
   15) UI: ADMIN
   -------------------------------------------------------------------------- */

function renderAdminUI(adminUser) {
    // Render applications
    renderAdminApplications(adminUser.id);

    // Render all requests
    renderAdminRequests();

    // Render time logs
    renderAdminTimeLogs();
}

/*
  Render tutor applications list with Approve/Reject buttons.
*/
function renderAdminApplications(adminId) {
    el.adminApplicationsList.innerHTML = "";

    if (state.tutorApplications.length === 0) {
        el.adminApplicationsList.textContent = "No tutor applications submitted yet.";
        return;
    }

    // Sort: pending first, then approved, then rejected
    const apps = [...state.tutorApplications].sort((a, b) => {
        const order = { pending: 0, approved: 1, rejected: 2 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });

    apps.forEach((a) => {
        const tutor = state.users.find((u) => u.id === a.tutorId);
        const profile = getTutorProfile(a.tutorId);

        const item = document.createElement("div");
        item.className = "list-item";

        const title = document.createElement("h4");
        title.textContent = `${tutor ? tutor.name : "Unknown Tutor"} — ${capitalize(a.status)}`;

        const meta = document.createElement("div");
        meta.className = "meta";

        const emailLine = document.createElement("div");
        emailLine.textContent = `Email: ${tutor?.email ?? "—"}`;

        const phoneLine = document.createElement("div");
        phoneLine.textContent = `Phone: ${tutor?.phone || "—"}`;

        const gpaLine = document.createElement("div");
        gpaLine.textContent = `GPA: ${profile?.gpa ?? "—"}`;

        meta.appendChild(emailLine);
        meta.appendChild(phoneLine);
        meta.appendChild(gpaLine);

        // Courses selected
        const courseCodes = a.selectedCourseIds
            .map((id) => getCourseById(id))
            .filter(Boolean)
            .map((c) => c.code);

        const coursesP = document.createElement("p");
        coursesP.className = "muted";
        coursesP.textContent = `Selected courses: ${courseCodes.join(", ") || "(none)"}`;

        // Transcript filename (prototype)
        const transcriptP = document.createElement("p");
        transcriptP.className = "muted";
        transcriptP.textContent = `Transcript file: ${profile?.transcriptFileName || "None (prototype)"}`;

        // Approve/Reject buttons (only meaningful if pending)
        const actions = document.createElement("div");
        actions.className = "actions";

        if (a.status === "pending") {
            const btnApprove = document.createElement("button");
            btnApprove.className = "btn btn-primary";
            btnApprove.type = "button";
            btnApprove.textContent = "Approve";

            btnApprove.addEventListener("click", () => {
                approveTutorApplication(adminId, a.id);
                saveState();
                renderApp();
            });

            const btnReject = document.createElement("button");
            btnReject.className = "btn btn-danger";
            btnReject.type = "button";
            btnReject.textContent = "Reject";

            btnReject.addEventListener("click", () => {
                rejectTutorApplication(adminId, a.id);
                saveState();
                renderApp();
            });

            actions.appendChild(btnApprove);
            actions.appendChild(btnReject);
        }

        item.appendChild(title);
        item.appendChild(meta);
        item.appendChild(coursesP);
        item.appendChild(transcriptP);
        if (actions.childNodes.length > 0) item.appendChild(actions);

        el.adminApplicationsList.appendChild(item);
    });
}

/*
  Render all tutoring requests.
*/
function renderAdminRequests() {
    el.adminRequestsList.innerHTML = "";

    if (state.requests.length === 0) {
        el.adminRequestsList.textContent = "No requests yet.";
        return;
    }

    const reqs = [...state.requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    reqs.forEach((r) => {
        const course = getCourseById(r.courseId);
        const student = state.users.find((u) => u.id === r.studentId);
        const tutor = state.users.find((u) => u.id === r.tutorId);

        const item = document.createElement("div");
        item.className = "list-item";

        const title = document.createElement("h4");
        title.textContent = `${course?.code ?? "Course"} — ${capitalize(r.status)}`;

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `Student: ${student?.name ?? "—"} • Tutor: ${tutor?.name ?? "—"}`;

        item.appendChild(title);
        item.appendChild(meta);

        if (r.note) {
            const note = document.createElement("p");
            note.className = "muted";
            note.textContent = `Note: ${r.note}`;
            item.appendChild(note);
        }

        el.adminRequestsList.appendChild(item);
    });
}

/*
  Render all time logs, optionally filtered by week start date.
*/
function renderAdminTimeLogs() {
    el.adminTimeLogsList.innerHTML = "";

    // Put the current filter into the input for clarity
    if (state.adminLogFilterWeekStart) {
        el.adminWeekStart.value = state.adminLogFilterWeekStart;
    }

    // Clone logs so we can filter/sort without mutating original
    let logs = [...state.timeLogs];

    // Apply filter if set
    if (state.adminLogFilterWeekStart) {
        const start = new Date(state.adminLogFilterWeekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        logs = logs.filter((t) => {
            const d = new Date(t.date);
            return d >= start && d < end;
        });
    }

    // Sort newest first
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (logs.length === 0) {
        el.adminTimeLogsList.textContent = "No logs found for this filter.";
        return;
    }

    logs.forEach((t) => {
        const tutor = state.users.find((u) => u.id === t.tutorId);
        const course = getCourseById(t.courseId);

        const item = document.createElement("div");
        item.className = "list-item";

        const title = document.createElement("h4");
        title.textContent = `${t.date} — ${tutor?.name ?? "Tutor"} — ${course?.code ?? "Course"}`;

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${t.type} • ${t.minutes} minutes → ${t.roundedHours.toFixed(2)} hours`;

        item.appendChild(title);
        item.appendChild(meta);

        el.adminTimeLogsList.appendChild(item);
    });
}


/* --------------------------------------------------------------------------
   16) SMALL HELPERS (utilities you reuse everywhere)
   -------------------------------------------------------------------------- */

/*
  Create a simple unique ID string.
  - This is not cryptographically secure, but fine for prototypes.
*/
function makeId() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/*
  Capitalize first letter:
  "student" -> "Student"
*/
function capitalize(str) {
    if (!str) return "";
    return str[0].toUpperCase() + str.slice(1);
}

/*
  Get selected values from a multi-select <select multiple>.
*/
function getSelectedOptions(selectEl) {
    return Array.from(selectEl.selectedOptions).map((opt) => opt.value);
}

/*
  Set selected values in a multi-select.
*/
function setMultiSelectValues(selectEl, values) {
    const set = new Set(values);
    Array.from(selectEl.options).forEach((opt) => {
        opt.selected = set.has(opt.value);
    });
}

/*
  Convert a File object into a base64 Data URL.
  This is how we can store small images in localStorage.

  How it works:
  - FileReader reads file bytes
  - When done, it produces a data URL string
*/
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); // built-in browser tool for reading files

        reader.onload = () => resolve(reader.result); // reader.result is the data URL
        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(file); // start reading file
    });
}
ß