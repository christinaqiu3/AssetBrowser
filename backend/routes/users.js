// 
const express = require('express')

// create a router: like a mini application w/in this application
const router = express.Router()

// this router lists out all users
router.get('/', (req, res) => {
    console.log(req.query.name)
    res.send("User List")
})

// create a router that generates a new user form
router.get('/new', (req, res) => {
    res.render("users/new")
})

// create a new user
router.post("/", (req, res) => {
    const isValid = true
    if (isValid) {
        users.push({ firstName: req.body.firstName })
        res.redirect(`/users/${users.length - 1}`)
    } else {
        console.log("Error:")
        res.render("users/new", { firstName: req.body.firstName })
    }
    res.send("Hi")
    console.log({ firstName: req.body.firstName })
})

////////// # these code blocks are equivalent
router.route("/:id")
    .get((req, res) => {
        console.log(req.user)
        res.send(`Get User With ID ${req.params.id}`)
    })
    .put((req, res) => {
        res.send(`Update User With ID ${req.params.id}`)
    })
    .delete((req, res) => {
        res.send(`Delete User With ID ${req.params.id}`)
    })

////////// # these code blocks are equivalent
// // access individual user as a dynamic parameter (":" indicates dynamic)
// router.get('/:id', (req, res) => {
//     res.send(`Get User With ID ${req.params.id}` )
// })

// // update user with ID
// router.get('/:id', (req, res) => {
//     res.send(`Update User With ID ${req.params.id}` )
// })

// // delete user with ID
// router.get('/:id', (req, res) => {
//     res.send(`Delete User With ID ${req.params.id}` )
// })

// runs anytime we find a param of name "id"
const users = [{ name: "Kyle" }, { name: "Sally" }]
// param is an example of middleware (runs btwn start of request and end of request, and always takes in req, res, and next)
router.param("id", (req, res, next, id) => {
    // set req.user to be the user for this id
    req.user = users[id]
    console.log(req.user);
    next()
})

// export this router
module.exports = router