import React from 'react';
import { Link } from 'react-router-dom';

function HomePage({ isDarkMode }) {
    return (
        <div className="py-16 text-center">
            <h1 className="text-5xl font-extrabold text-gray-800 dark:text-gray-100 mb-6">
                Welcome to the Data Compression Portal
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                Explore the fascinating world of data compression. Upload your files, apply various algorithms, and see how they can reduce file sizes!
            </p>

            <Link
                to="/compressor"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            >
                Get Started
                <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
            </Link>

            <div className={`mt-20 p-8 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} max-w-4xl mx-auto text-left`}>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    Understanding Compression Algorithms
                </h2>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Gzip (DEFLATE)</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            Gzip is a widely used data compression program that leverages the **DEFLATE algorithm**. DEFLATE is a combination of LZ77 (for finding repeated sequences) and Huffman coding (for compactly representing the sequence tokens). It's a highly effective general-purpose lossless data compression algorithm, commonly used for web content, file archiving, and software distribution. It generally provides good compression ratios for a wide variety of data types, including text, images, and binary files, making it the **recommended choice for most files on this portal.**
                        </p>
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold text-purple-600 dark:text-purple-400 mb-2">Run-Length Encoding (RLE)</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            RLE is a very simple form of data compression in which runs of data (sequences in which the same data value occurs in many consecutive data elements) are stored as a single data value and count, rather than as the original run. It is most effective on data that contains many such runs, e.g., simple graphic images such as icons, line drawings, and faxes. For data with little repetition, RLE can actually increase file size due to the overhead of storing counts for single occurrences.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-2">Huffman Coding</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            Huffman coding is a variable-length coding algorithm where the most frequent characters are assigned the shortest codes, and the least frequent characters are assigned the longest codes. This statistical compression method is lossless, meaning no data is lost during compression. It's often used as a component within other compression algorithms (like DEFLATE). Its effectiveness depends on the frequency distribution of characters in the data.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400 mb-2">LZ77 Algorithm</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            LZ77 is a dictionary-based lossless compression algorithm. It works by finding repeated sequences of data (matches) that have occurred previously in a "sliding window" of the already processed data. Instead of writing the repeated sequence, it writes a pointer to the previous occurrence (an offset) and the length of the match. Literal (unmatched) bytes are written directly. LZ77 forms the basis for many modern compression formats, including ZIP and PNG.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;