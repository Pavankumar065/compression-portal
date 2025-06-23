import React from 'react';

function AlgorithmInfo({ algorithm, onClose }) {
    let title = '';
    let description = '';
    let bestFor = [];
    let implementationNote = '';

    switch (algorithm) {
        case 'huffman':
            title = 'Huffman Coding';
            description = 'Huffman coding is a lossless data compression algorithm. It operates by assigning variable-length codes to input characters, with shorter codes assigned to more frequently occurring characters and longer codes to less frequently occurring ones. This creates a prefix code, meaning no character\'s code is a prefix of another character\'s code, which allows for unambiguous decoding.';
            bestFor = [
                'Text files (especially those with uneven character frequencies)',
                'Any data stream where symbol frequencies can be statistically analyzed'
            ];
            implementationNote = 'This is a conceptual implementation for demonstration. A full Huffman implementation requires building a frequency tree and encoding/decoding bit streams, which is complex for arbitrary file types in JavaScript. For general files, consider Gzip.';
            break;
        case 'rle':
            title = 'Run-Length Encoding (RLE)';
            description = 'Run-Length Encoding (RLE) is a very simple form of lossless data compression in which "runs" of identical data values (sequences where the same data value occurs in many consecutive data elements) are stored as a single data value and count, rather than as the original run. For example, "AAAAABBBCC" might conceptually become "A5B3C2".';
            bestFor = [
                'Simple images with large blocks of single colors (e.g., icons, faxes)',
                'Data with many consecutive repetitions of the same character or byte',
                'When simplicity and speed are prioritized over high compression ratios for varied data'
            ];
            implementationNote = 'This is a functional but basic implementation for demonstration. It performs well only on data with many repeating bytes. For general files, consider Gzip.';
            break;
        case 'lz77':
            title = 'LZ77 Algorithm';
            description = 'LZ77 is a dictionary-based lossless data compression algorithm. It works by finding repeated sequences (phrases) in the data stream and replacing them with pointers to earlier occurrences of those phrases. A pointer consists of a "length" (how long the phrase is) and a "distance" (how far back to look to find the phrase). This method is widely used in popular compression formats like ZIP and PNG, forming the basis for Deflate.';
            bestFor = [
                'General-purpose data (text, code, some images, executables)',
                'Data with recurring patterns and long repeated strings'
            ];
            implementationNote = 'This is a conceptual implementation for demonstration. A full LZ77 implementation involves managing a sliding window and lookahead buffer, which is complex to implement generically for all file types and optimized for performance. For general files, consider Gzip.';
            break;
        case 'gzip':
            title = 'Gzip Compression';
            description = 'Gzip is a popular file format and a software application used for file compression and decompression. It is based on the DEFLATE algorithm, which is a combination of LZ77 and Huffman coding. Gzip is widely used on the internet for compressing web content and in Unix-like systems for archiving.';
            bestFor = [
                '**Highly effective for virtually ALL file types (text, images, PDFs, archives, etc.)**',
                'Web content compression (e.g., HTTP compression)',
                'Archiving and data transfer where good compression and speed are needed',
                'When you need reliable, standard lossless compression'
            ];
            implementationNote = 'This implementation uses Node.js\'s built-in `zlib` module, providing robust and standard Gzip compression and decompression.';
            break;
        default:
            title = 'Algorithm Information';
            description = 'No specific algorithm selected or information available.';
            break;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-3xl w-full relative border border-gray-200 dark:border-gray-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl font-bold"
                    aria-label="Close"
                >
                    &times;
                </button>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
                    {title}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {description}
                </p>
                <div className="mb-4">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Best for:</p>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        {bestFor.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
                {implementationNote && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                        <strong>Note:</strong> {implementationNote}
                    </p>
                )}
            </div>
        </div>
    );
}

export default AlgorithmInfo;