import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../Common/Layout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export default function LoginRegister() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fname: "",
    lname: "",
    email: "",
    mobile: "",
    password: "",
    cpassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event, updateForm) => {
    const { name, value } = event.target;
    updateForm((form) => ({ ...form, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/user/login`, loginForm);
      if (data.user?.user_type === "Super_Admin") {
        setError("This account cannot sign in as a patient.");
        return;
      }

      localStorage.setItem("jwt-normal-user", JSON.stringify(data));
      navigate("/contact");
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Unable to sign in. Check your API URL and credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (registerForm.password !== registerForm.cpassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      const patientData = { ...registerForm };
      delete patientData.cpassword;
      const { data } = await axios.post(`${API_BASE_URL}/user/create`, patientData);
      setLoginForm({ email: registerForm.email, password: "" });
      setRegisterForm({ fname: "", lname: "", email: "", mobile: "", password: "", cpassword: "" });
      setIsRegistering(false);
      setSuccess(data.msg || "Registration successful. Please sign in.");
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchForm = (registering) => {
    setIsRegistering(registering);
    setError("");
    setSuccess("");
  };

  return (
    <Layout>
      <main className="container py-5">
        <section className="auth-card mx-auto">
          <h2>{isRegistering ? "Patient Registration" : "Patient Login"}</h2>
          <p className="text-muted">
            {isRegistering ? "Create an account to book and manage appointments." : "Sign in to book and manage appointments."}
          </p>
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {success && <div className="alert alert-success" role="status">{success}</div>}

          {isRegistering ? (
            <form onSubmit={handleRegister}>
              <label className="form-label" htmlFor="patient-fname">First name</label>
              <input id="patient-fname" className="form-control mb-3" type="text" name="fname" value={registerForm.fname} onChange={(event) => handleChange(event, setRegisterForm)} required autoComplete="given-name" />

              <label className="form-label" htmlFor="patient-lname">Last name</label>
              <input id="patient-lname" className="form-control mb-3" type="text" name="lname" value={registerForm.lname} onChange={(event) => handleChange(event, setRegisterForm)} required autoComplete="family-name" />

              <label className="form-label" htmlFor="register-email">Email address</label>
              <input id="register-email" className="form-control mb-3" type="email" name="email" value={registerForm.email} onChange={(event) => handleChange(event, setRegisterForm)} required autoComplete="email" />

              <label className="form-label" htmlFor="patient-mobile">Mobile</label>
              <input id="patient-mobile" className="form-control mb-3" type="tel" name="mobile" value={registerForm.mobile} onChange={(event) => handleChange(event, setRegisterForm)} required autoComplete="tel" />

              <label className="form-label" htmlFor="register-password">Password</label>
              <input id="register-password" className="form-control mb-3" type="password" name="password" value={registerForm.password} onChange={(event) => handleChange(event, setRegisterForm)} required minLength={6} autoComplete="new-password" />

              <label className="form-label" htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" className="form-control mb-4" type="password" name="cpassword" value={registerForm.cpassword} onChange={(event) => handleChange(event, setRegisterForm)} required minLength={6} autoComplete="new-password" />

              <button className="btn btn-primary w-100" type="submit" disabled={loading}>{loading ? "Please wait..." : "Register"}</button>
              <p className="mt-3 mb-0 text-center">
                Already a member? <button className="btn btn-link p-0" type="button" onClick={() => switchForm(false)}>Sign in</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <label className="form-label" htmlFor="patient-email">Email address</label>
              <input id="patient-email" className="form-control mb-3" type="email" name="email" value={loginForm.email} onChange={(event) => handleChange(event, setLoginForm)} required autoComplete="username" />

              <label className="form-label" htmlFor="patient-password">Password</label>
              <input id="patient-password" className="form-control mb-4" type="password" name="password" value={loginForm.password} onChange={(event) => handleChange(event, setLoginForm)} required autoComplete="current-password" />

              <button className="btn btn-primary w-100" type="submit" disabled={loading}>{loading ? "Please wait..." : "Login"}</button>
              <p className="mt-3 mb-0 text-center">
                Not a member yet? <button className="btn btn-link p-0" type="button" onClick={() => switchForm(true)}>Register now</button>
              </p>
            </form>
          )}
          <p className="mt-3 mb-0"><Link to="/doctor-login">Doctor login</Link></p>
        </section>
      </main>
    </Layout>
  );
}
