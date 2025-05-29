const locales = {
    /**
     * Gets the current language.
     * @returns {'en'|'en-US'|'en-UK'|'en-AU'|'en-CA'|'en-IN'|'es'|'es-US'|'es-MX'|'es-ES'|'fr'|'fr-FR'|'fr-CA'|'de'|'de-DE'|'zh'|'zh-CN'|'zh-TW'|'zh-HK'|'kr'|'kr-KR'|'kr-KP'|'ja'|'ja-JP'|'it'|'it-IT'}
     */
    current: () => localStorage.getItem('tv.system.language') || 'en',
    data: {},
    /**
     * Gets a localized string.
     * @param {string} id 
     * @param  {...any} args 
     * @returns {string|number|any[]|{[key:string|Symbol]:any}|boolean|Date|URL|null}
     */
    get: (id, ...args) => {
        const cur = locales.current();
        if(!locales.data[cur]) return null;
        const path = id.split('.');
        let base = locales.data[cur];
        for(let i = 0; i < path.length; i++) {
            if(base[path[i]]) {
                base = base[path[i]]
            } else {
                return null;
            }
        }
        if(typeof base === 'function') return base(...args);
        if(typeof base === 'number') return base;
        if(typeof base === 'string') {
            if(args.length === 0) return base;
            let out = '';
            for(let j = 0; j < base.length; j++) {
                if(base[j] === '%') {
                    j += 1;
                    if(base[j] === 's' || base[j] === '1') {
                        out += args[0];
                    } else if(!isNaN(base[j]) && args[base[j]-1]) {
                        out += args[base[j]-1];
                    } else if(base[j] === '%') {
                        out += '%';
                    }
                } else {
                    out += base[j];
                }
            }
            return out;
        }
        return null;
    },
    /**
     * Adds a new locale
     * @param {'en'|'en-US'|'en-UK'|'en-AU'|'en-CA'|'en-IN'|'es'|'es-US'|'es-MX'|'es-ES'|'fr'|'fr-FR'|'fr-CA'|'de'|'de-DE'|'zh'|'zh-CN'|'zh-TW'|'zh-HK'|'kr'|'kr-KR'|'kr-KP'|'ja'|'ja-JP'|'it'|'it-IT'} iso 
     * @param {{[key:string]: string|number|(...args: any[]) => any|{[key:string]: string|number|(...args: any[]) => any|{[key:string]: string|number|(...args: any[]) => any|{[key:string]: string|number|(...args: any[]) => any}}}}} data 
     * @returns {boolean} `true` if the locale was added successfully, `false` if it already exists.
     */
    add: (iso, data) => {
        if(locales.data[iso]) return false;
        locales.data[iso] = data;
        return true;
    },
    /**
     * Gets the native name of a langauge from its ISO code.
     * @param {'en'|'en-US'|'en-UK'|'en-AU'|'en-CA'|'en-IN'|'es'|'es-US'|'es-MX'|'es-ES'|'fr'|'fr-FR'|'fr-CA'|'de'|'de-DE'|'zh'|'zh-CN'|'zh-TW'|'zh-HK'|'kr'|'kr-KR'|'kr-KP'|'ja'|'ja-JP'|'it'|'it-IT'} iso 
     */
    name: (iso) => { return {
        'en': "English",
        'es': "Espa\xF1ol",
        'fr': "Fran\xE7ias",
        'de': "Deutsch",
        'it': "Italiano",
        'zh-CN': "\u7B80\u4F53\u4E2D\u6587",
        'zh-TW': "\u7E41\u4F53\u4E2D\u6587",
        'kr': "\uD55C\uAD6D\uC5B4",
        'jp': "\u65E5\u672C\u8A9E"
    }[iso]; },
    /**
     * @returns {('en'|'en-US'|'en-UK'|'en-AU'|'en-CA'|'en-IN'|'es'|'es-US'|'es-MX'|'es-ES'|'fr'|'fr-FR'|'fr-CA'|'de'|'de-DE'|'zh'|'zh-CN'|'zh-TW'|'zh-HK'|'kr'|'kr-KR'|'kr-KP'|'ja'|'ja-JP'|'it'|'it-IT')[]}
     */
    list: () => Object.keys(locales.data)
};