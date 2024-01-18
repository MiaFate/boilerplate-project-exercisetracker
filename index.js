const express = require('express')
const mongoose = require('mongoose')
const app = express()
const cors = require('cors')
require('dotenv').config()

//bd configuration
mongoose.connect(process.env.MONGO_URI)

//basic configuration
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const UserModel = require("./models/users.js");
const ExerciseModel = require("./models/exercises.js");

//this endpoint is for fetch a users list as array
app.get('/api/users', async function(req, res) {
  try {
    const list = await UserModel.find({})
    const filteredList = list.map(user => {
      return { username: user.username, _id: user._id }
    })
    res.status(200).json(filteredList)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

//this endpoint is for create new users
app.post('/api/users', async function(req, res) {
  try {
    const { username } = req.body
    if (req.body.username === "") throw new Error("you must provide a username")

    const userAlreadyExists = await UserModel.findOne({ username });
    if (userAlreadyExists) {
      throw new Error("user already exists on the database")
    }

    const newUser = new UserModel({ username });
    const doc = await newUser.save()

    res.status(200).json({ username: doc.username, _id: doc._id })
  } catch (error) {
    res.json({ error: error.message })
  }
})

app.post('/api/users/:_id/exercises', async function(req, res) {
  try {
    const { _id } = req.params
    let { description, duration, date } = req.body;
    const user = await UserModel.findById(_id)
    if (!user) throw new Error("User not found")

    pastDate = new Date(date)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let dayName = pastDate.getUTCDay()
    let day = pastDate.getUTCDate()
    let month = pastDate.getUTCMonth()
    let year = pastDate.getUTCFullYear()
    //fixedDate = date ? `${days[dayName]} ${months[month]} ${day} ${year}` : new Date().toDateString()
    fixedDate = date ? new Date(date) : new Date()


    const newExercise = new ExerciseModel({
      userId: _id,
      description,
      duration: parseInt(duration),
      date: fixedDate
    })
    const exercise = await newExercise.save()

    res.json({
      _id: exercise.userId,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    })
  } catch (error) {
    res.json({ error: error.message })
  }

})

app.get('/api/users/:_id/logs', async function(req, res) {
  try {
    const { _id } = req.params
    const { from, to, limit } = req.query;

    const user = await UserModel.findById(_id)
    if (!user) throw new Error("User not found")

    let dateObj = {}
    if (from) {
      dateObj["$gte"] = new Date(from)
    }
    if (to) {
      dateObj["$lte"] = new Date(to)
    }
    let filter = {
      userId: _id
    }
    if (from || to) {
      filter.date = dateObj
    }

    const list = await ExerciseModel.find(filter).limit(+limit ?? 500)

    const log = list.map(({ description, duration, date }) => {
      return {
        description,
        duration,
        date: date.toDateString()
      }
    })

    const logs = {
      username: user.username,
      count: log.length,
      _id: user._id,
      log
    }

    res.json(logs)
  } catch (error) {
    res.json({ error: error.message })
  }
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
