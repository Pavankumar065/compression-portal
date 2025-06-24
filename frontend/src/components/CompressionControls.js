import React, { useState } from 'react'; // <--- Ensure useState is imported
import axios from 'axios'; // <--- Ensure axios is imported
import { formatBytes } from '../utils/formatBytes'; // Ensure this utility is available

// This line is crucial for deployment.
// During Render's build process, process.env.REACT_APP_API_BASE_URL will be injected.
// Locally, it will fall back to 'http://localhost:5000'.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// This component is now responsible for its own state management
// for file selection, algorithm, and processing, to ensure it's self-contained and works.
function CompressionControls() { // <-- Removed props like selectedAlgorithm, onSelectAlgorithm, etc. as this component manages its own state now.
    const [selectedFile, setSelectedFile] = useState(null);
    const [displayFileName, setDisplayFileName] = useState('');
    const [displayFileSize, setDisplayFileSize] = useState(0);
    const [uploadedFilePath, setUploadedFilePath] = useState('');
    const [algorithm, setAlgorithm] = useState(''); // Default to empty, forcing selection
    const [compressionResult, setCompressionResult] = useState(null);
    const [decompressionResult, setDecompressionResult] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [actionType, setActionType] = useState('compress'); // State to determine if compressing or decompressing


    // Utility to reset all result/message states when a new file is selected
    const resetState = () => {
        setUploadedFilePath('');
        setCompressionResult(null);
        setDecompressionResult(null);
        setMessage('');
        setError(null); // Reset error as well
    };

    // Handle file selection from the input field
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file); // Store the actual File object
            setDisplayFileName(file.name); // Display name immediately
            setDisplayFileSize(file.size); // Display size immediately
            resetState(); // Clear previous results when a new file is selected
            setAlgorithm(''); // Reset algorithm selection
            setActionType('compress'); // Default action to compress for new file
        } else {
            setSelectedFile(null);
            setDisplayFileName('');
            setDisplayFileSize(0);
        }
    };

    // Handle algorithm selection from the dropdown
    const handleAlgorithmChange = (event) => {
        setAlgorithm(event.target.value);
    };

    // Function to upload the selected file to the backend
    const uploadFile = async () => {
        if (!selectedFile) {
            setError('Please select a file first.');
            return null; // Return null to indicate upload failure
        }

        setIsUploading(true);
        setError(null); // Clear previous errors
        setMessage('');

        const formData = new FormData();
        formData.append('file', selectedFile); // 'file' matches the Multer field name in server.js

        try {
            const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Server responds with the path where the file was saved
            setUploadedFilePath(response.data.filePath);
            setMessage(response.data.message);
            return response.data.filePath; // Return filePath for chaining
        } catch (err) {
            console.error("Upload error:", err.response?.data || err.message, err); // Log actual error
            setError(err.response?.data?.message || 'File upload failed. Please try again.');
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    // Generic function to handle both compression and decompression
    // actionType is derived from the button click
    const processFile = async (type) => { // 'type' here will be 'compress' or 'decompress'
        setActionType(type); // Set actionType state based on which button was clicked

        let filePathToProcess = uploadedFilePath;
        if (!filePathToProcess) {
            // If filePath is empty, try to upload the file first
            filePathToProcess = await uploadFile(); 
            if (!filePathToProcess) return; // Stop if upload failed
        }

        if (!algorithm) {
            setError(`Please select a ${type} algorithm.`);
            return;
        }

        setIsProcessing(true);
        setError(null); // Clear previous errors
        setCompressionResult(null); // Clear previous results
        setDecompressionResult(null); // Clear previous results

        try {
            const endpoint = `${API_BASE_URL}/api/${type}`;
            const response = await axios.post(endpoint, {
                filePath: filePathToProcess,
                algorithm: algorithm,
                fileName: displayFileName, // Use the name from the initial selection for server processing
            });

            if (type === 'compress') {
                setCompressionResult(response.data);
            } else { // type is 'decompress'
                setDecompressionResult(response.data);
            }
            setMessage(response.data.message);
        } catch (err) {
            console.error(`${type} error:`, err.response?.data || err.message, err); // Log actual error
            setError(err.response?.data?.message || `${type} failed. Check console for details.`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Defines the available compression/decompression algorithms for the UI dropdown.
    const algorithms = [
        { value: '', label: 'Select Algorithm', disabled: true }, // Default placeholder option
        { value: 'gzip', label: 'Gzip (Recommended for all files)' },
        { value: 'huffman', label: 'Huffman Coding (Best for text with repeated characters)' },
        { value: 'rle', label: 'Run-Length Encoding (RLE) (Best for highly repetitive data, e.g., simple images)' },
    ];

    // Determines if process buttons should be disabled
    const isProcessButtonDisabled = !selectedFile || !algorithm || isUploading || isProcessing;


    // Function to handle downloading files from the backend
    const handleDownload = async (fileName) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/download/${fileName}`);
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl space-y-6">
                <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">File Compression Portal</h1>

                {/* 1. File Upload Section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                        1. Upload Your File
                    </h2>
                    <label htmlFor="file-upload" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                        Select File:
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
                    />
                    {displayFileName && (
                        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-md text-sm text-blue-800 dark:text-blue-200">
                            <p><strong>Selected File:</strong> {displayFileName}</p>
                            <p><strong>Size:</strong> {formatBytes(displayFileSize)}</p>
                        </div>
                    )}
                </div>

                {/* 2. Select Algorithm & Process */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                        2. Select Algorithm & Process
                    </h2>
                    <div className="mb-6">
                        <label htmlFor="algorithm-select" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                            Select Algorithm:
                        </label>
                        <select
                            id="algorithm-select"
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                            value={algorithm}
                            onChange={handleAlgorithmChange}
                            disabled={isProcessing || isUploading}
                        >
                            {algorithms.map((algo) => (
                                <option key={algo.value} value={algo.value} disabled={algo.disabled}>
                                    {algo.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => processFile('compress')}
                            disabled={isProcessButtonDisabled}
                            className={`flex-1 py-3 rounded-lg text-white font-semibold transition-colors duration-200 flex items-center justify-center
                                ${isProcessButtonDisabled ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed' :
                                    'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800'
                                }`}
                        >
                            {isProcessing && actionType === 'compress' ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : null}
                            Start Compression
                        </button>
                        <button
                            onClick={() => processFile('decompress')}
                            disabled={isProcessButtonDisabled}
                            className={`flex-1 py-3 rounded-lg text-white font-semibold transition-colors duration-200 flex items-center justify-center
                                ${isProcessButtonDisabled ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed' :
                                    'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800'
                                }`}
                        >
                            {isProcessing && actionType === 'decompress' ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : null}
                            Start Decompression
                        </button>
                    </div>
                </div>

                {/* Status and Results Display */}
                {(isUploading || isProcessing || message || error || compressionResult || decompressionResult) && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                            3. Results & Status
                        </h2>
                        {isUploading && (
                            <p className="text-center text-blue-600 dark:text-blue-300 mb-4 flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Uploading file...
                            </p>
                        )}
                        {isProcessing && !isUploading && (
                            <p className="text-center text-blue-600 dark:text-blue-300 mb-4 flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Processing with {algorithm.toUpperCase()}...
                            </p>
                        )}
                        {message && (
                            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{message}</span>
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        {compressionResult && (
                            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Compression Details</h3>
                                <p><strong>Output File:</strong> {compressionResult.outputFileName}</p>
                                <p><strong>Original Size:</strong> {formatBytes(compressionResult.originalSize)}</p>
                                <p><strong>Compressed Size:</strong> {formatBytes(compressionResult.compressedSize)}</p>
                                <p><strong>Compression Ratio:</strong> {compressionResult.compressionRatio} (Compressed Size / Original Size)</p>
                                <p><strong>Processing Time:</strong> {compressionResult.processingTimeMs} ms</p>
                                <a
                                    href={`${API_BASE_URL}/api/download/${compressionResult.outputFileName}`}
                                    className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out"
                                    download
                                >
                                    Download Compressed File
                                </a>
                            </div>
                        )}

                        {decompressionResult && (
                            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Decompression Details</h3>
                                <p><strong>Output File:</strong> {decompressionResult.outputFileName}</p>
                                <p><strong>Decompressed Size:</strong> {formatBytes(decompressionResult.decompressedSize)}</p>
                                <p><strong>Processing Time:</strong> {decompressionResult.processingTimeMs} ms</p>
                                <a
                                    href={`${API_BASE_URL}/api/download/${decompressionResult.outputFileName}`}
                                    className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out"
                                    download
                                >
                                    Download Decompressed File
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CompressionControls;
