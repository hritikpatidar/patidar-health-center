export function timeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToLabel(totalMinutes) {
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const suffix = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function appointmentTimeToMinutes(value) {
  const twentyFourHour = timeToMinutes(value);
  if (twentyFourHour !== null) return twentyFourHour;

  const match = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i.exec(value || "");
  if (!match) return null;
  const hour = Number(match[1]) % 12;
  return (hour + (match[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(match[2]);
}

export function getScheduleSlots(startTime, endTime, consultationMinutes) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const duration = Number(consultationMinutes);
  if (start === null || end === null || end <= start || !Number.isInteger(duration) || duration <= 0) {
    return [];
  }

  const slots = [];
  for (let time = start; time + duration <= end; time += duration) {
    slots.push(minutesToLabel(time));
  }
  return slots;
}

export function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function formatDateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}
