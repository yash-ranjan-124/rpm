const Speciality = require("../models/speciality");
const Log = require("../../libs/log")("speciality.services");

class specialityService {
  async getSpeciality(specsData = {}) {
    try {
      let speciality = await Speciality.find(specsData);

      return speciality;
    } catch (err) {
      Log.errLog(500, "getSpeciality", err);
    }
  }

  async getAllSpecialities() {
    try {
      let specialities = await Speciality.find();
      return specialities;
    } catch (err) {
      Log.errLog(500, "getAllSpecialities", err);
    }
  }

  async addSpeciality(specsData) {
    try {
      let speciality = await Speciality.create(specsData);
      return speciality;
    } catch (err) {
      Log.errLog(500, "addSpeciality", err);
    }
  }

  async deleteSpeciality(specsData) {
    try {
    } catch (err) {}
  }

  async updateSpeciality(id, specsData) {
    try {
      let speciality = await Speciality.findByIdAndUpdate(
        id,
        {
          specialityName: specsData
        },
        { new: true }
      );

      return speciality;
    } catch (err) {
      Log.errLog(500, "updateSpeciality", err);
    }
  }
}

module.exports = new specialityService();
