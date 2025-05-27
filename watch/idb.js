// For Firefox
if(window.mozIndexedDB) window.indexedDB = window.mozIndexedDB;

/**
 * 
 * @param {IDBDatabase} db 
 * @param {string} name 
 */
const Idb =  function(db, name) {
    /**
     * @type {{
     * database: IDBDatabase,
     * name: string,
     * store: IDBObjectStore
     * }}
     */
    this._ = {
        database: db,
        name: name,
        /**
         * @type {IDBObjectStore}
         */
        store: null
    };
};

Idb.prototype.get = async function (key) {
    const trans = this._.database.transaction('idb','readwrite');
    const store = trans.objectStore('idb');
    const data = await Idb.HandleRequest(store.get(key));
    return data.value;
};

Idb.prototype.set = async function (key, value) {
    const trans = this._.database.transaction('idb','readwrite');
    const store = trans.objectStore('idb');
    return await Idb.HandleRequest(store.put(key, value));
};

Idb.prototype.rm = async function (key) {
    const trans = this._.database.transaction('idb','readwrite');
    const store = trans.objectStore('idb');
    return await Idb.HandleRequest(store.delete(key));
};

/**
 * INTERNAL USE ONLY
 * @param {IDBRequest} request 
 */
Idb.HandleRequest = (request) => {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Opens an IDB database.
 * @param {string} name The name of the database.
 * @returns {Promise<Idb>}
 */
Idb.Open = (name) => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(name);
        req.onsuccess = () => {
            resolve(new Idb(req.result, name));
        };
        req.onerror = () => {
            reject(req.error);
        };
        req.onupgradeneeded = (event) => {
            const db = req.result;
            const store = db.createObjectStore('idb', {
                keyPath: 'key'
            });
            store.createIndex('value', 'value', { unique: false });
        }
    });
};