const eventService = require("../../services/event/event.service");
const userService = require("../../services/user/user.service");
const Response = require("../../helper/responseFormat");
const errMessages = require("../../../config/messages.json").errMessages;
const { Proxy_Sdk, EVENTS } = require("../../proxySdk");
const { ActivitySdk, STAGES } = require("../../activitySdk");
const getEventDaysList = require("../../helper/eventScheduleGenerator");
import moment from "moment";
import scheduleService from "../../services/scheduler/scheduler.service";
import { EVENT_TYPE } from "../../../constant";
import { handleRescheduleAll } from "./helper";

const COMPLETED = "completed";

class AppointmentController {
  eventCategory = "appointment";
  create = async (req, res) => {
    try {
      const { body, userDetails } = req;
      const {
        participantTwo,
        startTime,
        endTime,
        startDate,
        endDate,
        activityType,
        activityMode,
        repeat,
        repeatDays,
        repeatInterval,
        notes
      } = body;

      const { userId: participantOne } = userDetails;

      //create link of this event
      const dataToSave = {
        eventCategory: this.eventCategory,
        participantOne,
        participantTwo,
        startDate: startDate,
        endDate: endDate,
        details: {
          activityMode,
          activityType,
          repeat,
          repeatDays,
          repeatInterval,
          startTime,
          endTime,
          notes
        },
        link: ""
      };

      const appt = await eventService.addEvent(dataToSave);
      const data = {
        eventType: EVENT_TYPE.APPOINTMENT,
        activityType,
        stage: STAGES.INIT,
        data: appt
      };
      ActivitySdk.execute(data);
      await Proxy_Sdk.scheduleEvent({ data: appt });
      const response = new Response(true, 200);
      response.setMessage("Appointment created succesfully");
      return res.send(response.getResponse());
    } catch (err) {
      let payload = {
        error: "something went wrong!",
        code: 500
      };
      let response = new Response(false, payload.code);
      response.setError(payload.error);
      return res.status(payload.code).json(response.getResponse());
    }
  };

  async getAppointments(req, res) {
    const { userId, startDate, endDate } = req.query;
    try {
      const appointmentsData = await eventService.getEventsByuserId({
        eventCategories: ["appointment"],
        userId,
        startDate: startDate,
        endDate: endDate
      });

      let appointments = {};
      let schedulesEvents = {};
      let scheduleEventListByDate = {};
      const eventList = appointmentsData.map(appointment => appointment._id);
      //const participants = new Set(); //for future
      for (const appointment of appointmentsData) {
        const { _id, participantOne, participantTwo } = appointment;
        // participants.add(participantOne);
        // participants.add(participantTwo);
        const scheduleEventList = await scheduleService.getScheduleEvent({
          eventId: _id,
          startDate: startDate,
          endDate: endDate
        });
        scheduleEventList.forEach(scheduleEvent => {
          const {
            _id,
            eventType,
            eventId,
            startTime,
            endTime,
            data,
            status
          } = scheduleEvent;
          schedulesEvents[_id] = {
            id: _id,
            eventType: eventType,
            eventId: eventId,
            startTime: startTime,
            endTime: endTime,
            data: data,
            status: status
          };
        });
        appointments[appointment._id] = scheduleEventList.map(
          scheduleEvent => scheduleEvent._id
        );
      }

      const scheduleEventListData = await scheduleService.getScheduleEventByEventIdGroupByDate(
        { eventIds: eventList, startDate, endDate }
      );

      scheduleEventListData.forEach(scheduleEvent => {
        const { _id, scheduleEvents = [] } = scheduleEvent;
        scheduleEventListByDate[_id] = scheduleEvents;
      });

      //const users = userService.getBasicInfo();//

      const response = new Response(true, 200);
      response.setData({
        appointments: appointments,
        events: schedulesEvents,
        scheduleEventListByDate: scheduleEventListByDate
        //users: users
      });

      return res.send(response.getResponse());
    } catch (err) {
      let payload = {
        error: "something went wrong!",
        code: 500
      };
      let response = new Response(false, payload.code);
      response.setError(payload.error);
      return res.status(payload.code).json(response.getResponse());
    }
  }

  async getAppointmentHistory(req, res) {
    try {
      const { userId } = req.params;
      const { query: startDate } = req.query;

      const appointmentData = await scheduleService.getAppointmentHistoryGroupByDate(
        { startDate, userId }
      );

      let events = {};
      let appointmentHistory = {};
      let historyIds = [];
      let participants = new Set(); //for future

      appointmentData.forEach(appointment => {
        const { _id, scheduleEvents, data } = appointment;
        const newScheduleEvents = scheduleEvents.slice().reverse();

        appointmentHistory[_id] = newScheduleEvents;

        historyIds.push(_id);

        data.forEach(eventData => {
          const {
            _id,
            eventType,
            eventId,
            startTime,
            endTime,
            data,
            status
          } = eventData;
          const { participantOne, participantTwo } = data;
          participants.add(participantOne);
          participants.add(participantTwo);
          events[_id] = {
            id: _id,
            eventType: eventType,
            eventId: eventId,
            startTime: startTime,
            endTime: endTime,
            data: data,
            status: status
          };
        });
      });

      let users = {};
      for (const id of participants) {
        const usersData = await userService.getUserById(id); //need to make batch get
        users[id] = {
          basicInfo: usersData.basicInfo
        };
      }

      const response = new Response(true, 200);
      response.setData({
        events: events,
        appointmentHistory: appointmentHistory,
        historyIds: historyIds,
        users: users
      });
      return res.send(response.getResponse());
    } catch (err) {
      let payload = {
        error: "something went wrong!",
        code: 500
      };
      let response = new Response(false, payload.code);
      response.setError(payload.error);
      return res.status(payload.code).json(response.getResponse());
    }
  }

  async complete(req, res) {
    const { eventId } = req.body;
    const { userId } = req.userDetails;
    const result = await scheduleService.scheduleEventMarkAsComplete({
      id: eventId
    });

    const {
      data: { activityType }
    } = result;
    const data = {
      eventType: EVENT_TYPE.APPOINTMENT,
      activityType,
      stage: STAGES.COMPLETE,
      data: { ...result, userId }
    };

    const handled = await ActivitySdk.execute(data);

    const response = new Response(true, 200);
    response.setMessage("Appointment Cancelled");
    return res.send(response.getResponse());
  }

  async setStatus(req, res) {
    try {
      const { eventId } = req.params;
      const { status } = req.body;
      const { userId } = req.userDetails;
      const result = await scheduleService.setAppointmentStatus({
        id: eventId,
        status: status,
        userId
      });
      const stage = status === COMPLETED ? STAGES.COMPLETE : STAGES.IN_COMPLETE;

      const {
        data: { activityType }
      } = result;
      const data = {
        eventType: EVENT_TYPE.APPOINTMENT,
        activityType,
        stage: stage,
        data: result
      };
      const handled = await ActivitySdk.execute(data);

      const response = new Response(true, 200);
      response.setData({ events: { [eventId]: result } });
      response.setMessage("Appointment Updated ");
      return res.send(response.getResponse());
    } catch (err) {
      const payload = {
        code: 500,
        error: errMessages.INTERNAL_SERVER_ERROR
      };
      const response = new Response(false, payload.code);
      response.setError(payload.error);
      return res.status(payload.code).json(response.getResponse());
    }
  }

  async cancel(req, res) {
    try {
      const { id, all } = req.query;
      const { reason } = req.body;
      const { userId } = req.userDetails;
      let result = {};
      if (all === "false") {
        result = await scheduleService.markAllEventsAsCancel({
          id: id
        });
      } else if (all === "true") {
        result = await scheduleService.scheduleEventMarkAsCancel({
          id: id,
          reason: reason
        });

        const { data: { activityType = "" } = {} } = result;
        const data = {
          eventType: EVENT_TYPE.APPOINTMENT,
          activityType,
          stage: STAGES.CANCEL,
          data: { ...result, userId }
        };
        const handled = await ActivitySdk.execute(data);
      }
      //ActivitySdk.execute();
      let response = new Response(true, 200);
      response.setMessage("Appointment Cancelled Successfully");
      return res.send(response.getResponse());
    } catch (err) {
      const payload = {
        code: 500,
        error: errMessages.INTERNAL_SERVER_ERROR
      };
      const response = new Response(false, payload.code);
      response.setError(payload.error);
      return res.status(payload.code).json(response.getResponse());
    }
  }

  // handleRescheduleAll = async ()

  reschedulScheduleEvent = async (req, res) => {
    try {
      const {
        startDate,
        startTime,
        endTime,
        notes,
        series = false,
        repeat,
        repeatDays,
        repeatInterval,
        endDate
      } = req.body;
      const { scheduleEventId } = req.params;
      const { userId } = req.userDetails;

      if (series) {
        const rescheduleAllData = await handleRescheduleAll({
          startDate,
          startTime,
          endTime,
          notes,
          scheduleEventId,
          repeat,
          repeatDays,
          repeatInterval,
          endDate
        });
        const response = new Response(true, 200);
        response.setMessage("Event details change successfully");
        return res.send(response.getResponse());
      }
      //check for only appointmnet and reminder
      const result = await scheduleService.reschedule({
        id: scheduleEventId,
        on: startDate,
        startTime: startTime,
        endTime: endTime
      });

      const resultEditNotes = await scheduleService.editNotes({
        id: scheduleEventId,
        notes: notes
      });

      const {
        data: { activityType }
      } = resultEditNotes;
      const data = {
        eventType: EVENT_TYPE.APPOINTMENT,
        activityType,
        stage: STAGES.RESCHEDULE,
        data: { ...resultEditNotes, userId }
      };
      const handled = await ActivitySdk.execute(data);

      const now = moment().add(15, "minutes");
      let startOn = moment(startTime);
      if (startOn < now) {
        await Proxy_Sdk.scheduleStartEndOfEvent(resultEditNotes);
      }

      const response = new Response(true, 200);
      response.setMessage("Event details change successfully");
      return res.send(response.getResponse());
    } catch (err) {
      const payload = {
        code: 500,
        error: errMessages.INTERNAL_SERVER_ERROR
      };
      const response = new Response(false, payload.code);
      response.setError(payload.error);
      return res.status(payload.code).json(response.getResponse());
    }
  };

  async editNotesScheduleEvent(req, res) {
    try {
      const { notes } = req.body;
      const { scheduleEventId } = req.params;
      const { userId } = req.userDetails;
      //check for only appointmnet and reminder
      const result = await scheduleService.editNotes({
        id: scheduleEventId,
        notes: notes
      });
      const {
        data: { activityType }
      } = result;
      const data = {
        eventType: EVENT_TYPE.APPOINTMENT,
        activityType,
        stage: STAGES.EDIT_NOTES,
        data: { ...result, userId }
      };
      const handled = await ActivitySdk.execute(data);
      const response = new Response(true, 200);
      response.setMessage("Event notes edited");
      return res.send(response.getResponse());
    } catch (err) {
      const payload = {
        code: 500,
        error: errMessages.INTERNAL_SERVER_ERROR
      };
      const response = new Response(false, payload.code);
      response.setError(payload.error);
      return res.status(payload.code).json(response.getResponse());
    }
  }

  async getAlReadyBookTimes(req, res) {
    const {
      startDate,
      endDate,
      repeat,
      repeatInterval,
      startTime,
      endTime,
      repeatDays
    } = req.query;
    const { userId } = req.params;
    const response = new Response(true, 200);
    const events = await eventService.getEventsByuserId({
      eventCategories: ["appointment"],
      userId,
      startDate: startDate,
      endDate: endDate
    });

    const eventIds = events.map(event => event._id) || [];
    if (eventIds.length > 0) {
      const eventList = await getEventDaysList({
        startDate,
        endDate,
        repeat,
        repeatDays,
        startTime,
        endTime,
        repeatDays
      });

      if (eventList.length > 0) {
        const result = await scheduleService.getBookedSlot({
          userId,
          eventIds,
          days: eventList
        });
        response.setData({ eventsDays: result });
      }
    }

    return res.send(response.getResponse());
  }

  async getLastEditedEvent(req, res) {
    try {
      const result = await scheduleService.getLastEditedEvent();
      const updatedAt = result[0] ? result[0].updatedAt : null;
      const response = new Response(true, 200);
      response.setData({ updatedAt: updatedAt });
      response.setMessage("Last Edited Event Time");
      return res.send(response.getResponse());
    } catch (err) {
      const payload = {
        code: 500,
        error: errMessages.INTERNAL_SERVER_ERROR
      };
      const response = new Response(false, payload.code);
      response.setError(payload.error);
      return res.status(payload.code).json(response.getResponse());
    }
  }

  async getEventUsers(req, res) {
    try {
      const eventId = req.params.eventId;
      const event = await scheduleService.getScheduleEventById(eventId);
      const {
        data: { participantOne, participantTwo }
      } = event;
      const userOne = await userService.getUserById(participantOne);
      const userTwo = await userService.getUserById(participantTwo);
      const users = [];
      users[participantOne] = userOne;
      users[participantTwo] = userTwo;
      const response = new Response(true, 200);
      response.setData(users);
      response.setMessage("Last Edited Event Time");
      return res.send(response.getResponse());
    } catch (err) {
      const payload = {
        code: 500,
        error: errMessages.INTERNAL_SERVER_ERROR
      };
      const response = new Response(false, payload.code);
      response.setError(payload.error);
      return res.status(payload.code).json(response.getResponse());
    }
  }

  async getBookedTimeSlotByDate(req, res) {
    try {
      const { userId, startDate: date } = req.query;
      const searchDate = new Date(date);
      const startDate = searchDate;
      const endDate = new Date(searchDate.getTime() + 24 * 60 * 60 * 1000);
      const events = await eventService.getEventsByuserId({
        eventCategories: ["appointment"],
        status: ["pending"],
        userId,
        startDate: startDate,
        endDate: endDate
      });

      const eventIds = events.map(event => event._id);
      const scheduleEvents = await scheduleService.getScheduleEventsByEventIds({
        eventIds: eventIds,
        startTime: startDate,
        endTime: endDate
      });
      const bookedSlots = scheduleEvents.map(event => {
        const { startTime, endTime } = event;
        return {
          start: startTime,
          end: endTime
        };
      });
      const response = new Response(true, 200);
      response.setData({ bookedSlots });
      return res.send(response.getResponse());
    } catch (err) {
      console.log(err);
    }
  }

  async addVideoRoomParticipants(req, res) {
    try {
      const { eventId } = req.params;
      const { userOne, userTwo } = req.body;
      const result = await scheduleService.addVideoParticipantsToScheduleEvent(
        eventId,
        userOne,
        userTwo
      );
      const response = new Response(true, 200);
      response.setMessage("Added Video Room Participants");
      return res.send(response.getResponse());
    } catch (err) {
      const payload = {
        code: 500,
        error: errMessages.INTERNAL_SERVER_ERROR
      };
      const response = new Response(false, payload.code);
      response.setError(payload.error);
      return res.status(payload.code).json(response.getResponse());
    }
  }
}

export default new AppointmentController();
