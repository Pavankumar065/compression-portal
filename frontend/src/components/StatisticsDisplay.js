import React from 'react';
import { formatBytes } from '../utils/formatBytes'; 

function StatisticsDisplay({ stats, onDownload, onActionTypeChange, isDarkMode, error }) {
    
    const buttonText = stats?.compressionRatio ? 'Download Compressed File' : 'Download Decompressed File';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                3. Results & Download
            </h2>

            {/* Action Type Toggle (Compress/Decompress) */}
            <div className="mb-6 flex space-x-4">
                <button
                    onClick={() => onActionTypeChange('compress')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
                        ${!stats?.outputFileName || stats?.compressionRatio ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}
                        hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800
                    `}
                >
                    Switch to Compress Mode
                </button>
                <button
                    onClick={() => onActionTypeChange('decompress')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors duration-200
                        ${!stats?.outputFileName || stats?.decompressedSize ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}
                        hover:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-800
                    `}
                >
                    Switch to Decompress Mode
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 p-3 rounded-md mb-4 text-sm">
                    <p className="font-semibold">Operation Failed:</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Statistics Display */}
            {stats && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-4 rounded-md mb-4">
                    <p className="font-semibold mb-2">Operation Result:</p>
                    <p>{stats.message}</p>
                    <hr className="my-2 border-green-200 dark:border-green-700" />

                    {stats.initialSize !== undefined && (
                        <p>Original Size: <span className="font-medium">{formatBytes(stats.initialSize)}</span></p>
                    )}
                    {stats.compressedSize !== undefined && (
                        <p>Compressed Size: <span className="font-medium">{formatBytes(stats.compressedSize)}</span></p>
                    )}
                    {stats.decompressedSize !== undefined && (
                        <p>Decompressed Size: <span className="font-medium">{formatBytes(stats.decompressedSize)}</span></p>
                    )}
                    {stats.compressionRatio && (
                        <p>Compression Ratio (Compressed / Original): <span className="font-medium">{stats.compressionRatio}</span></p>
                    )}
                    {stats.initialSize !== undefined && stats.compressedSize !== undefined && (
                        <p>Savings: <span className="font-medium">
                            {formatBytes(Math.abs(stats.initialSize - stats.compressedSize))}
                            ({((1 - stats.compressionRatio) * 100).toFixed(2)}% {((1 - stats.compressionRatio) * 100) >= 0 ? 'reduction' : 'increase'})
                        </span></p>
                    )}
                     {stats.processingTimeMs && (
                        <p>Processing Time: <span className="font-medium">{stats.processingTimeMs} ms</span></p>
                    )}
                </div>
            )}

            {/* Download Button */}
            {stats && stats.outputFileName && (
                <button
                    onClick={() => onDownload(stats.outputFileName)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800"
                >
                    {buttonText}
                </button>
            )}

            {/* Initial Message */}
            {!stats && !error && (
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 p-4 rounded-md text-center">
                    <p>Upload a file and start compression/decompression to see statistics.</p>
                </div>
            )}
        </div>
    );
}

export default StatisticsDisplay;