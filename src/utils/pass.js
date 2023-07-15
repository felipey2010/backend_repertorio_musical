const bcrypt = require("bcrypt")
const dotenv = require("dotenv")

dotenv.config()

const saltRound = process.env.BCRYPT_SALTROUND

const createHash = async text => {
  try {
    const salt = await bcrypt.genSalt(Number(saltRound))
    const encryptedPassword = await bcrypt.hash(text, salt)
    return encryptedPassword
  } catch (error) {
    console.log(error)
    throw new Error("Erro ao criar o hash da senha: " + error.message)
  }
}

const comparePasswords = async (userPassword, savedPassword) => {
  try {
    const isMatch = await bcrypt.compare(userPassword, savedPassword)
    return isMatch
  } catch (error) {
    throw error
  }
}

module.exports = { comparePasswords, createHash }
