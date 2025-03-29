// 
const express = require('express')

// create a router: like a mini application w/in this application
const router = express.Router()

// this router lists out all users
router.get('/', (req, res) => {
    res.send("User List")
})

// create a router that generates a new user form
router.get('/new', (req, res) => {
    res.send("User New Form")
})

// create a new user
router.post("/", (req, res) => {
    rmSync.send("Create User")
})

// access individual user as a dynamic parameter (":" indicates dynamic)
router.get('/:id', (req, res) => {
    req.params.id
    res.send("Get User With ID ${req.params.id}")
})


// export this router
module.exports = router