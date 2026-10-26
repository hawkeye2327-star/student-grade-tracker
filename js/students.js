/* ============================================================
   students.js - Manage Students & Grades page
   Add/edit/delete, validation, search, filter and sorting.
   ============================================================ */

let editingStudentId = null;

/* ---------- Rendering ---------- */

function getFilteredAndSortedStudents(students) {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const gradeFilter = document.getElementById('gradeFilter').value;
  const sortBy = document.getElementById('sortBy').value;
  const sortDirection = document.getElementById('sortDir').value === 'asc' ? 1 : -1;

  const filtered = students.filter(function (student) {
    const name = String(student.name || '').toLowerCase();
    const rollNo = String(student.rollNo || '').toLowerCase();
    const matchesQuery = !query || name.includes(query) || rollNo.includes(query);
    const matchesGrade = gradeFilter === 'all' || getGrade(calculatePercentage(student)) === gradeFilter;
    return matchesQuery && matchesGrade;
  });

  return filtered.sort(function (a, b) {
    let result = 0;
    if (sortBy === 'name') {
      result = String(a.name || '').localeCompare(String(b.name || ''));
    } else if (sortBy === 'rollNo') {
      result = String(a.rollNo || '').localeCompare(String(b.rollNo || ''));
    } else {
      result = calculatePercentage(a) - calculatePercentage(b);
    }
    return result * sortDirection;
  });
}

function renderStudentsTable() {
  const students = loadStudents();
  const visibleStudents = getFilteredAndSortedStudents(students);
  const tbody = document.getElementById('studentsTableBody');
  const table = document.getElementById('studentsTable');
  const empty = document.getElementById('studentsEmpty');

  if (visibleStudents.length === 0) {
    tbody.innerHTML = '';
    table.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  table.classList.remove('hidden');
  empty.classList.add('hidden');

  tbody.innerHTML = visibleStudents.map(function (student, index) {
    const percentage = calculatePercentage(student);
    const grade = getGrade(percentage);
    const passed = isPassingStudent(student, percentage);

    const subjectCells = SUBJECTS.map(function (subject, subjectIndex) {
      const value = Number(student.marks && student.marks[getSubjectKey(subjectIndex)]) || 0;
      return '<td>' + escapeHtml(value) + '</td>';
    }).join('');

    return (
      '<tr>' +
        '<td>' + (index + 1) + '</td>' +
        '<td>' + escapeHtml(student.name) + '</td>' +
        '<td>' + escapeHtml(student.rollNo) + '</td>' +
        '<td>' + escapeHtml(student.semester) + '</td>' +
        subjectCells +
        '<td>' + calculateTotal(student.marks) + '</td>' +
        '<td>' + formatPercentage(percentage) + '</td>' +
        '<td>' + getGradeBadge(grade) + '</td>' +
        '<td>' + (passed
          ? '<span class="status-pass">Pass</span>'
          : '<span class="status-fail">Fail</span>') + '</td>' +
        '<td class="actions-cell">' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="edit" data-id="' + escapeHtml(student.id) + '">Edit</button> ' +
          '<button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="' + escapeHtml(student.id) + '">Delete</button>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}

/* ---------- Form validation ---------- */

function validateForm() {
  let isValid = true;

  const nameInput = document.getElementById('name');
  const name = nameInput.value.trim();
  if (name === '') {
    showError(nameInput, document.getElementById('nameError'), 'Name is required.');
    isValid = false;
  } else {
    clearError(nameInput, document.getElementById('nameError'));
  }

  const rollInput = document.getElementById('rollNo');
  const rollNo = rollInput.value.trim();
  if (rollNo === '') {
    showError(rollInput, document.getElementById('rollNoError'), 'Roll number is required.');
    isValid = false;
  } else {
    clearError(rollInput, document.getElementById('rollNoError'));
  }

  const semesterInput = document.getElementById('semester');
  const semester = semesterInput.value;
  if (semester === '') {
    showError(semesterInput, document.getElementById('semesterError'), 'Please select a semester.');
    isValid = false;
  } else {
    clearError(semesterInput, document.getElementById('semesterError'));
  }

  const marks = {};
  let marksAreValid = true;

  for (let i = 0; i < SUBJECTS.length; i++) {
    const key = getSubjectKey(i);
    const input = document.getElementById(key);
    const errorElement = document.getElementById(key + 'Error');
    const rawValue = input.value.trim();
    const value = Number(rawValue);

    if (rawValue === '') {
      showError(input, errorElement, getSubjectName(i) + ' marks are required.');
      marksAreValid = false;
    } else if (Number.isNaN(value) || value < 0 || value > 100) {
      showError(input, errorElement, 'Marks must be between 0 and 100.');
      marksAreValid = false;
    } else {
      clearError(input, errorElement);
      // Round to 2 decimals so long floating point values stay readable.
      marks[key] = Math.round(value * 100) / 100;
    }
  }

  if (!marksAreValid) isValid = false;

  return isValid ? { name: name, rollNo: rollNo, semester: semester, marks: marks } : null;
}

/* ---------- Create / update ---------- */

function handleFormSubmit(event) {
  event.preventDefault();

  const data = validateForm();
  if (!data) return;

  const students = loadStudents();

  const duplicate = students.some(function (student) {
    return (
      String(student.rollNo || '').toLowerCase() === data.rollNo.toLowerCase() &&
      student.id !== editingStudentId
    );
  });

  if (duplicate) {
    showError(
      document.getElementById('rollNo'),
      document.getElementById('rollNoError'),
      'This roll number already exists. Please use a unique one.'
    );
    return;
  }

  if (editingStudentId) {
    const index = students.findIndex(function (student) {
      return student.id === editingStudentId;
    });

    if (index === -1) {
      showToast('Student no longer exists. Please try again.', 'error');
      resetForm();
      renderStudentsTable();
      return;
    }

    students[index] = {
      id: students[index].id,
      name: data.name,
      rollNo: data.rollNo,
      semester: data.semester,
      marks: data.marks,
      createdAt: students[index].createdAt
    };

    saveStudents(students);
    showToast('Student updated successfully.', 'success');
  } else {
    students.push({
      id: 'stu_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      name: data.name,
      rollNo: data.rollNo,
      semester: data.semester,
      marks: data.marks,
      createdAt: new Date().toISOString()
    });

    saveStudents(students);
    showToast('Student added successfully.', 'success');
  }

  resetForm();
  renderStudentsTable();
}

function resetForm() {
  document.getElementById('studentForm').reset();
  editingStudentId = null;

  document.getElementById('formTitle').textContent = 'Add New Student';
  document.getElementById('submitBtn').textContent = 'Add Student';

  const fieldIds = ['name', 'rollNo', 'semester'];
  SUBJECTS.forEach(function (subject, index) {
    fieldIds.push(getSubjectKey(index));
  });

  fieldIds.forEach(function (id) {
    const input = document.getElementById(id);
    const errorElement = document.getElementById(id + 'Error');
    if (input) {
      input.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
    }
    if (errorElement) errorElement.textContent = '';
  });
}

/* ---------- Edit ---------- */

function startEditingStudent(id) {
  const student = loadStudents().find(function (item) {
    return item.id === id;
  });

  if (!student) {
    showToast('Student not found.', 'error');
    return;
  }

  editingStudentId = id;
  document.getElementById('name').value = student.name;
  document.getElementById('rollNo').value = student.rollNo;
  document.getElementById('semester').value = student.semester;

  SUBJECTS.forEach(function (subject, index) {
    const key = getSubjectKey(index);
    document.getElementById(key).value = Number(student.marks && student.marks[key]) || 0;
  });

  document.getElementById('formTitle').textContent = 'Edit Student';
  document.getElementById('submitBtn').textContent = 'Update Student';
  document.getElementById('studentForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Delete ---------- */

function openDeleteModal(id) {
  const student = loadStudents().find(function (item) {
    return item.id === id;
  });

  if (!student) return;

  document.getElementById('deleteStudentName').textContent = student.name;
  document.getElementById('confirmDeleteBtn').setAttribute('data-id', id);
  document.getElementById('deleteModal').classList.add('visible');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('visible');
  document.getElementById('confirmDeleteBtn').removeAttribute('data-id');
}

function confirmDelete() {
  const id = document.getElementById('confirmDeleteBtn').getAttribute('data-id');
  if (!id) return;

  const students = loadStudents().filter(function (student) {
    return student.id !== id;
  });

  saveStudents(students);

  if (editingStudentId === id) {
    resetForm();
  }

  closeDeleteModal();
  renderStudentsTable();
  showToast('Student deleted successfully.', 'success');
}

/* ---------- Event wiring ---------- */

function handleTableClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = button.getAttribute('data-id');
  const action = button.getAttribute('data-action');

  if (action === 'edit') startEditingStudent(id);
  if (action === 'delete') openDeleteModal(id);
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('studentForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('resetFormBtn').addEventListener('click', resetForm);

  document.getElementById('searchInput').addEventListener('input', renderStudentsTable);
  document.getElementById('gradeFilter').addEventListener('change', renderStudentsTable);
  document.getElementById('sortBy').addEventListener('change', renderStudentsTable);
  document.getElementById('sortDir').addEventListener('change', renderStudentsTable);

  document.getElementById('studentsTableBody').addEventListener('click', handleTableClick);

  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
  document.getElementById('deleteModal').addEventListener('click', function (event) {
    if (event.target === this) closeDeleteModal();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDeleteModal();
  });

  // Clear a field's error as soon as the user starts fixing it.
  ['name', 'rollNo', 'semester'].forEach(function (id) {
    const input = document.getElementById(id);
    input.addEventListener('input', function () {
      clearError(input, document.getElementById(id + 'Error'));
    });
  });

  SUBJECTS.forEach(function (subject, index) {
    const key = getSubjectKey(index);
    const input = document.getElementById(key);
    input.addEventListener('input', function () {
      clearError(input, document.getElementById(key + 'Error'));
    });
  });

  renderStudentsTable();
});
