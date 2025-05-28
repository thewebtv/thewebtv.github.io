const ID3Parse = {
    /**
     * (Internal) Converts an ArrayBuffer to a string of comma-separated bytes.
     * @param {ArrayBuffer|Uint8Array} buffer 
     * @returns {Promise<string>}
     * @private
     */
    BufferToString: async function (buffer) {
        const array = buffer instanceof Uint8Array ? Array.from(buffer) : Array.from(new Uint8Array(buffer));
        return array.join(',');
    },
    /**
     * 
     * @param {string} cleanedBuffer 
     */
    CleanedBufferToReadableString: async function (cleanedBuffer) {
        let output = '';
        const bytes = cleanedBuffer.split(',');
        for(let i = 0; i < bytes.length; i++) {
            output += String.fromCharCode(Number(bytes[i]));
        }
        return output;
    },
    /**
     * (Internal) Converts a raw string to a string of comma-separated bytes.
     * @param {string} text 
     * @private
     */
    TextToBytes: async function (text) {
        const bytes = [];
        for(let i = 0; i < text.length; i++) {
            bytes.push(text.charCodeAt(i));
        }
        return bytes;
    },
    /**
     * (Internal) Searches for a string inside of a buffer.
     * @param {ArrayBuffer|Uint8Array|string} convertedOrRawBuffer 
     * @param {string} substring 
     * @private
     */
    SearchBuffer: async function (convertedOrRawBuffer, substring) {
        if(typeof convertedOrRawBuffer != 'string') {
            convertedOrRawBuffer = await ID3Parse.BufferToString(convertedOrRawBuffer);
        }
        const text = await ID3Parse.TextToBytes(substring);
        return convertedOrRawBuffer.indexOf(text);
    },
    /**
     * Parses the metadata from an M4A file.
     * @param {ArrayBuffer|Uint8Array|string} data 
     */
    ParseM4A: async function (data) {
        if(typeof data != 'string') data = await ID3Parse.BufferToString(data);
        const sliceStart = data.slice(
            await ID3Parse.SearchBuffer(data, 'nam\u0000\u0000\u0000'),
        );
        const rawSliceData = sliceStart.slice(0, await ID3Parse.SearchBuffer(sliceStart, 'trkn'));
        const slice = await ID3Parse.CleanedBufferToReadableString(rawSliceData);
        const indicatorSplit = slice.split('\u0001').join('\u0000').split('\u0000');
        let mode = 'getName';
        let prop = {};
        let name = '';
        let value = '';
        for(let i = 0; i < indicatorSplit.length; i++) {
            let t = indicatorSplit[i];
            if(mode === 'getName') {
                if(t.length > 2 && t.charCodeAt(0) > 0x10) {
                    name = t;
                    mode = 'waitForData'
                }
            } else if(mode === 'waitForData') {
                if(t.replaceAll('\n','').includes('data')) {
                    mode = 'findData';
                }
            } else if(mode === 'findData') {
                if(t && t.charCodeAt(0) > 0x20) {
                    prop[name] = t;
                    mode = 'getName'
                }
            }
        };
        let m = {};
        Object.keys(prop).forEach(keyRaw => {
            const key = keyRaw.toLowerCase();
            if(key.includes('nam')||key.includes('tit')) {
                m.title = prop[keyRaw]
            } else if(key.includes('art')) {
                m.artist = prop[keyRaw];
            } else if(key.includes('alb')||key.includes('abm')) {
                m.album = prop[keyRaw];
            }
        });
        return m;
    },
    /**
     * Parse the metadata from an MP3 file.
     * @param {ArrayBuffer|Uint8Array|string} data 
     */
    ParseMP3: async function (data) {
        if(typeof data != 'string') data = await ID3Parse.BufferToString(data);
        const sliceStart = data.slice(
            await ID3Parse.SearchBuffer(data, 'nam\u0000\u0000\u0000'),
        );
        const rawSliceData = sliceStart.slice(0, await ID3Parse.SearchBuffer(sliceStart, 'trkn'));
        const slice = await ID3Parse.CleanedBufferToReadableString(rawSliceData);
    }
}