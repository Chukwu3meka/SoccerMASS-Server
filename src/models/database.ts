import mongoose from "mongoose";

mongoose.Promise = global.Promise;

mongoose.set({
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  strictQuery: true,
  debug: false, // ? <= hide console messages

  // keepAlive: true,
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  // useFindAndModify: false,
});

interface IConnectionEvents {
  all: string;
  open: string;
  close: string;
  error: string;
  connected: string;
  fullsetup: string;
  connecting: string;
  reconnected: string;
  disconnected: string;
  disconnecting: string;
}

const connectionEvents: IConnectionEvents = {
  connecting: "Emitted when Mongoose starts making its initial connection to the MongoDB server",
  connected:
    "Emitted when Mongoose successfully makes its initial connection to the MongoDB server, or when Mongoose reconnects after losing connectivity. May be emitted multiple times if Mongoose loses connectivity.",
  open: "Emitted after 'connected' and onOpen is executed on all of this connection's models.",
  disconnecting: "Your app called Connection#close() to disconnect from MongoDB",
  disconnected:
    "Emitted when Mongoose lost connection to the MongoDB server. This event may be due to your code explicitly closing the connection, the database server crashing, or network connectivity issues.",
  close:
    "Emitted after Connection#close() successfully closes the connection. If you call conn.close(), you'll get both a 'disconnected' event and a 'close' event.",
  reconnected:
    "Emitted if Mongoose lost connectivity to MongoDB and successfully reconnected. Mongoose attempts to automatically reconnect when it loses connection to the database.",
  error: "Emitted if an error occurs on a connection, like a parseError due to malformed data or a data larger than 16MB.",
  fullsetup: "Emitted when you're connecting to a replica set and Mongoose has successfully connected to the primary and at least one secondary.",
  all: "Emitted when you're connecting to a replica set and Mongoose has successfully connected to all servers specified in your connection string.",
};

type LogMessage = { label: string; event: string };
const logMessage = ({ label, event }: LogMessage) =>
  `MongoDB ${label} Database Connection Events} ::: ${connectionEvents[event as keyof IConnectionEvents]}`;

type ModelGenerator = { label: string; db: string };
const modelGenerator = ({ label, db }: ModelGenerator) => {
  return mongoose
    .createConnection(<string>process.env[`${label}_MONGODB_URI`], { dbName: db })
    .on("all", () => logMessage({ label, event: "all" }))
    .on("open", () => logMessage({ label, event: "open" }))
    .on("error", () => logMessage({ label, event: "error" }))
    .on("close", () => logMessage({ label, event: "close" }))
    .on("connected", () => logMessage({ label, event: "connected" }))
    .on("fullsetup", () => logMessage({ label, event: "fullsetup" }))
    .on("connecting", () => logMessage({ label, event: "connecting" }))
    .on("reconnected", () => logMessage({ label, event: "reconnected" }))
    .on("disconnected", () => logMessage({ label, event: "disconnected" }))
    .on("disconnecting", () => logMessage({ label, event: "disconnecting" }));
};

const infoDatabase = modelGenerator({ label: "INFO", db: "info" }); // ? <= Client Database
const gamesDatabase = modelGenerator({ label: "GAMES", db: "games" }); // ? <= Games Database
const apihubDatabase = modelGenerator({ label: "APIHUB", db: "apihub" }); // ? <= API Hub Database
const accountsDatabase = modelGenerator({ label: "ACCOUNTS", db: "accounts" }); // ? <= Auth/Accounts  Database
const federatedDatabase = modelGenerator({ label: "FEDERATED", db: "WaveRD" }); // ? <= Federation Instance Database

export { accountsDatabase, infoDatabase, apihubDatabase, gamesDatabase, federatedDatabase };
