/* ============================================================
   reports.js - Reports page logic
   Individual report card, ranking, CSV export, print and reset.
   ============================================================ */

let reportChartInstance = null;

function clearReportCard() {
  document.getElementById('reportStudentName').textContent = '\u2013';
  document.getElementById('reportStudentMeta').textContent = '\u2013';
  document.getElementById('reportGradeBadge').innerHTML =
    '<span class="badge" style="background:#94a3b8">\u2013</span>';
  document.getElementById('reportRemarks').textContent = '\u2013';
  document.getElementById('reportTotal').textContent = '0';
  document.getElementById('reportPercentage').textContent = '0%';

  for (let i = 1; i <= SUBJECTS.length; i++) {
    document.getElementById('reportSubject' + i).textContent = '0';
  }

  if (reportChartInstance) {
    reportChartInstance.destroy();
    reportChartInstance = null;
  }
}

function renderReportChart(student) {
  const canvas = document.getElementById('reportChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (reportChartInstance) reportChartInstance.destroy();

  const marks = SUBJECTS.map(function (subject, index) {
    return Number(student.marks && student.marks[getSubjectKey(index)]) || 0;
  });

  reportChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: SUBJECTS.map(function (subject) { return subject.name; }),
      datasets: [
        {
          label: 'Marks',
          data: marks,
          backgroundColor: '#4f46e5',
          borderRadius: 6,
          maxBarThickness: 46
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

function renderStudentReport(id) {
  const student = loadStudents().find(function (item) {
    return item.id === id;
  });

  if (!student) {
    clearReportCard();
    return;
  }

  const percentage = calculatePercentage(student);
  const grade = getGrade(percentage);
  const gradeConfig = GRADE_CONFIG[grade];

  document.getElementById('reportStudentName').textContent = student.name;
  document.getElementById('reportStudentMeta').textContent =
    student.rollNo + ' \u00B7 ' + student.semester;
  document.getElementById('reportGradeBadge').innerHTML =
    '<span class="badge" style="background:' + gradeConfig.color + '">' + gradeConfig.label + '</span>';
  document.getElementById('reportRemarks').textContent = generateRemarks(percentage);
  document.getElementById('reportTotal').textContent = calculateTotal(student.marks);
  document.getElementById('reportPercentage').textContent = formatPercentage(percentage);

  SUBJECTS.forEach(function (subject, index) {
    const value = Number(student.marks && student.marks[getSubjectKey(index)]) || 0;
    document.getElementById('reportSubject' + (index + 1)).textContent = value;
  });

  renderReportChart(student);
}

function populateStudentSelect(students) {
  const select = document.getElementById('studentSelect');
  let options = '<option value="">-- Select a student --</option>';

  students.forEach(function (student) {
    options +=
      '<option value="' + escapeHtml(student.id) + '">' +
        escapeHtml(student.name) + ' (' + escapeHtml(student.rollNo) + ')' +
      '</option>';
  });

  select.innerHTML = options;

  if (students.length > 0) {
    select.value = students[0].id;
    renderStudentReport(students[0].id);
  } else {
    clearReportCard();
    select.value = '';
  }
}

function renderRankingTable(students) {
  const tbody = document.getElementById('rankingBody');

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No students available. Add students to see the ranking.</td></tr>';
    return;
  }

  const ranked = getRankedStudents(students);

  tbody.innerHTML = ranked.map(function (entry) {
    const grade = getGrade(entry.percentage);
    const passed = isPassingStudent(entry.student, entry.percentage);

    return (
      '<tr>' +
        '<td>' + entry.rank + '</td>' +
        '<td>' + escapeHtml(entry.student.name) + '</td>' +
        '<td>' + escapeHtml(entry.student.rollNo) + '</td>' +
        '<td>' + escapeHtml(entry.student.semester) + '</td>' +
        '<td>' + formatPercentage(entry.percentage) + '</td>' +
        '<td>' + getGradeBadge(grade) + '</td>' +
        '<td>' + (passed
          ? '<span class="status-pass">Pass</span>'
          : '<span class="status-fail">Fail</span>') + '</td>' +
      '</tr>'
    );
  }).join('');
}

function renderReports() {
  const students = loadStudents();
  populateStudentSelect(students);
  renderRankingTable(students);
}

/* ---------- CSV export ---------- */

function escapeCsvField(value) {
  const text = String(value == null ? '' : value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function exportCsv() {
  const students = loadStudents();

  if (students.length === 0) {
    showToast('No data to export.', 'error');
    return;
  }

  const header = ['Name', 'Roll No', 'Semester']
    .concat(SUBJECTS.map(function (subject) { return subject.name; }))
    .concat(['Total', 'Percentage', 'Grade', 'Status']);

  const rows = students.map(function (student) {
    const percentage = calculatePercentage(student);
    const subjectMarks = SUBJECTS.map(function (subject, index) {
      return Number(student.marks && student.marks[getSubjectKey(index)]) || 0;
    });

    return [student.name, student.rollNo, student.semester]
      .concat(subjectMarks)
      .concat([
        calculateTotal(student.marks),
        percentage.toFixed(2),
        getGrade(percentage),
        isPassingStudent(student, percentage) ? 'Pass' : 'Fail'
      ]);
  });

  const csv = [header].concat(rows).map(function (row) {
    return row.map(escapeCsvField).join(',');
  }).join('\r\n');

  // The BOM makes Excel open the file with the correct encoding.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'student-grades.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 0);

  showToast('CSV exported successfully.', 'success');
}

/* ---------- Print / reset ---------- */

function printReportCard() {
  const selectedId = document.getElementById('studentSelect').value;
  if (!selectedId) {
    showToast('Please select a student first.', 'error');
    return;
  }
  // The print stylesheet hides everything except #reportCard.
  window.print();
}

function resetData() {
  const confirmed = window.confirm(
    'This will replace all current students with the original sample data. Continue?'
  );
  if (!confirmed) return;

  resetToSampleData();
  renderReports();
  showToast('Sample data restored successfully.', 'success');
}

/* ---------- Event wiring ---------- */

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('studentSelect').addEventListener('change', function () {
    renderStudentReport(this.value);
  });

  document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
  document.getElementById('printReportBtn').addEventListener('click', printReportCard);
  document.getElementById('resetDataBtn').addEventListener('click', resetData);

  renderReports();
});
