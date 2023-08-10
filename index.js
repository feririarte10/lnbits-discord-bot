const Bot = require(`./Bot`);
const App = require(`./App`);
const winston = require(`winston`);
const dotenv = require(`dotenv`);
dotenv.config();

const mongoose = require("mongoose");
const ENABLE_MONGODB = Boolean(process.env.ENABLE_MONGODB);
const MONGODB_URI = ENABLE_MONGODB ? String(process.env.MONGODB_URI) : "";

if (process.env.LOG_TO_FILE == `true`) {
  const logDate = new Date().toISOString();
  var fs = require(`fs`);
  var logDir = `logs`;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const logger = winston.createLogger({
    level: `info`,
    format: winston.format.json(),
    transports: [
      new winston.transports.File({
        filename: `./${logDir}/${logDate}_error.log`,
        level: `error`,
      }),
      new winston.transports.File({
        filename: `./${logDir}/${logDate}_combined.log`,
      }),
    ],
  });

  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );

  console.log = function () {
    return logger.info.apply(logger, arguments);
  };
  console.error = function () {
    return logger.error.apply(logger, arguments);
  };
  console.info = function () {
    return logger.warn.apply(logger, arguments);
  };
}

const DiscordBot = new Bot();
DiscordBot.connect();

const DiscordApp = App;
DiscordApp.listen(process.env.APP_PORT, () => {
  console.log(
    `Lightning bot listening at http://localhost:${process.env.APP_PORT}`
  );

  if (ENABLE_MONGODB) {
    mongoose
      .connect(MONGODB_URI, {})
      .then(() => {
        console.log("Connected to MongoDB");
      })
      .catch((err) => {
        console.log(
          "No se pudo conectar con MongoDB, no se utilizará la base de datos: ",
          err
        );
        ENABLE_MONGODB = false;
      });
  }
});
