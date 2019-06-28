export const getAddAppointmentURL = () => {
  return "/appointments";
};

export const getAddReminderURL = () => {
  return "/reminders";
};

export const getAppointments = (userId, startDate, endDate) => {
  return `/appointments?userId=${userId}&startDate=${startDate}&endDate=${endDate}`;
};

export const getAppointmentsHistory = userId => {
  return `users/${userId}/appointments/history`;
};

export const getCancelAppointment = (eventId, all) => {
  return `/appointments/delete?id=${eventId}&all=${all}`;
};

export const getCancelReminderURL = (eventId, all) => {
  return `/reminders/delete?id=${eventId}&all=${all}`;
};

export const getCreateAdverseEventURL = () => {
  return `/adverse-events`;
};

export const getRescheduleAppointmentURL = id => {
  return `/appointments/${id}/re-schedule`;
};

export const getEditNotesURL = id => {
  return `/appointments/${id}/edit-notes`;
};

export const getEditReminderURL = id => {
  return `/reminders/${id}/edit`;
};

export const getEditNotesReminderURL = id => {
  return `/reminders/${id}/edit-notes`;
};

export const setAppointmentStatusURL = eventId => {
  return `/events/${eventId}/status`;
};

export const getFetchAdverseEvent = userId => {
  return `/users/${userId}/adverse-events`;
};

export const getLastEditedEvent = () => {
  return "/events/lastEdited";
};

export const getEventUsers = eventId => {
  return `/events/${eventId}/eventUsers`;
};

export const getEventDataById = eventId => {
  return `/events/eventData/${eventId}`;
};

export const getBookedSlotsURL = () => {
  return `/events/booked-timeslot`;
};

export const addVideoRoomParticipantsURL = eventId => {
  return `/events/${eventId}/addVideoRoomParticipants`;
};
