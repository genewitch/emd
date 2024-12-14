const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const app = express();
const db = new sqlite3.Database('./db.sqlite');

app.use(bodyParser.json());
app.use(cors()); // Add this line to enable CORS

// Middleware to verify token
function verifyToken(req, res, next) {
  const token = req.headers['x-access-token'];
  console.log('Token received:', token);
  if (!token) {
    console.log('No token provided');
    return res.status(403).send({ auth: false, message: 'No token provided.' });
  }
  jwt.verify(token, 'supersecret', (err, decoded) => {
    if (err) {
      console.log('Failed to authenticate token');
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    }
    req.userId = decoded.id;
    req.username = decoded.username; // Make sure to include username in the token
    next();
  });
}

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS progress (
      user1 TEXT,
      user2 TEXT,
      goal TEXT,
      tally INTEGER DEFAULT 0,
      PRIMARY KEY (user1, user2, goal)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS relationships (
      user1 TEXT,
      user2 TEXT,
      PRIMARY KEY (user1, user2)
    )
  `);
});

// Endpoint to register a user
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
    if (err) {
      console.error('Error registering user:', err);
      return res.status(500).send('Error registering user');
    }
    const token = jwt.sign({ id: this.lastID, username }, 'supersecret', { expiresIn: '1h' });
    res.send({ token });
  });
});

// Endpoint to login a user
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (err || !row) {
      console.error('Error logging in:', err);
      return res.status(401).send('Invalid username or password');
    }
    const token = jwt.sign({ id: row.id, username: row.username }, 'supersecret', { expiresIn: '1h' });
    res.send({ token });
  });
});

// Endpoint to link accounts
app.post('/link-accounts', verifyToken, (req, res) => {
  const { user2 } = req.body;
  const user1 = req.username;
  console.log(`Linking accounts: ${user1} and ${user2}`);
  db.run(`INSERT INTO relationships (user1, user2) VALUES (?, ?)`, [user1, user2], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        // Check if the reverse relationship exists
        db.get(`SELECT * FROM relationships WHERE user1 = ? AND user2 = ?`, [user2, user1], (err, row) => {
          if (err) {
            console.error('Error checking reverse relationship:', err);
            return res.status(500).send('Error linking accounts');
          }
          if (row) {
            console.log(`Accounts ${user1} and ${user2} are now linked`);
            return res.send({ linked: true });
          } else {
            console.log(`Pending link from ${user1} to ${user2}`);
            return res.send({ linked: false });
          }
        });
      } else {
        console.error('Error linking accounts:', err);
        return res.status(500).send('Error linking accounts');
      }
    } else {
      console.log(`Pending link from ${user1} to ${user2}`);
      return res.send({ linked: false });
    }
  });
});

// Endpoint to fetch linked user
app.get('/get-linked-user', verifyToken, (req, res) => {
  const username = req.username;
  console.log(`Fetching linked user for user: ${username}`);
  db.get(`SELECT user2 FROM relationships WHERE user1 = ? UNION SELECT user1 FROM relationships WHERE user2 = ?`, 
    [username, username], (err, row) => {
    if (err) {
      console.error('Error fetching linked user:', err);
      return res.status(500).send('Error fetching linked user');
    }
    if (row) {
      console.log('Linked user data:', row);
      res.send({ linkedUser: row.user2 });
    } else {
      res.send({ linkedUser: null });
    }
  });
});

// Endpoint to get progress
app.get('/get-progress', verifyToken, (req, res) => {
  const { user1, user2 } = req.query;
  console.log(`Get progress for users: ${user1}, ${user2}`);
  db.all(`SELECT goal, tally FROM progress WHERE user1 = ? AND user2 = ?`, [user1, user2], (err, rows) => {
    if (err) {
      console.error('Error retrieving progress:', err);
      res.status(500).send('Error retrieving progress');
    } else {
      console.log('Progress data:', rows);
      res.send(rows);
    }
  });
});

// Endpoint to update progress
app.post('/update-progress', verifyToken, (req, res) => {
  const { user1, user2, goal, increment } = req.body;
  console.log(`Update progress for users: ${user1}, ${user2} with goal: ${goal} increment: ${increment}`);
  db.run(`
    INSERT INTO progress (user1, user2, goal, tally)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user1, user2, goal)
    DO UPDATE SET tally = tally + ?;
  `, [user1, user2, goal, increment, increment], function(err) {
    if (err) {
      console.error(err);
      res.status(500).send('Error updating progress');
    } else {
      res.send({ user1, user2, goal, tally: increment });
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
