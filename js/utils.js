/* ============================================================
   utils.js - Shared constants, calculations and UI helpers.
   Load this file before any page-specific script.
   ============================================================ */

// Single source of truth for the 5 subjects. The marks object uses
// subject1..subject5 keys, while these friendly names are used in the UI.
const SUBJECTS = [
  { key: 'subject1', name: 'Mathematics' },
  { key: 'subject2', name: 'Physics' },
  { key: 'subject3', name: 'Chemistry' },
  { key: 'subject4', name: 'Biology' },
  { key: 'subject5', name: 'Computer Science' }
];

const MAX_MARKS_PER_SUBJECT = 100;
const PASS_PERCENTAGE = 40;     // overall pass percentage
const PASS_SUBJECT_MARK = 35;   // minimum passing mark in every subject

// Grade thresholds live in ONE object so the grading scale can be
// changed in a single place (e.g. raising A from 80 to 85).
const GRADE_CONFIG = {
  A: { min: 80, label: 'A', color: '#16a34a', description: 'Excellent' },
  B: { min: 70, label: 'B', color: '#2563eb', description: 'Good' },
  C: { min: 60, label: 'C', color: '#d97706', description: 'Satisfactory' },
  D: { min: 40, label: 'D', color: '#ea580c', description: 'Needs Improvement' },
  F: { min: 0, label: 'F', color: '#dc2626', description: 'Fail' }
};

const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'F'];

function getSubjectKey(index) {
  return 'subject' + (index + 1);
}

function getSubjectName(index) {
  const subject = SUBJECTS[index];
  return subject ? subject.name : 'Subject ' + (index + 1);
}

// Total is the sum of the five subject marks. Missing or invalid
// values count as 0 so corrupted data cannot produce NaN.
function calculateTotal(marks) {
  let total = 0;
  for (let i = 0; i < SUBJECTS.length; i++) {
    const key = getSubjectKey(i);
    total += Number(marks && marks[key]) || 0;
  }
  return total;
}

function calculatePercentage(student) {
  const maxTotal = SUBJECTS.length * MAX_MARKS_PER_SUBJECT;
  const total = calculateTotal(student.marks);
  return maxTotal > 0 ? (total / maxTotal) * 100 : 0;
}

function getGrade(percentage) {
  for (let i = 0; i < GRADE_LETTERS.length; i++) {
    if (percentage >= GRADE_CONFIG[GRADE_LETTERS[i]].min) {
      return GRADE_LETTERS[i];
    }
  }
  return 'F';
}

// A student passes only when EVERY subject is at least 35 and the
// overall percentage is at least 40.
function isPassingStudent(student, percentage) {
  let allSubjectsOk = true;
  for (let i = 0; i < SUBJECTS.length; i++) {
    const key = getSubjectKey(i);
    const value = Number(student.marks && student.marks[key]) || 0;
    if (value < PASS_SUBJECT_MARK) {
      allSubjectsOk = false;
    }
  }
  return allSubjectsOk && percentage >= PASS_PERCENTAGE;
}

// Competition ranking: equal percentages share a rank and the next
// rank skips the tied positions (1, 1, 3 ...).
function getRankedStudents(students) {
  const list = students.map(function (student) {
    return { student: student, percentage: calculatePercentage(student), rank: 0 };
  });

  list.sort(function (a, b) {
    return b.percentage - a.percentage;
  });

  let currentRank = 0;
  let lastPercentage = null;

  for (let i = 0; i < list.length; i++) {
    if (i === 0 || list[i].percentage !== lastPercentage) {
      currentRank = i + 1;
    }
    list[i].rank = currentRank;
    lastPercentage = list[i].percentage;
  }

  return list;
}

function generateRemarks(percentage) {
  if (percentage >= 80) return 'Outstanding performance. Keep it up!';
  if (percentage >= 70) return 'Good performance. Focus a little more on weaker subjects.';
  if (percentage >= 60) return 'Satisfactory performance. Regular revision is recommended.';
  if (percentage >= PASS_PERCENTAGE) return 'Below expected performance. Consult your teacher for guidance.';
  return 'Fail. Please seek immediate academic support.';
}

// Escapes user-supplied text before it is inserted with innerHTML,
// which prevents stored XSS attacks.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPercentage(value) {
  return (Number(value) || 0).toFixed(2) + '%';
}

function getGradeBadge(grade) {
  const config = GRADE_CONFIG[grade] || GRADE_CONFIG.F;
  return '<span class="badge" style="background:' + config.color + '">' + config.label + '</span>';
}

function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'error' ? ' error' : '');
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(function () {
    toast.remove();
  }, 3000);
}

function showError(input, errorElement, message) {
  input.classList.add('invalid');
  input.setAttribute('aria-invalid', 'true');
  if (errorElement) errorElement.textContent = message;
}

function clearError(input, errorElement) {
  input.classList.remove('invalid');
  input.removeAttribute('aria-invalid');
  if (errorElement) errorElement.textContent = '';
}
