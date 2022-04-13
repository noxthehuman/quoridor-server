const router = require("express").Router();
const User = require('../models/User.model')

router.get("/", (req, res, next) => {

  res.json("All good in here");
});

// You put the next routes here 👇



module.exports = router;
