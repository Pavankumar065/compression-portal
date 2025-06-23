import React from 'react';
import { formatBytes } from '../utils/formatBytes';

function FileUpload({ onFileSelect, uploadInfo, error }) {
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 col-span-1 md:col-span-2 lg:col-span-1">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                1. Upload Your File
            </h2>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center mb-6 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 cursor-pointer"
                onClick={() => document.getElementById('file-input').click()}
            >
                <input
                    type="file"
                    id="file-input"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8"></path>
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Drop your file here, or click to browse</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Supports: Any file type (text, image, binary)</p>
            </div>

            {uploadInfo && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-4 rounded-md mb-6">
                    <p className="font-semibold mb-2">Uploaded File Information:</p>
                    <p>Name: <span className="font-medium">{uploadInfo.fileName}</span></p>
                    <p>Size: <span className="font-medium">{formatBytes(uploadInfo.size)}</span></p>
                    <p className="text-sm mt-2 text-blue-700 dark:text-blue-300">File is ready for compression or decompression.</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-md">
                    <p className="font-semibold">Error! {error}</p>
                </div>
            )}
        </div>
    );
}

export default FileUpload;