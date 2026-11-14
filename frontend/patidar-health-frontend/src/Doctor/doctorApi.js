import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export function getDoctorSession() {
  try {
    const storedSession = window.localStorage.getItem("doctor-login");
    if (!storedSession) return null;

    const session = JSON.parse(storedSession);
    if (!session?.token || !session?.user) return null;
    return session;
  } catch {
    return null;
  }
}

export function getDoctorName(session) {
  return [session?.user?.fname, session?.user?.lname].filter(Boolean).join(" ") || "Doctor";
}

export function getDoctorErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Your session has expired or is not authorized. Please sign in again.";
    }

    return error.response?.data?.msg
      || (error.code === "ERR_NETWORK"
        ? "Unable to connect to the server. Check your connection and try again."
        : "We couldn't load this information. Please try again.");
  }

  return "Something went wrong. Please try again.";
}

export async function fetchDoctorAppointments(session, page = 1, size = 10) {
  const doctorName = encodeURIComponent(getDoctorName(session));
  const response = await axios.get(
    `${API_BASE_URL}/appointment/find/${doctorName}?page=${page}&size=${size}`,
    {
      headers: { authorization: `Bearer ${session.token}` },
    },
  );
  return response.data;
}
