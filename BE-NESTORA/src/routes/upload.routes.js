const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const uploadController = require("../controllers/uploadController");
const auth = require("../middlewares/auth");

router.post("/single", auth(["admin"]), upload.single("image"), uploadController.uploadSingle);
router.post("/multiple", auth(["admin"]), upload.array("images", 10), uploadController.uploadMultiple);

module.exports = router;
