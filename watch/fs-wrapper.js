// (c) themirrazz 2025. All rights reserved.
//
// This library is a wrapper for accessing filesystems.
// It works in browsers, on Windows 96, in Electron, and
// on Node.js.

const fsjs = (() => {
    let nfs = typeof require != 'undefined' ? require('fs').promises : null;
    /** @type {Idb|null} */
    let idbDb;
    /** @type {FileSystemDirectoryHandle|null} */
    let opfsRoot;
    const NodeFS = {
        fix: (path) => fs.updloc(path, null, fs.updloc('/fsjs/', null, __dirname)),
        readbin: async (path) => {
            const fixed = NodeFS.fix(path);
            const data = await nfs.readFile(fixed);
            return new Uint8Array(data);
        },
        writebin: async (path, bin) => {
            const fixed = NodeFS.fix(path);
            await nfs.writeFile(fixed, bin);
        },
        touch: async (path) => {
            const fixed = NodeFS.fix(path);
            await nfs.writeFile(fixed, '');
        },
        mkdir: async (path) => {
            const fixed = NodeFS.fix(path);
            await nfs.mkdir(fixed);
        },
        exists: async (path) => {
            try {
                await nfs.stat(path);
                return true;
            } catch (error) {
                return false;
            }
        },
        stat: async (path) => {
            const fixed = NodeFS.fix(path);
            const stat = await nfs.stat(fixed);
            return {
                type: stat.isDirectory() ? 'directory' : 'file',
                created: stat.ctime,
                modified: stat.mtime,
                access: {
                    read: true,
                    write: true
                }
            };
        },
        rm: async (path) => {
            const fixed = NodeFS.fix(path);
            const stat = await NodeFS.stat(path);
            if(stat.type === 'directory') {
                await nfs.rmdir(fixed, { recursive: true });
            } else {
                await nfs.rm(fixed);
            }
        },
        cp: async (path, dest) => {
            const fixed0 = NodeFS.fix(path);
            const fixed1 = NodeFS.fix(dest);
            const stat = await NodeFS.stat(path);
            if(stat.type === 'directory') {
                await nfs.cp(fixed0, fixed1);
            } else {
                await nfs.copyFile(fixed0, fixed1);
            }
        }
    };
    const OPFS = {};
    const NullFS = {
        readdir: async (loc) => {
            if(loc === '/') return [];
            else throw new Error('ENOENT: Entry not found')
        },
        readbin: async () => {
            throw new Error('ENOENT: Entry not found');
        },
        writebin: async () => {
            throw new Error('Access denied');
        },
        touch: async () => {
            throw new Error('Access denied');
        },
        mkdir: async () => {
            throw new Error('Access denied');
        },
        exists: async (loc) => loc == '/',
        stat: async (loc) => {
            if(loc === '/') {
                return {
                    type: 'directory',
                    created: new Date(0),
                    access: {
                        read: true,
                        write: false
                    }
                }
            }
        },
        rm: async (loc) => {
            if(loc === '/') throw new Error('Access denied');
            else throw new Error('ENOENT: Entry not found');
        }
    };
    const fs = {
        /**
         * @param {string} path 
         * @param {string|undefined} relative
         * @param {string|undefined} root 
         * @returns {string[]}
         */
        seploc: function (path, relative, root) {
            const splitRL = relative ? fs.seploc(relative, null, root) : [];
            const splitRT = root ? fs.seploc(root) : [];
            let isAbsolutePath = false;
            path = path.replaceAll('\\', '/').replaceAll('<','').replaceAll('>','').replaceAll(':', '');
            path = path.replaceAll('|','').replaceAll('?','');
            if('ABCDEFGHIJLMNOPQRSTUVWXYZ'.includes(path[0].toUpperCase()) && path.slice(1,3) === ':\\') {
                path = path.slice(3);
                isAbsolutePath = true;
            };
            if(path.slice[0] === '/') isAbsolutePath = true;
            if(path.startsWith('/')) path = path.slice(1);
            if(path.endsWith('/')) path = path.slice(0, -1);
            const split = path.split('/');
            const output = [];
            if(splitRL && relative && !isAbsolutePath) {
                splitRL.forEach(rk => { output.push(rk); });
            }
            for(let i = 0; i < split.length; i++) {
                // e.g. treat '/bob///x' as '/bob/x';
                if(split[i] !== '' && split[i] !== '.') {
                    if(split[i] === '..') {
                        if(output.length > 0) output.pop();
                    } else {
                        output.push(split[i]);
                    }
                }
            };
            if(root && !relative) return [...splitRT, ...output];
            return output;
        },
        /**
         * @param {string} path 
         * @param {string|undefined} relative
         * @param {string|undefined} root
         */
        updloc: function (path, relative, root) {
            const seploc = fs.seploc(path, relative, root);
            return '/' + seploc.join('/')
        },
        /** @returns {NodeFS|OPFS|NullFS} */
        base: () => {
            if(typeof require != 'undefined') return NodeFS;
            if('storage' in navigator && opfsRoot) return OPFS;
            return NullFS;
        },
        /**
         * 
         * @param {string} src 
         * @param {string} dest 
         */
        mv: async function (src, dest) {
            if(this.base().mv) return await this.base().mv(src, dest);
            await this.cp(src, dest);
            await this.rm(src);
        },
        cp: async function (src, dest) {
            if(this.base().cp) return await this.base().cp(src, dest);
            throw new Error('Not implemented');
        },
        rm: async function (src) {
            return await this.base().rm(src);
        },
        stat: async function (src) {
            return await this.base().stat(src);
        },
        exists: async function (src) {
            return await this.base().exists(src);
        },
        touch: async function (src) {
            return await this.base().touch(src);
        },
        mkdir: async function (src) {
            return await this.base().mkdir(src);
        },
        writebin: async function (src, data) {
            if(data instanceof ArrayBuffer || Array.isArray(data)) data = new Uint8Array(data);
            return await this.base().readbin(src, data);
        },
        readbin: async function (src) {
            return await this.base().readbin(src);
        },
    };
});

if(typeof module != 'undefined' && typeof window == 'undefined') module.exports = fs;