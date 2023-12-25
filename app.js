const express = require('express');
const jwt = require('jsonwebtoken');
const sql = require('sequelize');
require('dotenv').config('./');
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const db = new sql('users', 'root', process.env.DBPWD, {
    host: 'localhost',
    dialect: 'mysql',
});

db.authenticate().then(() => {
    console.log(`Connection has been established successfully`);
}).catch((error) => {
    console.error(`Unable to connect to the database, exited with:\n${error}`);
});

app.post('/user/login', (req, res) => {
  // Handle post request for route1
});

app.post('/user/register', (req, res) => {
  // Handle post request for route2
});

app.put('/profile/:id', (req, res) => {
  // Handle put request for route3
});

app.get('/profile/:id', (req, res) => {
  // Handle get request for route4
});

app.get('/profiles', (req, res) => {
  // Handle get request for route5
});

app.listen(process.env.MAIN_PORT || 8080, () => {
    console.log(`Server listening on port ${process.env.MAIN_PORT || 8080}`);
})
