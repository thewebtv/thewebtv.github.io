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
     * @param {Uint8Array} data 
     */
    ParseM4A: function (data) {
        const block = ID3Parse.FindBlock(data, 'moov.udta.meta.list');
        console.log(block);
        return {};
    },
    /**
     * @param {Uint8Array} data
     * @param {string|string[]} block
     */
    FindBlock: function (data, block) {
        let blocks = Array.isArray(block) ? block : block.split('.');
        let blockName = '';
        let blockLength = 0;
        let blockSize = 0;
        for(let i = 0; i < data.length; i++) {
            blockName = '';
            blockLength = ID3Parse.GetLengthOfMp4(data.subarray(i, i + 4));
            blockSize = blockLength - 8;
            for(let j = 0; j < 4; j++) {
                blockName += String.fromCharCode(data[i + 4 + j]);
            }
            if(blockName === blocks[0]) {
                blocks.shift();
                if(blocks[0]) {
                    return ID3Parse.FindBlock(data.subarray(i, i + blockLength), blocks);
                } else {
                    return data.subarray(i, i + blockLength);
                }
            }
            i += blockLength;
        }
        return null;
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
    Make8Bits: function (n) {
        let bin = n.toString(2);
        while(bin.length < 8) bin = '0' + bin;
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
    },
    /**
     * @param {number[]|Uint8Array} n 
     */
    GetLengthOfMp4: function (n) {
        let d = '';
        for(let i = 0; i < n.length; i++) {
            d += ID3Parse.Make7Bits(n[i]);
        }
        return parseInt(d, 2);
    }
};