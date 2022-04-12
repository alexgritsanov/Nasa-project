const http = require("http");

require("dotenv").config();

const { start } = require("repl");

const app = require("./app");

// const mongoose = require("mongoose");

const { loadPlanetsData } = require("./models/planets.model");
const { mongoConnect } = require("./services/mongo");
const { loadLaunchData } = require("./models/launches.model");

const PORT = process.env.PORT || 8000;

// const MONGO_URL = 'mongodb+srv://nasa-api:1234@nasacluster.3cnn7.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

const server = http.createServer(app);

// mongoose.connection.once('open', () => {
//     console.log('MongoDB connection ready!');
// });

// mongoose.connection.on('error', (err) => {
//     console.error(err);
// })

async function startServer() {
  await mongoConnect();
  //   await mongoose.connect(MONGO_URL);
  await loadPlanetsData();
  await loadLaunchData();

  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
  });
}

startServer();
