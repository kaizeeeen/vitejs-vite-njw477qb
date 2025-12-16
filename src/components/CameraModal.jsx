import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, X, Loader2, UserX, AlertTriangle, ShieldAlert, SwitchCamera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyIdentity, recordAttendance } from '../services/attendance';

const CameraModal = ({ employee, onClose, onVerified }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error, confirm_override
  const [errorMessage, setErrorMessage] = useState(null);
  const [failCount, setFailCount] = useState(0);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'

  const capture = useCallback(async () => {
    setErrorMessage(null);
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    setStatus('processing');

    try {
      // 1. Convert base64 to Blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();

      // 2. Get Location
      let location = null;
      if (navigator.geolocation) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
        } catch (geoError) {
            console.warn("Geolocation failed or denied:", geoError);
        }
      }

      // 3. Biometric Verification
      if (!employee.referencePhotoUrl) {
          throw new Error("No reference photo found for this worker. Please contact Admin.");
      }

      const result = await verifyIdentity(employee.referencePhotoUrl, blob);
      
      if (result.match === true) {
          // 4. Record Attendance (Face Scan)
          await recordAttendance(employee.id, employee.name, location, 'Face Scan');
          setStatus('success');
          
          setTimeout(() => {
            onVerified();
          }, 2000);
      } else {
          setFailCount(prev => prev + 1);
          throw new Error("Identity Mismatch: Biometric verification failed.");
      }

    } catch (err) {
      console.error("Verification process failed:", err);
      setErrorMessage(err.message || "Verification failed");
      setStatus('error');
    }
  }, [webcamRef, onVerified, employee]);

  const handleRetry = () => {
      setImgSrc(null);
      setStatus('idle');
      setErrorMessage(null);
  };

  const initiateOverride = () => {
      setStatus('confirm_override');
  };

  const confirmOverride = async () => {
      setStatus('processing');
      try {
        await recordAttendance(employee.id, employee.name, null, 'MANUAL_OVERRIDE');
        setStatus('success');
        setTimeout(() => {
            onVerified();
        }, 2000);
      } catch (e) {
          setStatus('error');
          setErrorMessage("Override failed: " + e.message);
      }
  };

  const cancelOverride = () => {
      setStatus('idle');
  };

  const toggleCamera = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-construction-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 mx-4">
        
        {/* Header */}
        <div className="bg-construction-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
          <h3 className="text-xl text-white font-semibold">
            Verifying: <span className="text-safety-orange">{employee.name}</span>
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {!imgSrc && status !== 'confirm_override' ? (
            <>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{
                        facingMode: facingMode
                    }}
                />
                
                {/* Camera Toggle Button */}
                <button 
                    onClick={toggleCamera}
                    className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-all"
                    title="Switch Camera"
                >
                    <SwitchCamera className="w-6 h-6" />
                </button>
            </>
          ) : status === 'confirm_override' ? (
             <div className="bg-construction-gray-900 w-full h-full flex flex-col items-center justify-center p-8 text-center">
                 <ShieldAlert className="w-24 h-24 text-yellow-500 mb-4" />
                 <h2 className="text-3xl font-bold text-white mb-2">Foreman Override</h2>
                 <p className="text-xl text-gray-300 mb-8">
                     Manually clock in <span className="text-safety-orange font-bold">{employee.name}</span>?
                 </p>
                 <div className="flex gap-4">
                     <button 
                        onClick={cancelOverride}
                        className="px-8 py-3 rounded-lg border border-gray-600 text-white hover:bg-gray-800 font-bold"
                     >
                         Cancel
                     </button>
                     <button 
                        onClick={confirmOverride}
                        className="px-8 py-3 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 font-bold"
                     >
                         Confirm Override
                     </button>
                 </div>
             </div>
          ) : (
            <img 
              src={imgSrc} 
              alt="captured" 
              className="w-full h-full object-cover" 
            />
          )}

          {/* Overlay Guide */}
          {!imgSrc && status !== 'confirm_override' && (
            <div className="absolute inset-0 border-[3px] border-dashed border-white/30 m-8 rounded-lg pointer-events-none"></div>
          )}

          {/* Loading Overlay */}
          {status === 'processing' && (
             <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
                <Loader2 className="w-16 h-16 text-safety-orange animate-spin mb-4" />
                <p className="text-white text-xl font-semibold">Verifying Identity...</p>
             </div>
          )}

          {/* Success Overlay */}
          <AnimatePresence>
            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center backdrop-blur-sm z-20"
              >
                <CheckCircle className="w-24 h-24 text-white mb-4" />
                <h2 className="text-4xl font-bold text-white">Verified!</h2>
                <p className="text-white/90 text-lg mt-2">Identity Confirmed</p>
              </motion.div>
            )}
          </AnimatePresence>

           {/* Error / Mismatch Overlay */}
           {status === 'error' && (
             <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute inset-0 bg-red-900/95 flex flex-col items-center justify-center z-30 p-8 text-center"
             >
                <UserX className="w-24 h-24 text-white mb-6" />
                <h2 className="text-4xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-xl text-white/90 max-w-lg mb-8">
                    {errorMessage}
                </p>
                <button 
                    onClick={handleRetry}
                    className="bg-white text-red-900 px-10 py-4 rounded-full font-bold text-xl hover:bg-gray-200 transition-colors shadow-lg"
                >
                    Try Again
                </button>
             </motion.div>
          )}

        </div>

        {/* Action Bar */}
        <div className="p-8 bg-construction-gray-800 border-t border-gray-700 flex flex-col items-center gap-4">
          {status === 'idle' && (
            <>
                <button
                onClick={capture}
                className="group bg-safety-orange hover:bg-orange-600 text-white font-bold py-4 px-12 rounded-full text-xl flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30"
                >
                <Camera className="w-8 h-8" />
                Scan Face
                </button>

                {/* Foreman Override Button */}
                <div className="flex flex-col items-center mt-4">
                    <p className="text-gray-500 text-sm mb-2">Failed to scan 3 times? Click Manual Log In.</p>
                    <button 
                        onClick={initiateOverride}
                        className="text-gray-400 hover:text-white border-b border-gray-500 hover:border-white transition-all pb-1 text-sm font-semibold uppercase tracking-wider"
                    >
                        Manual Log In
                    </button>
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
