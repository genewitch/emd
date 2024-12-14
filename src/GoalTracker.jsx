import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GoalTracker = ({ token, username }) => {
  const [yourGoals, setYourGoals] = useState([]);
  const [yourTallies, setYourTallies] = useState({});
  const [linkedGoals, setLinkedGoals] = useState([]);
  const [linkedTallies, setLinkedTallies] = useState({});
  const [goalInput, setGoalInput] = useState('');
  const [error, setError] = useState('');
  const [linkedUser, setLinkedUser] = useState('');
  const [linkInput, setLinkInput] = useState('');

  console.log('Current Username:', username);

  const fetchLinkedUser = async () => {
    try {
      console.log('Fetching linked user with token:', token);
      const response = await axios.get('http://eggplantmydick.projectftm.com:3000/get-linked-user', {
        headers: { 'x-access-token': token }
      });
      console.log('Linked user data:', response.data);
      setLinkedUser(response.data.linkedUser);
    } catch (error) {
      console.error('Error fetching linked user:', error);
      setError('Error fetching linked user');
    }
  };

  const fetchProgress = async (user1, user2) => {
    try {
      console.log('Fetching progress for users:', user1, user2, 'with token:', token);
      const response = await axios.get('http://eggplantmydick.projectftm.com:3000/get-progress', {
        headers: { 'x-access-token': token },
        params: { user1, user2 }
      });
      console.log('Progress data for users', user1, user2, ':', response.data);
      const progressData = response.data.reduce((acc, curr) => {
        acc[curr.goal] = curr.tally;
        return acc;
      }, {});
      console.log('Processed Progress Data:', progressData);

      if (user1 === username) {
        setYourTallies(progressData);
        setYourGoals(Object.keys(progressData));
      } else {
        setLinkedTallies(progressData);
        setLinkedGoals(Object.keys(progressData));
      }
      console.log('Your Goals:', Object.keys(progressData));
    } catch (error) {
      console.error('Error fetching progress:', error);
      setError('Error fetching progress');
    }
  };

  useEffect(() => {
    fetchLinkedUser();
  }, [token]);

  useEffect(() => {
    if (linkedUser) {
      fetchProgress(username, linkedUser);
      fetchProgress(linkedUser, username);
    } else {
      fetchProgress(username, '');
    }
  }, [linkedUser]);

  const addGoal = async () => {
    if (goalInput.trim()) {
      try {
        await axios.post('http://eggplantmydick.projectftm.com:3000/update-progress', {
          user1: username,
          user2: linkedUser,
          goal: goalInput,
          increment: 0
        }, {
          headers: { 'x-access-token': token }
        });
        setYourGoals([...yourGoals, goalInput]);
        setYourTallies({ ...yourTallies, [goalInput]: 0 });
        setGoalInput('');
      } catch (error) {
        console.error('Error adding goal:', error);
        setError('Error adding goal');
      }
    }
  };

  const incrementTally = async (goal) => {
    const updatedTally = (yourTallies[goal] || 0) + 1;
    setYourTallies({ ...yourTallies, [goal]: updatedTally });
    try {
      await axios.post('http://eggplantmydick.projectftm.com:3000/update-progress', {
        user1: username,
        user2: linkedUser,
        goal,
        increment: 1
      }, {
        headers: { 'x-access-token': token }
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Error updating progress');
    }
  };

  const linkAccounts = async () => {
    try {
      await axios.post('http://eggplantmydick.projectftm.com:3000/link-accounts', {
        user1: username,
        user2: linkInput
      }, {
        headers: { 'x-access-token': token }
      });
      setLinkedUser(linkInput);
    } catch (error) {
      console.error('Error linking accounts:', error);
      setError('Error linking accounts');
    }
  };

  const handleLinkKeyPress = (event) => {
    if (event.key === 'Enter') {
      linkAccounts();
    }
  };

  const calculateEmojiPositions = (yourAchieved, linkedAchieved) => {
    const totalGoals = 21;
    const middlePoint = Math.floor(totalGoals / 2);

    if (yourAchieved >= middlePoint && yourAchieved <= middlePoint) {
      return <img src="https://i.imgur.com/daHUo7Q.gif" alt="BJ" style={{ verticalAlign: 'middle' }} />;
    }

    const yourPosition = Math.min(totalGoals - 1, middlePoint - yourAchieved);
    const linkedPosition = Math.min(totalGoals - 1, middlePoint - linkedAchieved);

    let scoreCard = Array(totalGoals + 1).fill('o');
    scoreCard[middlePoint] = '.';
    if ( yourAchieved >= middlePoint) {
      yourAchieved = middlePoint - 1;
    }
    scoreCard[Math.max(0,  yourAchieved)] = '👄';
    if ( linkedAchieved >= middlePoint) {
      yourAchieved = middlePoint -1;
    }

    scoreCard[Math.max(middlePoint,  totalGoals - linkedAchieved)] = '🍆';

    return scoreCard.join('');
  };

  const yourAchieved = Object.values(yourTallies).reduce((acc, curr) => acc + curr, 0);
  const linkedAchieved = Object.values(linkedTallies).reduce((acc, curr) => acc + curr, 0);
  const emojiScoreCard = calculateEmojiPositions(yourAchieved, linkedAchieved);

  return (
    <div>
      <h2>Relationship Goals</h2>
      <div style={{ fontSize: '2rem', textAlign: 'center', whiteSpace: 'pre' }}>
        {emojiScoreCard}
      </div>
      <input
        type="text"
        value={linkInput}
        onChange={(e) => setLinkInput(e.target.value)}
        placeholder="Enter partner's username"
        onKeyPress={handleLinkKeyPress}
      />
      <button onClick={linkAccounts}>Link Accounts</button>
      <input
        type="text"
        value={goalInput}
        onChange={(e) => setGoalInput(e.target.value)}
        placeholder="Enter a goal"
        onKeyPress={(e) => e.key === 'Enter' && addGoal()}
      />
      <button onClick={addGoal}>Add Goal</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '48%' }}>
          <h3>Your Goals</h3>
          <ul>
            {yourGoals.map((goal, index) => (
              <li key={index}>
                {goal} - Achieved: {yourTallies[goal] || 0} times
                <button onClick={() => incrementTally(goal)}>Achieved</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ width: '48%' }}>
          <h3>{linkedUser ? `${linkedUser}'s Goals` : 'No Linked User'}</h3>
          {linkedUser && (
            <ul>
              {linkedGoals.map((goal, index) => (
                <li key={index}>
                  {goal} - Achieved: {linkedTallies[goal] || 0} times
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalTracker;
