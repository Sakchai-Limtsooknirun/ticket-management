import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/system';
import '../styles/Products.css';

interface ProductsProps {
  onCreateRequest: () => void;
  currentUser: User;
}

const Products: React.FC<ProductsProps> = ({ onCreateRequest, currentUser }) => {
  const navigate = useNavigate();

  const features = [
    { 
      title: 'Create New Request', 
      icon: '➕', 
      onClick: onCreateRequest 
    },
    { 
      title: 'Request Management', 
      icon: '📝',
      onClick: () => navigate('/admin/requests'),
      adminOnly: true
    },
    { title: 'Approval Workflow', icon: '✅' },
    { title: 'Chemical Config', icon: '⚗️' },
    { title: 'File Attachments', icon: '📎' },
    { title: 'Status Tracking', icon: '📊' }
  ];

  const visibleFeatures = features.filter(feature => 
    !feature.adminOnly || currentUser.role === 'ADMIN'
  );

  return (
    <section className="products">
      <h2>System Features</h2>
      <div className="products-grid">
        {visibleFeatures.map((feature, index) => (
          <div 
            key={index} 
            className={`product-card ${feature.onClick ? 'clickable' : ''}`}
            onClick={feature.onClick}
          >
            <span className="product-icon">{feature.icon}</span>
            <h3>{feature.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Products; 