const { pool } = require("../utils/db")
const { createHash } = require("../utils/pass")
const { v4: uuidv4 } = require("uuid")
const { verifyToken } = require("../utils/jwtUtils")

const getAllUsers = async (req, res) => {
  try {
    const data = await verifyToken(req)

    if (!data || !data.success) {
      return res.status(data ? data.status : 500).json({
        success: false,
        message: data ? data.message : "Erro de verificação de token",
        error: data ? data.error : "",
      })
    }

    const queryText =
      "SELECT id, username, email, active, role, is_logged_in, date_registered, " +
      "last_logged_in, last_logged_out FROM public.users;"

    const { rows } = await pool.query(queryText)

    return res.status(200).json({
      success: true,
      message: "Lista de usuários encontrados",
      data: rows,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Erro do servidor",
      error: err,
    })
  }
}

const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body

    const result = validateUserParameters(req.body)

    if (result != null) {
      return res.status(400).json({
        success: false,
        message: result,
      })
    }

    const data = await pool.query(
      "SELECT * FROM public.users WHERE email = $1",
      [email]
    )

    if (data.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: "O e-mail informado já existe",
      })
    }

    const queryText =
      "INSERT INTO public.users(id, username, email, password, active, role, date_registered, " +
      "is_logged_in, last_logged_in, last_logged_out) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"

    const values = [
      uuidv4(),
      username,
      email,
      await createHash(password),
      true,
      role,
      new Date(),
      false,
      null,
      null,
    ]

    await pool.query(queryText, values)

    return res.status(201).json({
      success: true,
      message: "Usuário criado com êxito",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro do servidor",
      error: error,
    })
  }
}

const updateUser = async (req, res) => {
  try {
    const data = await verifyToken(req)

    if (!data || !data.success) {
      return res.status(data ? data.status : 500).json({
        success: false,
        message: data ? data.message : "Erro de verificação de token",
        error: data ? data.error : "",
      })
    }

    const { id, username, email, role } = req.body

    const { rowCount, rows } = await pool.query(
      "SELECT * FROM public.users WHERE id = $1",
      [id]
    )

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      })
    }

    const queryText =
      "UPDATE public.users SET id = $1, username = $2, email = $3, password = $4, " +
      "active = $5, role = $6, date_registered = $7, is_logged_in = $8, " +
      "last_logged_in = $9, last_logged_out = $10 WHERE id =$1"

    const values = [
      rows[0].id,
      username,
      email,
      rows[0].password,
      rows[0].active,
      role,
      rows[0].date_registered,
      rows[0].is_logged_in,
      rows[0].last_logged_in,
      rows[0].last_logged_out,
    ]

    await pool.query(queryText, values)

    return res.status(201).json({
      success: true,
      message: "Usuário atualizado com êxito",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro do servidor",
      error: error,
    })
  }
}

const deleteUser = async (req, res) => {
  try {
    const data = await verifyToken(req)

    if (!data || !data.success) {
      return res.status(data ? data.status : 500).json({
        success: false,
        message: data ? data.message : "Erro de verificação de token",
        error: data ? data.error : "",
      })
    }

    const { id } = req.params

    const queryText = "DELETE FROM public.users WHERE id = $1"

    await pool.query(queryText, [id])

    return res.status(201).json({
      success: true,
      message: "Usuário excluído com êxito",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro excluindo usuário",
      error: error,
    })
  }
}

const verifyEmail = async (req, res) => {
  try {
    const data = await verifyToken(req)

    if (!data || !data.success) {
      return res.status(data ? data.status : 500).json({
        success: false,
        message: data ? data.message : "Erro de verificação de token",
        error: data ? data.error : "",
      })
    }

    const { email } = req.body

    if (email.length == 0 || !email.includes("@") || !email.includes(".")) {
      return res.status(400).json({
        success: false,
        message: "Informe um e-mail válido",
      })
    }

    const { rowCount } = await pool.query(
      "SELECT * FROM pulic.users where email = $1",
      [email]
    )

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "E-mail não encontrado",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Usuário encontrado",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro do servidor",
      error: error,
    })
  }
}

function validateUserParameters(params) {
  const { username, email, password, role } = params

  if (!username || !email || !password || !role) {
    return "Preencha os campos obrigatórios"
  }
  if (typeof username !== "string" || username.trim().length === 0) {
    return "Nome de usuário inválido"
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return "E-mail inválido"
  }

  if (typeof password !== "string" || password.length < 6) {
    return "A senha deve conter pelo menos 6 caracteres"
  }

  const validRoles = ["ROLE_ADMIN", "ROLE_USER"]
  if (!validRoles.includes(role)) {
    return "Perfil inválido"
  }

  // All parameters are valid
  return null
}

module.exports = {
  getAllUsers,
  createUser,
  verifyEmail,
  updateUser,
  deleteUser,
}
