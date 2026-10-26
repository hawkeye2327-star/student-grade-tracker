/* ============================================================
   dashboard.js - Dashboard page rendering
   Summary cards, charts, top performers and at-risk students.
   ============================================================ */

let gradeChartInstance = null;
let subjectChartInstance = null;

function renderSummaryCards(students) {
  const total = students.length;

  const average = total
    ? students.reduce(function (sum, student) {
        return sum + calculatePercentage(student);
      }, 0) / total
    : 0;

  let highestStudent = null;
  students.forEach(function (student) {
    if (!highestStudent || calculatePercentage(student) > calculatePercentage(highestStudent)) {
      highestStudent = student;
    }
  });

  const passCount = students.filter(function (student) {
    return isPassingStudent(student, calculatePercentage(student));
  }).length;
  const passPercentage = total ? (passCount / total) * 100 : 0;

  document.getElementById('statTotalValue').textContent = total;
  document.getElementById('statAverageValue').textContent = formatPercentage(average);
  document.getElementById('statHighestValue').textContent = formatPercentage(
    highestStudent ? calculatePercentage(highestStudent) : 0
  );
  document.getElementById('statHighestName').textContent = highestStudent ? highestStudent.name : '\u2013';
  document.getElementById('statPassValue').textContent = formatPercentage(passPercentage);
}

function renderGradeChart(students) {
  const canvas = document.getElementById('gradeChart');
  if (!canvas || typeof Chart === 'undefined') return;

  // Chart.js throws if a canvas is reused, so destroy the old instance first.
  if (gradeChartInstance) gradeChartInstance.destroy();

  const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  students.forEach(function (student) {
    counts[getGrade(calculatePercentage(student))] += 1;
  });

  gradeChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: GRADE_LETTERS,
      datasets: [
        {
          label: 'Students',
          data: GRADE_LETTERS.map(function (letter) { return counts[letter]; }),
          backgroundColor: GRADE_LETTERS.map(function (letter) {
            return GRADE_CONFIG[letter].color;
          }),
          borderColor: '#ffffff',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderSubjectChart(students) {
  const canvas = document.getElementById('subjectChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (subjectChartInstance) subjectChartInstance.destroy();

  const averages = SUBJECTS.map(function (subject, index) {
    if (students.length === 0) return 0;
    const key = getSubjectKey(index);
    const sum = students.reduce(function (total, student) {
      return total + (Number(student.marks && student.marks[key]) || 0);
    }, 0);
    return Math.round((sum / students.length) * 100) / 100;
  });

  subjectChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: SUBJECTS.map(function (subject) { return subject.name; }),
      datasets: [
        {
          label: 'Average marks',
          data: averages,
          backgroundColor: '#4f46e5',
          borderRadius: 6,
          maxBarThickness: 48
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

function renderTopPerformers(students) {
  const list = document.getElementById('topPerformers');
  const empty = document.getElementById('topPerformersEmpty');

  const top = students
    .slice()
    .sort(function (a, b) {
      return calculatePercentage(b) - calculatePercentage(a);
    })
    .slice(0, 5);

  if (top.length === 0) {
    list.innerHTML = '';
    list.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  list.classList.remove('hidden');
  empty.classList.add('hidden');

  list.innerHTML = top.map(function (student, index) {
    const percentage = calculatePercentage(student);
    return (
      '<li>' +
        '<div>' +
          '<span class="rank">#' + (index + 1) + '</span>' +
          '<span class="name">' + escapeHtml(student.name) + '</span>' +
          '<span class="meta">' + escapeHtml(student.rollNo) + ' \u00B7 ' + escapeHtml(student.semester) + '</span>' +
        '</div>' +
        '<div class="list-right">' +
          '<strong>' + formatPercentage(percentage) + '</strong>' +
          getGradeBadge(getGrade(percentage)) +
        '</div>' +
      '</li>'
    );
  }).join('');
}

function renderNeedsAttention(students) {
  const list = document.getElementById('needsAttention');
  const empty = document.getElementById('needsAttentionEmpty');

  const needing = students
    .filter(function (student) {
      return calculatePercentage(student) < PASS_PERCENTAGE;
    })
    .sort(function (a, b) {
      return calculatePercentage(a) - calculatePercentage(b);
    });

  if (needing.length === 0) {
    list.innerHTML = '';
    list.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  list.classList.remove('hidden');
  empty.classList.add('hidden');

  list.innerHTML = needing.map(function (student) {
    const percentage = calculatePercentage(student);

    let failedSubjects = 0;
    SUBJECTS.forEach(function (subject, index) {
      const value = Number(student.marks && student.marks[getSubjectKey(index)]) || 0;
      if (value < PASS_SUBJECT_MARK) failedSubjects += 1;
    });

    const note = failedSubjects > 0
      ? failedSubjects + ' subject(s) below ' + PASS_SUBJECT_MARK
      : 'Overall below ' + PASS_PERCENTAGE + '%';

    return (
      '<li>' +
        '<div>' +
          '<span class="name">' + escapeHtml(student.name) + '</span>' +
          '<span class="meta">' + escapeHtml(student.rollNo) + ' \u00B7 ' + note + '</span>' +
        '</div>' +
        '<div class="list-right">' +
          '<strong>' + formatPercentage(percentage) + '</strong>' +
          getGradeBadge(getGrade(percentage)) +
        '</div>' +
      '</li>'
    );
  }).join('');
}

document.addEventListener('DOMContentLoaded', function () {
  const students = loadStudents();
  renderSummaryCards(students);
  renderGradeChart(students);
  renderSubjectChart(students);
  renderTopPerformers(students);
  renderNeedsAttention(students);
});
