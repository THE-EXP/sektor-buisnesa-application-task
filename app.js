const express = require('express');
const jwt = require('jsonwebtoken');
const sql = require('sequelize');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
require('dotenv').config('./');
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//logic below checks for .env file, if .env file has db credentials, and if it has a 'secret' value assigned, and if not, generates one
if (!fs.existsSync('.env')) {
  throw new Error('No environment variables loaded, please create a .env file in the root folder(i.e. in the same folder as thу server)');
}
if (!process.env.DBPWD || !process.env.DBUSER) {
  throw new Error('No database credentials stored, please add them to the .env file (DBUSER and DBPWD keys, plaintext)');
}
const secret = process.env.SECRET || crypto.randomBytes(32).toString('hex'); //required for jwt token validation

const db = new sql('users', process.env.DBUSER, process.env.DBPWD, {
    host: 'localhost',
    dialect: 'mysql',
});

db.authenticate().then(() => {
    console.log(`Connection has been established successfully`);
}).catch((error) => {
    console.error(`Unable to connect to the database, exited with:\n${error}`);
});

const Model = db.define('user', {
    id: {
        type: sql.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstname: {type: sql.STRING, allowNull: false},
    email: {type: sql.STRING, allowNull: false},
    surname: {type: sql.STRING, allowNull: false},
    pwdhash: {type: sql.STRING, allowNull: false},
    pwdsalt: {type: sql.STRING, allowNull: false},
    gender: {type: sql.BOOLEAN, allowNull: false}, //* True = Male, False = Female, a bit more efficient db usage
    registration_date: {type: sql.DATE, allowNull: false, defaultValue: sql.NOW}
}, {
  tableName: 'users'
});
Model.sync({alter: true});

app.post('/user/login', (req, res) => {
  login(req, res)// Login logic(JWT)
});

app.post('/user/register', (req, res) => {
  register(req, res); // Registration logic (jwt)
});

app.put('/profile/:id', (req, res) => {
  editUser(req, res)// Edit logic
});

app.get('/profile/:id', (req, res) => {
  showOne(req, res)// showOne logic
});

app.get('/profiles', (req, res) => {
  showAll(req, res)// showAll logic
});

app.listen(process.env.MAIN_PORT || 8080, () => {
    console.log(`Server listening on port ${process.env.MAIN_PORT || 8080}`);
})
