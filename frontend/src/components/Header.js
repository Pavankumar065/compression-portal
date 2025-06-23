
import React from 'react';

function Header({ currentPage, goToHomePage, goToCompressorPage, darkMode, toggleDarkMode }) {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mr-2">🗜️</span>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    Data Compression Portal
                </h1>
            </div>
            <nav className="flex items-center space-x-6">
                <button
                    onClick={goToHomePage}
                    className={`text-lg font-medium ${currentPage === 'home' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300'} transition-colors`}
                >
                    Home
                </button>
                <button
                    onClick={goToCompressorPage}
                    className={`text-lg font-medium ${currentPage === 'compressor' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300'} transition-colors`}
                >
                    Compressor
                </button>
                <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label="Toggle dark mode"
                >
                    {/* Using unicode characters for moon/sun icons */}
                    {darkMode ? (
                        <span className="text-xl">☀️</span> 
                    ) : (
                        <span className="text-xl">🌙</span> 
                    )}
                </button>
            </nav>
        </header>
    );
}

export default Header;