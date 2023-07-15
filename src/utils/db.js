const dotenv = require("dotenv")
const { Pool } = require("pg")

dotenv.config()

const db_user =
  process.env.DB_PRODUCTION === "true"
    ? process.env.DB_USER_PROD
    : process.env.DB_USER_LOCAL

const db_port =
  process.env.DB_PRODUCTION === "true"
    ? process.env.DB_PORT
    : process.env.DB_PORT_LOCAL

const db_password =
  process.env.DB_PRODUCTION === "true"
    ? process.env.DB_PASSWORD_PROD
    : process.env.DB_PASSWORD_LOCAL

const db_host =
  process.env.DB_PRODUCTION === "true"
    ? process.env.DB_HOST_PROD
    : process.env.DB_HOST_LOCAL

const db_name =
  process.env.DB_PRODUCTION === "true"
    ? process.env.DB_NAME_PROD
    : process.env.DB_NAME_LOCAL

//comment ssl later when the fix is found

const pool = new Pool({
  user: db_user,
  password: db_password,
  host: db_host,
  port: db_port,
  database: db_name,
  ssl: {
    rejectUnauthorized: false,
  },
})

module.exports = { pool }
