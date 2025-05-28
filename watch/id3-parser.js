const ID3Parse = {
    Types: {
        /**
         * @private
         * @param {{
         * title?:string,
         * artist?:string,
         * album?:string,
         * composer?:string,
         * imageURL?:string,
         * trackNumber?:number,
         * releaseYear?:number,
         * genre?:string|number,
         * lyrics?:string
         * }} metadata 
         * @returns {{
         * title?:string,
         * artist?:string,
         * album?:string,
         * composer?:string,
         * imageURL?:string,
         * trackNumber?:number,
         * releaseYear?:number,
         * genre?:string|number,
         * lyrics?:string
         * }} 
         */
        Metadata: function ({ title, artist, album, composer, imageURL, trackNumber, releaseYear, genre, lyrics }) {
            return {
                title,
                artist,
                album,
                composer,
                imageURL,
                trackNumber,
                releaseYear,
                genre,
                lyrics
            };
        },
        NullMetadata: () => ID3Parse.Types.Metadata({})
    },
    /**
     * 
     * @param {ArrayBuffer|Uint8Array} buffer 
     * @returns {Promise<string>}
     */
    BufferToString: async function (buffer) {
        const array = buffer instanceof Uint8Array ? Array.from(buffer) : Array.from(new Uint8Array(buffer));
        for(var i = 0; i < array.length; i++) {
            const og = array[i];
            array[i] = String.fromCharCode(og);
        }
        return array.join('');
    },
    /**
     * Parses metadata out of an M4A file.
     * @param {Buffer|Uint8Array|string} data 
     * @returns {Promise<ID3Parse.Types.Metadata>}
     */
    ParseM4A: async function (data) {
        if(typeof data != 'string') data = await ID3Parse.BufferToString(data);
        const sliceStart = data.slice(
            data.indexOf('nam\u0000\u0000\u0000'),
        );
        const slice = sliceStart.slice(0, sliceStart.indexOf('\u0000trkn'));
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
        return ID3Parse.Types.Metadata(m);
    },
    /**
     * Parses metadata out of an MP3 file.
     * @param {Buffer|Uint8Array|string} data
     */
    ParseID3: async function (data) {
        if(typeof data != 'string') data = await ID3Parse.BufferToString(data);
        const sliceStartIndex = data.slice(0, 100).indexOf('ID3');
        if(sliceStartIndex < 0) return {};
        const sliceStart = data.slice(sliceStartIndex + 35);
        const sliceEnd = sliceStartIndex + 100000 //sliceStart.indexOf('\u00FF\u00FE\u0000\u0000\u00FF');
        // if(sliceEnd < startIndex + 36) return;
        const slice = sliceEnd < sliceStartIndex + 36 ? slice : sliceStart.slice(0, sliceEnd);
        const prop = {};
        let key = '';
        let mode = 'getName';
        let value = '';
        let length = 0;
        for(let i = 0; i < slice.length; i++) {
            if(mode === 'getName') {
                if(slice.charCodeAt(i) < 0x20) break;
                key = slice.slice(i, i + 4);
                mode = 'getValue';
                value = '';
                length = '';
                for(let j = 0; j < 4; j++) {
                    length += slice.slice(i+4,i+8).charCodeAt(j).toString(16).length === 1 ? 
                        '0' + slice.slice(i+4,i+8).charCodeAt(j).toString(16) : slice.slice(i+4,i+8).charCodeAt(j).toString(16);
                }
                length = Number(`0x${length}`) - 2;
                if(key === 'USLT') mode = 'getLyrics';
                i += 10;
            } else if(mode === 'getLyrics') {
                value += [i];
                if(slice.slice(i).indexOf('\u0000\u0000\u0000') === 0) {
                    prop[key] = value;
                    value = key = '';
                    mode = 'waitUntilName';
                }
            } else if(mode === 'getValue') {
                value = slice.slice(i, i + length);
                prop[key] = value;
                value = key = '';
                i += length - 1;
                mode = 'waitUntilName';
            } else if(mode === 'waitUntilName') {
                if(slice[i] !== '\u0000') {
                    i -= 1;
                    mode = 'getName';
                }
            }
        }
        if(key&&value) prop[key] = value;
        const m = {};
        Object.keys(prop).forEach(key => {
            const value = prop[key];
            if(key === 'TIT2') {
                m.title = value;
            } else if(key === 'TPE1' || key === 'TPE2') {
                m.artist = value;
            } else if(key === 'TALB') {
                m.album = value;
            } else if(key === 'TCOM') {
                m.composer = value;
            }
        });
        return ID3Parse.Types.Metadata(m);
    },
}