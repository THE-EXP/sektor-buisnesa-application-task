//express app that renders html file from ./views directory
const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'base.html'));
});

app.get('/api/data', (req, res) => {console.log(`requesting ${req.query.name}`);res.send(``);});
app.get('/api/pagination', (req, res) => {res.send(`Current page: 1\nTotal pages: 10`);});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
