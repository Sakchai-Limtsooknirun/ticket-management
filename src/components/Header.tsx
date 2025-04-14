import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types/system';
import '../styles/Header.css';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  console.log('Current user in Header:', currentUser); // Debug log
  console.log('Current user role:', currentUser.role); // Debug log
  console.log('Is admin?', currentUser.role === 'ADMIN'); // Debug log

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo">ChemReq</Link>
        <nav className="main-nav">
          <Link to="/new-request" className="nav-link">New Request</Link>
          <Link to="/my-tickets" className="nav-link">My Tickets</Link>
          {(currentUser.role.toUpperCase() === 'ADMIN' || currentUser.role.toUpperCase() === 'APPROVER') && (
            <Link to="/admin/requests" className="nav-link">Request Management</Link>
          )}
          <Link to="/history" className="nav-link">History</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
          <Link to="/help" className="nav-link">Help</Link>
        </nav>
      </div>
      <div className="header-right">
        <div className="language-selector">
          <button className="lang-btn">EN</button>
        </div>
        <div className="user-menu-container">
          <button className="user-menu-button" onClick={toggleUserMenu}>
            <span className="user-name">{currentUser.fullName}</span>
            <span className="user-role">({currentUser.role.toLowerCase()})</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          {showUserMenu && (
            <div className="user-dropdown-menu">
              <div className="user-info">
                <p className="user-email">{currentUser.email}</p>
                <p className="user-department">{currentUser.department}</p>
              </div>
              <div className="menu-divider"></div>
              <button className="logout-button" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 