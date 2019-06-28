//common functionality of all Activity
import activityService from "../../services/activityLog/activityLog.service";
import { STAGES } from "../activityType";
import schedulerService from "../../services/scheduler/scheduler.service";
import calendarService from "../../services/calendarService/calendar.service";
import { ACTIVITY_LOG_STATUS, DEFAULT, EVENT_IS } from "../../../constant";
const { NotificationSdk } = require("../../notificationSdk");
const log = require("../../../libs/log")("ACTIVITY_SDK");

const notify = (participants, payload) => {
  //preapare notification data according to eventcategory
  const { participantOne, participantTwo } = participants;
  if (participantOne) {
    log.info(`going to notify: ${payload} to ${participantOne}`);
    NotificationSdk.execute(participantOne, payload);
  }
  if (participantTwo) {
    log.info(`going to notify: ${payload} to ${participantTwo}`);
    NotificationSdk.execute(participantTwo, payload);
  }
  return;
};

const logActivity = async ({
  eventId,
  data,
  message,
  status = ACTIVITY_LOG_STATUS.PENDING,
  updatedBy = DEFAULT
}) => {
  await activityService.create({
    eventId: eventId,
    data: data,
    message: message,
    status: status,
    updatedBy: updatedBy
  });
};

export const onCreate = async data => {
  log.info(`onCreate activity:, ${data}`);
  //fetch all calendar event here if it is
  //and send it to cronofy,if this is calendar related event, but that should be goes into scheduler, because we are creating multiple schedule event from scheduler.

  //add entry to the activity log
  const message = `New ${data.eventCategory} Scheduled`;

  const { participantOne, participantTwo, _id: eventId } = data;
  //add to activity log
  const result = await logActivity({
    eventId: data._id,
    data: data,
    message: message,
    status: ACTIVITY_LOG_STATUS.PENDING,
    updatedBy: participantOne
  });
  notify(
    { participantOne, participantTwo },
    { message: message, data: data, eventIs: EVENT_IS.CREATED }
  );
  const events = await schedulerService.getScheduleEventsByEventId(eventId);
  events.forEach(event => {
    calendarService.upsertCalendarEvent(
      { participantOne, participantTwo },
      { event: event }
    );
  });
  log.info(message);
};

export const onCancel = async data => {
  const message = `Following Event is canceled`;
  //add to activity log
  const result = await logActivity({
    eventId: data.eventId,
    data: data,
    message: message,
    status: ACTIVITY_LOG_STATUS.CANCELLED,
    updatedBy: `${data.userId}`
  });
  const {
    data: { participantOne, participantTwo },
    _id: eventId
  } = data;

  notify(
    { participantOne, participantTwo },
    { message: message, data: data, eventIs: EVENT_IS.CANCEL }
  );
  calendarService.deleteCalendarEvent(
    { participantOne, participantTwo },
    { event: data }
  );
  //FOR ALL CANCEL
  // const events = await schedulerService.getScheduleEventsByEventId(eventId);
  // events.forEach(event => {
  //   calendarService.deleteCalendarEvent(
  //     { participantOne, participantTwo },
  //     { event: data }
  //   );
  // });
  log.info(message);
};

export const onRescheduled = async data => {
  const message = `Following event is rescheduled`;
  //add to activity log
  const result = await logActivity({
    eventId: data.eventId,
    data: data,
    message: message,
    updatedBy: `${data.userId}`
  });
  const {
    data: { participantOne, participantTwo }
  } = data;
  notify(
    { participantOne, participantTwo },
    { message: message, data: data, eventIs: EVENT_IS.RESCHEDULED }
  );
  log.info(message);
};

export const onStart = async data => {
  const message = `Following event is going to start`;
  //add to activity log
  const result = await logActivity({
    eventId: data.eventId,
    data: data,
    message: message,
    status: ACTIVITY_LOG_STATUS.PENDING
  });
  const {
    data: { participantOne, participantTwo }
  } = data;
  notify(
    { participantOne, participantTwo },
    { message: message, data: data, eventIs: EVENT_IS.START }
  );
  log.info(message);
};

export const onPassed = async data => {
  const message = `Following  event has passed.`;
  //add to activity log
  const result = await logActivity({
    eventId: data.eventId,
    data: data,
    message: message,
    status: ACTIVITY_LOG_STATUS.PENDING
  });
  const {
    data: { participantOne, participantTwo }
  } = data;
  notify(
    { participantOne, participantTwo },
    { message: message, data: data, eventIs: EVENT_IS.PASSED }
  );
  log.info(message);
};

export const onComplete = async data => {
  const message = `Following event is Completed.`;

  //add to activity log
  const result = await logActivity({
    eventId: data.eventId,
    data: data,
    message: message,
    status: ACTIVITY_LOG_STATUS.COMPLETED,
    updatedBy: `${data.userId}`
  });
  const {
    data: { participantOne, participantTwo }
  } = data;
  notify(
    { participantOne, participantTwo },
    { message: message, data: data, eventIs: EVENT_IS.COMPLETE }
  );
  log.info(message);
};

export const onMarkInComplete = async data => {
  const message = `Following event is marked as incomplete`;
  //add to activity log
  const result = await logActivity({
    eventId: data.eventId,
    data: data,
    message: message,
    status: ACTIVITY_LOG_STATUS.PENDING,
    updatedBy: `${data.userId}`
  });
  const {
    data: { participantOne, participantTwo }
  } = data;
  notify(
    { participantOne, participantTwo },
    { message: message, data: data, eventIs: EVENT_IS.MARKINCOMPLETE }
  );
  log.info(message);
};

export const onUpdate = async data => {
  const message = `Following event is updated`;
  //add to activity log
  const { userId = DEFAULT } = data;
  const result = await logActivity({
    eventId: data.eventId,
    data: data,
    message: message,
    updatedBy: `${userId}`
  });
  const {
    data: { participantOne, participantTwo }
  } = data;
  notify(
    { participantOne, participantTwo },
    { message: message, data: data, eventIs: EVENT_IS.UPDATED }
  );
  calendarService.upsertCalendarEvent(
    { participantOne, participantTwo },
    { event: data }
  );
  log.info(message);
};
