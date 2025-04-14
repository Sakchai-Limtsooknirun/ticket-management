import React, { useState } from 'react';
import { login, LoginResponse } from '../services/api';
import { User, UserRole, Department } from '../types/system';
import '../styles/Login.css';

interface LoginProps {
  onLoginSuccess: (token: string, user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(username, password);
      const mappedUser: User = {
        _id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        fullName: response.user.fullName,
        role: response.user.role.replace(/\s+/g, '') as UserRole,
        department: response.user.department as Department,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      onLoginSuccess(response.token, mappedUser);
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Chemical Request System</h2>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 