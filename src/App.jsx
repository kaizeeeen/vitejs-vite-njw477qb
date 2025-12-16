import React, { useState } from 'react';
import EmployeeGrid from './components/EmployeeGrid';
import CameraModal from './components/CameraModal';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';

function App() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [view, setView] = useState('grid'); // 'grid', 'admin'
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Kiosk Flow
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleCloseModal = () => {
    setSelectedEmployee(null);
  };

  const handleVerified = () => {
    setSelectedEmployee(null);
  };

  // Admin Flow
  const handleAdminAccess = () => {
    setShowAdminLogin(true);
  };

  const handleAdminLogin = () => {
    setShowAdminLogin(false);
    setView('admin');
  };

  const handleBackToGrid = () => {
    setView('grid');
  };

  if (view === 'admin') {
      return <AdminDashboard onBack={handleBackToGrid} />;
  }

  return (
    <div className="bg-construction-gray-900 min-h-screen text-white font-sans">
      <EmployeeGrid 
        onSelectEmployee={handleSelectEmployee} 
        onAdminAccess={handleAdminAccess}
      />
      
      <AdminLogin 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)}
        onLogin={handleAdminLogin}
      />

      {selectedEmployee && (
        <CameraModal 
          employee={selectedEmployee} 
          onClose={handleCloseModal}
          onVerified={handleVerified}
        />
      )}
    </div>
  );
}

export default App;
