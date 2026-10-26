# Student Grade Tracker

A beginner-friendly, front-end-only student grade tracker built with plain HTML5, CSS3 and vanilla JavaScript (ES6+). All data is saved in the browser's `localStorage`, so there is no backend, database, or build step. Charts are rendered with Chart.js loaded from a CDN.

## Features

- **Dashboard** with summary cards (total students, class average, highest score, pass percentage), a grade-distribution chart, a subject-wise average chart, top 5 performers, and students below 40%.
- **Manage Students** with add, edit, and delete (confirmation modal), live search by name/roll number, grade filter, sorting by name/percentage/roll number, and inline validation.
- **Reports** including an individual report card with chart and auto remarks, a class ranking table with correct tie handling, CSV export, print-friendly report card, and reset to sample data.
- **Responsive UI** using CSS Grid, Flexbox and CSS variables, with accessible labels, focus states, and toast notifications.
- **Robust data layer** that seeds 10 sample students on first load and recovers from corrupted `localStorage`.

## How to run

1. Download or clone this folder.
2. Double-click `index.html` (or open it in any modern browser such as Chrome, Edge, or Firefox).

No installation, server, or build tools are required. An internet connection is needed for the Chart.js CDN; the rest of the app works offline (fonts use a system font stack).

## Folder structure

```
student-grade-tracker/
├── index.html          Dashboard page
├── students.html       Manage Students & Grades page
├── reports.html        Reports page
├── css/
│   └── style.css       All styles + responsive + print styles
├── js/
│   ├── utils.js        Constants, calculations, HTML escaping, toasts
│   ├── storage.js      localStorage data layer + seed data
│   ├── dashboard.js    Dashboard rendering and charts
│   ├── students.js     CRUD, validation, search/filter/sort
│   └── reports.js      Report card, ranking, CSV, print, reset
└── README.md
```

## localStorage structure

**Key:** `studentGradeTracker.students`

**Value:** a JSON array of student objects.

```json
[
  {
    "id": "s1",
    "name": "Aarav Sharma",
    "rollNo": "STU001",
    "semester": "Semester 1",
    "marks": {
      "subject1": 92,
      "subject2": 88,
      "subject3": 95,
      "subject4": 90,
      "subject5": 94
    },
    "createdAt": "2026-09-01T09:00:00.000Z"
  }
]
```

Notes:

- The array is seeded automatically with 10 students the first time the app runs.
- If the stored value is not valid JSON or not an array, the app logs a warning and replaces it with fresh sample data.
- Marks are stored per subject; `subject1` to `subject5` map to Mathematics, Physics, Chemistry, Biology, and Computer Science.
- Deleting all students leaves an empty array, which is a supported state (empty tables and charts).

## Business rules

| Rule | Formula |
| --- | --- |
| Percentage | `total marks / (5 × 100) × 100` |
| Grade A | percentage ≥ 80 |
| Grade B | percentage ≥ 70 |
| Grade C | percentage ≥ 60 |
| Grade D | percentage ≥ 40 |
| Grade F | percentage < 40 |
| Pass | every subject ≥ 35 **and** overall percentage ≥ 40 |
| Ranking | sorted by percentage (descending); equal percentages share a rank, and the next rank skips (1, 1, 3...) |

All grade thresholds live in the `GRADE_CONFIG` object in `js/utils.js`. Change the `min` values there to update the grading scale everywhere.
