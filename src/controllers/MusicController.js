const { pool } = require("../utils/db")
const { verifyToken } = require("../utils/jwtUtils")

const getAllMusics = async (req, res) => {
  try {
    let orderBy = req.query.order || "title"

    let queryText
    let values = []

    const validOrderFields = ["title", "category", "id", "date_created"]
    if (!validOrderFields.includes(orderBy)) {
      orderBy = "title"
    }

    queryText = `SELECT * FROM public.musics ORDER BY ${orderBy}`

    const { rows } = await pool.query(queryText, values)

    res.status(200).json({
      success: true,
      data: rows,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error,
    })
  }
}

const getMusicById = async (req, res) => {
  try {
    const data = await verifyToken(req)

    if (!data || !data.success) {
      return res.status(data ? data.status : 500).json({
        success: false,
        message: data ? data.message : "Erro de verificação de token",
        error: data ? data.error : "",
      })
    }

    const id = parseInt(req.params.id)

    const { rows } = await pool.query(
      "SELECT * FROM public.musics WHERE id = $1",
      [id]
    )

    res.status(200).json({
      success: true,
      message: "Música encontrada",
      data: rows[0],
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error,
    })
  }
}

const createMusic = async (req, res) => {
  try {
    const data = await verifyToken(req)

    if (!data || !data.success) {
      return res.status(data ? data.status : 500).json({
        success: false,
        message: data ? data.message : "Erro de verificação de token",
        error: data ? data.error : "",
      })
    }

    const { title, artiste, category, link_yt, link_cifra } = req.body

    const result = validateMusicFields(title, artiste, category, link_yt)

    if (result) {
      return res.status(400).json({
        success: false,
        message: result,
      })
    }

    const queryText =
      "INSERT INTO public.musics (title, artiste, category, link_yt, link_cifra, registered_by, user_id, date_created) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) " +
      "RETURNING *"

    const values = [
      title,
      artiste,
      category,
      link_yt,
      link_cifra,
      data.user.username,
      data.user.id,
      new Date(),
    ]

    const { rows } = await pool.query(queryText, values)
    const createdMusic = rows[0]

    return res.status(200).json({
      success: true,
      message: "Música cadastrada com êxito",
      data: createdMusic,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error,
    })
  }
}

const updateMusic = async (req, res) => {
  try {
    const data = await verifyToken(req)

    if (!data || !data.success) {
      return res.status(data ? data.status : 500).json({
        success: false,
        message: data ? data.message : "Erro de verificação de token",
        error: data ? data.error : "",
      })
    }

    const { id, title, artiste, category, link_yt, link_cifra } = req.body

    const result = validateMusicFields(title, artiste, category, link_yt)

    if (result) {
      return res.status(400).json({
        success: false,
        message: result,
      })
    }

    const { rowCount, rows } = await pool.query(
      "SELECT * FROM public.musics WHERE id = $1",
      [id]
    )

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Música não encontrada na base de dados",
      })
    }

    const queryText =
      "UPDATE public.musics SET title = $1, artiste = $2, category = $3, link_yt = $4, " +
      "link_cifra = $5, registered_by = $6, user_id = $7, date_created = $8 WHERE id = $9"

    const values = [
      title,
      artiste,
      category,
      link_yt,
      link_cifra,
      rows[0].registered_by,
      rows[0].user_id,
      rows[0].date_created,
      id,
    ]

    await pool.query(queryText, values)

    return res.status(200).json({
      success: true,
      message: "Música atualizada com êxito",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error,
    })
  }
}

const deleteMusic = async (req, res) => {
  try {
    const data = await verifyToken(req)

    if (!data || !data.success) {
      return res.status(data ? data.status : 500).json({
        success: false,
        message: data ? data.message : "Erro de verificação de token",
        error: data ? data.error : "",
      })
    }

    const id = parseInt(req.params.id)

    await pool.query("DELETE FROM public.musics WHERE id = $1", [id])

    return res.status(200).json({
      success: true,
      message: "Música excluída com êxito",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor: " + error.message,
    })
  }
}

const validateMusicFields = (title, artiste, category, link_yt) => {
  if (typeof title !== "string" || title.trim().length === 0) {
    return "Título inválido"
  }

  if (typeof artiste !== "string" || artiste.trim().length === 0) {
    return "Nome do(a) cantor(a) inválido"
  }

  if (typeof category !== "string" || category.trim().length === 0) {
    return "Categoria inválida"
  }

  const youtubeLinkRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
  if (!youtubeLinkRegex.test(link_yt)) {
    return "Link do YouTube inválido"
  }

  return null
}

module.exports = {
  updateMusic,
  deleteMusic,
  createMusic,
  getMusicById,
  getAllMusics,
}
