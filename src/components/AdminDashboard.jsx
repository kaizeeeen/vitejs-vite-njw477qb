import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { addWorker, getWorkers, deleteWorker } from '../services/workers';
import { getAttendanceHistory, deleteAttendanceRecord } from '../services/attendance';
import { UserPlus, Upload, ArrowLeft, Loader2, FileText, Settings, Download, Trash2, User, ChevronLeft, ChevronRight, Calendar, List, Camera, RefreshCw, X } from 'lucide-react';

const AdminDashboard = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'reports'

    return (
        <div className="min-h-screen bg-construction-gray-900 p-8">
            <header className="mb-8 flex items-center justify-between">
                 <button 
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                    Back to Kiosk
                </button>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-safety-orange" />
                    Admin Dashboard
                </h1>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-700 pb-1">
                <button 
                    onClick={() => setActiveTab('manage')}
                    className={`px-6 py-3 font-bold rounded-t-lg transition-colors ${activeTab === 'manage' ? 'bg-construction-gray-800 text-safety-orange border-t border-x border-gray-700' : 'text-gray-400 hover:text-white'}`}
                >
                    Manage Workers
                </button>
                <button 
                    onClick={() => setActiveTab('reports')}
                    className={`px-6 py-3 font-bold rounded-t-lg transition-colors ${activeTab === 'reports' ? 'bg-construction-gray-800 text-safety-orange border-t border-x border-gray-700' : 'text-gray-400 hover:text-white'}`}
                >
                    History & Reports
                </button>
            </div>

            <div className="bg-construction-gray-800 rounded-xl p-8 border border-gray-700 shadow-xl min-h-[500px]">
                {activeTab === 'manage' ? <ManageWorkersTab /> : <ReportsTab />}
            </div>
        </div>
    );
};

// Helper to convert dataURL to File
const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const ManageWorkersTab = () => {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const [cameraMode, setCameraMode] = useState('user'); // 'user' | 'environment'
    const webcamRef = useRef(null);

    // List State
    const [workersList, setWorkersList] = useState([]);
    const [listLoading, setListLoading] = useState(true);

    const fetchWorkersList = async () => {
        setListLoading(true);
        try {
            const data = await getWorkers();
            setWorkersList(data);
        } catch (error) {
            console.error(error);
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkersList();
    }, []);

    const handlePhotoChange = (e) => {
        if (e.target.files[0]) {
            setPhoto(e.target.files[0]);
        }
    };

    const handleCapture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            const file = dataURLtoFile(imageSrc, `capture_${Date.now()}.jpg`);
            setPhoto(file);
            setShowCamera(false);
        }
    }, [webcamRef]);

    const toggleCameraMode = () => {
        setCameraMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !role || !photo) return;

        setLoading(true);
        try {
            await addWorker(name, role, photo);
            setSuccess(true);
            setName('');
            setRole('');
            setPhoto(null);
            setTimeout(() => setSuccess(false), 3000);
            fetchWorkersList(); // Refresh list
        } catch (error) {
            alert("Failed to add worker: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (worker) => {
        if (window.confirm(`Are you sure you want to delete ${worker.name}? This cannot be undone.`)) {
            try {
                await deleteWorker(worker.id);
                fetchWorkersList(); // Refresh list
            } catch (error) {
                alert("Failed to delete worker: " + error.message);
            }
        }
    };

    return (
        <div className="flex flex-col gap-12">
            {/* Top Section: Add Form */}
            <div className="max-w-3xl mx-auto w-full">
                <h2 className="text-xl text-white font-semibold mb-6 flex items-center gap-2">
                    <UserPlus className="text-safety-orange" />
                    Add New Worker Profile
                </h2>

                <form onSubmit={handleSubmit} className="bg-construction-gray-900 p-8 rounded-xl border border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-gray-400 mb-2">Full Name</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-construction-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:border-safety-orange focus:outline-none"
                                placeholder="e.g. Juan Cruz"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-2">Role / Title</label>
                            <input 
                                type="text" 
                                value={role} 
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-construction-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:border-safety-orange focus:outline-none"
                                placeholder="e.g. Foreman"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-400 mb-2">Master Reference Photo</label>
                        <div className="flex flex-col gap-4">
                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-safety-orange transition-colors cursor-pointer relative bg-construction-gray-800">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {photo ? (
                                    <p className="text-green-400 font-medium">{photo.name}</p>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <Upload className="w-8 h-8" />
                                        <span>Click to upload photo</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* OR Separator */}
                            <div className="flex items-center gap-4">
                                <div className="h-px bg-gray-700 flex-1"></div>
                                <span className="text-gray-500 text-sm">OR</span>
                                <div className="h-px bg-gray-700 flex-1"></div>
                            </div>

                            {/* Camera Button */}
                            <button
                                type="button"
                                onClick={() => setShowCamera(true)}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <Camera className="w-5 h-5" />
                                Take Photo
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || !photo}
                        className="w-full bg-safety-orange hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Save Worker Profile"}
                    </button>

                    {success && (
                        <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-center">
                            Worker added successfully!
                        </div>
                    )}
                </form>
            </div>

            {/* Bottom Section: Existing Workers List */}
            <div className="border-t border-gray-700 pt-12">
                 <h2 className="text-2xl text-white font-bold mb-8 flex items-center gap-2 justify-center">
                    <User className="text-safety-orange w-8 h-8" />
                    Current Team List
                </h2>
                
                {listLoading ? (
                    <div className="text-gray-500 flex justify-center items-center gap-2"><Loader2 className="animate-spin w-6 h-6" /> Loading list...</div>
                ) : workersList.length === 0 ? (
                    <p className="text-gray-500 text-center text-lg">No workers found.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                        {workersList.map(worker => (
                            <div key={worker.id} className="bg-construction-gray-900 p-4 rounded-lg border border-gray-700 flex items-center justify-between group hover:border-gray-500 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-safety-orange transition-colors">
                                        {worker.referencePhotoUrl ? (
                                            <img src={worker.referencePhotoUrl} alt={worker.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-full h-full p-2 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{worker.name}</h3>
                                        <p className="text-sm text-safety-orange font-medium">{worker.role}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(worker)}
                                    className="text-gray-500 hover:text-red-500 p-3 rounded-full hover:bg-red-500/10 transition-colors"
                                    title="Delete Worker"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="bg-construction-gray-900 rounded-xl overflow-hidden shadow-2xl w-full max-w-2xl border border-gray-700">
                        <div className="p-4 bg-construction-gray-800 flex justify-between items-center border-b border-gray-700">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <Camera className="text-safety-orange" />
                                Take Reference Photo
                            </h3>
                            <button onClick={() => setShowCamera(false)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="relative aspect-video bg-black">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{
                                    facingMode: cameraMode
                                }}
                            />
                        </div>

                        <div className="p-6 flex justify-between items-center gap-4 bg-construction-gray-800 border-t border-gray-700">
                            <button 
                                onClick={toggleCameraMode}
                                className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
                                title="Flip Camera"
                            >
                                <RefreshCw className="w-6 h-6" />
                            </button>
                            
                            <button 
                                onClick={handleCapture}
                                className="flex-1 bg-safety-orange hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <div className="w-4 h-4 rounded-full bg-white animate-pulse"></div>
                                Capture Photo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReportsTab = () => {
    const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'history'
    const [currentDate, setCurrentDate] = useState(new Date());

    const [history, setHistory] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters for "All History" mode
    const [selectedWorkerId, setSelectedWorkerId] = useState('ALL');
    const [dateRange, setDateRange] = useState('7'); // '7', '30', 'ALL'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [h, w] = await Promise.all([getAttendanceHistory(), getWorkers()]);
            setHistory(h);
            setWorkers(w);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRecord = async (recordId) => {
        if (window.confirm("Delete this attendance record? This cannot be undone.")) {
            try {
                await deleteAttendanceRecord(recordId);
                setHistory(prev => prev.filter(item => item.id !== recordId));
            } catch (error) {
                alert("Failed to delete record: " + error.message);
            }
        }
    };

    // --- Daily View Logic ---
    const handlePrevDay = () => {
        const prev = new Date(currentDate);
        prev.setDate(prev.getDate() - 1);
        setCurrentDate(prev);
    };

    const handleNextDay = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 1);
        setCurrentDate(next);
    };

    const dailyData = history.filter(record => {
        if (!record.timestamp) return false;
        const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
        return (
            recordDate.getDate() === currentDate.getDate() &&
            recordDate.getMonth() === currentDate.getMonth() &&
            recordDate.getFullYear() === currentDate.getFullYear()
        );
    });

    // --- All History Logic ---
    const filteredHistoryData = history.filter(record => {
        if (selectedWorkerId !== 'ALL' && record.workerId !== selectedWorkerId) return false;
        if (dateRange !== 'ALL') {
            if (!record.timestamp) return false;
            const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
            const now = new Date();
            const daysDiff = (now - recordDate) / (1000 * 60 * 60 * 24);
            if (daysDiff > parseInt(dateRange)) return false;
        }
        return true;
    });

    // --- Export ---
    const handleExportCSV = () => {
        const dataToExport = viewMode === 'daily' ? dailyData : filteredHistoryData;
        if (dataToExport.length === 0) return;

        const headers = ["Date", "Time", "Worker Name", "Worker ID", "Method", "Verified"];
        const rows = dataToExport.map(r => {
             const d = r.timestamp && r.timestamp.toDate ? r.timestamp.toDate() : new Date();
             return [
                 d.toLocaleDateString(),
                 d.toLocaleTimeString(),
                 r.workerName,
                 r.workerId,
                 r.method || 'Unknown',
                 r.verified ? 'Yes' : 'No'
             ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_report_${viewMode}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="text-white flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8"/></div>;

    const renderTable = (data) => (
         <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-construction-gray-900 text-gray-400 border-b border-gray-700">
                            <th className="p-4">Date & Time</th>
                            <th className="p-4">Worker</th>
                            <th className="p-4">Method</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300">
                        {data.length > 0 ? data.map(record => {
                             const date = record.timestamp && record.timestamp.toDate ? record.timestamp.toDate() : new Date();
                             return (
                                <tr key={record.id} className="border-b border-gray-700 hover:bg-gray-700/50 group">
                                    <td className="p-4">
                                        <div className="text-white font-medium">{date.toLocaleDateString()}</div>
                                        <div className="text-sm text-gray-500">{date.toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-4 font-bold text-white">{record.workerName}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.method === 'MANUAL_OVERRIDE' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {record.method || 'Face Scan'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-green-400 flex items-center gap-1">
                                            Verified
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDeleteRecord(record.id)}
                                            className="text-gray-600 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10"
                                            title="Delete Record"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">No records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
    );

    return (
        <div className="space-y-6">
            
            {/* View Toggle */}
            <div className="flex justify-center mb-4">
                <div className="bg-construction-gray-900 p-1 rounded-lg border border-gray-700 flex">
                    <button 
                        onClick={() => setViewMode('daily')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${viewMode === 'daily' ? 'bg-construction-gray-800 text-safety-orange shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Calendar className="w-4 h-4" />
                        Daily View
                    </button>
                    <button 
                         onClick={() => setViewMode('history')}
                         className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-all ${viewMode === 'history' ? 'bg-construction-gray-800 text-safety-orange shadow-sm' : 'text-gray-400 hover:text-white'}`}
                    >
                        <List className="w-4 h-4" />
                        All History
                    </button>
                </div>
            </div>

            {/* View Content */}
            {viewMode === 'daily' ? (
                <div className="space-y-6">
                    {/* Date Navigation */}
                    <div className="flex flex-col items-center gap-2 bg-construction-gray-900 p-6 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-6">
                            <button onClick={handlePrevDay} className="p-2 hover:bg-gray-800 rounded-full text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                            <h2 className="text-2xl font-bold text-white min-w-[200px] text-center">
                                {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </h2>
                            <button onClick={handleNextDay} className="p-2 hover:bg-gray-800 rounded-full text-white transition-colors"><ChevronRight className="w-6 h-6" /></button>
                        </div>
                        <p className="text-safety-orange font-bold text-lg">
                            {dailyData.length} Worker{dailyData.length !== 1 ? 's' : ''} Present
                        </p>
                    </div>
                    
                    {renderTable(dailyData)}
                </div>
            ) : (
                <div className="space-y-6">
                     <div className="flex flex-wrap gap-4 items-end justify-between bg-construction-gray-900 p-4 rounded-lg border border-gray-700">
                        {/* Filters */}
                        <div className="flex gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Worker</label>
                                <select 
                                    value={selectedWorkerId} 
                                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                                    className="bg-construction-gray-800 text-white border border-gray-600 rounded p-2 focus:border-safety-orange outline-none min-w-[200px]"
                                >
                                    <option value="ALL">All Workers</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Date Range</label>
                                <select 
                                    value={dateRange} 
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="bg-construction-gray-800 text-white border border-gray-600 rounded p-2 focus:border-safety-orange outline-none"
                                >
                                    <option value="7">Last 7 Days</option>
                                    <option value="30">Last 30 Days</option>
                                    <option value="ALL">All Time</option>
                                </select>
                            </div>
                        </div>

                        {/* Export */}
                        <button 
                            onClick={handleExportCSV}
                            disabled={filteredHistoryData.length === 0}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            Export CSV
                        </button>
                    </div>

                    {renderTable(filteredHistoryData)}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
