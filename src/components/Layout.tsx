import React from 'react';
import { Outlet } from 'react-router-dom';
import { User } from '../types/system';
import Header from './Header';
import '../styles/Layout.css';

interface LayoutProps {
  currentUser: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="layout">
      <Header currentUser={currentUser} onLogout={onLogout} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 