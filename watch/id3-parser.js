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
         * lyrics?:string,
         * key?:string,
         * bpm?:string
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
         * lyrics?:string,
         * key?:string,
         * bpm?:string
         * }} 
         */
        Metadata: function ({ title, artist, album, composer, imageURL, trackNumber, releaseYear, genre, lyrics, key, bpm }) {
            return {
                title,
                artist,
                album,
                composer,
                imageURL,
                trackNumber,
                releaseYear,
                genre,
                lyrics,
                key,
                bpm
            };
        },
        NullMetadata: () => ID3Parse.Types.Metadata({})
    },
    /**
     * @param {ArrayBuffer} buffer
     * @param {ArrayBuffer|Uint8Array|string} subdata 
     */
    IndexBuffer: function (buffer, subdata) {
        let data = subdata;
        if(subdata instanceof ArrayBuffer) data = new Uint8Array(subdata);
        if(typeof subdata === 'string') data = ID3Parse.StringToUint8Array(subdata);
        let buff = new Uint8Array(buffer);
        for(let i = 0; i < buff.length - data.length; i++) {
            let doesMatch = true;
            for(let j = 0; j < data.length; j++) {
                if(buff[i+j] !== data[j]) {
                    doesMatch = false;
                    break;
                }
            }
            if(doesMatch) return i;
        }
        return -1;
    },
    BufferStartsWith: function (buffer, subdata) {
        let data = subdata;
        if(subdata instanceof ArrayBuffer) data = new Uint8Array(subdata);
        if(typeof subdata === 'string') data = ID3Parse.StringToUint8Array(subdata);
        if(data.length > buffer.length) return false;
        let buff = new Uint8Array(buffer);
        for(let i = 0; i < data.length; i++) {
            if(buff[i] !== data[i]) return false;
        }
        return true;
    },
    StringToUint8Array: function (string) {
        return new Uint8Array(string.split(''));
    }, 
    /**
     * 
     * @param {ArrayBuffer|Uint8Array} buffer 
     * @returns {string}
     */
    BufferToString: function (buffer) {
        const array = buffer instanceof Uint8Array ? Array.from(buffer) : Array.from(new Uint8Array(buffer));
        for(var i = 0; i < array.length; i++) {
            const og = array[i];
            array[i] = String.fromCharCode(og);
        }
        return array.join('');
    },
    /**
     * 
     * @param {ArrayBuffer|Uint8Array} buffer 
     * @returns {Promise<string>}
     */
    BufferToStringAsync: async function (buffer) {
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
        if(typeof data != 'string') data = await ID3Parse.BufferToStringAsync(data);
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
     * @deprecated
     */
    ParseID3Legacy: async function (data) {
        if(typeof data != 'string') data = await ID3Parse.BufferToString(data);
        const sliceStartIndex = data.slice(0, 100).indexOf('ID3');
        if(sliceStartIndex < 0) return {};
        const sliceStart = data.slice(sliceStartIndex + 35);
        const sliceEnd = sliceStartIndex + 100000 //sliceStart.indexOf('\u00FF\u00FE\u0000\u0000\u00FF');
        // if(sliceEnd < startIndex + 36) return;
        const slice = sliceEnd < sliceStartIndex + 36 ? slice : sliceStart.slice(0, sliceEnd);
        const getProp = (slice) => {
            return slice.slice(11, 11+slice.slice(4,8).charCodeAt(3)-2);
        };
        const nameIndex = slice.indexOf('TIT2');
        let artistIndex = slice.indexOf('TPE1');
        if(artistIndex < 0) artistIndex = slice.indexOf('TPE2');
        const albumIndex = slice.indexOf('TALB');
        const composerIndex = slice.indexOf('TCOM');
        const m = {};
        if(nameIndex > -1) {
            m.title = getProp(slice.slice(nameIndex));
        }
        if(artistIndex > -1) {
            m.artist = getProp(slice.slice(artistIndex));
        }
        if(albumIndex > -1) {
            m.album = getProp(slice.slice(albumIndex));
        }
        if(composerIndex > -1) {
            m.composer = getProp(slice.slice(composerIndex));
        }
        return ID3Parse.Types.Metadata(m);
    },
    /**
     * 
     * @param {Uint8Array} data 
     */
    ParseID3: function (data) {
        const prop = [];
        const length = ID3Parse.GetLengthOfID3(data.subarray(6, 10));
        const id3 = data.subarray(10, 10 + length);
        let key = '';
        let value = '';
        for(let i = 0; i < id3.length; i++) {
            key = String.fromCharCode(id3[i])+String.fromCharCode(id3[i+1])+String.fromCharCode(id3[i+2])+String.fromCharCode(id3[i+3]);
            i += 4;
            if(typeof id3[i] != 'number') break;
            const size = ID3Parse.GetLengthOfID3(id3.subarray(i, i+4));
            i += 6;
            if(typeof id3[i] != 'number') break;
            prop.push({
                key: key,
                value: id3.subarray(i, i + size)
            });
            i += size;
            key = value = '';
            i -= 1;
        }
        let m = {};
        prop.forEach(({key,value}) => {
            if(key === 'TIT2' && !m.title) {
                if(value[1] === 255 && value[2] === 254) {
                    m.title = (new TextDecoder('utf-16')).decode(value.subarray(3));
                } else {
                    m.title = ID3Parse.BufferToString(value).slice(1, -1);
                }
            } else if(key.slice(0,3) === 'TPE' && !m.artist) {
                if(value[1] === 255 && value[2] === 254) {
                    m.artist = (new TextDecoder('utf-16')).decode(value.subarray(3));
                } else {
                    m.artist = ID3Parse.BufferToString(value).slice(1, -1);
                }
            } else if(key === 'TALB' && !m.album) {
                if(value[1] === 255 && value[2] === 254) {
                    m.album = (new TextDecoder('utf-16')).decode(value.subarray(3));
                } else {
                    m.album = ID3Parse.BufferToString(value).slice(1, -1);
                }
            } else if(key === 'USLT') {
                m.lyrics = (new TextDecoder('utf-16')).decode(value.subarray(3));
            } else if(key === 'TCOM' && !m.composer) {
                if(value[1] === 255 && value[2] === 254) {
                    m.composer = (new TextDecoder('utf-16')).decode(value.subarray(3));
                } else {
                    m.composer = ID3Parse.BufferToString(value).slice(1, -1);
                }
            } else if(key === 'TKEY' && !m.key) {
                if(value[1] === 255 && value[2] === 254) {
                    m.key = (new TextDecoder('utf-16')).decode(value.subarray(3));
                } else {
                    m.key = ID3Parse.BufferToString(value).slice(1, -1);
                }
            } else if(key === 'TBPM' && !m.bpm) {
                if(value[1] === 255 && value[2] === 254) {
                    m.bpm = (new TextDecoder('utf-16')).decode(value.subarray(3));
                } else {
                    m.bpm = ID3Parse.BufferToString(value).slice(1, -1);
                }
            } else if(key === 'APIC' && !m.imageURL) {
                const descTextEncoding = value[0];
                let mime = '';
                let i = 1;
                for(i = 1; i < value.length; i++) {
                    if(value[i] === 0x00) {
                        i += 1;
                        break;
                    } else {
                        mime += String.fromCharCode(value[i]);
                    }
                };
                const pictureType = value[i];
                i += 1;
                if(pictureType != 0x03 && pictureType != 0x00 && pictureType != 0x06) return;
                for(null; i < value.length; i += descTextEncoding === 0x01 ? 2 : 1) {
                    if(descTextEncoding === 0x01) {
                        if(value[i] === 0x00 && value[i+1] === 0x00) {
                            i += 2;
                            break;
                        }
                    } else {
                        if(value [i] === 0x00) {
                            i += 1;
                            break;
                        }
                    }
                };
                const bin = value.subarray(i);
                const blob = new Blob([bin], {
                    type: mime || 'image/png'
                });
                const url = URL.createObjectURL(blob);
                m.imageURL = url;
            }
        });
        return ID3Parse.Types.Metadata(m);
    },
    /**
     * 
     * @param {number} n 
     */
    Make7Bits: function (n) {
        let bin = n.toString(2);
        while(bin.length < 7) bin = '0' + bin;
        return bin;
    },
    /**
     * 
     * @param {number[]|Uint8Array} n 
     */
    GetLengthOfID3: function (n) {
        let d = '';
        for(let i = 0; i < n.length; i++) {
            d += ID3Parse.Make7Bits(n[i]);
        }
        return parseInt(d, 2);
    }
}