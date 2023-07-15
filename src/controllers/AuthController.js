const { pool } = require("../utils/db")
const { comparePasswords } = require("../utils/pass")
const { generateToken, verifyToken } = require("../utils/jwtUtils")

const authenticate = async (req, res) => {
  try {
    const { email, password } = req.body

    const result = validateUserCredentials(email, password)

    if (result) {
      return res.status(400).json({
        success: false,
        message: result,
      })
    }

    const { rowCount, rows } = await pool.query(
      "SELECT * FROM public.users WHERE email = $1",
      [email]
    )

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      })
    }

    if (rowCount > 1) {
      return res.status(400).json({
        success: false,
        message: "Registro de e-mail duplicado",
      })
    }

    const storedPassword = rows[0].password
    const isMatch = await comparePasswords(password, storedPassword)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "As credenciais estão incorretas",
      })
    }

    const queryText =
      "UPDATE public.users SET username = $1, active = $2, role = $3, is_logged_in = $4, " +
      "last_logged_in = $5, last_logged_out = $6 WHERE id = $7 RETURNING *"

    const values = [
      rows[0].username,
      rows[0].active,
      rows[0].role,
      true,
      new Date(),
      rows[0].last_logged_out,
      rows[0].id,
    ]

    const response = await pool.query(queryText, values)

    let data = {}

    const payload = { email }
    data = await generateToken(payload)

    if (!data || !data.success) {
      return res.status(500).json({
        success: false,
        message: "Erro ao gerar token de acesso",
        error: data ? data.error : null,
      })
    }

    const token = data.token

    const user = {
      id: response.rows[0].id,
      username: response.rows[0].username,
      email: response.rows[0].email,
      role: response.rows[0].role,
      active: response.rows[0].active,
      date_registered: response.rows[0].date_registered,
    }

    res.cookie("token", token, { httpOnly: true, maxAge: 86400 * 1000 })

    return res.status(200).json({
      success: true,
      message: "Usuário autenticado",
      token,
      user,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
    })
  }
}

const verifyUserToken = async (req, res) => {
  try {
    const data = await verifyToken(req)

    if (!data || !data.success) {
      return res.status(data ? data.status : 500).json({
        success: false,
        message: data ? data.message : "Erro de verificação de token",
        error: data ? data.error : "",
      })
    }

    return res.status(200).json({
      success: true,
      message: data.message,
      token: data.token,
      user: data.user,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
    })
  }
}

const logout = async (req, res) => {
  const { id } = req.params

  try {
    const { rowCount, rows } = await pool.query(
      "SELECT * FROM public.users WHERE id = $1",
      [id]
    )

    if (rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuário não encontrado",
      })
    }

    const queryText =
      "UPDATE public.users SET username = $2, email = $3, password = $4, " +
      "active = $5, role = $6, date_registered = $7, is_logged_in = $8, " +
      "last_logged_in = $9, last_logged_out = $10 WHERE id = $1"

    const values = [
      rows[0].id,
      rows[0].username,
      rows[0].email,
      rows[0].password,
      rows[0].active,
      rows[0].role,
      rows[0].date_registered,
      false,
      rows[0].last_logged_in,
      new Date(),
    ]

    await pool.query(queryText, values)

    return res.status(200).json({
      success: true,
      message: "Usuário deslogado com êxito",
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
}

const validateUserCredentials = (email, password) => {
  if (!email || !password) {
    return "Por favor, informe email e senha"
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (
    typeof email !== "string" ||
    email.trim().length === 0 ||
    !emailRegex.test(email)
  ) {
    return "Formato do e-mail é inválido"
  }

  if (typeof password !== "string" || password.trim().length === 0) {
    return "Por favor, informe uma senha"
  }

  return null
}

module.exports = { authenticate, logout, verifyUserToken }
