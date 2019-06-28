import { EventEmitter } from "events";
import { ACTIVITIES, STAGES } from "./activityType";
import { ACTIVITY_TYPE, EVENT_TYPE } from "../../constant";
const log = require("../../libs/log")("ACTIVITY_SDK");

class Activity extends EventEmitter {
  constructor() {
    super();
  }

  executeAppointment({ activityType, stage, data }) {
    switch (activityType) {
      case ACTIVITY_TYPE.FOLLOWUP:
        this.emit(ACTIVITIES.FOLLOW_UP[stage], data);
        break;
      case ACTIVITY_TYPE.MATERIAL_DELIVERY:
        this.emit(ACTIVITIES.MATERIAL_DELIVERY[stage], data);
        break;
      case ACTIVITY_TYPE.MEDICATION:
        this.emit(ACTIVITIES.MEDICATION[stage], data);
        break;
      default:
        log.warn(`invalid activity Type: ${activityType}`);
    }
  }

  execute(args) {
    const { eventType, activityType, stage, data } = args;
    log.info(`initial ${eventType}, ${stage}, ${activityType}, ${data}`);
    //add validation for parameter here
    switch (eventType) {
      case EVENT_TYPE.APPOINTMENT:
        this.executeAppointment({ activityType, stage, data });
        break;
      case EVENT_TYPE.ADVERSE_EVENT:
        this.emit(ACTIVITIES.ADVERSE_EVENT[stage], data);
        break;
      case EVENT_TYPE.REMINDER:
        this.emit(ACTIVITIES.REMINDER[stage], data);
        break;
      default:
        log.warn(`invalid event Type:${eventType}`);
    }
  }
}

const ActivitySdk = new Activity();

module.exports = { ActivitySdk, STAGES };
