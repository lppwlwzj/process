const express = require("express")
const router = express.Router()

const ysd_handler = require("../router_handler/ysd")

router.post("/login", ysd_handler.login)
router.post("/remark", ysd_handler.remark)
router.post("/phone/list", ysd_handler.phoneList)
router.post("/phone/update", ysd_handler.phoneUpdate)
router.post("/phone/delete", ysd_handler.phoneDelete)

module.exports = router
