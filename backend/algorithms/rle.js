
function rleCompress(buffer) {
    if (buffer.length === 0) return Buffer.from([]);

    let compressed = [];
    let i = 0;
    while (i < buffer.length) {
        let char = buffer[i];
        let count = 1;
        while (i + 1 < buffer.length && buffer[i + 1] === char && count < 255) {
            count++;
            i++;
        }
        compressed.push(count);
        compressed.push(char);
        i++;
    }
 
    return Buffer.from(compressed);
}

function rleDecompress(buffer) {
    if (buffer.length === 0) return Buffer.from([]);

    let decompressed = [];
    let i = 0;
    while (i < buffer.length) {
        let count = buffer[i];
        let char = buffer[i + 1];
        for (let j = 0; j < count; j++) {
            decompressed.push(char);
        }
        i += 2;
    }
    return Buffer.from(decompressed);
}

module.exports = { rleCompress, rleDecompress };