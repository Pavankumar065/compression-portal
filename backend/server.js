const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Debugging for FRONTEND_URL ---
console.log('Attempting to read FRONTEND_URL from environment...');
const rawFrontendUrl = process.env.FRONTEND_URL;
console.log(`Raw FRONTEND_URL from process.env: "${rawFrontendUrl}"`); // IMPORTANT: Check this line in Render logs

const allowedOrigin = rawFrontendUrl || 'http://localhost:3000';
console.log(`Calculated allowedOrigin for CORS: "${allowedOrigin}"`); // IMPORTANT: Check this line in Render logs
// --- End Debugging for FRONTEND_URL ---

app.use(cors({
  origin: allowedOrigin,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const COMPRESSED_DIR = path.join(__dirname, 'compressed');

// Create directories if they don't exist
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}
if (!fs.existsSync(COMPRESSED_DIR)) {
    fs.mkdirSync(COMPRESSED_DIR);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- UTILITY FUNCTIONS ---
const readFileAsBuffer = (filePath) => fs.readFileSync(filePath);
const writeBufferToFile = (filePath, buffer) => fs.writeFileSync(filePath, buffer);

// --- RLE (Run-Length Encoding) ---
const RLE_MAX_COUNT = 128; // Max length for a literal sequence or a repeat run

const rleCompress = (buffer) => {
    const output = [];
    let i = 0;

    while (i < buffer.length) {
        let currentByte = buffer[i];
        let runLength = 0;

        for (let j = i; j < Math.min(buffer.length, i + RLE_MAX_COUNT); j++) {
            if (buffer[j] === currentByte) {
                runLength++;
            } else {
                break;
            }
        }

        if (runLength >= 2) {
            output.push((runLength - 1) | 0x80); // Set MSB (1xxxxxxx), store (length-1)
            output.push(currentByte);
            i += runLength;
        } else {
            let literalCount = 0;
            const literalStartIdx = i;

            while (
                (i < buffer.length) &&
                (literalCount < RLE_MAX_COUNT) &&
                !(i + 1 < buffer.length && buffer[i] === buffer[i + 1])
            ) {
                literalCount++;
                i++;
            }
            
            if (literalCount === 0 && literalStartIdx < buffer.length) {
                literalCount = 1;
                i = literalStartIdx + 1;
            }

            output.push(literalCount - 1); // MSB is 0 (0xxxxxxx), store (count-1)
            for (let k = 0; k < literalCount; k++) {
                output.push(buffer[literalStartIdx + k]);
            }
        }
    }
    console.log(`[RLE] Original: ${buffer.length} bytes, Compressed: ${output.length} bytes`);
    return Buffer.from(output);
};

const rleDecompress = (buffer) => {
    const output = [];
    let i = 0;

    while (i < buffer.length) {
        const controlByte = buffer[i++];

        if (controlByte & 0x80) { // MSB is 1: Repeat block
            const runLength = (controlByte & 0x7F) + 1;
            if (i >= buffer.length) {
                throw new Error("Malformed RLE data: run byte missing after control byte.");
            }
            const byteToRepeat = buffer[i++];
            for (let j = 0; j < runLength; j++) {
                output.push(byteToRepeat);
            }
        } else { // MSB is 0: Literal block
            const literalCount = (controlByte & 0x7F) + 1;
            if (i + literalCount > buffer.length) {
                throw new Error("Malformed RLE data: literal sequence extends beyond buffer end.");
            }
            for (let j = 0; j < literalCount; j++) {
                output.push(buffer[i + j]);
            }
            i += literalCount;
        }
    }
    console.log(`[RLE] Compressed: ${buffer.length} bytes, Decompressed: ${output.length} bytes`);
    return Buffer.from(output);
};

// --- Huffman Coding ---
class Node {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

class BitStreamWriter {
    constructor() {
        this.buffer = [];
        this.byte = 0;
        this.bitCount = 0;
    }

    writeBit(bit) {
        this.byte = (this.byte << 1) | bit;
        this.bitCount++;
        if (this.bitCount === 8) {
            this.buffer.push(this.byte);
            this.byte = 0;
            this.bitCount = 0;
        }
    }

    writeBits(code) {
        for (const bit of code) {
            this.writeBit(parseInt(bit, 10));
        }
    }

    getBytes() {
        if (this.bitCount > 0) {
            this.byte <<= (8 - this.bitCount);
            this.buffer.push(this.byte);
        }
        return Buffer.from(this.buffer);
    }
}

class BitStreamReader {
    constructor(buffer) {
        this.buffer = buffer;
        this.currentByteIndex = 0;
        this.currentBitInByte = 7;
    }

    readBit() {
        if (this.currentByteIndex >= this.buffer.length) {
            return null; // End of stream
        }
        const byte = this.buffer[this.currentByteIndex];
        const bit = (byte >> this.currentBitInByte) & 1;
        this.currentBitInByte--;
        if (this.currentBitInByte < 0) {
            this.currentBitInByte = 7;
            this.currentByteIndex++;
        }
        return bit;
    }
}

const huffmanCompress = (buffer) => {
    if (buffer.length === 0) {
        // For an empty file, header will be 2 bytes (0 unique chars, 0 length)
        const header = Buffer.alloc(2); // uniqueCharsCount as 0 (2 bytes)
        header.writeUInt16BE(0, 0); // Write 0 unique chars count
        console.log(`[Huffman] Original: ${buffer.length} bytes, Compressed: ${header.length} bytes`);
        return header;
    }

    const frequencies = new Map();
    for (const byte of buffer) {
        frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
    }

    const nodes = Array.from(frequencies.entries())
        .map(([char, freq]) => new Node(char, freq))
        .sort((a, b) => {
            if (a.freq === b.freq) {
                // Secondary sort key for deterministic tree building
                // Internal nodes (char === null) should consistently sort last for equal frequencies
                if (a.char === null && b.char !== null) return 1;
                if (a.char !== null && b.char === null) return -1;
                if (a.char === null && b.char === null) return 0; // Maintain original relative order if both are internal
                return a.char - b.char; // Sort by character code for leaves
            }
            return a.freq - b.freq;
        });

    while (nodes.length > 1) {
        const left = nodes.shift();
        const right = nodes.shift();
        const parent = new Node(null, left.freq + right.freq, left, right);
        let inserted = false;
        for (let i = 0; i < nodes.length; i++) {
            if (parent.freq < nodes[i].freq || (parent.freq === nodes[i].freq && (nodes[i].char === null || parent.char - nodes[i].char < 0))) {
                if (parent.freq < nodes[i].freq) {
                    nodes.splice(i, 0, parent);
                    inserted = true;
                    break;
                } else if (parent.freq === nodes[i].freq) {
                    let comparison = 0;
                    if (parent.char === null && nodes[i].char !== null) comparison = 1;
                    else if (parent.char !== null && nodes[i].char === null) comparison = -1;
                    else if (parent.char !== null && nodes[i].char !== null) comparison = parent.char - nodes[i].char;

                    if (comparison < 0) {
                        nodes.splice(i, 0, parent);
                        inserted = true;
                        break;
                    }
                }
            }
        }
        if (!inserted) {
            nodes.push(parent);
        }
        // Re-sort after insertion for perfect consistency, matching initial sort logic
        nodes.sort((a, b) => {
            if (a.freq === b.freq) {
                if (a.char === null && b.char !== null) return 1;
                if (a.char !== null && b.char === null) return -1;
                if (a.char === null && b.char === null) return 0;
                return a.char - b.char;
            }
            return a.freq - b.freq;
        });
    }
    const root = nodes[0];

    const codes = new Map();
    function generateCodes(node, currentCode) {
        if (node.char !== null) { // Leaf node (represents an actual byte)
            codes.set(node.char, currentCode);
            return;
        }
        generateCodes(node.left, currentCode + '0'); // Go left, append '0'
        generateCodes(node.right, currentCode + '1'); // Go right, append '1'
    }
    if (root) {
        if (root.char !== null) { // Special case: only one unique character in the entire buffer
            codes.set(root.char, '0'); // Assign a code of '0' for this single char
        } else {
            generateCodes(root, ''); // Start code generation from root with empty string
        }
    } else {
        // Should not happen for non-empty buffer, but defensive check
        console.error("[Huffman Compress ERROR] Root node is null for non-empty buffer after tree building.");
        return Buffer.from([]);
    }

    const writer = new BitStreamWriter();
    for (const byte of buffer) {
        const code = codes.get(byte);
        if (code) {
            writer.writeBits(code);
        } else {
            // This indicates an error in frequency calculation or code generation
            throw new Error(`Huffman: No code found for byte ${byte}`); 
        }
    }
    const encodedData = writer.getBytes();

    const uniqueCharsCount = frequencies.size;
    const headerParts = [];

    // Write uniqueCharsCount as 2 bytes (16-bit integer)
    const uniqueCharsCountBuffer = Buffer.alloc(2);
    uniqueCharsCountBuffer.writeUInt16BE(uniqueCharsCount, 0); // Writes 16-bit unsigned integer (big-endian)
    headerParts.push(uniqueCharsCountBuffer);

    // Write each character and its frequency (4 bytes for frequency)
    for (const [char, freq] of frequencies.entries()) {
        headerParts.push(Buffer.from([char])); // Add the byte itself
        const freqBuffer = Buffer.alloc(4);
        freqBuffer.writeUInt32BE(freq, 0); // Writes 32-bit unsigned integer (big-endian)
        headerParts.push(freqBuffer);
    }
    const header = Buffer.concat(headerParts);

    const compressedBuffer = Buffer.concat([header, encodedData]);
    console.log(`[Huffman] Original: ${buffer.length} bytes, Compressed: ${compressedBuffer.length} bytes`);
    return Buffer.from(compressedBuffer);
};

const huffmanDecompress = (buffer) => {
    console.log(`[Huffman Decompress] Received buffer length: ${buffer.length} bytes`);
    if (buffer.length < 2) { // Need at least 2 bytes for uniqueCharsCount
        console.log(`[Huffman Decompress] Input buffer too short for header. Returning empty buffer.`);
        return Buffer.from([]);
    }

    // Read uniqueCharsCount as 2 bytes (UInt16BE)
    const uniqueCharsCount = buffer.readUInt16BE(0);
    let offset = 2; // Start reading after uniqueCharsCount (2 bytes)
    const frequencies = new Map();

    if (uniqueCharsCount === 0) {
        if (buffer.length > 2) { // For an empty original file, uniqueCharsCount is 0, and buffer length should be 2.
            console.error(`[Huffman Decompress ERROR] Header indicates 0 unique chars but buffer length is ${buffer.length}.`);
            throw new Error("Huffman Decompress: Malformed compressed data - 0 unique chars with extra data.");
        }
        console.log(`[Huffman Decompress] Header indicates 0 unique chars. Returning empty buffer.`);
        return Buffer.from([]);
    }

    // Expected header length now accounts for 2 bytes for uniqueCharsCount and 4 bytes per frequency
    const expectedHeaderLength = 2 + (uniqueCharsCount * (1 + 4)); // 2 bytes for uniqueCharsCount + (1 byte char + 4 bytes freq) per entry
    if (buffer.length < expectedHeaderLength) {
        console.error(`[Huffman Decompress ERROR] Buffer too short for header. Expected at least ${expectedHeaderLength}, got ${buffer.length}.`);
        throw new Error(`Huffman Decompress: Malformed header - buffer too short for ${uniqueCharsCount} unique chars. Expected at least ${expectedHeaderLength} bytes, got ${buffer.length}.`);
    }

    // Read each character and its frequency (4 bytes for frequency)
    for (let i = 0; i < uniqueCharsCount; i++) {
        if (offset + 4 >= buffer.length) { // Need 1 byte for char + 4 bytes for freq
            console.error(`[Huffman Decompress ERROR] Ran out of buffer parsing frequency entry ${i}/${uniqueCharsCount}.`);
            throw new Error("Huffman Decompress: Malformed frequency table - buffer ended prematurely.");
        }
        const char = buffer[offset];
        const freq = buffer.readUInt32BE(offset + 1); // Read 32-bit unsigned integer (big-endian)
        frequencies.set(char, freq);
        offset += 5; // Advance 1 for char + 4 for freq
    }
    console.log(`[Huffman Decompress] Header parsed. Unique chars: ${uniqueCharsCount}. Data starts at offset: ${offset}`);

    const leaves = Array.from(frequencies.entries())
        .map(([char, freq]) => new Node(char, freq))
        .sort((a, b) => { // MUST mirror the compression sort for deterministic tree building
            if (a.freq === b.freq) {
                if (a.char === null && b.char !== null) return 1;
                if (a.char !== null && b.char === null) return -1;
                if (a.char === null && b.char === null) return 0;
                return a.char - b.char;
            }
            return a.freq - b.freq;
        });

    const nodes = [...leaves];
    while (nodes.length > 1) {
        const left = nodes.shift();
        const right = nodes.shift();
        const parent = new Node(null, left.freq + right.freq, left, right);
        let inserted = false;
        for (let i = 0; i < nodes.length; i++) {
            if (parent.freq < nodes[i].freq) {
                nodes.splice(i, 0, parent);
                inserted = true;
                break;
            } else if (parent.freq === nodes[i].freq) {
                let comparison = 0;
                if (parent.char === null && nodes[i].char !== null) comparison = 1;
                else if (parent.char !== null && nodes[i].char === null) comparison = -1;
                else if (parent.char !== null && nodes[i].char !== null) comparison = parent.char - nodes[i].char;

                if (comparison < 0) {
                    nodes.splice(i, 0, parent);
                    inserted = true;
                    break;
                }
            }
        }
        if (!inserted) {
            nodes.push(parent);
        }
        nodes.sort((a, b) => {
            if (a.freq === b.freq) {
                if (a.char === null && b.char !== null) return 1;
                if (a.char !== null && b.char === null) return -1;
                if (a.char === null && b.char === null) return 0;
                return a.char - b.char;
            }
            return a.freq - b.freq;
        });
    }
    const root = nodes[0];
    console.log(`[Huffman Decompress] Huffman tree rebuilt.`);

    const totalOriginalChars = Array.from(frequencies.values()).reduce((sum, freq) => sum + freq, 0);
    console.log(`[Huffman Decompress] Total expected original characters: ${totalOriginalChars}`);

    if (uniqueCharsCount === 1) {
        const [char, freq] = Array.from(frequencies.entries())[0];
        const output = [];
        for (let i = 0; i < freq; i++) {
            output.push(char);
        }
        if (output.length !== totalOriginalChars) {
             console.error(`[Huffman Decompress ERROR] Single char: Decompressed length mismatch. Expected ${totalOriginalChars}, got ${output.length}.`);
             throw new Error(`Huffman Decompress (single char): Decompressed length mismatch. Expected ${totalOriginalChars}, got ${output.length}.`);
        }
        console.log(`[Huffman Decompress] Single char file handled. Decompressed size: ${output.length} bytes.`);
        return Buffer.from(output);
    }

    const encodedDataBuffer = buffer.slice(offset);
    console.log(`[Huffman Decompress] Encoded data buffer length: ${encodedDataBuffer.length} bytes.`);
    
    if (totalOriginalChars > 0 && encodedDataBuffer.length === 0) {
        console.error(`[Huffman Decompress ERROR] No encoded data found but expected ${totalOriginalChars} chars.`);
        throw new Error("Huffman Decompress: No encoded data found after header, but totalOriginalChars is positive. Compressed data might be missing or truncated.");
    }

    const reader = new BitStreamReader(encodedDataBuffer);
    const output = [];
    let currentNode = root;
    let decodedCharsCount = 0;
    
    while (decodedCharsCount < totalOriginalChars) {
        const bit = reader.readBit();
        if (bit === null) {
            console.error(`[Huffman Decompress ERROR] Ran out of bits at decodedChar ${decodedCharsCount}/${totalOriginalChars}.`);
            throw new Error(`Huffman Decompress: Ran out of bits before decoding all ${totalOriginalChars} characters. Decoded ${decodedCharsCount}. Compressed data might be truncated or malformed.`);
        }

        if (bit === 0) {
            if (!currentNode.left) {
                console.error(`[Huffman Decompress ERROR] Invalid path: '0' bit but no left child at node. Current node char: ${currentNode.char}, freq: ${currentNode.freq}. Decoded: ${decodedCharsCount}.`);
                throw new Error("Huffman Decompress: Invalid Huffman code encountered (no left child). Corrupted data or tree mismatch.");
            }
            currentNode = currentNode.left;
        } else {
            if (!currentNode.right) {
                console.error(`[Huffman Decompress ERROR] Invalid path: '1' bit but no right child at node. Current node char: ${currentNode.char}, freq: ${currentNode.freq}. Decoded: ${decodedCharsCount}.`);
                throw new Error("Huffman Decompress: Invalid Huffman code encountered (no right child). Corrupted data or tree mismatch.");
            }
            currentNode = currentNode.right;
        }

        if (currentNode.char !== null) {
            output.push(currentNode.char);
            decodedCharsCount++;
            currentNode = root;
        }
    }
    if (output.length !== totalOriginalChars) {
        console.error(`[Huffman Decompress ERROR] Final decompressed length mismatch. Expected ${totalOriginalChars}, got ${output.length}.`);
        throw new Error(`Huffman Decompress: Decompressed length mismatch. Expected ${totalOriginalChars}, got ${output.length}.`);
    }

    console.log(`[Huffman] Compressed: ${buffer.length} bytes, Decompressed: ${output.length} bytes`);
    return Buffer.from(output);
};


// --- GZIP Compression (using Node.js built-in zlib) ---
const gzipCompress = (buffer) => {
    try {
        const compressedBuffer = zlib.gzipSync(buffer);
        console.log(`[GZIP] Original: ${buffer.length} bytes, Compressed: ${compressedBuffer.length} bytes`);
        return compressedBuffer;
    } catch (error) {
        console.error('Gzip compression error:', error);
        throw new Error('Gzip compression failed.');
    }
};

const gzipDecompress = (buffer) => {
    try {
        const decompressedBuffer = zlib.gunzipSync(buffer);
        console.log(`[GZIP] Compressed: ${buffer.length} bytes, Decompressed: ${decompressedBuffer.length} bytes`);
        return decompressedBuffer;
    } catch (error) {
        console.error('Gzip decompression error:', error);
        throw new Error('Gzip decompression failed. Is the file really gzip compressed?');
    }
};


// --- Core Compression/Decompression Logic ---

const compressFile = (filePath, algorithm, originalFileName) => {
    const startTime = process.hrtime.bigint();
    
    try {
        const fileContentBuffer = readFileAsBuffer(filePath);
        let compressedContentBuffer;
        let outputFileName;

        const originalExtension = path.extname(originalFileName);
        const baseName = path.basename(originalFileName, originalExtension);

        switch (algorithm) {
            case 'rle':
                compressedContentBuffer = rleCompress(fileContentBuffer);
                outputFileName = `${baseName}_rle_compressed${originalExtension}`;
                break;
            case 'huffman':
                compressedContentBuffer = huffmanCompress(fileContentBuffer);
                outputFileName = `${baseName}_huf_compressed${originalExtension}`;
                break;
            case 'gzip':
                compressedContentBuffer = gzipCompress(fileContentBuffer);
                outputFileName = `${baseName}_gz${originalExtension}`; 
                break;
            default:
                throw new Error('Unsupported compression algorithm');
        }

        const compressedFilePath = path.join(COMPRESSED_DIR, outputFileName);
        writeBufferToFile(compressedFilePath, compressedContentBuffer);

        const endTime = process.hrtime.bigint();
        const processingTimeMs = Number(endTime - startTime) / 1_000_000;

        const originalSize = fileContentBuffer.length;
        const compressedSize = compressedContentBuffer.length;
        const compressionRatio = originalSize > 0 ? (compressedSize / originalSize) : 0;

        return {
            outputFileName,
            originalSize,
            compressedSize,
            compressionRatio: compressionRatio.toFixed(3),
            processingTimeMs: processingTimeMs.toFixed(2),
            message: `${algorithm.toUpperCase()} compression successful!`
        };

    } catch (error) {
        console.error(`Error during ${algorithm} compression:`, error);
        throw new Error(`Compression failed: ${error.message}`);
    }
};

const decompressFile = (filePath, algorithm, originalFileName) => {
    const startTime = process.hrtime.bigint();
    
    try {
        const compressedContentBuffer = readFileAsBuffer(filePath);
        let decompressedContentBuffer;
        let outputFileName;

        let baseName = path.basename(originalFileName, path.extname(originalFileName));
        let originalExtension = path.extname(originalFileName);

        switch (algorithm) {
            case 'rle':
                decompressedContentBuffer = rleDecompress(compressedContentBuffer);
                outputFileName = `${baseName}_decompressed${originalExtension}`;
                break;
            case 'huffman':
                decompressedContentBuffer = huffmanDecompress(compressedContentBuffer);
                outputFileName = `${baseName}_decompressed${originalExtension}`;
                break;
            case 'gzip':
                decompressedContentBuffer = gzipDecompress(compressedContentBuffer);
                if (originalFileName.includes('_gz')) {
                     outputFileName = originalFileName.replace(/_gz/, '_decompressed');
                } else if (originalFileName.includes('_compressed')) {
                    outputFileName = originalFileName.replace(/_compressed/, '_decompressed');
                } else {
                    if (originalFileName.endsWith('.gz')) {
                        outputFileName = path.basename(originalFileName, '.gz') + '_decompressed';
                    } else {
                        outputFileName = `${baseName}_decompressed${originalExtension}`;
                    }
                }
                break;
            default:
                throw new Error('Unsupported decompression algorithm');
        }

        const decompressedFilePath = path.join(COMPRESSED_DIR, outputFileName);
        writeBufferToFile(decompressedFilePath, decompressedContentBuffer);

        const endTime = process.hrtime.bigint();
        const processingTimeMs = Number(endTime - startTime) / 1_000_000;

        return {
            outputFileName,
            decompressedSize: decompressedContentBuffer.length,
            processingTimeMs: processingTimeMs.toFixed(2),
            message: `${algorithm.toUpperCase()} decompression successful!`
        };

    } catch (error) {
        console.error(`Error during ${algorithm} decompression:`, error);
        throw new Error(`Decompression failed: ${error.message}. Ensure the file was compressed with the correct algorithm and is not corrupted.`);
    }
};


// --- API Endpoints ---

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    console.log('File uploaded:', req.file.path);
    res.json({
        message: 'File uploaded successfully!',
        fileName: req.file.originalname,
        filePath: req.file.path,
        size: req.file.size
    });
});

app.post('/api/compress', (req, res) => {
    const { filePath, algorithm, fileName } = req.body;
    console.log(`Received compression request: file=${filePath}, algorithm=${algorithm}, originalName=${fileName}`);

    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(400).json({ message: 'File not found on server for compression. Please upload again.' });
    }

    if (!algorithm) {
        return res.status(400).json({ message: 'No compression algorithm selected.' });
    }

    try {
        const result = compressFile(filePath, algorithm, fileName);
        res.json(result);
    }
    catch (error) {
        console.error('Compression API error:', error);
        res.status(500).json({ message: error.message || 'Failed to compress file. Check backend logs.' });
    }
});

app.post('/api/decompress', (req, res) => {
    const { filePath, algorithm, fileName } = req.body;
    console.log(`Received decompression request: file=${filePath}, algorithm=${algorithm}, originalName=${fileName}`);

    if (!filePath || !fs.existsSync(filePath)) {
        return res.status(400).json({ message: 'File not found on server for decompression. Please upload again.' });
    }

    if (!algorithm) {
        return res.status(400).json({ message: 'No decompression algorithm selected.' });
    }

    try {
        const result = decompressFile(filePath, algorithm, fileName);
        res.json(result);
    } catch (error) {
        console.error('Decompression API error:', error);
        res.status(500).json({ message: error.message || 'Failed to decompress file. Check backend logs.' });
    }
});

app.get('/api/download/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(COMPRESSED_DIR, fileName);

    console.log(`Attempting to download file: ${filePath}`);

    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('File download error:', err);
                if (res.headersSent) {
                    console.error('Headers already sent, download error after start.');
                } else {
                    res.status(500).json({ message: 'Could not download the file.' });
                }
            } else {
                console.log('File sent successfully:', fileName);
            }
        });
    } else {
        console.error('File not found for download:', filePath);
        res.status(404).json({ message: 'File not found for download.' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`Allowed frontend origin for CORS: ${allowedOrigin}`); // This line is for debugging, will show the final allowed origin
    console.log(`Uploads directory: ${UPLOADS_DIR}`);
    console.log(`Compressed files directory: ${COMPRESSED_DIR}`);
});
