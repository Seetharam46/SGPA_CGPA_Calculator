const SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

const GRADES = [
  { label: 'A+', value: 10 },
  { label: 'A',  value: 9  },
  { label: 'B',  value: 8  },
  { label: 'C',  value: 7  },
  { label: 'D',  value: 6  },
  { label: 'E',  value: 5  },
  { label: 'F',  value: 0  }
];

const CREDIT_OPTIONS = [1, 1.5, 2, 3, 4, 8];

let state = {
  users: [],
  user:  null,
  data:  {}
};

let currentOpenSemIdx = null;

// ================= USER MODALS =================

function showAddUserModal() {
  const modal = document.getElementById('userModal');
  const title = document.getElementById('userModalTitle');
  const input = document.getElementById('userModalInput');
  const error = document.getElementById('userModalError');

  title.textContent = 'Add New User';
  input.value       = '';
  error.textContent = '';

  modal.classList.remove('hidden');
  modal.querySelector('.modal').classList.add('modal-user-anim');
  setTimeout(() => input.focus(), 20);

  function closeModal() {
    modal.classList.add('hidden');
    modal.querySelector('.modal').classList.remove('modal-user-anim');
  }

  document.getElementById('closeUserModal').onclick =
  document.getElementById('userModalCancel').onclick =
    (e) => { e.preventDefault(); closeModal(); };

  document.getElementById('userModalForm').onsubmit = function (e) {
    e.preventDefault();
    let val = input.value.trim();

    if (!val) {
      error.textContent = 'Please enter a username.';
      input.focus();
      return;
    }
    if (val.length > 18) {
      error.textContent = 'Username must be at most 18 characters.';
      input.focus();
      return;
    }
    if (state.users.includes(val)) {
      error.textContent = 'Username already exists.';
      input.focus();
      return;
    }

    state.users.push(val);
    state.data[val] = {};
    state.user       = val;

    saveState();
    closeModal();
    renderUserDropdown();
    renderSemesters();
    renderCgpa();
    showToast('User Added!');
  };
}

function showDeleteUserModal() {
  const modal = document.getElementById('confirmModal');
  const txt   = document.getElementById('deleteConfirmText');

  txt.textContent = `Delete user "${state.user}"? This cannot be undone.`;
  modal.classList.remove('hidden');

  document.getElementById('confirmYes').onclick = function () {
    deleteUser(true);
    modal.classList.add('hidden');
  };

  document.getElementById('confirmCancel').onclick = function () {
    modal.classList.add('hidden');
  };
}


// ================= FIRST USER =================

function promptForFirstUser() {
  const modal = document.getElementById('userEntryModal');
  const form  = modal.querySelector('form');
  const input = document.getElementById('entryUsername');
  const err   = document.getElementById('entryError');

  function open() {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    input.value   = '';
    err.textContent = '';
    setTimeout(() => input.focus(), 30);
  }

  function close() {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  form.onsubmit = e => {
    e.preventDefault();
    let val = input.value.trim();

    if (!val) { err.textContent = 'Please enter a username.'; return; }
    if (val.length > 18) { err.textContent = 'Max 18 chars.'; return; }
    if (state.users.includes(val)) { err.textContent = 'User already exists.'; return; }

    state.users.push(val);
    state.data[val] = {};
    state.user       = val;

    saveState();
    close();
    renderUserDropdown();
    renderSemesters();
    renderCgpa();
    showToast('User Added!');
  };

  open();
}

// ================= STORAGE =================

function saveState() {
  localStorage.setItem('sgpaAppUsers',    JSON.stringify(state.users));
  localStorage.setItem('sgpaAppData',     JSON.stringify(state.data));
  localStorage.setItem('sgpaAppSelected', state.user);
}

function loadState() {
  state.users = JSON.parse(localStorage.getItem('sgpaAppUsers'))    || [];
  state.data  = JSON.parse(localStorage.getItem('sgpaAppData'))     || {};
  state.user  = localStorage.getItem('sgpaAppSelected')             || null;
}

// ================= TOAST =================

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1200);
}

// ================= USER DROPDOWN =================

function renderUserDropdown() {
  const sel = document.getElementById('userSelect');
  sel.innerHTML = '';

  state.users.forEach(user => {
    const option       = document.createElement('option');
    option.value       = user;
    option.textContent = user;
    sel.appendChild(option);
  });

  sel.value = state.user || '';
}

function deleteUser() {
  if (!state.user) return;

  state.users.splice(state.users.indexOf(state.user), 1);
  delete state.data[state.user];
  state.user = state.users[0] || null;

  saveState();
  renderUserDropdown();
  renderSemesters();
  renderCgpa();
  showToast('User Deleted!');
}

function switchUser(e) {
  state.user = e.target.value;
  saveState();
  renderSemesters();
  renderCgpa();
  showToast('Switched to ' + state.user);
}

// ================= SEMESTERS =================

/**
 * Renders the semester card grid.
 * Each card shows the semester name and, if saved, its SGPA below it.
 */
function renderSemesters() {
  const container = document.getElementById('semesters');
  container.innerHTML = '';

  if (!state.user) {
    container.innerHTML =
      '<div style="grid-column:1/-1; padding:2em 0; text-align:center; color:#888;">Please add a user!</div>';
    renderCgpa();
    return;
  }

  const userData = state.data[state.user] || {};

  SEMESTERS.forEach((sem, idx) => {
    const semKey  = 'S' + (idx + 1);
    const semData = userData[semKey];
    const hasSgpa = semData && semData.sgpa != null && semData.totalCredits;

    const card      = document.createElement('div');
    card.className  = 'semCard' + (hasSgpa ? ' semCard--saved' : '');
    card.tabIndex   = 0;

    // Build inner HTML: name + optional SGPA line
    card.innerHTML = `
      <div class="semCard-inner">
        <span class="semCard-name">${sem}</span>
        ${hasSgpa
          ? `<span class="semCard-sgpa">${parseFloat(semData.sgpa).toFixed(2)}</span>`
          : ''}
      </div>
    `;

    card.onclick  = () => openSemester(idx);
    card.onkeyup  = e => {
      if (e.key === 'Enter' || e.key === ' ') openSemester(idx);
    };

    container.appendChild(card);
  });
}

// ================= OPEN SEM MODAL =================

function openSemester(idx) {
  currentOpenSemIdx = idx;

  const modal = document.getElementById('modal');
  modal.classList.remove('hidden');

  document.getElementById('modalSemLabel').textContent =
    `Semester ${SEMESTERS[idx]}`;

  const semKey  = 'S' + (idx + 1);
  const userData = state.data[state.user] || {};
  const isSaved  = !!(
    userData[semKey] &&
    userData[semKey].sgpa != null &&
    userData[semKey].totalCredits
  );
  const semData  = userData[semKey] || { subjects: [] };

  const countInput = document.getElementById('subjectCount');
  countInput.value = semData.subjects.length || 9;

  renderSubjectRows(semData.subjects);
  updateSgpaOutputDisplay();

  // Remove semester button — shows only for saved semesters
  const removeBtn          = document.getElementById('removeSemBtn');
  removeBtn.style.display  = isSaved ? '' : 'none';
  removeBtn.onclick        = function () {
    removeSemester(idx);
    closeSemModal();
  };

  // Refresh live SGPA when subject count changes
  countInput.oninput = () => {
    const current = collectSubjects();
    renderSubjectRows(current);
    updateSgpaOutputDisplay();
};

  // Save SGPA on form submit
  document.getElementById('subjectForm').onsubmit = e => {
    e.preventDefault();
    saveSemester(idx);
    closeSemModal();
  };
}

// ================= CLOSE SEMESTER MODAL =================

function closeSemModal() {
  document.getElementById('modal').classList.add('hidden');
}

document.getElementById('closeModal').onclick = closeSemModal;

document.getElementById('modal').onclick = e => {
  if (e.target.classList.contains('modal-overlay')) closeSemModal();
};

// ================= SUBJECT ROWS =================

/**
 * Renders grade + credit selects for each subject.
 * Attaches live-SGPA listeners to every grade/credit control.
 */
function renderSubjectRows(existing = []) {
  const count = Math.max(
    1,
    Math.min(15, parseInt(document.getElementById('subjectCount').value, 10) || 9)
  );

  const container = document.getElementById('subjectRows');
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const gradeSelected =
      (existing[i] && typeof existing[i].grade !== 'undefined' && existing[i].grade !== '')
        ? existing[i].grade
        : 10;

    const creditSelected =
      (existing[i] && typeof existing[i].credit !== 'undefined')
        ? existing[i].credit
        : 3;

    const isCustomCredit = !CREDIT_OPTIONS.includes(creditSelected);

    const row       = document.createElement('div');
    row.className   = 'subjectRow';

    row.innerHTML = `
      <label>
        Grade:
        <div class="select-wrap">
          <select class="gradeSel" required>
            <option value="" disabled ${gradeSelected === '' ? 'selected' : ''}>
              Choose Grade
            </option>
            ${GRADES.map(g => `
              <option value="${g.value}" ${gradeSelected == g.value ? 'selected' : ''}>
                ${g.label}
              </option>
            `).join('')}
          </select>
          <span class="dropdown-arrow">&#9662;</span>
        </div>
      </label>

      <label>
        Credit:
        <div class="select-wrap">
          <select class="creditSel" onchange="handleCustomCredit(this)">
            ${CREDIT_OPTIONS.map(c => `
              <option value="${c}" ${c == creditSelected ? 'selected' : ''}>
                ${c}
              </option>
            `).join('')}
            <option value="custom" ${isCustomCredit ? 'selected' : ''}>Custom</option>
          </select>

          <input
            type="number"
            class="customCreditInput"
            step="0.1"
            min="0"
            placeholder="Enter"
            value="${isCustomCredit ? creditSelected : ''}"
            style="
              display:${isCustomCredit ? 'block' : 'none'};
              margin-top:6px;
              width:90px;
              padding:6px;
              border-radius:8px;
              border:1px solid #bcd2fa;
            "
          />

          <span class="dropdown-arrow">&#9662;</span>
        </div>
      </label>
    `;

    container.appendChild(row);
  }

  // Attach live-SGPA listeners after all rows are in the DOM
  attachLiveSgpaListeners();
}

/**
 * Attaches change/input listeners to every grade select and
 * custom-credit input so SGPA refreshes in real time.
 */
function attachLiveSgpaListeners() {
  document.querySelectorAll('#subjectRows .gradeSel').forEach(sel => {
    sel.addEventListener('change', updateSgpaOutputDisplay);
  });

  document.querySelectorAll('#subjectRows .creditSel').forEach(sel => {
    sel.addEventListener('change', updateSgpaOutputDisplay);
  });

  document.querySelectorAll('#subjectRows .customCreditInput').forEach(inp => {
    inp.addEventListener('input', updateSgpaOutputDisplay);
  });
}

// ================= CUSTOM CREDIT =================

function handleCustomCredit(selectEl) {
  const wrap  = selectEl.parentElement;
  const input = wrap.querySelector('.customCreditInput');

  if (selectEl.value === 'custom') {
    // Hide dropdown while the user types a custom value
    selectEl.style.display = 'none';
    input.style.display    = 'inline-block';
    input.focus();

    input.onchange = function () {
      const val = parseFloat(input.value);

      if (!isNaN(val) && val > 0) {
        // Add a new option for the custom value and select it
        const newOption       = document.createElement('option');
        newOption.value       = val;
        newOption.textContent = val;
        newOption.selected    = true;

        selectEl.insertBefore(
          newOption,
          selectEl.querySelector('option[value="custom"]')
        );

        // Restore the dropdown
        selectEl.style.display = 'inline-block';
        input.style.display    = 'none';
        input.value            = '';

        // Refresh live SGPA after custom value is confirmed
        updateSgpaOutputDisplay();
      }
    };

  } else {
    selectEl.style.display = 'inline-block';
    input.style.display    = 'none';
    input.value            = '';
  }
}

// ================= COLLECT CURRENT SUBJECTS =================

/**
 * Reads all subject rows from the DOM and returns an array of
 * { grade, credit } objects. Used by both save and live-preview.
 */
function collectSubjects() {
  const subjects = [];

  document.querySelectorAll('#subjectRows .subjectRow').forEach(row => {
    const grade        = row.querySelector('.gradeSel').value;
    const creditSelect = row.querySelector('.creditSel');
    const customInput  = row.querySelector('.customCreditInput');

    let credit;
    if (creditSelect.value === 'custom') {
      credit = parseFloat(customInput.value) || 0;
    } else {
      credit = parseFloat(creditSelect.value);
    }

    subjects.push({ grade: grade ? parseFloat(grade) : '', credit });
  });

  return subjects;
}

// ================= COMPUTE SGPA =================

/**
 * Computes SGPA and totalCredits from an array of subject objects.
 * Returns { sgpa, totalCredits }.
 */
function computeSgpa(subjects) {
  const validSubs    = subjects.filter(s => s.grade !== '');
  const totalCredits = validSubs.reduce((sum, s) => sum + s.credit, 0);
  const sgpa         = totalCredits
    ? validSubs.reduce((sum, s) => sum + s.grade * s.credit, 0) / totalCredits
    : null;

  return { sgpa, totalCredits };
}

// ================= SAVE SEM =================

function saveSemester(idx) {
  const semKey   = 'S' + (idx + 1);
  const subjects = collectSubjects();

  const allValid = subjects.every(s => s.grade !== '');
  if (!allValid) {
    showToast('Select all grades!');
    return;
  }

  const { sgpa, totalCredits } = computeSgpa(subjects);

  if (!state.data[state.user]) state.data[state.user] = {};

  state.data[state.user][semKey] = { subjects, sgpa, totalCredits };

  saveState();
  renderCgpa();
  renderSemesters();
  showToast('SGPA saved!');
}

// ================= REMOVE SEM =================

function removeSemester(idx) {
  const semKey = 'S' + (idx + 1);

  if (state.data[state.user] && state.data[state.user][semKey]) {
    delete state.data[state.user][semKey];
    saveState();
    renderCgpa();
    renderSemesters();
    showToast('Semester removed!');
  }
}

// ================= LIVE SGPA (modal display) =================

/**
 * Reads current subject rows, computes SGPA + total credits,
 * and updates the #sgpaOutput element in real time.
 */
function updateSgpaOutputDisplay() {
  const sgpaDiv  = document.getElementById('sgpaOutput');
  const subjects = collectSubjects();
  const { sgpa, totalCredits } = computeSgpa(subjects);

  if (sgpa != null && !isNaN(sgpa)) {
    sgpaDiv.innerHTML = `
      <div class="live-sgpa-row">
        <span class="live-sgpa-label">SGPA:&nbsp;<strong>${sgpa.toFixed(2)}</strong></span>
        <span class="live-credits-label">Total Credits:&nbsp;<strong>${totalCredits}</strong></span>
      </div>
    `;
  } else {
    sgpaDiv.innerHTML = '';
  }
}

// ================= CGPA =================

/**
 * Calculates and renders CGPA, percentage, and total combined credits
 * in the footer banner.
 */
function renderCgpa() {
  const cgpaBar    = document.getElementById('cgpaValue');
  const percentBar = document.getElementById('percentageValue');
  const creditsBar = document.getElementById('totalCreditsValue');

  if (!state.user) {
    cgpaBar.textContent    = '--';
    percentBar.textContent = 'Percentage: --';
    if (creditsBar) creditsBar.textContent = 'Total Credits: --';
    return;
  }

  const userData   = state.data[state.user] || {};
  let numerator    = 0;
  let denominator  = 0;

  for (let i = 1; i <= 8; i++) {
    const sem = userData['S' + i];
    if (sem && sem.sgpa != null && sem.totalCredits) {
      numerator   += sem.sgpa * sem.totalCredits;
      denominator += sem.totalCredits;
    }
  }

  if (denominator) {
    const cgpa    = numerator / denominator;
    const percent = (cgpa - 0.75) * 10;

    cgpaBar.textContent    = cgpa.toFixed(2);
    percentBar.textContent = `Percentage: ${percent.toFixed(2)}%`;
    if (creditsBar) creditsBar.textContent = `Total Credits: ${denominator}`;
  } else {
    cgpaBar.textContent    = '--';
    percentBar.textContent = 'Percentage: --';
    if (creditsBar) creditsBar.textContent = 'Total Credits: --';
  }
}

// ================= EVENTS =================

document.getElementById('addUserBtn').onclick    = showAddUserModal;
document.getElementById('deleteUserBtn').onclick = showDeleteUserModal;
document.getElementById('userSelect').onchange   = switchUser;

// ================= INIT =================

loadState();

if (!state.users.length) {
  promptForFirstUser();
} else {
  renderUserDropdown();
  renderSemesters();
  renderCgpa();
}
