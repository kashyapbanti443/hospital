import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const SESSION_KEY = "carepoint-session";
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

async function request(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "register") {
        await request("/Users/register", { method: "POST", body: form });
        setNotice("Account created. Sign in with your email and password.");
        setMode("login");
      } else {
        const result = await request("/Users/login", {
          method: "POST",
          body: { email: form.email, password: form.password },
        });
        onLogin({ token: result.token, user: result.user });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <div className="brand brand-light"><span className="brand-mark">✚</span><span>CarePoint</span></div>
        <div className="story-copy">
          <p className="eyebrow">CARE THAT CONNECTS</p>
          <h1>Better care starts with a simpler visit.</h1>
          <p>Book trusted doctors, keep track of appointments, and spend more time focused on your health.</p>
        </div>
        <figure className="story-photo">
          <img src="https://images.pexels.com/photos/7108157/pexels-photo-7108157.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Doctor speaking with a patient during a clinic visit" />
          <figcaption><span>Care that puts people first</span><a href="https://www.pexels.com/photo/a-doctor-talking-to-his-patient-7108157/" target="_blank" rel="noreferrer">Photo: Pavel Danilyuk / Pexels</a></figcaption>
        </figure>
        <div className="story-footer"><span className="pulse-dot" /> Your care, all in one place</div>
        <div className="story-orb orb-one" /><div className="story-orb orb-two" />
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-brand brand"><span className="brand-mark">✚</span><span>CarePoint</span></div>
        <div className="auth-mobile-visual"><img src="https://images.pexels.com/photos/7108157/pexels-photo-7108157.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Doctor speaking with a patient during a clinic visit" /><span>Care that puts people first <a href="https://www.pexels.com/photo/a-doctor-talking-to-his-patient-7108157/" target="_blank" rel="noreferrer">Pavel Danilyuk / Pexels</a></span></div>
        <div className="auth-card">
          <div className="auth-heading"><p className="eyebrow">{mode === "login" ? "WELCOME TO CAREPOINT" : "PATIENT REGISTRATION"}</p><h2>{mode === "login" ? "Sign in to your account" : "Create your patient account"}</h2><p>{mode === "login" ? "Enter your details to continue." : "Register as a patient to find doctors and book appointments."}</p></div>
          {notice && <div className="notice">{notice}</div>}
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={submit} className="form-stack">
            {mode === "register" && <><label>Full name<input name="name" autoComplete="name" value={form.name} onChange={update} required placeholder="Your name" /></label><label>Phone number<input name="phone" autoComplete="tel" value={form.phone} onChange={update} required placeholder="Phone number" /></label></>}
            <label>Email address<input name="email" type="email" autoComplete="email" value={form.email} onChange={update} required placeholder="you@example.com" /></label>
            <label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength="6" value={form.password} onChange={update} required placeholder="At least 6 characters" /></label>
            <button className="button button-primary button-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Register as patient"}<span>→</span></button>
          </form>
          <p className="auth-switch">{mode === "login" ? "New patient?" : "Already have an account?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setNotice(""); }}>{mode === "login" ? "Patient registration" : "Sign in"}</button></p>
          <p className="auth-footnote">By continuing, you agree to keep your account credentials private.</p>
        </div>
      </section>
    </main>
  );
}

function AppointmentsTable({ appointments, role, onStatusChange, updatingId }) {
  if (!appointments.length) return <div className="empty-state"><div className="empty-icon">▦</div><h3>No appointments yet</h3><p>Your upcoming appointments will appear here.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Doctor</th><th>Date & time</th><th>Reason</th><th>Status</th></tr></thead><tbody>
    {appointments.map((appointment) => <tr key={appointment._id}>
      <td><div className="person-cell"><span className="avatar avatar-small">{initials(appointment.patientId?.name)}</span><span>{appointment.patientId?.name || "Patient"}</span></div></td>
      <td>{appointment.doctorId?.userId?.name || "Doctor"}<span className="cell-sub">{appointment.doctorId?.specialization}</span></td>
      <td>{formatDate(appointment.appointmentDate)}</td><td className="reason-cell">{appointment.reason}</td>
      <td>{role === "Admin" || role === "Doctor" ? <select className={`status-select status-${appointment.status?.toLowerCase()}`} value={appointment.status} disabled={updatingId === appointment._id} onChange={(event) => onStatusChange(appointment._id, event.target.value)} aria-label="Appointment status"><option>Pending</option><option>Confirmed</option><option>Cancelled</option><option>Completed</option></select> : <span className={`status-pill status-${appointment.status?.toLowerCase()}`}>{appointment.status}</span>}</td>
    </tr>)}
  </tbody></table></div>;
}

function DoctorCard({ doctor, onBook, token, isAdmin, onScheduleSaved }) {
  const doctorName = doctor.userId?.name || "";
  const isRahulKashyap = doctorName.trim().toLowerCase() === "rahul kashyap";
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open || !date) { setSlots([]); setSelectedTime(""); return; }
    let current = true;
    setLoadingSlots(true);
    setError("");
    request(`/appointments/availability/${doctor._id}?date=${date}`, { token })
      .then((result) => { if (current) setSlots(result.slots || []); })
      .catch((err) => { if (current) setError(err.message); })
      .finally(() => { if (current) setLoadingSlots(false); });
    return () => { current = false; };
  }, [open, date, doctor._id, token]);
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try { await onBook(doctor._id, date, selectedTime, reason); setOpen(false); setDate(""); setReason(""); setSelectedTime(""); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <article className="doctor-card">
    <div className="doctor-top"><div className="avatar doctor-avatar">{isRahulKashyap ? <img src="/images/doctors/rahul-kashyap.png" alt="Dr. Rahul Kashyap" /> : initials(doctorName)}</div><span className="available-tag"><span /> Available</span></div>
    <h3>Dr. {doctor.userId?.name || "Doctor"}</h3><p className="doctor-specialty">{doctor.specialization}</p>
    <div className="doctor-details"><span>{doctor.qualification}</span><span>{doctor.experience} years experience</span></div>
    <div className="doctor-bottom"><div><span className="fee-label">CONSULTATION</span><strong>₹{doctor.consultationFee}</strong></div><div className="doctor-actions"><button className="button button-outline" onClick={() => setOpen(!open)}>{open ? "Close" : "Book visit"}<span>→</span></button></div></div>
    {open && <form className="booking-form" onSubmit={submit}><label>Choose appointment date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={localDateString(new Date())} required /></label>{date && <div className="slot-picker"><div className="slot-title">One-hour time slots</div>{loadingSlots ? <p className="slot-hint">Checking availability…</p> : slots.length === 0 ? <p className="slot-hint">No hours are scheduled for this day. Ask the Admin to add this doctor’s working hours.</p> : <div className="slot-grid">{slots.map((slot) => {
      const isPast = new Date(`${date}T${slot.startTime}:00`) <= new Date();
      const isBooked = slot.status === "Booked" || isPast;
      return <button key={slot.startTime} type="button" disabled={isBooked} className={`slot-option${selectedTime === slot.startTime ? " selected" : ""}${isBooked ? " booked" : ""}`} onClick={() => setSelectedTime(slot.startTime)}><span>{formatTime(slot.startTime)}</span><small>{isBooked ? "Booked" : "Available"}</small></button>;
    })}</div>}</div>}<label>Reason for visit<textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength="500" required placeholder="Briefly describe your concern" /></label>{error && <p className="inline-error">{error}</p>}<button className="button button-primary button-full" disabled={busy || !date || !selectedTime}>{busy ? "Booking…" : "Confirm appointment"}</button></form>}
    {isAdmin && <AdminScheduleEditor doctor={doctor} token={token} onSaved={onScheduleSaved} />}
  </article>;
}

function AdminDoctorForm({ token, onCreated }) {
  const [users, setUsers] = useState([]); const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ userId: "", specialization: "", qualification: "", experience: "", consultationFee: "", weeklySchedule: [] });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([request("/Users", { token }), request("/doctors")]).then(([allUsers, doctorList]) => { setUsers(allUsers); setDoctors(doctorList.doctors || []); }).catch((err) => setError(err.message));
  }, [token]);
  const assignedIds = new Set(doctors.map((doctor) => String(doctor.userId?._id || doctor.userId)));
  const doctorUsers = users.filter((user) => user.role === "Doctor" && !assignedIds.has(String(user._id)));
  const changeScheduleDay = (day) => setForm((old) => ({
    ...old,
    weeklySchedule: old.weeklySchedule.some((entry) => entry.dayOfWeek === day)
      ? old.weeklySchedule.filter((entry) => entry.dayOfWeek !== day)
      : [...old.weeklySchedule, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }],
  }));
  const changeScheduleTime = (day, key, value) => setForm((old) => ({
    ...old,
    weeklySchedule: old.weeklySchedule.map((entry) => entry.dayOfWeek === day ? { ...entry, [key]: value } : entry),
  }));
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await request("/doctors", { token, method: "POST", body: { ...form, availableDays: form.weeklySchedule.map((entry) => entry.dayOfWeek), experience: Number(form.experience), consultationFee: Number(form.consultationFee) } });
      setForm({ userId: "", specialization: "", qualification: "", experience: "", consultationFee: "", weeklySchedule: [] });
      await onCreated();
      const doctorList = await request("/doctors"); setDoctors(doctorList.doctors || []);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="admin-form-card"><div className="section-heading compact-heading"><div><p className="eyebrow">DIRECTORY SETUP</p><h2>Add a doctor profile</h2><p>Only existing accounts with the Doctor role can be added.</p></div><span className="heading-icon">＋</span></div>
    {error && <div className="error-banner">{error}</div>}
    {doctorUsers.length === 0 ? <div className="info-banner">No unassigned Doctor accounts found. An Admin must first provision a user account with the Doctor role.</div> : <form className="doctor-admin-form" onSubmit={submit}>
      <label>Doctor account<select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required><option value="">Select account</option>{doctorUsers.map((user) => <option value={user._id} key={user._id}>{user.name} · {user.email}</option>)}</select></label>
      <label>Specialization<input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required placeholder="e.g. Cardiology" /></label>
      <label>Qualification<input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} required placeholder="e.g. MBBS, MD" /></label>
      <label>Experience (years)<input type="number" min="0" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} required /></label>
      <label>Consultation fee (₹)<input type="number" min="0" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} required /></label>
      <fieldset className="schedule-field"><legend>Weekly appointment hours · 1-hour slots</legend><div className="weekly-schedule-grid">{WEEKDAYS.map((day) => { const entry = form.weeklySchedule.find((item) => item.dayOfWeek === day); return <div className="schedule-row" key={day}><label className="schedule-day"><input type="checkbox" checked={!!entry} onChange={() => changeScheduleDay(day)} />{day}</label><input aria-label={`${day} start time`} type="time" step="3600" disabled={!entry} value={entry?.startTime || "09:00"} onChange={(e) => changeScheduleTime(day, "startTime", e.target.value)} /><span>to</span><input aria-label={`${day} end time`} type="time" step="3600" disabled={!entry} value={entry?.endTime || "17:00"} onChange={(e) => changeScheduleTime(day, "endTime", e.target.value)} /></div>; })}</div></fieldset>
      <button className="button button-primary" disabled={busy || form.weeklySchedule.length === 0}>{busy ? "Saving…" : "Create doctor profile"}<span>→</span></button>
    </form>}
  </section>;
}

function AdminScheduleEditor({ doctor, token, onSaved }) {
  const makeInitialSchedule = () => doctor.weeklySchedule?.length
    ? doctor.weeklySchedule.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }))
    : (doctor.availableDays || []).map((dayOfWeek) => ({ dayOfWeek, startTime: "09:00", endTime: "17:00" }));
  const [schedule, setSchedule] = useState(makeInitialSchedule);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const changeDay = (day) => setSchedule((old) => old.some((entry) => entry.dayOfWeek === day)
    ? old.filter((entry) => entry.dayOfWeek !== day)
    : [...old, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }]);
  const changeTime = (day, key, value) => setSchedule((old) => old.map((entry) => entry.dayOfWeek === day ? { ...entry, [key]: value } : entry));
  async function save(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await request(`/doctors/${doctor._id}`, { token, method: "PUT", body: { weeklySchedule: schedule } });
      await onSaved();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <details className="schedule-editor"><summary>Edit hours</summary><form onSubmit={save}>
    <div className="weekly-schedule-grid">{WEEKDAYS.map((day) => { const entry = schedule.find((item) => item.dayOfWeek === day); return <div className="schedule-row" key={day}><label className="schedule-day"><input type="checkbox" checked={!!entry} onChange={() => changeDay(day)} />{day}</label><input aria-label={`${day} start time`} type="time" step="3600" disabled={!entry} value={entry?.startTime || "09:00"} onChange={(e) => changeTime(day, "startTime", e.target.value)} /><span>to</span><input aria-label={`${day} end time`} type="time" step="3600" disabled={!entry} value={entry?.endTime || "17:00"} onChange={(e) => changeTime(day, "endTime", e.target.value)} /></div>; })}</div>
    {error && <p className="inline-error">{error}</p>}<button className="button button-primary" disabled={busy || schedule.length === 0}>{busy ? "Saving…" : "Save hours"}</button>
  </form></details>;
}

function Dashboard({ session, onLogout }) {
  const [section, setSection] = useState(session.user.role === "Patient" ? "doctors" : "appointments");
  const [doctors, setDoctors] = useState([]); const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [updatingId, setUpdatingId] = useState("");
  const role = session.user.role;
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [doctorResult, appointmentResult] = await Promise.allSettled([
        request("/doctors"), request("/appointments", { token: session.token }),
      ]);
      if (doctorResult.status === "fulfilled") setDoctors(doctorResult.value.doctors || []);
      else setError(doctorResult.reason.message);
      if (appointmentResult.status === "fulfilled") setAppointments(appointmentResult.value.appointments || []);
      else { setError(appointmentResult.reason.message); if (/token|auth|access/i.test(appointmentResult.reason.message)) onLogout(); }
    } catch (err) { setError(err.message); if (/token|auth|access/i.test(err.message)) onLogout(); }
    finally { setLoading(false); }
  }, [session.token, onLogout]);
  useEffect(() => { load(); }, [load]);
  const stats = useMemo(() => ({ total: appointments.length, upcoming: appointments.filter((item) => new Date(item.appointmentDate) > new Date() && !["Cancelled", "Completed"].includes(item.status)).length, doctors: doctors.length }), [appointments, doctors]);

  async function book(doctorId, appointmentDay, slotStartTime, reason) {
    const appointmentDate = new Date(`${appointmentDay}T${slotStartTime}:00`).toISOString();
    await request("/appointments", { token: session.token, method: "POST", body: { doctorId, appointmentDay, slotStartTime, appointmentDate, reason } });
    setNotice("Appointment booked successfully."); setSection("appointments"); await load();
  }
  async function changeStatus(id, status) {
    const previousStatus = appointments.find((item) => item._id === id)?.status;
    setError(""); setNotice(""); setUpdatingId(id);
    try {
      const result = await request(`/appointments/${id}/status`, { token: session.token, method: "PATCH", body: { status } });
      setAppointments((current) => current.map((item) => item._id === id ? { ...item, status: result.appointment?.status || status } : item));
      setNotice(`Appointment ${status.toLowerCase()} successfully.`);
    } catch (err) {
      setError(err.message);
      if (previousStatus) setAppointments((current) => current.map((item) => item._id === id ? { ...item, status: previousStatus } : item));
    } finally { setUpdatingId(""); }
  }

  const nav = role === "Patient" ? [{ id: "doctors", label: "Find a doctor", icon: "⌕" }, { id: "appointments", label: "My appointments", icon: "▦" }] : [{ id: "appointments", label: "Appointments", icon: "▦" }, ...(role === "Admin" ? [{ id: "doctors", label: "Doctor directory", icon: "✚" }] : [])];
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">✚</span><span>Dr. Ramnivas Gupta Hospital</span></div><div className="workspace-label">WORKSPACE</div><nav>{nav.map((item) => <button key={item.id} className={section === item.id ? "nav-item active" : "nav-item"} onClick={() => setSection(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{section === item.id && <span className="nav-active-mark" />}</button>)}</nav><div className="sidebar-bottom"><div className="support-card"><div className="support-icon">♡</div><strong>Here for your health</strong><p>Your care team is just a visit away.</p></div><button className="profile-row" onClick={onLogout}><span className="avatar">{initials(session.user.name)}</span><span className="profile-text"><strong>{session.user.name}</strong><small>{role}</small></span><span className="logout-icon">↗</span></button></div></aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> {section === "doctors" ? (role === "Admin" ? "Doctor directory" : "Find a doctor") : role === "Patient" ? "My appointments" : "Appointments"}</div><div className="topbar-right"><span className="secure-label"><span>●</span> Secure patient portal</span><span className="topbar-avatar">{initials(session.user.name)}</span></div></header>
      <div className="page-content"><div className="welcome-row"><div><p className="eyebrow">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</p><h1>{greeting()}, {session.user.name?.split(" ")[0] || "there"}<span className="wave">✦</span></h1><p className="page-subtitle">{role === "Patient" ? "Your health journey, organized in one place." : role === "Doctor" ? "Here is what is happening with your patients." : "Here is an overview of your hospital today."}</p></div>{role === "Patient" && <button className="button button-primary" onClick={() => setSection("doctors")}>＋ Book an appointment</button>}</div>
        <section className="dashboard-care-banner"><div className="dashboard-care-copy"><p className="eyebrow">CARE THAT CONNECTS</p><h2>{role === "Patient" ? "A trusted doctor is just a visit away." : "Care works better when we work together."}</h2><p>{role === "Patient" ? "Find the right specialist and book a time that works for you." : "Every appointment is a chance to make a difference for a patient."}</p><button className="care-banner-link" onClick={() => setSection(role === "Patient" ? "doctors" : "appointments")}>{role === "Patient" ? "Explore doctors" : "View appointments"}<span>→</span></button></div><div className="dashboard-care-image"><img src="https://images.pexels.com/photos/7108157/pexels-photo-7108157.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Doctor speaking with a patient during a clinic visit" /><a href="https://www.pexels.com/photo/a-doctor-talking-to-his-patient-7108157/" target="_blank" rel="noreferrer">Photo: Pavel Danilyuk / Pexels</a></div></section>
        {notice && <div className="notice dismissible">{notice}<button onClick={() => setNotice("")}>×</button></div>}{error && <div className="error-banner dismissible">{error}<button onClick={() => setError("")}>×</button></div>}
        <div className="stats-grid"><StatCard label={role === "Patient" ? "My appointments" : "Total appointments"} value={stats.total} icon="▦" tone="blue" detail={role === "Patient" ? "Across your care" : "In your workspace"} /><StatCard label="Upcoming" value={stats.upcoming} icon="◷" tone="mint" detail="Scheduled visits" /><StatCard label="Doctors" value={stats.doctors} icon="✚" tone="peach" detail="In the directory" /></div>
        {section === "doctors" && role !== "Doctor" ? <>
          {role === "Admin" && <AdminDoctorForm token={session.token} onCreated={load} />}
          <div className="section-heading"><div><p className="eyebrow">OUR CARE TEAM</p><h2>{role === "Admin" ? "Doctor directory" : "Find your doctor"}</h2><p>{role === "Admin" ? "Doctors available for appointments." : "Choose a specialist and book a time that works for you."}</p></div><span className="result-count">{doctors.length} doctors</span></div>
          {loading ? <div className="loading-state">Loading doctors…</div> : doctors.length ? <div className="doctor-grid">{doctors.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} onBook={book} token={session.token} isAdmin={role === "Admin"} onScheduleSaved={load} />)}</div> : <div className="empty-state"><div className="empty-icon">✚</div><h3>No doctor profiles yet</h3><p>The hospital team has not added any doctors to the directory.</p></div>}
        </> : <>
          <div className="section-heading"><div><p className="eyebrow">{role === "Patient" ? "YOUR CARE" : "SCHEDULE"}</p><h2>{role === "Patient" ? "My appointments" : role === "Doctor" ? "Your patient appointments" : "All appointments"}</h2><p>{role === "Patient" ? "Review your visits and appointment status." : "Review scheduled visits and keep appointment status up to date."}</p></div><button className="button button-light" onClick={load}>↻ <span className="refresh-label">Refresh</span></button></div>
          <section className="appointments-card"><div className="card-toolbar"><div className="card-title"><span className="toolbar-icon">▦</span><strong>Appointment schedule</strong><span className="count-chip">{appointments.length}</span></div><span className="live-label"><span /> Live data</span></div>{loading ? <div className="loading-state">Loading appointments…</div> : <AppointmentsTable appointments={appointments} role={role} onStatusChange={changeStatus} updatingId={updatingId} />}</section>
        </>}
        <footer className="page-footer"><span>Dr. Ramnivas Gupta Hospital</span><span>Confidential · For authorized users</span></footer>
      </div>
    </main>
  </div>;
}

function StatCard({ label, value, icon, tone, detail }) { return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></article>; }
function initials(name = "") { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CP"; }
function greeting() { const hour = new Date().getHours(); return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"; }
function formatDate(value) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function localDateString(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatTime(value) { return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${value}:00`)); }

function Root() {
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } });
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => { const updatePath = () => setPath(window.location.pathname); window.addEventListener("popstate", updatePath); return () => window.removeEventListener("popstate", updatePath); }, []);
  const login = (value) => { localStorage.setItem(SESSION_KEY, JSON.stringify(value)); setSession(value); };
  const logout = () => { localStorage.removeItem(SESSION_KEY); setSession(null); };
  if (path !== "/") return <main className="not-found-page"><div className="not-found-content"><img src="/images/notfound.svg" alt="Page not found" /><p className="eyebrow">404 · PAGE NOT FOUND</p><h1>This page isn’t here</h1><p>The address may be incorrect, or the page may have moved.</p><a className="button button-primary" href="/">Back to CarePoint <span>→</span></a></div></main>;
  return session?.token && session?.user ? <Dashboard session={session} onLogout={logout} /> : <AuthScreen onLogin={login} />;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><Root /></React.StrictMode>);
