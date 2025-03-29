// in package.js, 
// "devStart": "nodemon server.js" 
// makes it so that the server restarts automatically when changes are made

// require the express library
const express = require('express')

// set up server
const app = express()

// use ejs view engine
app.set('view engine', 'ejs')

// to set up routes, mainly use
// get post
// get put 
// get delete
// get patch

// make a get request for url (request, response, next)
app.get('/', (req, res) => {
    console.log('Here')

    // to throw error
    // res.sendStatus(500)

    // to print "Hi" to the screen
    // res.send("Hi")

    // to chain commands and do both
    // res.status(500).send("Hi")

    // to send json
    // res.json({ message: 'Error' })

    // to chain commands but send a json instead
    // res.status(500).json({ message: 'Error' })

    // to send a file to user to download
    // res.download("server.js")

    // rendering out an html file
    // res.render('index')

    // to also pass info from server into views
    res.render("index", { text: "World" })
})

// import router
const userRouter = require("./routes/users")

// // link up router routes into main app
app.use('/users', userRouter)


// make the server actually runs
app.listen(3000)

