import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// API base URL - change this to your backend URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

// Configure axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

function App() {
  // State management
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchHistory();
  }, []);

  // Fetch all users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
        // Auto-select first user if none selected
        if (!selectedUserId && response.data.data.length > 0) {
          setSelectedUserId(response.data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch points history with pagination
  const fetchHistory = async (page = 1) => {
    try {
      const response = await api.get(`/history?page=${page}&limit=5`);
      if (response.data.success) {
        setHistory(response.data.data.history);
        setHistoryPagination(response.data.data.pagination);
        setHistoryPage(page);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Show message with auto-hide
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 3000);
  };

  // Handle claim points
  const handleClaimPoints = async () => {
    if (!selectedUserId) {
      showMessage('Please select a user first', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/claim-points', { userId: selectedUserId });

      if (response.data.success) {
        setUsers(response.data.data.allUsers);
        showMessage(response.data.message, 'success');
        fetchHistory(); // Refresh history after claiming points
      }
    } catch (error) {
      console.error('Error claiming points:', error);
      showMessage(error.response?.data?.message || 'Failed to claim points', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle add new user
  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      showMessage('Please enter a user name', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/users', { name: newUserName.trim() });

      if (response.data.success) {
        setUsers(response.data.data);
        setNewUserName('');
        setShowAddUser(false);
        showMessage(response.data.message, 'success');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      showMessage(error.response?.data?.message || 'Failed to add user', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get selected user details
  const selectedUser = users.find(user => user._id === selectedUserId);

  // Format date for history display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1>🎯 Points Claiming System</h1>
          <p>Select a user and claim random points to climb the leaderboard!</p>
        </header>

        {/* Message Display */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Main Content */}
        <div className="main-content">
          {/* Left Panel - User Selection & Actions */}
          <div className="left-panel">
            <div className="card">
              <h2>👤 Select User</h2>

              {/* User Selection */}
              <div className="user-selection">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={loading}
                  className="user-select"
                >
                  <option value="">-- Select a User --</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.totalPoints} pts - Rank #{user.rank})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected User Info */}
              {selectedUser && (
                <div className="selected-user-info">
                  <h3>{selectedUser.name}</h3>
                  <div className="user-stats">
                    <span className="points">{selectedUser.totalPoints} Points</span>
                    <span className="rank">Rank #{selectedUser.rank}</span>
                  </div>
                </div>
              )}

              {/* Claim Button */}
              <button
                onClick={handleClaimPoints}
                disabled={loading || !selectedUserId}
                className={`claim-btn ${loading ? 'loading' : ''}`}
              >
                {loading ? '⏳ Claiming...' : '🎲 Claim Random Points'}
              </button>

              {/* Add User Section */}
              <div className="add-user-section">
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="toggle-add-user"
                >
                  {showAddUser ? '❌ Cancel' : '➕ Add New User'}
                </button>

                {showAddUser && (
                  <div className="add-user-form">
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Enter user name"
                      className="user-name-input"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
                    />
                    <button
                      onClick={handleAddUser}
                      disabled={loading || !newUserName.trim()}
                      className="add-user-btn"
                    >
                      Add User
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Leaderboard */}
          <div className="right-panel">
            <div className="card">
              <h2>🏆 Leaderboard</h2>

              {users.length === 0 ? (
                <div className="no-data">No users found</div>
              ) : (
                <div className="leaderboard">
                  {users.map((user, index) => (
                    <div
                      key={user._id}
                      className={`leaderboard-item ${user._id === selectedUserId ? 'selected' : ''} ${index < 3 ? 'top-3' : ''}`}
                    >
                      <div className="rank">
                        <span className="rank-number">#{user.rank}</span>
                        {index === 0 && <span className="trophy">🥇</span>}
                        {index === 1 && <span className="trophy">🥈</span>}
                        {index === 2 && <span className="trophy">🥉</span>}
                      </div>
                      <div className="user-info">
                        <span className="name">{user.name}</span>
                        <span className="points">{user.totalPoints} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History Section */}
            <div className="card">
              <div className="history-header">
                <h2>📜 Recent Activity</h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="toggle-history"
                >
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>

              {showHistory && (
                <div className="history-section">
                  {history.length === 0 ? (
                    <div className="no-data">No history found</div>
                  ) : (
                    <>
                      <div className="history-list">
                        {history.map((record) => (
                          <div key={record._id} className="history-item">
                            <div className="history-info">
                              <span className="user-name">{record.userName}</span>
                              <span className="points">+{record.pointsAwarded} pts</span>
                            </div>
                            <div className="history-date">
                              {formatDate(record.claimedAt)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {historyPagination.totalPages > 1 && (
                        <div className="pagination">
                          <button
                            onClick={() => fetchHistory(historyPage - 1)}
                            disabled={!historyPagination.hasPrev}
                            className="pagination-btn"
                          >
                            ← Previous
                          </button>
                          <span className="pagination-info">
                            Page {historyPagination.currentPage} of {historyPagination.totalPages}
                          </span>
                          <button
                            onClick={() => fetchHistory(historyPage + 1)}
                            disabled={!historyPagination.hasNext}
                            className="pagination-btn"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>Built with ❤️ by iPalashAcharya</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
