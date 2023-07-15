const { pool } = require("../utils/db")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const secret = process.env.JWT_SECRET

const generateToken = async payload => {
  try {
    const token = jwt.sign(payload, secret, {
      expiresIn: "24h",
      algorithm: "HS256",
    })

    return {
      success: true,
      message: "Token criado",
      token,
    }
  } catch (error) {
    return {
      success: false,
      message: "Erro ao criar token",
      error: error,
    }
  }
}

const verifyToken = async req => {
  try {
    const token =
      req.body.token || req.params.token || req.headers["access-token"]

    if (!token) {
      return {
        success: false,
        message: "É necessário informar um token de acesso",
        status: 400,
      }
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    })

    const queryText =
      "SELECT id, username, email, active, role, is_logged_in, date_registered, last_logged_in, last_logged_out FROM public.users WHERE email = $1"

    const { rowCount, rows } = await pool.query(queryText, [decoded.email])

    if (rowCount === 0) {
      return {
        success: false,
        message: "Token de acesso inválido!",
        status: 401,
      }
    }

    if (rowCount > 1) {
      return {
        success: false,
        message: "Registro de e-mail duplicado",
        status: 400,
      }
    }

    return {
      success: true,
      message: "Token válido",
      status: 200,
      token,
      user: rows[0],
    }
  } catch (error) {
    return {
      success: false,
      message: "Erro ao verificar token",
      status: 500,
      error: error,
    }
  }
}

module.exports = { generateToken, verifyToken }
