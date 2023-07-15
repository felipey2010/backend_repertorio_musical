const { Router } = require("express")

const {
  createMusic,
  deleteMusic,
  getAllMusics,
  getMusicById,
  updateMusic,
} = require("./controllers/MusicController")

const {
  authenticate,
  logout,
  verifyUserToken,
} = require("./controllers/AuthController")

const {
  createUser,
  getAllUsers,
  verifyEmail,
  updateUser,
  deleteUser,
} = require("./controllers/UserController")

const router = Router()

router.get("/", (req, res) => {
  return res.status(200).send("Bem-vindo(a) a base da API")
})

//User
router.get("/users/all", getAllUsers)
router.post("/users/create", createUser)
router.put("/users/update", updateUser)
router.put("/users/delete/:id", deleteUser)
router.get("/users/verify-email/", verifyEmail)

//Music
router.get("/musics/all", getAllMusics)
router.get("/musics/find/:id", getMusicById)
router.post("/musics/create", createMusic)
router.put("/musics/update", updateMusic)
router.delete("/musics/delete/:id", deleteMusic)

//Auth
router.post("/auth/login", authenticate)
router.post("/auth/logout/:id", logout)
router.post("/auth/verify-token/:token", verifyUserToken)

module.exports = router
