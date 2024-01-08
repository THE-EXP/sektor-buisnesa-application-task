const express = require('express');
const jwt = require('jsonwebtoken');
const sequelize = require('sequelize');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const cp = require('cookie-parser');
const multer = require('multer');
const upload = multer({dest: './pictures/'});
require('dotenv').config('./');
const app = express();

//configure multer to upload to ./pictures/ and check if the file is actually an image
app.use(cp());
app.use(upload.single('file'));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//logic below checks for .env file, if .env file has mysql credentials, and if it has a 'secret' value assigned, and if not, generates one
if (!fs.existsSync('.env')) {
  throw new Error('No environment variables loaded, please create a .env file in the root folder(i.e. in the same folder as thу server)');
}
if (!process.env.DBPWD || !process.env.DBUSER) {
  throw new Error('No database credentials stored, please add them to the .env file (DBUSER and DBPWD keys, plaintext)');
}
const secret = process.env.SECRET || crypto.randomBytes(32).toString('hex'); //required for jwt token validation

const mysql = new sequelize('users', process.env.DBUSER, process.env.DBPWD, {
    host: 'localhost',
    dialect: 'mysql',
});

mysql.authenticate().then(() => {
    console.log(`Connection has been established successfully`);
}).catch((error) => {
    console.error(`Unable to connect to the database, exited with:`);
    throw error;
});

const usr = mysql.define('user', {
    id: {
        type: sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstname: {type: sequelize.STRING, allowNull: false},
    email: {type: sequelize.STRING, allowNull: false},
    surname: {type: sequelize.STRING, allowNull: true},
    pwdhash: {type: sequelize.STRING, allowNull: false},
    pwdsalt: {type: sequelize.STRING, allowNull: false},
    gender: {type: sequelize.CHAR, allowNull: false, defaultValue: 'U'}, //* M = Male, F = Female, U = Unspecified
    registration_date: {type: sequelize.DATE, allowNull: false, defaultValue: sequelize.NOW},
    profile_picture: {type: sequelize.STRING, allowNull: false, defaultValue: './pictures/default.png'},
}, {
  tableName: 'users'
});
const token = mysql.define('token', {
  id: {
    type: sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  atoken: {type: sequelize.STRING, allowNull: false},
  rtoken: {type: sequelize.STRING, allowNull: false}
})
usr.sync();
token.sync();

app.post('/user/login', (req, res) => {
  login(req, res); // Login logic(JWT? How to maintain?!) 
});

app.post('/user/register', (req, res) => {
  register(req, res); // Registration logic (JWT? how to maintain?!)
});

app.put('/profile/:id', (req, res) => {
  editUser(req, res); // Edit logic(require JWT to confirm that an actual owner of account is editing it? How to maintain?!)
});

app.get('/profile/:id', (req, res) => {
  showOne(req, res); // showOne logic, JSON response
});

app.get('/profiles', (req, res) => {
  showAll(req, res); // showAll logic, how to make pagination work in this? use paginate-array??, JSON response
});

app.listen(process.env.MAIN_PORT || 8080, () => {
    console.log(`Server listening on port ${process.env.MAIN_PORT || 8080}`);
})

async function register(req, res) {
  //TODO: add JWT to this crap
  const firstname = req.body.firstname;
  const email = req.body.email;
  const password = req.body.password; 

  if (!firstname || !email || !password) {
    console.log(firstname, email, password);
    res.status(400).send('Fill in all the missing fields');
    return;
  }
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    const user = await usr.create({ firstname, email, pwdhash: hash, pwdsalt: salt });
    await user.save();
    res.status(201).cookie('hashpwd', hash, {maxAge: 86400, httpOnly: true, secure: true}).json({ result: 'OK', msg: 'User successfully registered!' });
}

async function login(req, res){
  // TODO: add JWT to this crap, for now just check password
  const email = req.body.email;
  const password = req.body.password;
  const user = await usr.findOne({where: {email: email}});
  console.log(user);
  //const hashedpwd = req.cookies.hashpwd;
  switch (await bcrypt.compare(password, user.pwdhash)) {
    case true:
      console.log(`User ${user.id} logged in`);
      break;
    case false:
      console.log(`User ${user.id} failed to log in, wrong password`);
  }
}

async function showAll(req, res) {
  if (req.query.page == undefined) {
    req.query.page = 1; //assume page 1 by default
  }
  if (req.query.orderby == undefined) {
    req.query.orderby = 'ASC'; //assume ascending order by default(oldest first)
  }
  const offset = (req.query.page - 1) * 10;
  const users = await usr.findAll({ limit: 10, offset: offset, order: [['registration_date', req.query.orderby.toUpperCase()]] });
  res.status(200).json({ ok: true, result: users});
}

async function showOne(req, res) {
  const id = req.params.id;
  const user = await usr.findOne({where: {id}});
  if (!user) {
    res.status(404).json({ ok: false, msg: 'User not found' });
    return;
  }
  const user_safe = {
    id: user.id,
    firstname: user.firstname,
    email: user.email,
    surname: user.surname,
    gender: user.gender,
    registration_date: user.registration_date,
    profile_picture: user.profile_picture
  };
  res.status(200).json({ ok: true, result: user_safe });
}
