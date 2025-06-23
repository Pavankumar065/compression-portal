import React, { useState } from 'react';
import axios from 'axios';
import FileUpload from './FileUpload';
import CompressionControls from './CompressionControls';
import ResultsDisplay from './ResultsDisplay';
import AlgorithmInfo from './AlgorithmInfo';

const API_BASE_URL = 'http://localhost:5000/api'; // <<< REMEMBER TO CHANGE THIS FOR DEPLOYMENT!

function CompressorPage() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('');
    const [processingResult, setProcessingResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionType, setActionType] = useState(null); 

    const [showAlgorithmDetails, setShowAlgorithmDetails] = useState(null); 

    const handleFileChange = (file) => {
        setSelectedFile(file);
        setUploadedFileInfo(null);
        setProcessingResult(null);
        setError(null);
        setActionType(null); 
        setSelectedAlgorithm(''); 
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first.');
            return;
        }

        setLoading(true);
        setError(null);
        setProcessingResult(null); 

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadedFileInfo({
                ...response.data,
                originalFileName: selectedFile.name 
            });
      
        } catch (err) {
            console.error('File upload error:', err);
            setError(err.response?.data?.message || 'File upload failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessFile = async () => {
        if (!uploadedFileInfo || !selectedAlgorithm || !actionType) {
            setError('Please upload a file, select an action (compress/decompress), and choose an algorithm.');
            return;
        }

        setLoading(true);
        setError(null);
        setProcessingResult(null);

        try {
            let response;
            const requestBody = {
                filePath: uploadedFileInfo.filePath, 
                algorithm: selectedAlgorithm,
                fileName: uploadedFileInfo.originalFileName 
            };

            if (actionType === 'compress') {
                response = await axios.post(`${API_BASE_URL}/compress`, requestBody);
            } else if (actionType === 'decompress') {
                response = await axios.post(`${API_BASE_URL}/decompress`, requestBody);
            } else {
                throw new Error('Invalid action type selected.');
            }

            setProcessingResult(response.data);
        } catch (err) {
            console.error(`${actionType} error:`, err);
          
            const errorMessage = err.response?.data?.message || `${actionType} failed.`;
            setError(errorMessage + " Please check the console for more details and ensure file type / algorithm compatibility.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (downloadFileName) => {
        if (downloadFileName) {
            window.open(`${API_BASE_URL}/download/${downloadFileName}`, '_blank');
        } else {
            setError('No file available for download.');
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-8 text-center">
                File Compressor
            </h1>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Compression Algorithms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Adjusted grid for 4 algorithms */}
                    {/* Huffman Card */}
                    <div
                        className={`p-6 rounded-lg shadow-md cursor-pointer transition-all duration-200
                        ${showAlgorithmDetails === 'huffman' ? 'bg-blue-100 dark:bg-blue-900 border-blue-400' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-lg'}
                        border`}
                        onClick={() => setShowAlgorithmDetails(showAlgorithmDetails === 'huffman' ? null : 'huffman')}
                    >
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            Huffman Coding {showAlgorithmDetails === 'huffman' ? '▲' : '▼'}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                            A lossless data compression algorithm that uses variable-length codes.
                        </p>
                        {showAlgorithmDetails === 'huffman' && (
                            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                <p className="font-semibold mb-1">Best for:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>Text files (with uneven character frequency)</li>
                                    <li>Any data with statistical redundancy</li>
                                </ul>
                                <p className="mt-2 text-red-500 text-xs">(Conceptual implementation - poor for binary)</p>
                            </div>
                        )}
                    </div>

                    {/* RLE Card */}
                    <div
                        className={`p-6 rounded-lg shadow-md cursor-pointer transition-all duration-200
                        ${showAlgorithmDetails === 'rle' ? 'bg-blue-100 dark:bg-blue-900 border-blue-400' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-lg'}
                        border`}
                        onClick={() => setShowAlgorithmDetails(showAlgorithmDetails === 'rle' ? null : 'rle')}
                    >
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            Run-Length Encoding (RLE) {showAlgorithmDetails === 'rle' ? '▲' : '▼'}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                            A simple technique replacing sequences of repeated characters with a count.
                        </p>
                        {showAlgorithmDetails === 'rle' && (
                            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                <p className="font-semibold mb-1">Best for:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>Simple images (e.g., icons, faxes)</li>
                                    <li>Data with long sequences of identical values</li>
                                </ul>
                                <p className="mt-2 text-red-500 text-xs">(Conceptual implementation - poor for general binary)</p>
                            </div>
                        )}
                    </div>

                    {/* LZ77 Card */}
                    <div
                        className={`p-6 rounded-lg shadow-md cursor-pointer transition-all duration-200
                        ${showAlgorithmDetails === 'lz77' ? 'bg-blue-100 dark:bg-blue-900 border-blue-400' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-lg'}
                        border`}
                        onClick={() => setShowAlgorithmDetails(showAlgorithmDetails === 'lz77' ? null : 'lz77')}
                    >
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            LZ77 {showAlgorithmDetails === 'lz77' ? '▲' : '▼'}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                            A dictionary-based algorithm replacing repeated sequences with references.
                        </p>
                        {showAlgorithmDetails === 'lz77' && (
                            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                <p className="font-semibold mb-1">Best for:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>General purpose data (text, code, some images)</li>
                                    <li>Data with repeated patterns</li>
                                </ul>
                                <p className="mt-2 text-red-500 text-xs">(Conceptual implementation - poor for general binary)</p>
                            </div>
                        )}
                    </div>

                    {/* Gzip Card - NEW */}
                    <div
                        className={`p-6 rounded-lg shadow-md cursor-pointer transition-all duration-200
                        ${showAlgorithmDetails === 'gzip' ? 'bg-blue-100 dark:bg-blue-900 border-blue-400' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:shadow-lg'}
                        border`}
                        onClick={() => setShowAlgorithmDetails(showAlgorithmDetails === 'gzip' ? null : 'gzip')}
                    >
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            Gzip {showAlgorithmDetails === 'gzip' ? '▲' : '▼'}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                            A popular and effective lossless data compression format using the Deflate algorithm.
                        </p>
                        {showAlgorithmDetails === 'gzip' && (
                            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                <p className="font-semibold mb-1">Best for:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>**Highly effective for ALL file types (images, PDFs, text, etc.)**</li>
                                    <li>Web content compression</li>
                                </ul>
                                <p className="mt-2 text-green-600 text-xs">(Robust, standard implementation)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AlgorithmInfo Modal/Section */}
            {showAlgorithmDetails && (
                <AlgorithmInfo
                    algorithm={showAlgorithmDetails}
                    onClose={() => setShowAlgorithmDetails(null)}
                />
            )}

            <FileUpload
                onFileChange={handleFileChange}
                onFileUpload={handleFileUpload}
                loading={loading}
                uploadedFileInfo={uploadedFileInfo}
                selectedFile={selectedFile}
            />

            {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error! </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {uploadedFileInfo && !actionType && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center">
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                        Choose an action for: <span className="text-blue-600 dark:text-blue-400">{uploadedFileInfo.fileName}</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
                        <button
                            onClick={() => setActionType('compress')}
                            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                        >
                            Compress
                        </button>
                        <button
                            onClick={() => setActionType('decompress')}
                            className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
                        >
                            Decompress
                        </button>
                    </div>
                </div>
            )}

            {uploadedFileInfo && actionType && (
                <CompressionControls
                    selectedAlgorithm={selectedAlgorithm}
                    onSelectAlgorithm={setSelectedAlgorithm}
                    onProcessFile={handleProcessFile}
                    loading={loading}
                    actionType={actionType}
                />
            )}

            {processingResult && (
                <ResultsDisplay
                    result={processingResult}
                    onDownload={handleDownload}
                />
            )}
        </div>
    );
}

export default CompressorPage;