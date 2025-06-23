
const fs = require('fs');
const path = require('path');
const { huffmanCompress, huffmanDecompress } = require('../algorithms/huffman');
const { rleCompress, rleDecompress } = require('../algorithms/rle');
const { lz77Compress, lz77Decompress } = require('../algorithms/lz77'); 

exports.uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
   
    res.json({
        message: 'File uploaded successfully!',
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size
    });
};

exports.compressFile = async (req, res) => {
    const { filePath, algorithm } = req.body;
    if (!filePath || !algorithm) {
        return res.status(400).json({ message: 'Missing file path or algorithm.' });
    }

    const originalSize = fs.statSync(filePath).size;
    const startTime = process.hrtime.bigint();
    let compressedData;
    let compressedFilePath;
    let outputFileName;

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const originalFileName = path.basename(filePath); 

        switch (algorithm) {
            case 'huffman':
                compressedData = huffmanCompress(fileBuffer);
                outputFileName = `${originalFileName}.huff`;
                break;
            case 'rle':
                compressedData = rleCompress(fileBuffer);
                outputFileName = `${originalFileName}.rle`;
                break;
            case 'lz77':
                compressedData = lz77Compress(fileBuffer);
                outputFileName = `${originalFileName}.lz77`;
                break;
            default:
                return res.status(400).json({ message: 'Unsupported compression algorithm.' });
        }

        const endTime = process.hrtime.bigint();
        const processingTimeMs = Number(endTime - startTime) / 1_000_000;

        compressedFilePath = path.join('uploads', outputFileName);
        fs.writeFileSync(compressedFilePath, compressedData);

        const compressedSize = fs.statSync(compressedFilePath).size;
        const compressionRatio = (1 - (compressedSize / originalSize)) * 100;

        res.json({
            message: 'File compressed successfully!',
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: compressionRatio.toFixed(2),
            processingTime: processingTimeMs.toFixed(2),
            downloadFileName: outputFileName,
            downloadPath: `/api/download/${outputFileName}`
        });

    } catch (error) {
        console.error('Compression error:', error);
        res.status(500).json({ message: 'Failed to compress file.', error: error.message });
    } finally {
       
    }
};

exports.decompressFile = async (req, res) => {
    const { filePath, algorithm } = req.body; 
    if (!filePath || !algorithm) {
        return res.status(400).json({ message: 'Missing file path or algorithm.' });
    }

    const originalCompressedSize = fs.statSync(filePath).size;
    const startTime = process.hrtime.bigint();
    let decompressedData;
    let decompressedFilePath;
    let outputFileName;

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const originalFileName = path.basename(filePath);
        const baseFileName = originalFileName.split('.').slice(0, -1).join('.'); 

        switch (algorithm) {
            case 'huffman':
                decompressedData = huffmanDecompress(fileBuffer);
                outputFileName = `${baseFileName}_decompressed`;
                break;
            case 'rle':
                decompressedData = rleDecompress(fileBuffer);
                outputFileName = `${baseFileName}_decompressed`;
                break;
            case 'lz77':
                decompressedData = lz77Decompress(fileBuffer);
                outputFileName = `${baseFileName}_decompressed`;
                break;
            default:
                return res.status(400).json({ message: 'Unsupported decompression algorithm.' });
        }

        const endTime = process.hrtime.bigint();
        const processingTimeMs = Number(endTime - startTime) / 1_000_000;

        // Save decompressed data to a new file
        decompressedFilePath = path.join('uploads', outputFileName);
        fs.writeFileSync(decompressedFilePath, decompressedData);

        const decompressedSize = fs.statSync(decompressedFilePath).size;

        res.json({
            message: 'File decompressed successfully!',
            originalCompressedSize: originalCompressedSize,
            decompressedSize: decompressedSize,
            processingTime: processingTimeMs.toFixed(2),
            downloadFileName: outputFileName,
            downloadPath: `/api/download/${outputFileName}`
        });

    } catch (error) {
        console.error('Decompression error:', error);
        res.status(500).json({ message: 'Failed to decompress file.', error: error.message });
    } finally {
    
    }
};

exports.downloadFile = (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File not found for download:', err);
            return res.status(404).json({ message: 'File not found.' });
        }
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ message: 'Could not download the file.' });
            }
        
        });
    });
};