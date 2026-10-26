/* ============================================================
   storage.js - localStorage data layer and seed data.
   Every page reads/writes through these functions.
   ============================================================ */

const STORAGE_KEY = 'studentGradeTracker.students';

// Ten sample students, used on first load and by "Reset to Sample Data".
function seedStudents() {
  return [
    {
      id: 's1',
      name: 'Aarav Sharma',
      rollNo: 'STU001',
      semester: 'Semester 1',
      marks: { subject1: 92, subject2: 88, subject3: 95, subject4: 90, subject5: 94 },
      createdAt: '2026-09-01T09:00:00.000Z'
    },
    {
      id: 's2',
      name: 'Priya Patel',
      rollNo: 'STU002',
      semester: 'Semester 1',
      marks: { subject1: 78, subject2: 72, subject3: 68, subject4: 65, subject5: 70 },
      createdAt: '2026-09-01T09:05:00.000Z'
    },
    {
      id: 's3',
      name: 'Rohan Mehta',
      rollNo: 'STU003',
      semester: 'Semester 2',
      marks: { subject1: 65, subject2: 70, subject3: 68, subject4: 72, subject5: 74 },
      createdAt: '2026-09-02T10:00:00.000Z'
    },
    {
      id: 's4',
      name: 'Sneha Iyer',
      rollNo: 'STU004',
      semester: 'Semester 2',
      marks: { subject1: 45, subject2: 38, subject3: 40, subject4: 33, subject5: 42 },
      createdAt: '2026-09-02T10:10:00.000Z'
    },
    {
      id: 's5',
      name: 'Karan Joshi',
      rollNo: 'STU005',
      semester: 'Semester 3',
      marks: { subject1: 55, subject2: 60, subject3: 58, subject4: 62, subject5: 61 },
      createdAt: '2026-09-03T11:00:00.000Z'
    },
    {
      id: 's6',
      name: 'Ananya Gupta',
      rollNo: 'STU006',
      semester: 'Semester 3',
      marks: { subject1: 88, subject2: 85, subject3: 92, subject4: 87, subject5: 90 },
      createdAt: '2026-09-03T11:05:00.000Z'
    },
    {
      id: 's7',
      name: 'Vikram Singh',
      rollNo: 'STU007',
      semester: 'Semester 4',
      marks: { subject1: 30, subject2: 35, subject3: 28, subject4: 40, subject5: 33 },
      createdAt: '2026-09-04T12:00:00.000Z'
    },
    {
      id: 's8',
      name: 'Ishita Bose',
      rollNo: 'STU008',
      semester: 'Semester 4',
      marks: { subject1: 72, subject2: 78, subject3: 75, subject4: 70, subject5: 73 },
      createdAt: '2026-09-04T12:10:00.000Z'
    },
    {
      id: 's9',
      name: 'Arjun Reddy',
      rollNo: 'STU009',
      semester: 'Semester 5',
      marks: { subject1: 90, subject2: 91, subject3: 89, subject4: 93, subject5: 88 },
      createdAt: '2026-09-05T13:00:00.000Z'
    },
    {
      id: 's10',
      name: 'Meera Khan',
      rollNo: 'STU010',
      semester: 'Semester 5',
      marks: { subject1: 50, subject2: 55, subject3: 48, subject4: 52, subject5: 57 },
      createdAt: '2026-09-05T13:05:00.000Z'
    }
  ];
}

// Reads students from localStorage. If nothing is stored yet, the
// sample data is saved and returned. Corrupted JSON is caught and
// replaced with fresh sample data so the app never crashes.
function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      const seeded = seedStudents();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Stored data is not an array');
    }
    return parsed;
  } catch (error) {
    console.warn('Could not read localStorage data. Loading sample data instead.', error);
    const seeded = seedStudents();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    } catch (ignored) {
      // Even writing can fail (e.g. storage disabled). The in-memory data still works.
    }
    return seeded;
  }
}

function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function resetToSampleData() {
  const seeded = seedStudents();
  saveStudents(seeded);
  return seeded;
}
