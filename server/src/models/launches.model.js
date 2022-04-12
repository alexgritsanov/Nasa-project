const axios = require("axios");

const launchesDatabse = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;

launches = new Map();

// let latestFlightNumber = 100;

const launch = {
  flightNumber: 100, //flight_number
  mission: "Kepler Exploration X", //name
  rocket: "Explorer IS1", //rocket.name
  launchDate: new Date("December 27, 2030"), //date_local
  target: "Kepler-442 b",
  customer: ["NASA", "MIB"], //payload.customers
  upcoming: true, //upcoming
  success: true, //success
};

// saveLaunch(launch);

// // launches.set(launch.flightNumber, launch);

// function existLaunchWithId(launchId) {
//     return launches.has(launchId);
// }

saveLaunch(launch);

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
  console.log("Downloading launch data...");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem downloading launch data");
    throw new Error("Launch data download failed");
  }

  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };
    console.log(`${launch.flightNumber} ${launch.mission}`);

    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });
  if (firstLaunch) {
    console.log("Launch data already loaded");
  } else {
    await populateLaunches();
  }
}

// launches.set(launch.flightNumber, launch);

async function findLaunch(filter) {
  return await launchesDatabse.findOne(filter);
}

async function existLaunchWithId(launchId) {
  return await findLaunch({
    flightNumber: launchId,
  });
}

// function getAllLaunches() {
//     return Array.from(launches.values());
// }

async function getAllLaunches(skip, limit) {
  return await launchesDatabse
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

//  return aborted.modifiedCount === 1;
async function saveLaunch(launch) {
  await launchesDatabse.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  );

  // const planet = await planets.findOne({
  //     keplerName: launch.target
  // });

  // if (!planet) {
  //     throw new Error('No matching planet found');
  // }
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabse.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }

  return latestLaunch.flightNumber;
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("No matching planet found");
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;

  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["MIB", "NASA"],
    flightNumber: newFlightNumber,
  });

  await saveLaunch(newLaunch);
}

// function addNewLaunch(launch){
//     latestFlightNumber++;
//     launches.set(
//         latestFlightNumber,
//         Object.assign(launch, {
//             success: true,
//             upcoming: true,
//             customers: ['ZTM', 'Nasa'],
//             flightNumber: latestFlightNumber,
//         })
//         );
// }

// function abortLaunchById(launchId) {
//     const aborted = launches.get(launchId)
//     aborted.upcoming = false ;
//     aborted.success = false;

//     return aborted;
// }

async function abortLaunchById(launchId) {
  const aborted = await launchesDatabse.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );

  return aborted.modifiedCount === 1;
}

// addNewLaunch,
module.exports = {
  existLaunchWithId,
  getAllLaunches,
  loadLaunchData,
  abortLaunchById,
  scheduleNewLaunch,
};
