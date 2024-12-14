import React, { useState } from 'react';
import axios from 'axios';

const Register = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      console.log(`Attempting to register user: ${username}`);
      const response = await axios.post('http://eggplantmydick.projectftm.com:3000/register', { username, password });
      console.log('Registration successful:', response.data);
      setToken(response.data.token);
      setError('');  // Clear any previous errors
    } catch (error) {
      console.error('Error registering:', error);
      if (error.response && error.response.status === 400) {
        setError('Username already exists');
      } else {
        setError('Error registering user');
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button onClick={handleRegister}>Register</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Register;
