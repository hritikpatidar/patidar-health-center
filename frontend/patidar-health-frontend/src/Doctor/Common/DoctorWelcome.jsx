
import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getDoctorName, getDoctorSession } from "../doctorApi";
import "../DoctorPortal.css";

const pageDetails = {
  "/doctor/dashboard": { title: "Dashboard", description: "Your practice at a glance" },
  "/doctor/appointments": { title: "Appointments", description: "Review your patient appointments" },
  "/doctor/schedule": { title: "Schedule", description: "Manage your availability" },
};

export default function DoctorWelcome(props) {
  const [profileActive, setProfileActive] = useState(false);
  const [asideActive, setAsideActive] = useState(false);
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const currentSession = getDoctorSession();
    if (!currentSession) {
      navigate("/doctor-login", { replace: true });
      return;
    }
    setSession(currentSession);
  }, [navigate]);

  const logoutHandler = () => {
    window.localStorage.removeItem("doctor-login");
    navigate("/doctor-login", { replace: true });
  };
  const page = pageDetails[pathname] || pageDetails["/doctor/dashboard"];

  return (
    <div className="doctor-portal">
      {asideActive && <button className="doctor-sidebar-backdrop" aria-label="Close navigation" onClick={() => setAsideActive(false)} />}
      <aside className={`doctor-sidebar ${asideActive ? "is-open" : ""}`}>
        <div className="doctor-brand">
          <span className="doctor-brand-mark"><span className="material-icons-sharp">medical_services</span></span>
          <span>Patidar<span className="doctor-brand-light"> Health</span></span>
          <button className="doctor-sidebar-close" aria-label="Close navigation" onClick={() => setAsideActive(false)}>
            <span className="material-icons-sharp">close</span>
          </button>
        </div>
        <p className="doctor-nav-label">WORKSPACE</p>
        <nav className="doctor-sidebar-nav" aria-label="Doctor navigation">
          <NavLink end to="/doctor/dashboard" onClick={() => setAsideActive(false)}>
            <span className="material-icons-sharp">grid_view</span><span>Dashboard</span>
          </NavLink>
          <NavLink to="/doctor/appointments" onClick={() => setAsideActive(false)}>
            <span className="material-icons-sharp">calendar_month</span><span>Appointments</span>
          </NavLink>
          <NavLink to="/doctor/schedule" onClick={() => setAsideActive(false)}>
            <span className="material-icons-sharp">event_note</span><span>Schedule</span>
          </NavLink>
        </nav>
        <div className="doctor-sidebar-bottom">
          <div className="doctor-sidebar-note">
            <span className="material-icons-sharp">health_and_safety</span>
            <span>Care that keeps<br />patients first.</span>
          </div>
          <button type="button" className="doctor-logout" onClick={logoutHandler}>
            <span className="material-icons-sharp">logout</span><span>Sign out</span>
          </button>
        </div>
      </aside>
      <div className="doctor-main">
        <header className="doctor-topbar">
          <div className="doctor-topbar-heading">
            <button type="button" className="doctor-menu-button" aria-label="Open navigation" onClick={() => setAsideActive(true)}>
              <span className="material-icons-sharp">menu</span>
            </button>
            <div>
              <span className="doctor-eyebrow">DOCTOR PORTAL</span>
              <h1>{page.title}</h1>
            </div>
          </div>
          <div className="doctor-topbar-profile">
            <div className="doctor-avatar">{getDoctorName(session).slice(0, 1).toUpperCase()}</div>
            <div className="doctor-profile-copy">
              <strong>{getDoctorName(session)}</strong>
              <span>Healthcare professional</span>
            </div>
            <button
              type="button"
              className="doctor-profile-menu"
              aria-label="Sign out"
              aria-expanded={profileActive}
              onClick={() => setProfileActive(!profileActive)}
            >
              <span className="material-icons-sharp">more_vert</span>
            </button>
            {profileActive && (
              <div className="doctor-profile-dropdown">
                <span>{getDoctorName(session)}</span>
                <button type="button" onClick={logoutHandler}>
                  <span className="material-icons-sharp">logout</span> Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="doctor-content">
          <div className="doctor-page-intro">
            <div>
              <h2>{page.title}</h2>
              <p>{page.description}</p>
            </div>
            <div className="doctor-today">
              <span className="material-icons-sharp">today</span>
              {new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" }).format(new Date())}
            </div>
          </div>
          {props.children}
        </main>
      </div>
    </div>
  );
}
