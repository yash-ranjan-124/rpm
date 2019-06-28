import {
  onCreate,
  onComplete,
  onCancel,
  onRescheduled,
  onStart,
  onUpdate,
  onPassed,
  onMarkInComplete
} from "../helper";
import { ACTIVITIES } from "../activityType";
const { MATERIAL_DELIVERY } = ACTIVITIES;
const { ActivitySdk } = require("../");

class MaterialDeliveryActivity {
  constructor({}) {
    this._event = ActivitySdk;
  }

  async create(data) {
    //do preProcessing task of create followupActivity
    const response = await onCreate(data);
    //do postProcessing task of create followUpActivity
  }
  async start(data) {
    //do preProcessing task
    const response = await onStart(data);
    //do postProcessing task
  }

  async cancel(data) {
    //do preProcessing task
    const response = await onCancel(data);
    //do postProcessing task
  }

  async reschedule(data) {
    //do preProcessing task
    const response = await onRescheduled(data);
    //do postProcessing task
  }

  async complete(data) {
    //do preProcessing task
    const response = await onComplete(data);
    //do postProcessing task
  }

  async update(data) {
    //do preProcessing task
    const response = await onUpdate(data);
    //do postProcessing task
  }

  async passed(data) {
    //do preProcessing task
    const response = await onPassed(data);
    //do postProcessing task
  }

  async markedInComplete(data) {
    //do preProcessing task
    const response = await onMarkInComplete(data);
    //do postProcessing task
  }

  async editNotes(data) {
    //do preProcessing task
    const response = await onUpdate(data);
    //do postProcessing task
  }

  //define activity specific task here
  async extraActivity1() {}

  runObservers() {
    this._event.on(MATERIAL_DELIVERY.INIT, this.create);
    this._event.on(MATERIAL_DELIVERY.STARTED, this.start);
    this._event.on(MATERIAL_DELIVERY.PASSED, this.passed);
    this._event.on(MATERIAL_DELIVERY.RESCHEDULE, this.reschedule);
    this._event.on(MATERIAL_DELIVERY.COMPLETE, this.complete);
    this._event.on(MATERIAL_DELIVERY.CANCEL, this.cancel);
    this._event.on(MATERIAL_DELIVERY.IN_COMPLETE, this.markedInComplete);
    this._event.on(MATERIAL_DELIVERY.EDIT_NOTES, this.editNotes);
  }
}

export default new MaterialDeliveryActivity({});
