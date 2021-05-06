/*
 * Author : Rahul <rahulvramesh@hotmail.com>
 * Vaccine Notification For Everyone
 */

// axios call the api

const axios = require("axios");
const _ = require("lodash");
const Twitter = require("twitter");
const moment = require("moment");
const cron = require("node-cron");

const accountSid = "AC5030e4740a7973af1cc22d1d7158bb40";
const authToken = "87ba9b418347260760523bf504f716ed";
const twilioClient = require("twilio")(accountSid, authToken);

const getCenters = async (districtId) => {
  let config = {
    headers: {
      accept: "application/json",
      "Accept-Language": "hi_IN",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
    },
  };
  let today = moment();
  let dateString = today.format("DD-MM-YYYY");
  const center = await axios.get(
    `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${dateString}`,
    config
  );
  return center.data.centers;
};

const notifyUser = async (payload) => {
  // Send SMS Alert
  if (process.env.TWILIO_ENABLED) {
    await twilioClient.messages.create({
      body: "Vaccine Available",
      messagingServiceSid: process.env.TWILIO_MESSAGE_SERVICE_SID,
      to: process.env.TWILIO_MESSAGE_TO,
    });
  }

  // Send Email

  // Send Whatsapp

  // Send Twitter Update
  if (process.env.TWITTER_ENABLED) {
    let Tclient = new Twitter({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    Tclient.post(
      "statuses/update",
      { status: "test status" },
      function (error, tweet, response) {
        if (error) throw error;
      }
    );
  }
};

const main = async () => {
  try {
    cron.schedule("* * * * *", async () => {
      await checkAvailability();
    });
  } catch (e) {
    console.log("an error occured: " + JSON.stringify(e, null, 2));
    throw e;
  }
};

// Main Execution
const checkAvailability = async () => {
  const centers = await getCenters(process.env.DISTRICT_ID);
  let availableLocation = [];
  centers.map((c) => {
    // Find From Session
    c.sessions.map((session) => {
      if (session.available_capacity > 0) {
        availableLocation.push({
          name: c.name,
          date: session.date,
          capacity: session.available_capacity,
        });
      }
    });
  });
  if (availableLocation.length > 0) {
    console.log("Vaccine Available");
    await notifyUser({ count: availableLocation.length });
  } else {
    console.log("No Vaccine Available");
  }
};
main().then(() => {
  console.log("Application Started!");
});
