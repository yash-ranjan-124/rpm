const bcrypt = require("bcrypt");
const user = require("../models/user");
const event = require("../models/event");
const scheduler = require("../models/scheduler");
const Mongo = require("../../libs/mongo");
const uuid = require("uuid/v4");
var ObjectId = require("mongodb").ObjectID;

const cityCountryModel = require("../models/cityCountry");

(async () => {
  try {
    const mongo = new Mongo("mongodb://mongodb:27017/rpm");

    var conn = (async function() {
      try {
        const connection = await mongo.getConnection();
      } catch (err) {}
    })();

    const salt = await bcrypt.genSalt(Number(process.config.saltRounds));
    const options = [
      {
        _id: ObjectId("111000000000"),
        name: "Super Admin",
        email: "superadmin@rpm.com",
        category: "superAdmin",
        password: await bcrypt.hash("password", salt),
        settings: {
          isCalendarSynced: false,
          isProfileCompleted: false
        },
        programId: ["313130303030303030303030"]
      },
      {
        _id: ObjectId("222000000000"),
        name: "Program Admin",
        email: "programadmin@rpm.com",
        category: "programAdmin",
        password: await bcrypt.hash("password", salt),
        contactNo: {
          countryCode: "+91",
          phoneNumber: 1234567
        },
        settings: {
          isCalendarSynced: false,
          isProfileCompleted: false
        },
        programId: ["323230303030303030303030"]
      },
      {
        _id: ObjectId("444000000000"),
        name: "Care Coach",
        email: "carecoach@rpm.com",
        category: "careCoach",
        password: await bcrypt.hash("password", salt),
        contactNo: {
          countryCode: "+91",
          phoneNumber: 1234569
        },
        settings: {
          isCalendarSynced: false,
          isProfileCompleted: false
        },
        programId: [
          "333330303030303030303030",
          "333220303030303030303030",
          "223330303030303030303030"
        ]
      }
    ];

    await user.remove({});
    let programAdminId;
    let status;
    for (let i = 0; i < options.length; i++) {
      status = await user.create(options[i]);
      if (status.category == "superAdmin") {
        programAdminId = status._id;
      }
    }

    const inviteOptions = [];
    await event.remove({});
    await scheduler.remove({});
    mongo.disconnectConnection();
  } catch (err) {}
})();
