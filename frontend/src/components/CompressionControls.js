import React, { useState } from 'react';
import axios from 'axios';
import { formatBytes } from '../utils/formatBytes';

// This line is crucial for deployment.
// During Render's build process, process.env.REACT_APP_API_BASE_URL will be injected.
// Locally, it will fall back to 'http://localhost:5000'.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function CompressionControls() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [displayFileName, setDisplayFileName] = useState('');
    const [displayFileSize, setDisplayFileSize] = useState(0);
    const [uploadedFilePath, setUploadedFilePath] = useState('');
    const [algorithm, setAlgorithm] = useState('gzip'); 
    const [compressionResult, setCompressionResult] = useState(null);
    const [decompressionResult, setDecompressionResult] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const resetState = () => {
        setUploadedFilePath('');
        setCompressionResult(null);
        setDecompressionResult(null);
        setMessage('');
        setError('');
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setDisplayFileName(file.name);
            setDisplayFileSize(file.size);
            resetState();
        } else {
            setSelectedFile(null);
            setDisplayFileName('');
            setDisplayFileSize(0);
        }
    };

    const handleAlgorithmChange = (event) => {
        setAlgorithm(event.target.value);
    };

    const uploadFile = async () => {
        if (!selectedFile) {
            setError('Please select a file first.');
            return null;
        }

        setIsUploading(true);
        setError('');
        setMessage('');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Using the API_BASE_URL that should be populated by the environment variable
            const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadedFilePath(response.data.filePath);
            setMessage(response.data.message);
            return response.data.filePath;
        } catch (err) {
            // Log the actual error to console for more details
            console.error("Upload error:", err.response?.data || err.message, err);
            setError(err.response?.data?.message || 'File upload failed. Please try again.');
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const processFile = async (actionType) => {
        let filePathToProcess = uploadedFilePath;
        if (!filePathToProcess) {
            filePathToProcess = await uploadFile();
            if (!filePathToProcess) return;
        }

        if (!algorithm) {
            setError(`Please select a ${actionType} algorithm.`);
            return;
        }

        setIsProcessing(true);
        setError('');
        setCompressionResult(null);
        setDecompressionResult(null);

        try {
            const endpoint = `${API_BASE_URL}/api/${actionType}`;
            // Using the API_BASE_URL that should be populated by the environment variable
            const response = await axios.post(endpoint, {
                filePath: filePathToProcess,
                algorithm: algorithm,
                fileName: displayFileName,
            });

            if (actionType === 'compress') {
                setCompressionResult(response.data);
            } else {
                setDecompressionResult(response.data);
            }
            setMessage(response.data.message);
        } catch (err) {
            // Log the actual error to console for more details
            console.error("Process file error:", err.response?.data || err.message, err);
            setError(err.response?.data?.message || `${actionType} failed. Check console.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCompressClick = () => processFile('compress');
    const handleDecompressClick = () => processFile('decompress');

    const buttonDisabled = !selectedFile || isUploading || isProcessing;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Compression Portal</h1>

                <div className="mb-6 border-b pb-4">
                    <label htmlFor="file-upload" className="block text-gray-700 text-sm font-bold mb-2">
                        Upload File:
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {displayFileName && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                            <p><strong>Selected File:</strong> {displayFileName}</p>
                            <p><strong>Size:</strong> {formatBytes(displayFileSize)}</p>
                        </div>
                    )}
                </div>

                <div className="mb-6 border-b pb-4">
                    <label htmlFor="algorithm-select" className="block text-gray-700 text-sm font-bold mb-2">
                        Select Algorithm:
                    </label>
                    <select
                        id="algorithm-select"
                        value={algorithm}
                        onChange={handleAlgorithmChange}
                        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="rle">Run-Length Encoding (RLE)</option>
                        <option value="huffman">Huffman Coding</option>
                        <option value="gzip">Gzip (Node.js zlib)</option>
                    </select>
                </div>

                <div className="flex justify-center space-x-4 mb-6">
                    <button
                        onClick={handleCompressClick}
                        disabled={buttonDisabled}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing && actionType === 'compress' ? 'Compressing...' : 'Compress File'}
                    </button>
                    <button
                        onClick={handleDecompressClick}
                        disabled={buttonDisabled}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing && actionType === 'decompress' ? 'Decompressing...' : 'Decompress File'}
                    </button>
                </div>

                {isUploading && <p className="text-center text-blue-600 mb-4">Uploading file...</p>}
                {isProcessing && <p className="text-center text-blue-600 mb-4">Processing with {algorithm.toUpperCase()}...</p>}
                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{message}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {compressionResult && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-3">Compression Result</h2>
                        <p><strong>Output File:</strong> {compressionResult.outputFileName}</p>
                        <p><strong>Original Size:</strong> {formatBytes(compressionResult.originalSize)}</p>
                        <p><strong>Compressed Size:</strong> {formatBytes(compressionResult.compressedSize)}</p>
                        <p><strong>Compression Ratio:</strong> {compressionResult.compressionRatio} (Compressed Size / Original Size)</p>
                        <p><strong>Processing Time:</strong> {compressionResult.processingTimeMs} ms</p>
                        <a href={`${API_BASE_URL}/api/download/${compressionResult.outputFileName}`} className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out" download>
                            Download Compressed File
                        </a>
                    </div>
                )}

                {decompressionResult && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-3">Decompression Result</h2>
                        <p><strong>Output File:</strong> {decompressionResult.outputFileName}</p>
                        <p><strong>Decompressed Size:</strong> {formatBytes(decompressionResult.decompressedSize)}</p>
                        <p><strong>Processing Time:</strong> {decompressionResult.processingTimeMs} ms</p>
                        <a href={`${API_BASE_URL}/api/download/${decompressionResult.outputFileName}`} className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out" download>
                            Download Decompressed File
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CompressionControls;
