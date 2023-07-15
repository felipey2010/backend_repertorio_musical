const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const router = require("./src/routes")

dotenv.config()

//using this to define a particular directory
// const requireDir = require("require-dir")

const app = express()

//MIDDLEWARES
app.use(cors())
app.use(express.json())

//folder to create our models
// requireDir("./src/models")

//routes file
app.use("/api/v1", router)

//URL of the database
const PORT = Number(process.env.PORT) || 5000

//Start the server
app.listen(PORT, () => {
  console.log("Now listening for request at port: " + PORT)
})
