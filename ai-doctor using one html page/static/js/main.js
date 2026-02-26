/* =====================================================
   AI DOCTOR ANALYSIS — MAIN JAVASCRIPT
   Full SPA logic: Navigation, Body Map, API calls,
   Admin Dashboard, Animations, Scroll effects
   ===================================================== */

'use strict';

/* ===== PAGE ROUTING ===== */
let currentPage = 'home';
let tipsLoaded = false;
let adminDataLoaded = { illnesses:false, doctors:false, medicines:false, tips:false, messages:false };

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const page = document.getElementById(`page-${name}`);
  if (!page) return;
  page.classList.add('active');
  currentPage = name;

  // Nav highlight
  const navLink = document.querySelector(`[data-page="${name}"]`);
  if (navLink) navLink.classList.add('active');

  // Show/hide header & footer
  const headerPages = ['home','about','tips','contact'];
  document.getElementById('main-header').style.display = headerPages.includes(name) ? '' : 'none';
  document.getElementById('main-footer').style.display = headerPages.includes(name) ? '' : 'none';

  // Close mobile menu
  document.getElementById('main-nav').classList.remove('open');

  // Scroll to top
  window.scrollTo({ top:0, behavior:'smooth' });

  // Page-specific loaders
  if (name === 'tips' && !tipsLoaded) loadHealthTips();
  if (name === 'about') initScrollReveal();
  if (name === 'admin') loadAdminDashboard();
}

function toggleMenu() {
  document.getElementById('main-nav').classList.toggle('open');
}

/* ===== BODY MAP ===== */
document.addEventListener('DOMContentLoaded', () => {
  initBodyMap();
  initScrollReveal();
  updateTopbarDate();
  checkAdminSession();
});

function initBodyMap() {
  const parts = document.querySelectorAll('.body-part');
  const label = document.getElementById('hover-label');

  parts.forEach(part => {
    part.addEventListener('mouseenter', () => {
      label.textContent = part.dataset.label || part.dataset.part;
      // Highlight same-part areas
      document.querySelectorAll(`[data-part="${part.dataset.part}"]`).forEach(p => {
        p.style.fill = 'rgba(0,180,216,0.25)';
      });
    });

    part.addEventListener('mouseleave', () => {
      label.textContent = 'Hover to select';
      document.querySelectorAll(`[data-part="${part.dataset.part}"]`).forEach(p => {
        p.style.fill = 'transparent';
      });
    });

    part.addEventListener('click', () => {
      loadIllnessPage(part.dataset.part);
    });
  });
}

/* ===== ILLNESS PAGE ===== */
async function loadIllnessPage(slug) {
  showPage('illness');

  const content = document.getElementById('illness-content');
  const title = document.getElementById('illness-page-title');
  const sub = document.getElementById('illness-page-sub');
  const badge = document.getElementById('part-badge');

  content.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Loading health information...</p></div>`;
  title.textContent = '';
  sub.textContent = '';
  badge.textContent = '';

  try {
    const res = await fetch(`/api/body-part/${slug}`);
    const data = await res.json();

    if (!data.success) {
      content.innerHTML = `<div class="loading-state"><div class="empty-icon">⚠️</div><p>Could not load data. Please try again.</p></div>`;
      return;
    }

    const { part, illnesses, doctors } = data.data;

    // Update hero
    badge.textContent = '🔬 ' + part.name;
    title.textContent = part.name + ' — Health Information';
    sub.textContent = `Explore common conditions, symptoms, care tips, and specialists for ${part.name} health.`;

    // Build content
    let html = `<div class="illness-grid">`;

    if (!illnesses.length) {
      html += `<div class="ill-section"><p class="ill-desc">No illness data available for this body part yet. Please check back later.</p></div>`;
    } else {
      illnesses.forEach((ill, idx) => {
        const sevClass = `severity-${ill.severity || 'mild'}`;
        const sevLabel = (ill.severity || 'mild').charAt(0).toUpperCase() + (ill.severity || 'mild').slice(1);

        html += `
        <div class="ill-section">
          <div class="ill-section-header">
            <div class="ill-section-icon">${getIllnessIcon(ill.name)}</div>
            <div>
              <div class="ill-name">${escHtml(ill.name)}</div>
              <span class="severity-badge ${sevClass}">${sevLabel} Severity</span>
            </div>
          </div>
          <p class="ill-desc">${escHtml(ill.description)}</p>
        </div>`;

        if (ill.symptoms_list && ill.symptoms_list.length) {
          html += `
          <div class="ill-section">
            <div class="ill-section-header">
              <div class="ill-section-icon">🔍</div>
              <h3 class="ill-section-title">Symptoms — ${escHtml(ill.name)}</h3>
            </div>
            <ul class="symptoms-list">
              ${ill.symptoms_list.map(s => `<li>${escHtml(s)}</li>`).join('')}
            </ul>
          </div>`;
        }

        if (ill.care_list && ill.care_list.length) {
          html += `
          <div class="ill-section">
            <div class="ill-section-header">
              <div class="ill-section-icon">💚</div>
              <h3 class="ill-section-title">Care Tips — ${escHtml(ill.name)}</h3>
            </div>
            <ul class="care-list">
              ${ill.care_list.map(c => `<li>${escHtml(c)}</li>`).join('')}
            </ul>
          </div>`;
        }

        if (ill.medicines && ill.medicines.length) {
          html += `
          <div class="ill-section">
            <div class="ill-section-header">
              <div class="ill-section-icon">💊</div>
              <h3 class="ill-section-title">Medicine Information — ${escHtml(ill.name)}</h3>
            </div>
            <div class="med-warning">⚠️ Educational information only. Always consult a doctor before taking any medication.</div>
            <div class="medicine-cards" style="margin-top:16px">
              ${ill.medicines.map(m => `
                <div class="medicine-card">
                  <div class="med-card-name">${escHtml(m.name)}</div>
                  <span class="med-otc-badge ${m.is_otc ? 'otc-yes' : 'otc-no'}">${m.is_otc ? '✓ Over-the-Counter' : '⚕ Prescription Required'}</span>
                  <div class="med-field">${escHtml(m.description)}</div>
                  ${m.dosage ? `<div class="med-field"><strong>Dosage:</strong> ${escHtml(m.dosage)}</div>` : ''}
                  ${m.side_effects ? `<div class="med-field"><strong>Side Effects:</strong> ${escHtml(m.side_effects)}</div>` : ''}
                </div>`).join('')}
            </div>
          </div>`;
        }

        if (idx < illnesses.length - 1) html += `<hr style="border:none;border-top:2px dashed var(--gray-100);margin:8px 0">`;
      });
    }

    // Doctors section
    if (doctors && doctors.length) {
      html += `
      <div class="ill-section">
        <div class="ill-section-header">
          <div class="ill-section-icon">👨‍⚕️</div>
          <h3 class="ill-section-title">Recommended Specialists</h3>
        </div>
        <div class="doctors-grid">
          ${doctors.map(d => `
            <div class="doctor-card">
              <div class="doc-avatar">${getDoctorEmoji(d.specialization)}</div>
              <div class="doc-name">${escHtml(d.name)}</div>
              <div class="doc-spec">${escHtml(d.specialization)}</div>
              ${d.hospital ? `<div class="doc-hospital">🏥 ${escHtml(d.hospital)}</div>` : ''}
              <div class="doc-contacts">
                ${d.phone ? `<div class="doc-contact-item">📞 <a href="tel:${escHtml(d.phone)}" style="color:var(--primary-light)">${escHtml(d.phone)}</a></div>` : ''}
                ${d.email ? `<div class="doc-contact-item">📧 <a href="mailto:${escHtml(d.email)}" style="color:var(--primary-light)">${escHtml(d.email)}</a></div>` : ''}
              </div>
              ${d.experience_years ? `<span class="doc-exp">${d.experience_years} years experience</span>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
    }

    html += `</div>`;
    content.innerHTML = html;

  } catch (err) {
    content.innerHTML = `<div class="loading-state"><div class="empty-icon">⚠️</div><p>Error: ${err.message}</p></div>`;
    console.error(err);
  }
}

/* ===== HEALTH TIPS ===== */
async function loadHealthTips() {
  const container = document.getElementById('tips-content');
  try {
    const res = await fetch('/api/health-tips');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const grouped = data.data;
    const catConfig = {
      'home_care': { label:'🏠 Home Care Tips', sub:'Daily habits for a healthier life', color:'--primary' },
      'medicine_safety': { label:'💊 Medicine Safety Tips', sub:'Stay safe with medications', color:'--success' },
      'nutrition': { label:'🥗 Nutrition Tips', sub:'Fuel your body right', color:'--warning' },
      'fitness': { label:'🏃 Fitness Tips', sub:'Move more, feel better', color:'--accent' },
      'mental_health': { label:'🧠 Mental Health Tips', sub:'Take care of your mind', color:'--primary' }
    };

    let html = '';
    Object.entries(grouped).forEach(([cat, tips]) => {
      const cfg = catConfig[cat] || { label: cat, sub:'', color:'--primary' };
      html += `
      <div class="tips-section">
        <div class="tips-section-header">
          <div class="tips-section-title">${cfg.label}</div>
        </div>
        <div class="tips-section-sub" style="margin-bottom:16px;color:var(--text-muted);font-size:14px">${cfg.sub}</div>
        <div class="tips-grid">
          ${tips.map(t => `
            <div class="tip-card">
              <div class="tip-icon">${t.icon || '💡'}</div>
              <div class="tip-title">${escHtml(t.title)}</div>
              <div class="tip-desc">${escHtml(t.description)}</div>
            </div>`).join('')}
        </div>
      </div>`;
    });

    container.innerHTML = html;
    tipsLoaded = true;
  } catch (err) {
    container.innerHTML = `<div class="loading-state"><p>Could not load tips: ${err.message}</p></div>`;
  }
}

/* ===== CONTACT ===== */
async function submitContact(e) {
  e.preventDefault();
  const btn = document.getElementById('contact-submit');
  btn.disabled = true;
  btn.innerHTML = '<span>Sending...</span>';

  try {
    const res = await fetch('/api/contact', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        message: document.getElementById('contact-message').value
      })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('contact-success').style.display = 'flex';
      document.getElementById('contact-form').reset();
      showToast('Message sent successfully!', 'success');
    } else {
      showToast(data.message || 'Failed to send message', 'error');
    }
  } catch (err) {
    showToast('Network error. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Send Message</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  }
}

/* ===== ADMIN AUTH ===== */
async function adminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  const errDiv = document.getElementById('login-error');
  errDiv.style.display = 'none';

  try {
    const res = await fetch('/admin/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({email, password})
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('admin-user-info').innerHTML = `Logged in as<br><strong style="color:white">${data.name}</strong>`;
      document.getElementById('admin-nav-link').style.display = '';
      showPage('admin');
      adminTab('dashboard');
    } else {
      errDiv.textContent = data.message || 'Invalid credentials';
      errDiv.style.display = 'block';
    }
  } catch (err) {
    errDiv.textContent = 'Connection error: ' + err.message;
    errDiv.style.display = 'block';
  }
}

async function adminLogout() {
  await fetch('/admin/logout', { method:'POST' });
  document.getElementById('admin-nav-link').style.display = 'none';
  showPage('home');
  showToast('Logged out successfully', 'info');
}

async function checkAdminSession() {
  try {
    const res = await fetch('/admin/check');
    const data = await res.json();
    if (data.success) {
      document.getElementById('admin-user-info').innerHTML = `Logged in as<br><strong style="color:white">${data.name}</strong>`;
      document.getElementById('admin-nav-link').style.display = '';
    }
  } catch (e) {}
}

function toggleAdminPass(btn) {
  const inp = btn.previousElementSibling;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

/* ===== ADMIN DASHBOARD ===== */
function loadAdminDashboard() {
  updateTopbarDate();
  loadAdminStats();
}

async function loadAdminStats() {
  try {
    const res = await fetch('/admin/stats');
    const data = await res.json();
    if (data.success) {
      const s = data.data;
      document.getElementById('stat-illnesses').textContent = s.illnesses;
      document.getElementById('stat-doctors').textContent = s.doctors;
      document.getElementById('stat-medicines').textContent = s.medicines;
      document.getElementById('stat-messages').textContent = s.messages;
      const badge = document.getElementById('msg-badge');
      badge.textContent = s.messages;
      badge.style.display = s.messages > 0 ? '' : 'none';
    }
  } catch(e){}
}

function adminTab(name) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  document.getElementById(`atab-${name}`).classList.add('active');
  document.getElementById(`tab-${name === 'tips' ? 'tips-admin' : name}`).classList.add('active');

  const titles = {
    'dashboard':'Dashboard Overview', 'illnesses':'Manage Illnesses',
    'doctors':'Manage Doctors', 'medicines':'Manage Medicines',
    'tips':'Manage Health Tips', 'messages':'Contact Messages'
  };
  document.getElementById('admin-page-title').textContent = titles[name] || 'Admin Panel';

  if (name === 'illnesses' && !adminDataLoaded.illnesses) loadAdminIllnesses();
  if (name === 'doctors' && !adminDataLoaded.doctors) loadAdminDoctors();
  if (name === 'medicines' && !adminDataLoaded.medicines) loadAdminMedicines();
  if (name === 'tips') loadAdminTips();
  if (name === 'messages') loadAdminMessages();
}

/* ===== ADMIN ILLNESSES ===== */
async function loadAdminIllnesses() {
  const el = document.getElementById('illnesses-table');
  el.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Loading...</p></div>`;
  try {
    const res = await fetch('/admin/illnesses');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const items = data.data;
    if (!items.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">🦠</div><p>No illnesses added yet.</p></div>`;
      return;
    }
    el.innerHTML = `
      <table class="admin-table">
        <thead><tr>
          <th>ID</th><th>Body Part</th><th>Name</th><th>Severity</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${items.map(i => `<tr>
            <td>#${i.id}</td>
            <td><span style="background:var(--gray-100);padding:2px 8px;border-radius:4px;font-size:12px">${escHtml(i.body_part_name)}</span></td>
            <td><strong>${escHtml(i.name)}</strong></td>
            <td><span class="severity-badge severity-${i.severity}">${i.severity}</span></td>
            <td><span style="color:${i.is_active?'var(--success)':'var(--danger)'}">●</span> ${i.is_active?'Active':'Inactive'}</td>
            <td><button class="btn-danger" onclick="deleteIllness(${i.id})">Delete</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    adminDataLoaded.illnesses = true;
  } catch(e) {
    el.innerHTML = `<div class="empty-state"><p>Error: ${e.message}</p></div>`;
  }
}

async function saveIllness(e) {
  e.preventDefault();
  const body = {
    body_part_id: document.getElementById('ill-body-part').value,
    name: document.getElementById('ill-name').value,
    description: document.getElementById('ill-description').value,
    symptoms: document.getElementById('ill-symptoms').value,
    care_tips: document.getElementById('ill-care').value,
    severity: document.getElementById('ill-severity').value
  };
  try {
    const res = await fetch('/admin/illness', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      closeModal('illness-modal');
      document.getElementById('illness-form').reset();
      adminDataLoaded.illnesses = false;
      loadAdminIllnesses();
      loadAdminStats();
      showToast('Illness added successfully!', 'success');
    } else showToast(data.message, 'error');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteIllness(id) {
  if (!confirm('Delete this illness? Related medicines will also be deleted.')) return;
  try {
    await fetch(`/admin/illness/${id}`, { method:'DELETE' });
    adminDataLoaded.illnesses = false;
    loadAdminIllnesses();
    loadAdminStats();
    showToast('Illness deleted', 'success');
  } catch(e) { showToast('Error deleting', 'error'); }
}

/* ===== ADMIN DOCTORS ===== */
async function loadAdminDoctors() {
  const el = document.getElementById('doctors-table');
  el.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Loading...</p></div>`;
  try {
    const res = await fetch('/admin/doctors');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const items = data.data;
    if (!items.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">👨‍⚕️</div><p>No doctors added yet.</p></div>`;
      return;
    }
    el.innerHTML = `
      <table class="admin-table">
        <thead><tr>
          <th>Name</th><th>Specialization</th><th>Body Part</th><th>Hospital</th><th>Phone</th><th>Exp.</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${items.map(d => `<tr>
            <td><strong>${escHtml(d.name)}</strong></td>
            <td>${escHtml(d.specialization)}</td>
            <td><span style="background:var(--gray-100);padding:2px 8px;border-radius:4px;font-size:12px">${escHtml(d.body_part_name||'General')}</span></td>
            <td>${escHtml(d.hospital||'—')}</td>
            <td>${escHtml(d.phone||'—')}</td>
            <td>${d.experience_years}y</td>
            <td><button class="btn-danger" onclick="deleteDoctor(${d.id})">Delete</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    adminDataLoaded.doctors = true;
  } catch(e) {
    el.innerHTML = `<div class="empty-state"><p>Error: ${e.message}</p></div>`;
  }
}

async function saveDoctor(e) {
  e.preventDefault();
  const body = {
    body_part_id: document.getElementById('doc-body-part').value || null,
    name: document.getElementById('doc-name').value,
    specialization: document.getElementById('doc-spec').value,
    hospital: document.getElementById('doc-hospital').value,
    phone: document.getElementById('doc-phone').value,
    email: document.getElementById('doc-email').value,
    address: document.getElementById('doc-address').value,
    experience_years: parseInt(document.getElementById('doc-exp').value)||0
  };
  try {
    const res = await fetch('/admin/doctor', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      closeModal('doctor-modal');
      document.getElementById('doctor-form').reset();
      adminDataLoaded.doctors = false;
      loadAdminDoctors();
      loadAdminStats();
      showToast('Doctor added successfully!', 'success');
    } else showToast(data.message, 'error');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteDoctor(id) {
  if (!confirm('Delete this doctor?')) return;
  try {
    await fetch(`/admin/doctor/${id}`, { method:'DELETE' });
    adminDataLoaded.doctors = false;
    loadAdminDoctors();
    loadAdminStats();
    showToast('Doctor deleted', 'success');
  } catch(e) {}
}

/* ===== ADMIN MEDICINES ===== */
async function loadAdminMedicines() {
  const el = document.getElementById('medicines-table');
  el.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Loading...</p></div>`;
  try {
    const res = await fetch('/admin/medicines');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const items = data.data;
    if (!items.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">💊</div><p>No medicines added yet.</p></div>`;
      return;
    }
    el.innerHTML = `
      <table class="admin-table">
        <thead><tr>
          <th>Medicine</th><th>Related Illness</th><th>Dosage</th><th>Type</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${items.map(m => `<tr>
            <td><strong>${escHtml(m.name)}</strong></td>
            <td>${escHtml(m.illness_name)}</td>
            <td style="font-size:12px;color:var(--text-muted)">${escHtml(m.dosage||'—')}</td>
            <td><span style="background:${m.is_otc?'#e7f7ef':'#fff3e0'};color:${m.is_otc?'#2d9970':'#e65100'};padding:2px 8px;border-radius:4px;font-size:12px">${m.is_otc?'OTC':'Rx'}</span></td>
            <td>
              <button class="btn-danger" onclick="deleteMedicine(${m.id})">Delete</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    adminDataLoaded.medicines = true;
  } catch(e) {
    el.innerHTML = `<div class="empty-state"><p>Error: ${e.message}</p></div>`;
  }
}

async function saveMedicine(e) {
  e.preventDefault();
  const body = {
    illness_id: document.getElementById('med-illness').value,
    name: document.getElementById('med-name').value,
    description: document.getElementById('med-description').value,
    dosage: document.getElementById('med-dosage').value,
    side_effects: document.getElementById('med-sides').value,
    is_otc: parseInt(document.getElementById('med-otc').value)
  };
  try {
    const res = await fetch('/admin/medicine', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      closeModal('medicine-modal');
      document.getElementById('medicine-form').reset();
      adminDataLoaded.medicines = false;
      loadAdminMedicines();
      loadAdminStats();
      showToast('Medicine added successfully!', 'success');
    } else showToast(data.message, 'error');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteMedicine(id) {
  if (!confirm('Delete this medicine?')) return;
  try {
    await fetch(`/admin/medicine/${id}`, { method:'DELETE' });
    adminDataLoaded.medicines = false;
    loadAdminMedicines();
    loadAdminStats();
    showToast('Medicine deleted', 'success');
  } catch(e) {}
}

/* ===== ADMIN HEALTH TIPS ===== */
async function loadAdminTips() {
  const el = document.getElementById('tips-table');
  el.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Loading...</p></div>`;
  try {
    const res = await fetch('/admin/tips');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const items = data.data;
    if (!items.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">💡</div><p>No tips added yet.</p></div>`;
      return;
    }
    el.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Icon</th><th>Title</th><th>Category</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>
          ${items.map(t => `<tr>
            <td style="font-size:20px">${t.icon||'💡'}</td>
            <td><strong>${escHtml(t.title)}</strong></td>
            <td><span style="background:var(--gray-100);padding:2px 8px;border-radius:4px;font-size:12px">${t.category.replace('_',' ')}</span></td>
            <td><span style="color:${t.is_active?'var(--success)':'var(--danger)'}">●</span></td>
            <td><button class="btn-danger" onclick="deleteTip(${t.id})">Delete</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch(e) {
    el.innerHTML = `<div class="empty-state"><p>Error: ${e.message}</p></div>`;
  }
}

async function saveTip(e) {
  e.preventDefault();
  const body = {
    category: document.getElementById('tip-category').value,
    title: document.getElementById('tip-title').value,
    description: document.getElementById('tip-description').value,
    icon: document.getElementById('tip-icon').value || '💡'
  };
  try {
    const res = await fetch('/admin/tip', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      closeModal('tip-modal');
      document.getElementById('tip-form').reset();
      loadAdminTips();
      tipsLoaded = false;
      showToast('Health tip added!', 'success');
    } else showToast(data.message, 'error');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteTip(id) {
  if (!confirm('Delete this tip?')) return;
  try {
    await fetch(`/admin/tip/${id}`, { method:'DELETE' });
    loadAdminTips();
    tipsLoaded = false;
    showToast('Tip deleted', 'success');
  } catch(e) {}
}

/* ===== ADMIN MESSAGES ===== */
async function loadAdminMessages() {
  const el = document.getElementById('messages-table');
  el.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Loading...</p></div>`;
  try {
    const res = await fetch('/admin/messages');
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const items = data.data;
    if (!items.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><p>No messages yet.</p></div>`;
      return;
    }
    el.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          ${items.map(m => `<tr>
            <td><strong>${escHtml(m.name)}</strong></td>
            <td><a href="mailto:${escHtml(m.email)}" style="color:var(--primary-light)">${escHtml(m.email)}</a></td>
            <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(m.message)}</td>
            <td style="font-size:12px;color:var(--text-muted)">${new Date(m.created_at).toLocaleDateString()}</td>
            <td>
              ${m.is_read ? '<span style="color:var(--success);font-size:12px">✓ Read</span>' :
              `<button onclick="markRead(${m.id})" style="background:var(--primary);color:white;border:none;padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer">Mark Read</button>`}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch(e) {
    el.innerHTML = `<div class="empty-state"><p>Error: ${e.message}</p></div>`;
  }
}

async function markRead(id) {
  try {
    await fetch(`/admin/message/${id}/read`, { method:'POST' });
    loadAdminMessages();
    loadAdminStats();
    showToast('Message marked as read', 'success');
  } catch(e) {}
}

/* ===== MODAL HELPERS ===== */
async function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.add('open');

  // Populate dropdowns
  if (id === 'illness-modal' || id === 'doctor-modal') {
    const res = await fetch('/admin/body-parts');
    const data = await res.json();
    if (data.success) {
      const selectId = id === 'illness-modal' ? 'ill-body-part' : 'doc-body-part';
      const select = document.getElementById(selectId);
      const addEmpty = id === 'doctor-modal';
      select.innerHTML = (addEmpty ? '<option value="">-- General / All --</option>' : '') +
        data.data.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
  }

  if (id === 'medicine-modal') {
    const res = await fetch('/admin/illnesses-list');
    const data = await res.json();
    if (data.success) {
      document.getElementById('med-illness').innerHTML = data.data.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
    }
    document.getElementById('med-upload-group').style.display = 'none';
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

/* ===== SCROLL ANIMATIONS ===== */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, i * 100);
      }
    });
  }, { threshold: 0.1, rootMargin:'0px 0px -50px 0px' });

  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}

/* ===== UTILITIES ===== */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (el) el.textContent = new Date().toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' });
}

function getIllnessIcon(name) {
  const n = (name||'').toLowerCase();
  if (n.includes('migrain') || n.includes('headache')) return '🤕';
  if (n.includes('sinus')) return '🤧';
  if (n.includes('cancer') || n.includes('tumor')) return '🔴';
  if (n.includes('heart') || n.includes('cardiac')) return '❤️';
  if (n.includes('lung') || n.includes('pneumon') || n.includes('breath')) return '🫁';
  if (n.includes('stomach') || n.includes('gastri') || n.includes('ibs')) return '🫃';
  if (n.includes('knee') || n.includes('arthrit')) return '🦵';
  if (n.includes('back') || n.includes('spine') || n.includes('disc')) return '🦴';
  if (n.includes('shoulder') || n.includes('rotator')) return '💪';
  if (n.includes('foot') || n.includes('feet') || n.includes('plantar') || n.includes('gout')) return '🦶';
  if (n.includes('neck') || n.includes('cervical')) return '🧍';
  if (n.includes('carpal') || n.includes('wrist') || n.includes('elbow')) return '🖐';
  if (n.includes('varicose') || n.includes('vein')) return '🩸';
  if (n.includes('frozen')) return '🧊';
  return '🏥';
}

function getDoctorEmoji(spec) {
  const s = (spec||'').toLowerCase();
  if (s.includes('neuro') || s.includes('brain')) return '🧠';
  if (s.includes('cardio') || s.includes('heart')) return '❤️';
  if (s.includes('ortho') || s.includes('bone')) return '🦴';
  if (s.includes('gastro') || s.includes('digest')) return '🫃';
  if (s.includes('pulmo') || s.includes('lung')) return '🫁';
  if (s.includes('sports')) return '🏃';
  if (s.includes('rheuma')) return '💊';
  if (s.includes('pod') || s.includes('foot')) return '🦶';
  if (s.includes('vascul')) return '🩸';
  if (s.includes('spine') || s.includes('back')) return '🦴';
  return '👨‍⚕️';
}
