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
            tv.apps.show(id);
            tv.system.app = id;
            tv.hdmi.stop();
            if(id === 'live-tv') {
                tv.live.start();
            } else if(id === 'hdmi') {
                tv.live.stop();
                tv.hdmi.start(hdmiId);
            }else {
                tv.live.stop();
                // TO DO: Handle third-party apps
            }
        }
    },
    live: {
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
            if(typeof channelId === 'number') tv.live.channel = channelId;
            tv.live.stop(); // stop existing things
            clearTimeout(tv.live.__debounce__);
            tv.live.badge.set(tv.live.channel, CHANNELS[tv.live.channel]);
            tv.live.__debounce__ = setTimeout(() => {
                tv.system.hls.loadSource(CHANNELS[tv.live.channel].feed);
                tv.system.hls.startLoad();
                $livevideo.play();
            }, 1000);
        },
        __debounce__: 0,
        badge: {
            __debounce__: 0,
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
         * @param {string|number} id 
         */
        start: function (id) {
            tv.hdmi.id = id;
            tv.hdmi.stop();
            clearTimeout(tv.hdmi.__debounce__);
            tv.hdmi.__debounce__ = setTimeout(() => {
                navigator.mediaDevices.getUserMedia({
                    video: {
                        groupId: id,
                        width: 1920,
                        height: 1080
                    },
                    audio: {
                        groupId: id
                    }
                }).then(stream => {
                    tv.system.hdmi = stream;
                    $hdmivideo.srcObject = stream;
                    $hdmivideo.play()
                });
            }, 1000);
        },
        __debounce__: 0
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
                    tile.scrollIntoView({ behavior: 'smooth' });
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
                document.querySelector('.home').appendChild(tile.tile)
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
        onrequesttiles: () => { return [] },
        tile: () => {
            const tile = document.createElement('div');
            tile.className = 'tile';
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
        up: (amount=5) => {
            tv.volume.set(tv.system.volume + amount);
        },
        down: (amount=5) => {
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
    if(event.keyCode === 87 || event.keyCode === 38) {
        tv.remote.trigger({
            key: 'up',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.keyCode === 83 || event.keyCode === 40) {
        tv.remote.trigger({
            key: 'down',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.keyCode === 65 || event.keyCode === 37) {
        tv.remote.trigger({
            key: 'left',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.keyCode === 68 || event.keyCode === 39) {
        tv.remote.trigger({
            key: 'right',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
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
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    } else if(event.key === 'SelectTask' || event.key === 'h') {
        event.preventDefault();
        tv.remote.trigger({
            key: 'home',
            source: {
                id: 'JS_KEYBOARD_EVENT',
                type: 'keyboard'
            },
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
            data: {
                key: event.key,
                keyCode: event.keyCode
            }
        });
    }
};

if(Hls.isSupported()) tv.system.hls = new Hls({
    renderTextTracksNatively: false
}), tv.system.hls.attachMedia($livevideo);

if(tv.system.hls) {
    tv.system.hls.on(
        Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND,
        (event, data) => {
            if(window.ConsoleLogTextTracks) {
                console.log(data);
            }
        }
    );
}