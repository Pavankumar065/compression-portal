        import React, { useState, useEffect } from 'react';
        import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
        import CompressionControls from './components/CompressionControls'; // Self-contained component
        import HomePage from './components/HomePage'; // Your HomePage component
        import './App.css'; 
        import './index.css'; 

        function App() {
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

            const toggleDarkMode = () => {
                setIsDarkMode(!isDarkMode);
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
                                    <Link to="/" className="text-gray-300 hover:text-white transition-colors duration-200">Home</Link>
                                    <Link to="/compressor" className="text-gray-300 hover:text-white transition-colors duration-200">Compressor</Link>
                                    {/* Theme Toggle Button */}
                                    <button
                                        onClick={toggleDarkMode}
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
                                {/* Compressor route now renders the self-contained CompressionControls */}
                                <Route path="/compressor" element={<CompressionControls />} />
                            </Routes>
                        </div>
                    </div>
                </Router>
            );
        }

        export default App;
        