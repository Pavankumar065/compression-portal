import React from 'react';

function CompressionControls({ selectedAlgorithm, onSelectAlgorithm, onProcessFile, loading, actionType }) {
    // Defines the available compression/decompression algorithms for the UI dropdown.
    // LZ77 has been removed from this list as per the backend changes.
    const algorithms = [
        { value: '', label: 'Select Algorithm', disabled: true }, // Default placeholder option
        { value: 'gzip', label: 'Gzip (Recommended for all files)' },
        { value: 'huffman', label: 'Huffman Coding (Best for text with repeated characters)' },
        { value: 'rle', label: 'Run-Length Encoding (RLE) (Best for highly repetitive data, e.g., simple images)' },
        // The LZ77 option is no longer present here
    ];

    return (
        // Main container for the algorithm selection and processing buttons
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Section title, dynamically showing "Compress" or "Decompress" */}
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                2. Select Algorithm & {actionType === 'compress' ? 'Compress' : 'Decompress'}
            </h2>

            {/* Algorithm selection dropdown */}
            <div className="mb-6">
                <label htmlFor="algorithm-select" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                    Select Algorithm:
                </label>
                <select
                    id="algorithm-select"
                    className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={selectedAlgorithm} // Controlled component: value is from parent state
                    onChange={(e) => onSelectAlgorithm(e.target.value)} // Prop to update parent state
                    disabled={loading} // Disable during processing
                >
                    {/* Map through the algorithms array to create option elements */}
                    {algorithms.map((algo) => (
                        <option key={algo.value} value={algo.value} disabled={algo.disabled}>
                            {algo.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Action button: Start Compression or Start Decompression */}
            <button
                onClick={onProcessFile} // Trigger the processing function from parent
                disabled={!selectedAlgorithm || loading} // Disable if no algorithm selected or loading
                className={`w-full py-3 rounded-lg text-white font-semibold transition-colors duration-200
                    ${!selectedAlgorithm || loading ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed' :
                        // Dynamic styling based on actionType (compress/decompress)
                        actionType === 'compress' ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800' :
                        'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800'
                    }
                `}
            >
                {loading ? ( // Show loading spinner and text when processing
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {actionType === 'compress' ? 'Processing...' : 'Processing...'}
                    </div>
                ) : ( // Show standard button text when not loading
                    actionType === 'compress' ? 'Start Compression' : 'Start Decompression'
                )}
            </button>
        </div>
    );
}

export default CompressionControls;
