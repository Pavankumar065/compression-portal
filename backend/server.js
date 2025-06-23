const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const COMPRESSED_DIR = path.join(__dirname, 'compressed');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}
if (!fs.existsSync(COMPRESSED_DIR)) {
    fs.mkdirSync(COMPRESSED_DIR);
}

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

const readFileAsBuffer = (filePath) => fs.readFileSync(filePath);
const writeBufferToFile = (filePath, buffer) => fs.writeFileSync(filePath, buffer);

const RLE_MAX_COUNT = 128;

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
            output.push((runLength - 1) | 0x80);
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

            output.push(literalCount - 1); 
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

        if (controlByte & 0x80) { 
            const runLength = (controlByte & 0x7F) + 1; 
            if (i >= buffer.length) {
                throw new Error("Malformed RLE data: run byte missing after control byte.");
            }
            const byteToRepeat = buffer[i++]; 
            for (let j = 0; j < runLength; j++) {
                output.push(byteToRepeat);
            }
        } else { 
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
            return null; 
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
    if (buffer.length === 0) return Buffer.from([0]); 
    const frequencies = new Map();
    for (const byte of buffer) {
        frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
    }

    const nodes = Array.from(frequencies.entries())
        .map(([char, freq]) => new Node(char, freq))
        .sort((a, b) => a.freq - b.freq); 

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
            }
        }
        if (!inserted) {
            nodes.push(parent); 
        }
    }
    const root = nodes[0]; 
    const codes = new Map();
    function generateCodes(node, currentCode) {
        if (node.char !== null) { 
            codes.set(node.char, currentCode);
            return;
        }
        generateCodes(node.left, currentCode + '0'); 
        generateCodes(node.right, currentCode + '1'); 
    }
    if (root) {
        if (root.char !== null) { 
            codes.set(root.char, '0'); 
        } else {
            generateCodes(root, ''); 
        }
    } else {
      
        return Buffer.from([]);
    }

    const writer = new BitStreamWriter();
    for (const byte of buffer) {
        const code = codes.get(byte);
        if (code) {
            writer.writeBits(code);
        } else {
     
            throw new Error(`Huffman: No code found for byte ${byte}`); 
        }
    }
    const encodedData = writer.getBytes();

    const uniqueCharsCount = frequencies.size;
    const headerParts = [Buffer.from([uniqueCharsCount])]; 

    for (const [char, freq] of frequencies.entries()) {
        headerParts.push(Buffer.from([char])); 
        headerParts.push(Buffer.from([(freq >> 8) & 0xFF, freq & 0xFF])); 
    }
    const header = Buffer.concat(headerParts);

    const compressedBuffer = Buffer.concat([header, encodedData]);
    console.log(`[Huffman] Original: ${buffer.length} bytes, Compressed: ${compressedBuffer.length} bytes`);
    return compressedBuffer;
};

const huffmanDecompress = (buffer) => {
    if (buffer.length === 0) return Buffer.from([]);

    
    const uniqueCharsCount = buffer[0];
    let offset = 1; 
    const frequencies = new Map();

    if (uniqueCharsCount === 0) {
        if (buffer.length > 1) { /*console.warn("Huffman Decompress: Header indicates 0 unique chars but data present. Ignoring extra data.");*/ }
        return Buffer.from([]);
    }

    for (let i = 0; i < uniqueCharsCount; i++) {
        const char = buffer[offset];
        const freq = (buffer[offset + 1] << 8) | buffer[offset + 2]; 
        frequencies.set(char, freq);
        offset += 3; 
    }


    const leaves = Array.from(frequencies.entries())
        .map(([char, freq]) => new Node(char, freq))
        .sort((a, b) => a.freq - b.freq);

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
            }
        }
        if (!inserted) {
            nodes.push(parent);
        }
    }
    const root = nodes[0];

   
    if (uniqueCharsCount === 1) {
        const [char, freq] = Array.from(frequencies.entries())[0];
        const output = [];
        for (let i = 0; i < freq; i++) {
            output.push(char);
        }
        return Buffer.from(output);
    }


    const reader = new BitStreamReader(buffer.slice(offset)); 
    const output = [];
    let currentNode = root;

    let bit;
    let decodedCharsCount = 0;
    const totalOriginalChars = Array.from(frequencies.values()).reduce((sum, freq) => sum + freq, 0);

    while ((bit = reader.readBit()) !== null && decodedCharsCount < totalOriginalChars) {
        if (bit === 0) {
            currentNode = currentNode.left; 
        } else {
            currentNode = currentNode.right; 
        }

        if (currentNode.char !== null) { 
            output.push(currentNode.char);
            decodedCharsCount++;
            currentNode = root; 
        }
    }
    console.log(`[Huffman] Compressed: ${buffer.length} bytes, Decompressed: ${output.length} bytes`);
    return Buffer.from(output);
};

const LZ77_WINDOW_SIZE = 4096; 
const LZ77_MIN_MATCH = 3;      
const LZ77_MAX_MATCH = 10;     
const LZ77_LITERAL_ESCAPE = 0x80; 

const hashBytes = (b1, b2, b3) => (b1 << 16) | (b2 << 8) | b3;

const lz77Compress = (buffer) => {
    const output = [];
    let i = 0; 
    const dictionary = new Map();

    while (i < buffer.length) {
        let bestMatch = { offset: 0, length: 0 };
        
        dictionary.forEach((positions, key) => {
            while (positions.length > 0 && positions[0] < i - LZ77_WINDOW_SIZE) {
                positions.shift();
            }
            if (positions.length === 0) {
                dictionary.delete(key); 
            }
        });

        if (i + LZ77_MIN_MATCH <= buffer.length) {
            const currentHashKey = hashBytes(buffer[i], buffer[i+1], buffer[i+2]);

            if (dictionary.has(currentHashKey)) {
                const potentialMatchStarts = dictionary.get(currentHashKey);

              
                for (let k = potentialMatchStarts.length - 1; k >= 0; k--) {
                    const startIdx = potentialMatchStarts[k];
                  
                    if (startIdx >= i - LZ77_WINDOW_SIZE && startIdx < i) {
                        let currentMatchLength = 0;
                       
                        while (
                            (i + currentMatchLength < buffer.length) && 
                            (currentMatchLength < LZ77_MAX_MATCH) &&   
                            (buffer[startIdx + currentMatchLength] === buffer[i + currentMatchLength])
                        ) {
                            currentMatchLength++;
                        }
                      
                        if (currentMatchLength > bestMatch.length) {
                            bestMatch = { offset: i - startIdx, length: currentMatchLength };
                          
                            if (bestMatch.length === LZ77_MAX_MATCH) break;
                        }
                    }
                }
            }
        }

      
        if (bestMatch.length >= LZ77_MIN_MATCH && bestMatch.offset > 0) {
        
            const lengthCode = bestMatch.length - LZ77_MIN_MATCH; 
            const offsetHigh = (bestMatch.offset >> 8) & 0x0F; 
            const offsetLow = bestMatch.offset & 0xFF;        

            const byte1 = 0x80 | (lengthCode << 4) | offsetHigh;
            output.push(byte1);
            output.push(offsetLow);

            
            for (let p = i; p < i + bestMatch.length; p++) {
                if (p + LZ77_MIN_MATCH <= buffer.length) { 
                    const hash = hashBytes(buffer[p], buffer[p+1], buffer[p+2]);
                    if (!dictionary.has(hash)) {
                        dictionary.set(hash, []);
                    }
                    dictionary.get(hash).push(p);
                }
            }
            
            i += bestMatch.length;
        } else {
          
            const currentByte = buffer[i];
            if (currentByte < LZ77_LITERAL_ESCAPE) { 
                output.push(currentByte); 
            } else { 
                output.push(LZ77_LITERAL_ESCAPE); 
                output.push(currentByte);       
            }
            
         
            if (i + LZ77_MIN_MATCH <= buffer.length) { 
                const hash = hashBytes(buffer[i], buffer[i+1], buffer[i+2]);
                if (!dictionary.has(hash)) {
                    dictionary.set(hash, []);
                }
                dictionary.get(hash).push(i);
            }
           
            i++;
        }
    }
    console.log(`[LZ77] Original: ${buffer.length} bytes, Compressed: ${output.length} bytes`);
    return Buffer.from(output);
};

const lz77Decompress = (buffer) => {
    const output = [];
    let i = 0; 

    while (i < buffer.length) {
        const byte1 = buffer[i];

        if ((byte1 & 0x80) === 0) { 
            if (byte1 === LZ77_LITERAL_ESCAPE) { 
                if (i + 1 >= buffer.length) {
                    throw new Error("LZ77 Decompress: Malformed literal escape sequence - missing second byte.");
                }
                output.push(buffer[i + 1]); 
                i += 2; 
            } else { 
                output.push(byte1);
                i++; 
            }
        } else { 
            if (i + 1 >= buffer.length) { 
                throw new Error("LZ77 Decompress: Malformed match tuple - not enough bytes.");
            }
            const byte2 = buffer[i + 1];

            const length = ((byte1 >> 4) & 0x07) + LZ77_MIN_MATCH; 
            const offsetHigh = byte1 & 0x0F;                      
            const offsetLow = byte2;                               
            const offset = (offsetHigh << 8) | offsetLow;         

          
            if (offset === 0) { 
                throw new Error(`LZ77 Decompress: Invalid match - offset cannot be zero (at compressed byte ${i}).`);
            }
            if (output.length < offset) { 
                throw new Error(`LZ77 Decompress: Invalid match (offset ${offset}, length ${length}) at compressed byte ${i}. Output length: ${output.length}. The offset points outside the already decompressed data. Ensure the file was compressed with the correct algorithm and is not corrupted.`);
            }

           
            const copySourceIndex = output.length - offset;
            for (let j = 0; j < length; j++) {
                output.push(output[copySourceIndex + j]); 
            }
            i += 2; 
        }
    }
    console.log(`[LZ77] Compressed: ${buffer.length} bytes, Decompressed: ${output.length} bytes`);
    return Buffer.from(output);
};

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
            case 'lz77':
                compressedContentBuffer = lz77Compress(fileContentBuffer);
                outputFileName = `${baseName}_lz77_compressed${originalExtension}`;
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
            case 'lz77':
                decompressedContentBuffer = lz77Decompress(compressedContentBuffer);
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
    console.log(`Uploads directory: ${UPLOADS_DIR}`);
    console.log(`Compressed files directory: ${COMPRESSED_DIR}`);
});
