import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import CompressionControls from './components/CompressionControls';
import StatisticsDisplay from './components/StatisticsDisplay';
import HomePage from './components/HomePage';
import './App.css'; 

function App() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadInfo, setUploadInfo] = useState(null); 
    const [algorithm, setAlgorithm] = useState('');
    const [stats, setStats] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionType, setActionType] = useState('compress'); 
    const [originalFileName, setOriginalFileName] = useState(''); 
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);
    const handleFileSelect = (file) => {
        setSelectedFile(file);
        setUploadInfo(null);
        setStats(null);
        setError(null);
        setAlgorithm('');
        setActionType('compress'); 
        setOriginalFileName(file.name); 
    };
    const handleProcessFile = async () => {
        if (!selectedFile || !algorithm) {
            setError('Please upload a file and select an algorithm.');
            return;
        }

        setLoading(true);
        setError(null);
        setStats(null); 

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            console.log("Uploading file...");
            const uploadResponse = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.message || 'File upload failed.');
            }
            const uploadResult = await uploadResponse.json();
            setUploadInfo(uploadResult);
            console.log(`Performing ${actionType} with ${algorithm} on ${uploadResult.filePath}...`);
            const processResponse = await fetch(`http://localhost:5000/api/${actionType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filePath: uploadResult.filePath,
                    algorithm: algorithm,
                    fileName: originalFileName 
                }),
            });

            if (!processResponse.ok) {
                const errorData = await processResponse.json();
                throw new Error(errorData.message || `${actionType} failed.`);
            }
            const processResult = await processResponse.json();
            const newStats = { ...processResult };
            if (actionType === 'compress') {
                newStats.initialSize = uploadResult.size;
                newStats.originalFileName = uploadResult.fileName;
            } else {
                newStats.initialSize = uploadResult.size;
                newStats.originalFileName = uploadResult.fileName;
            }
            setStats(newStats);

        } catch (err) {
            console.error(`${actionType} error:`, err);
            setError(`Error! ${err.message || `Failed to ${actionType} file.`}`);
            setStats(null); 
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileName) => {
        try {
            const response = await fetch(`http://localhost:5000/api/download/${fileName}`);
            if (!response.ok) {
                throw new Error('File download failed.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            setError(`Error! ${err.message || 'Failed to download file.'}`);
        }
    };

    return (
        <Router>
            <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-300`}>
                <nav className="bg-gray-800 dark:bg-gray-950 p-4 shadow-md">
                    <div className="container mx-auto flex justify-between items-center">
                        <Link to="/" className="text-white text-2xl font-bold">
                            Data Compression Portal
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link to="/" className="text-gray-300 hover:text-white transition-colors duration-200">
                                Home
                            </Link>
                            <Link to="/compressor" className="text-gray-300 hover:text-white transition-colors duration-200">
                                Compressor
                            </Link>
                            {/* Theme Toggle Button */}
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-2 rounded-full bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {isDarkMode ? (
                                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.325 3.325l-.707.707M6.379 6.379l-.707-.707m12.728 0l-.707-.707M6.379 17.621l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z"></path>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="container mx-auto p-8">
                    <Routes>
                        <Route path="/" element={<HomePage isDarkMode={isDarkMode} />} />
                        <Route path="/compressor" element={
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <FileUpload
                                    onFileSelect={handleFileSelect}
                                    uploadInfo={uploadInfo}
                                    error={error}
                                />
                                <CompressionControls
                                    selectedAlgorithm={algorithm}
                                    onSelectAlgorithm={setAlgorithm}
                                    onProcessFile={handleProcessFile}
                                    loading={loading}
                                    actionType={actionType}
                                />
                                <StatisticsDisplay
                                    stats={stats}
                                    onDownload={handleDownload}
                                    onActionTypeChange={setActionType}
                                    isDarkMode={isDarkMode}
                                    error={error} 
                                />
                            </div>
                        } />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;