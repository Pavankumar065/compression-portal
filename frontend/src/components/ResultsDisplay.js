import React from 'react';

function ResultsDisplay({ result, onDownload }) {
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">3. Results</h2>

            {result.message && (
                <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Success! </strong>
                    <span className="block sm:inline">{result.message}</span>
                </div>
            )}

            <div className="space-y-3 text-gray-800 dark:text-gray-200">
                <p><strong>Output File Name:</strong> <span className="font-medium">{result.outputFileName}</span></p>

                {result.originalSize !== undefined && (
                    <p><strong>Original Size:</strong> <span className="font-medium">{formatBytes(result.originalSize)}</span></p>
                )}

                {result.compressedSize !== undefined && (
                    <p><strong>Compressed Size:</strong> <span className="font-medium">{formatBytes(result.compressedSize)}</span></p>
                )}

                {result.decompressedSize !== undefined && (
                    <p><strong>Decompressed Size:</strong> <span className="font-medium">{formatBytes(result.decompressedSize)}</span></p>
                )}

                {result.compressionRatio !== undefined && (
                    <p>
                        <strong>Compression Ratio:</strong> <span className="font-medium">{result.compressionRatio}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                            (Ratio of Compressed Size / Original Size. Lower is better. e.g., 0.5 means 50% size reduction)
                        </span>
                    </p>
                )}
            </div>

            {result.outputFileName && (
                <button
                    onClick={() => onDownload(result.outputFileName)}
                    className="mt-6 w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition-colors duration-200"
                >
                    Download File
                </button>
            )}
        </div>
    );
}

export default ResultsDisplay;