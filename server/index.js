const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client/build')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bloque1', require('./routes/bloque1'));
app.use('/api/bloque2', require('./routes/bloque2'));
app.use('/api/bloque3', require('./routes/bloque3'));
app.use('/api/bloque4', require('./routes/bloque4'));
app.use('/api/bloque5', require('./routes/bloque5'));
app.use('/api/bloque6', require('./routes/bloque6'));
app.use('/api/excel', require('./routes/excel'));

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize database
const db = require('./database/init');
db.init();


