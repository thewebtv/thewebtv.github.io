const tv = {
    system: {
        hls: null,
        /**
         * @type {MediaStream|null}
         */
        hdmi: null,
        get name() {
            return localStorage.getItem('tv.system.name') || `My ${Config.Device.Name}`;
        },
        set name(name) {
            return localStorage.setItem('tv.system.name', name);
        },
        app: 'live-tv',
        volume: 30,
        muted: false,
        registerVolume: () => {
            document.querySelectorAll('video').forEach(video => {
                video.muted = tv.system.muted;
                video.volume = tv.system.volume / 100;
            });
        },
        noop: () => { return () => {}; }
    },
    data: {
        /**
         * 
         * @param {string} key 
         * @returns 
         */
        get: function (key) {
            return localStorage.getItem(`tv.data:${key}`);
        },
        /**
         * 
         * @param {string} key 
         * @param {string} value 
         * @returns 
         */
        set: function (key, value) {
            return localStorage.setItem(`tv.data:${key}`, value);
        }
    },
    apps: {
        /**
         * 
         * @param {string} id 
         */
        show: function (id) {
            document.querySelector(`.feature.fg-${tv.system.app}`).style.display = 'none';
            document.querySelector(`.feature.fg-${id}`).style.display = '';
        },
        /**
         * 
         * @param {string} id 
         * @param {string|number|boolean} hdmiId 
         * @param {boolean} bp
         * @returns 
         */
        load: function (id, hdmiId, bp) {
            if(id === 'hdmi' && !hdmiId) return;
            if(id === tv.system.app && id != 'hdmi' && !hdmiId) return;
            if(id === 'hdmi' && id === tv.system.app && tv.hdmi.id === hdmiId && !bp) return;
            if(id === 'usb' && id === tv.system.app && tv.usbdrive.root === hdmiId && !bp) return;
            tv.apps.show(id);
            tv.system.app = id;
            tv.hdmi.stop();
            tv.usbdrive.stop();
            if(id === 'live-tv') {
                tv.live.start();
            } else if(id === 'hdmi') {
                tv.live.stop();
                tv.hdmi.start(hdmiId);
            } else if(id === 'usb') {
                tv.live.stop();
                tv.usbdrive.start(hdmiId);
            } else {
                tv.live.stop();
                // TO DO: Handle third-party apps
            }
        }
    },
    live: {
        region: 'us',
        channel: 0,
        stop: function () {
            if(!tv.system.hls) return;
            $livevideo.pause();
            tv.system.hls.stopLoad();
        },
        /**
         * 
         * @param {number} channelId 
         */
        start: function (channelId) {
            tv.live.captions.cues = [];
            if(typeof channelId === 'number') tv.live.channel = channelId;
            tv.live.stop(); // stop existing things
            clearTimeout(tv.live.__debounce__);
            tv.live.badge.set(tv.live.channel, CHANNELS[tv.live.region][tv.live.channel]);
            tv.live.__debounce__ = setTimeout(() => {
                tv.system.hls.loadSource(CHANNELS[tv.live.region][tv.live.channel].feed);
                tv.system.hls.startLoad();
                $livevideo.play();
            }, 1000);
        },
        __debounce__: 0,
        badge: {
            __debounce__: 0,
            /**
             * 
             * @param {number} index 
             * @param {{id: string, name: string, category: string}} details 
             */
            set: (index, {id, name, category}) => {
                clearTimeout(tv.live.badge.__debounce__);
                const badge = document.querySelector('.live-badge');
                document.querySelector('.live-badge-img').src = `./channels/${id}.png`;
                document.querySelector('.live-badge-index').innerText = `Channel ${index+1}`;
                document.querySelector('.live-badge-channel').innerText = name;
                document.querySelector('.live-badge-category').innerText = category;
                badge.style.display = '';
                tv.live.badge.__debounce__ = setTimeout(function () {
                    badge.style.display = 'none';
                }, 5000);
            }
        },
        captions: {
            // TO DO: fix everything
            enabled: () => false,
            /**
             * @type {VTTCue[]}
             */
            cues: []
        }
    },
    hdmi: {
        id: null,
        stop: function () {
            if(!(tv.system.hdmi instanceof MediaStream)) return;
            $hdmivideo.pause();
            $hdmivideo.srcObject = null;
            tv.system.hdmi.getTracks().forEach(track => track.stop());
        },
        /**
         * 
         * @param {{video:string|number,audio:string|number}} config 
         */
        start: function (config) {
            tv.hdmi.id = config.video;
            tv.hdmi.stop();
            clearTimeout(tv.hdmi.__debounce__);
            tv.hdmi.__debounce__ = setTimeout(() => {
                navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: config.video,
                        width: {
                            ideal: 1920,
                            max: 3840
                        },
                        height: {
                            ideal: 1080,
                            max: 2160
                        }
                    },
                    audio: config.audio ? {
                        deviceId: config.audio,
                        sampleRate: 48000,
                        channelCount: {
                            min: 2,
                            max: 8,
                            ideal: 6
                        },
                        echoCancellation: false,
                        autoGainControl: false,
                        noiseSuppression: false
                    } : false
                }).then(stream => {
                    tv.system.hdmi = stream;
                    $hdmivideo.srcObject = stream;
                    $hdmivideo.play()
                });
            }, 1000);
        },
        __debounce__: 0
    },
    usbdrive: {
        /**
         * @type {FileSystemDirectoryHandle}
         */
        fh: null,
        /**
         * @type {FileSystemDirectoryHandle}
         */
        kfh: null,
        section: 'browse',
        path: '/',
        sfi: 0,
        objectUrl: '',
        root: '',
        /**
         * @type {(FileSystemDirectoryHandle|FileSystemFileHandle)[]}
         */
        kf: [],
        start: async (id) => {
            if(id.toLowerCase() === 'ipod' || id.toLowerCase().endsWith('ipod')) {
                $usbmainheaderimg.src = 'assets/ipod.png';
            } else if(
                [
                    'GOPROSD',
                    'HERO4 Black',
                    'HERO5 Black',
                    'HERO6 Black',
                    'HERO7 Black',
                    'HERO8 Black',
                    'HERO9 Black',
                    'HERO10 Black',
                    'HERO11 Black',
                    'HERO11 Black Mini',
                    'HERO12 Black',
                    'HERO13 Black'
                ].includes(id)
            ) {
                $usbmainheaderimg.src = 'assets/camera.png';
            } else {
                $usbmainheaderimg.src = 'assets/usb.png';
            }
            tv.usbdrive.root = id;
            try {
                tv.usbdrive.fh = await USBStorageReader.i.fh.getDirectoryHandle(id, {
                    create: false
                });
            } catch (error) {
                setTimeout(() => {
                    tv.apps.load('live-tv');
                }, 2307);
                return;
            };
            tv.usbdrive.sfi = 0;
            tv.usbdrive.path = '';
            tv.usbdrive.section = 'browse';
            document.querySelector('.usb-main-header p').innerText = id;
            document.querySelector('.usb-main').style.display = '';
            // TO DO: Add actual app features here
            await tv.usbdrive.renderFolder('/');
        },
        setKhF: async () => {
            let khf = tv.usbdrive.fh;
            const split = tv.usbdrive.path.split('/');
            for(let i = 0; i < split.length; i++) {
                if(split[i].trim()) {
                    khf = await khf.getDirectoryHandle(split[i]);
                }
            }
            tv.usbdrive.kfh = khf;
        },
        renderFolder: async (path, previousPath) => {
            document.querySelector('.usb-main-content').innerText = '';
            if(!path.endsWith('/')) path += '/';
            tv.usbdrive.path = path;
            tv.usbdrive.sfi = 0;
            await tv.usbdrive.setKhF();
            const entries = await tv.usbdrive.kfh.entries();
            /**
             * @type {{key:string,value:FileSystemDirectoryHandle|FileSystemFileHandle}[]}
             */
            const sortedEntries = [];
            for await(const [key, value] of entries) {
                // TO DO: Create buttons for files
                sortedEntries.push({ key, value });
            }
            sortedEntries.sort((a, b) => {
                if(a.value.kind === 'file' && b.value.kind === 'directory') {
                    return 1;
                } else if(a.value.kind === 'directory' && b.value.kind === 'file') {
                    return -1;
                } else {
                    return a.key.localeCompare(b.key, undefined, { sensitivity: 'base' });
                }
            });
            const kf = [];
            let previousPathId;
            if(tv.usbdrive.path != '/') {
                const backButton = tv.usbdrive.createIconForFile('..', 'f-up.png');
                document.querySelector('.usb-main-content').appendChild(backButton);
                backButton.querySelector('.usb-file').classList.add('usb-file-active');
                kf.push('BACK');
            }
            sortedEntries.forEach((entryDetails, i) => {
                const name = entryDetails.key;
                const entry = entryDetails.value;
                kf.push(entry);
                if(name === previousPath) previousPathId = i;
                const endingSpliiter = name.toLowerCase().split('.');
                const ending = endingSpliiter[endingSpliiter.length - 1];
                let icon = 'file';
                if(entry.kind === 'directory') {
                    icon = 'folder';
                } else if('mp4,mov,webm,m4v'.split(',').includes(ending)) {
                    icon = 'f-video';
                } else if('mp3,m4a,wav'.split(',').includes(ending)) {
                    icon = 'f-audio';
                } else if('png,jpg,jpeg,gif'.split(',').includes(ending)) {
                    icon = 'f-image';
                } else if('txt'.split(',').includes(ending)) {
                    icon = 'f-doc';
                }
                const button = tv.usbdrive.createIconForFile(name, icon + '.png');
                if(i < 1 && tv.usbdrive.path == '/') button.querySelector('.usb-file').classList.add('usb-file-active');
                document.querySelector('.usb-main-content').appendChild(button);
            });
            tv.usbdrive.kf = kf;
            if(previousPath && typeof previousPathId === 'number') {
                if(path != '/') previousPathId += 1;
                tv.usbdrive.focusFileButton(previousPathId);
                tv.usbdrive.sfi = previousPathId;
            }
        },
        createIconForFile: (name, icon) => {
            const cont = document.createElement('div');
            cont.className = 'usb-file-container';
            const file = document.createElement('div');
            file.className = 'usb-file';
            const img = document.createElement('img');
            img.className = 'usb-file-img';
            img.src = `assets/${icon}`;
            const title = document.createElement('p');
            title.className = 'usb-file-label';
            title.innerText = name;
            file.appendChild(img);
            file.appendChild(title);
            cont.appendChild(file);
            return cont;
        },
        stop: () => {
            if(!$usbvideo.paused) $usbvideo.pause();
            if(!$usbaudiovideo.paused) $usbaudiovideo.pause();
            document.querySelector('.usb-main').style.display = 'none';
            document.querySelector('.usb-video').style.display = 'none';
            document.querySelector('.usb-main-content').innerText = '';
            document.querySelector('.usb-text').style.display = 'none';
            document.querySelector('.usb-image-viewer').style.display = 'none';
            document.querySelector('.usb-audio').style.display = 'none';
            if(tv.usbdrive.objectUrl) URL.revokeObjectURL(tv.usbdrive.objectUrl);
        },
        focusFileButton: (id) => {
            const tiles = document.querySelectorAll('.usb-main .usb-file');
            tv.home.selected = id;
            tiles.forEach((tile, index) => {
                if(index === id) {
                    tile.className = 'usb-file usb-file-active';
                    tile.parentElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                } else {
                    tile.className = 'usb-file';
                }
            });
        },
        getFile: async (name) => {
            const fileHandle = await tv.usbdrive.kfh.getFileHandle(name);
            return await fileHandle.getFile();
        },
        openTextFile: async (name) => {
            $usbtextreader.innerText = '';
            document.querySelector('.usb-text').scrollTop = 0;
            document.querySelector('.usb-main').style.display = 'none';
            document.querySelector('.usb-text').style.display = '';
            tv.usbdrive.section = 'buffering';
            try {
                const file = await tv.usbdrive.getFile(name);
                $usbtextreader.innerText = await file.text();
                tv.usbdrive.section = 'text';
            } catch (error) {
                console.warn(error);
                document.querySelector('.usb-text').style.display = 'none';
                document.querySelector('.usb-main').style.display = '';
                tv.usbdrive.section = 'browse';
                tv.usbdrive.renderFolder(tv.usbdrive.path);
            }
        },
        openImageFile: async (name) => {
            $usbtextreader.innerText = '';
            document.querySelector('.usb-main').style.display = 'none';
            document.querySelector('.usb-image-viewer').style.display = '';
            document.querySelector('.usb-image-viewer img').style.src = 'assets/pixel.png';
            tv.usbdrive.section = 'buffering';
            try {
                const file = await tv.usbdrive.getFile(name);
                const furl = tv.usbdrive.objectUrl = URL.createObjectURL(file);
                document.querySelector('.usb-image-viewer img').src = furl;
                tv.usbdrive.section = 'image-viewer';
            } catch (error) {
                console.warn(error);
                document.querySelector('.usb-image-viewer').style.display = 'none';
                document.querySelector('.usb-main').style.display = '';
                tv.usbdrive.section = 'browse';
                tv.usbdrive.renderFolder(tv.usbdrive.path);
            }
        },
        openAudioFile: async (name) => {
            $usbaudiorwbutton.className = 'usb-audio-control';
            $usbaudioplaybutton.className = 'usb-audio-control usb-audio-control-active';
            $usbaudioffbutton.className = 'usb-audio-control';
            document.querySelector('.usb-main').style.display = 'none';
            document.querySelector('.usb-audio').style.display = 'flex';
            $usbaudiotitle.innerText = name;
            $usbaudioartist.innerText = 'Flash Drive';
            $usbaudioalbum.innerText = '';
            tv.usbdrive.section = 'buffering';
            tv.usbdrive.audioSelectedIcon = 0;
            try {
                const file = await tv.usbdrive.getFile(name);
                const furl = tv.usbdrive.objectUrl = URL.createObjectURL(file);
                $usbaudiovideo.src = furl;
                $usbaudiovideo.play();
                const buffer = await file.arrayBuffer();
                const limit = 1024 * 1024 * 15; 
                if(buffer.byteLength <= limit && !name.toLowerCase().endsWith('.mp3')) {
                    ID3Parse.BufferToString(buffer).then(async text => {
                        let metadata = ID3Parse.Types.NullMetadata();
                        // M4A files
                        if(name.toLowerCase().endsWith('.m4a')) {
                            metadata = await ID3Parse.ParseM4A(text);
                        } else if(text.startsWith('ID3')) {
                            metadata = await ID3Parse.ParseID3(text);
                        }
                        if(metadata.title) {
                            $usbaudiotitle.innerText = metadata.title;
                        }
                        if(metadata.artist) {
                            $usbaudioartist.innerText = metadata.artist;
                        }
                        if(metadata.album) {
                            $usbaudioalbum.innerText = metadata.album;
                        }
                    }).catch(error => alert(error));
                } else if(name.toLowerCase().endsWith('.mp3')) {
                    const uint8 = new Uint8Array(buffer);
                    console.log(ID3Parse.ParseID3Experimental(uint8));
                }
                tv.usbdrive.section = 'audio';
            } catch (error) {
                console.warn(error);
                document.querySelector('.usb-main').style.display = '';
                document.querySelector('.usb-audio').style.display = 'none';
                tv.usbdrive.section = 'browse';
                tv.usbdrive.renderFolder(tv.usbdrive.path);
            }
        },
        openVideoFile: async (name) => {
            document.querySelector('.usb-main').style.display = 'none';
            document.querySelector('.usb-video').style.display = 'flex';
            tv.usbdrive.section = 'buffering';
            try {
                const file = await tv.usbdrive.getFile(name);
                const furl = tv.usbdrive.objectUrl = URL.createObjectURL(file);
                $usbvideo.src = furl;
                $usbvideo.play();
                tv.usbdrive.section = 'video';
            } catch (error) {
                console.warn(error);
                document.querySelector('.usb-main').style.display = '';
                document.querySelector('.usb-video').style.display = 'none';
                tv.usbdrive.section = 'browse';
                tv.usbdrive.renderFolder(tv.usbdrive.path);
            }
        },
        audioSelectedIcon: 0
    },
    home: {
        open: false,
        changing: false,
        selected: 0,
        resetTiles: () => {
            document.querySelectorAll('.home .tile').forEach(node => {
                if(node.classList.contains('tile-active')) node.classList.remove('tile-active');
            });
        },
        focusTile: (id) => {
            const tiles = document.querySelectorAll('.home .tile');
            tv.home.selected = id;
            tiles.forEach((tile, index) => {
                if(index === id) {
                    tile.className = 'tile tile-active';
                    tile.parentNode.scrollIntoView({
                        behavior: 'smooth',
                    });
                } else {
                    tile.className = 'tile';
                }
            });
        },
        show: async () => {
            tv.home.changing = true;
            //document.querySelector('.home').style.opacity = '0';
            document.querySelector('.home').innerHTML = ''; // quick
            const tiles = await tv.home.onrequesttiles();
            tv.home.__tiles__ = tiles;
            tiles.forEach(tile => {
                document.querySelector('.home').appendChild(tile.tile.parentNode);
            });
            document.querySelector('.home').style.display = '';
            setTimeout(() => {
                // document.querySelector('.app').style.filter = 'blur(10px)';
                // document.querySelector('.app').style.webkitFilter = 'blur(10px)';
                document.querySelector('.home').style.opacity = '1'
            },100);
            setTimeout(() => {
                tv.home.focusTile(0);
            }, 220);
            setTimeout(() => {
                tv.home.open = true;
                tv.home.changing = false;
            }, 500);
        },
        __tiles__: [],
        hide: () => {
            tv.home.changing = true;
            document.querySelector('.home').style.opacity = '0';
            // document.querySelector('.app').style.filter = 'blur(0px)';
            // document.querySelector('.app').style.webkitFilter = 'blur(0px)';
            setTimeout(() => {
                document.querySelector('.home').style.display = 'none';
                tv.home.open = false;
                tv.home.changing = false;
            }, 435);
        },
        onrequesttiles: async () => { return [] },
        tile: () => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            const cont = document.createElement('div');
            cont.className = 'tile-container';
            cont.appendChild(tile);
            return tile;
        },
        length: () => {
            return tv.home.__tiles__.length;
        },
        click: (id) => {
            tv.home.__tiles__[id].onclick();
        }
    },
    remote: {
        onbuttonpressed: (event={key:'unknown',source:{id:'',type:'unknown'},data:null}) => {},
        trigger: (event={key:'unknown',source:{id:'',type:'unknown'},data:null}) => {
            try {
                return tv.remote.onbuttonpressed(event), true;
            } catch (error) {
                return console.warn(error), false;
            }
        }
    },
    volume: {
        up: (amount=2) => {
            tv.volume.set(tv.system.volume + amount);
        },
        down: (amount=2) => {
            tv.volume.set(tv.system.volume - amount);
        },
        mute: () => {
            tv.system.muted = !tv.system.muted;
            tv.system.registerVolume();
            tv.volume.__show__();
        },
        set: (level=30) => {
            tv.system.volume = level;
            if(tv.system.volume < 0) tv.system.volume = 0;
            if(tv.system.volume > 100) tv.system.volume = 100;
            tv.system.volume = Math.floor(tv.system.volume);
            tv.system.registerVolume();
            tv.volume.__show__();
        },
        __timeout__: 0,
        __show__: () => {
            clearTimeout(tv.volume.__timeout__);
            if(tv.system.muted) {
                $volumeuimuted.style.display = '';
                $volumeuilevel.style.display = 'none';
            } else {
                $volumeuimuted.style.display = 'none';
                $volumeuiprogress.style.width = `${tv.system.volume}%`;
                $volumeuilevel.style.display = '';
            }
            $volumeui.style.display = '';
            tv.volume.__timeout__ = setTimeout(() => $volumeui.style.display = 'none', 2500);
        }
    },
    ui: {
        alerts: {
            queue: [],
            active: false,
            show: function (text) {
                const prom = new Promise(finish => {
                    tv.ui.alerts.queue.push({
                        text: text,
                        done: () => finish()
                    });
                });
                if(tv.ui.alerts.queue.length === 1) {
                    this.__show__();
                }
            },
            __show__: function () {
                this.active = true;
                // to do
                this.queue[0].done();
                this.queue.shift();
                if(this.queue.length != 0) this.__show__();
                else this.active = false;
            }
        },
        settings: {
            open: false,
            changing: false,
            show: () => {},
            hide: () => {}
        }
    },
    geo: {
        get: () => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject))
    }
};

window.onkeydown = function(event) {
    if(/*event.keyCode === 87 ||*/ event.keyCode === 38) {
        tv.remote.trigger({
            key: 'up',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(/*event.keyCode === 83 ||*/ event.keyCode === 40) {
        tv.remote.trigger({
            key: 'down',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(/*event.keyCode === 65 ||*/ event.keyCode === 37) {
        tv.remote.trigger({
            key: 'left',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(/*event.keyCode === 68 ||*/ event.keyCode === 39) {
        tv.remote.trigger({
            key: 'right',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.keyCode === 27) {
        tv.remote.trigger({
            key: 'exit',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.keyCode === 13) {
        tv.remote.trigger({
            key: 'ok',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.keyCode === 32) {
        tv.remote.trigger({
            key: 'ok',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.keyCode === 173) {
        event.preventDefault();
        tv.remote.trigger({
            key: 'mute',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.keyCode === 174 || event.keyCode === 75) {
        event.preventDefault();
        tv.remote.trigger({
            key: 'voldown',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.keyCode === 175 || event.keyCode === 73) {
        event.preventDefault();
        tv.remote.trigger({
            key: 'volup',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.key === 'SelectTask' || event.key === 'Control') {
        event.preventDefault();
        tv.remote.trigger({
            key: 'home',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.key === 'PowerOff') {
        event.preventDefault();
        tv.remote.trigger({
            key: 'power',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(('0123456789'.split('')).includes(event.key)) {
        tv.remote.trigger({
            key: event.key,
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.key === 'Backspace') {
        tv.remote.trigger({
            key: 'delete',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.key === 'BrightnessUp') {
        event.preventDefault();
        tv.remote.trigger({
            key: 'options',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            repeat: event.repeat,
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    }
};

if(Hls.isSupported()) tv.system.hls = new Hls({
    renderTextTracksNatively: true
}), tv.system.hls.attachMedia($livevideo);