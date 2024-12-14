import React, { useState } from 'react';
import './App.css';
import Login from './Login';
import Register from './Register';
import GoalTracker from './GoalTracker';
import { jwtDecode } from "jwt-decode";

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(token ? jwtDecode(token) : null);

  const handleSetToken = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setUser(jwtDecode(newToken));
  };

  if (!token) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Relationship Goal Tracker</h1>
        </header>
        <main>
          <Login setToken={handleSetToken} />
          <Register setToken={handleSetToken} />
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Relationship Goal Tracker</h1>
        <button onClick={() => {
          setToken(null);
          localStorage.removeItem('token');
        }}>Logout</button>
      </header>
      <main>
        <GoalTracker token={token} username={user.username} />
      </main>
    </div>
  );
}

export default App;
