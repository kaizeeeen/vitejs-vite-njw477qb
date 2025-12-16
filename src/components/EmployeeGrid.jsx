import React, { useEffect, useState } from 'react';
import { User, HardHat, Settings, AlertCircle } from 'lucide-react';
import { getWorkers } from '../services/workers';

const EmployeeGrid = ({ onSelectEmployee, onAdminAccess }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getWorkers();
        setEmployees(data);
      } catch (err) {
        setError("Failed to load worker profiles.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-construction-gray-900 p-8 flex flex-col items-center justify-center relative">
      
      {/* Admin Button (Gear Icon) */}
      <button 
        onClick={onAdminAccess}
        className="absolute top-8 right-8 text-gray-600 hover:text-safety-orange transition-colors"
        title="Admin Settings"
      >
        <Settings className="w-8 h-8" />
      </button>

      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
           <HardHat className="w-10 h-10 text-safety-orange" />
           Face-In Kiosk
        </h1>
        <p className="text-gray-400 text-xl">Select your profile to sign in</p>
      </header>

      {loading ? (
          <div className="text-white text-xl animate-pulse">Loading profiles...</div>
      ) : error ? (
          <div className="flex flex-col items-center gap-2 text-red-500 bg-red-500/10 p-6 rounded-xl border border-red-500/50">
              <AlertCircle className="w-8 h-8" />
              <p>{error}</p>
          </div>
      ) : employees.length === 0 ? (
          <div className="text-gray-500 text-lg">No workers found. Please ask Admin to add profiles.</div>
      ) : (
        <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
            {employees.map((employee) => (
            <button
                key={employee.id}
                onClick={() => onSelectEmployee(employee)}
                className="group relative bg-construction-gray-800 border-2 border-gray-700 hover:border-safety-orange rounded-xl p-8 flex flex-col items-center transition-all duration-300 transform hover:scale-105"
            >
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4 overflow-hidden group-hover:ring-4 ring-safety-orange/50 transition-all">
                {employee.referencePhotoUrl ? (
                    <img src={employee.referencePhotoUrl} alt={employee.name} className="w-full h-full object-cover" />
                ) : (
                    <User className="w-12 h-12 text-gray-300 group-hover:text-safety-orange" />
                )}
                </div>
                <h2 className="text-2xl font-bold text-white">{employee.name}</h2>
                <p className="text-safety-orange font-medium">{employee.role}</p>
            </button>
            ))}
        </div>
      )}

      <footer className="mt-16 text-gray-500">
        <p>Face-In Attendance System v3.0 (Diamond)</p>
      </footer>
    </div>
  );
};

export default EmployeeGrid;
