tv.remote.onbuttonpressed = function (event={key:'unknown',source:{id:'',type:'unknown'},data:null}) {
    if(event.key === 'volup') return tv.volume.up();
    if(event.key === 'voldown') return tv.volume.down();
    if(event.key === 'mute') return tv.volume.mute();
    if(event.key === 'home') {
        if(tv.home.changing) return;
        if(tv.home.open) return tv.home.hide();
        return tv.home.show().catch(e=>alert(e.stack||e));
    }
    if(tv.home.changing) return;
    if(tv.home.open) {
        onbuttonpressedonhome(event.key);
    } else {
        onbuttonpressed(event);
    }
}

const REQUEST_INPUT_TILES = tv.home.onrequesttiles = async () => {
    const tiles = [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = {}
    devices.forEach(k => { if(k.kind==='audioinput') audioDevices[k.groupId] = k.deviceId });
    devices.forEach(device => {
        if(device.kind === 'videoinput') {
            const tile = tv.home.tile();
            tile.innerHTML = `<div style="justify-content:center;display:flex;flex-direction:column;text-align:center;width:100%;height:100%;"><p style="margin:0px;left:0px;">[${
                audioDevices[device.groupId] ? 'HDMI' : 'ALG'
            }]${device.label.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p></div>`;
            tiles.push({
                tile: tile,
                onclick: function () {
                    tv.home.hide();
                    tv.apps.load('hdmi', {
                        video: device.deviceId,
                        audio: audioDevices[device.groupId]
                    });
                }
            });
        }
    });
    if(USBStorageReader.Capable && USBStorageReader.i.fh) {
        try {
            /**
             * @type {{
             * deviceClass: number,
             * deviceSubClass: number,
             * deviceProtocol: number,
             * manufacturerName: string,
             * productName: string
             * }[]}
             */
            const entries = USBStorageReader.i.fh.keys();
            const toBeTiled = [];
            for await (const key of entries) toBeTiled.push(key);
            toBeTiled.forEach(folderName => {
                let deviceType = 'usb';
                if(
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
                    ].includes(folderName)
                ) {
                    deviceType = 'camera'
                } else if(
                    folderName.toLowerCase().endsWith(' ipod')
                    || folderName.toLowerCase() === 'ipod'
                ) {
                    deviceType = 'ipod';
                }
                const tile = tv.home.tile();
                tile.innerHTML = `<div style="justify-content:center;display:flex;flex-direction:column;text-align:center;width:100%;height:100%;"><p style="margin:0px;left:0px;">[${deviceType}]${folderName.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p></div>`;
                tiles.push({
                    tile: tile,
                    onclick: function () {
                        tv.home.hide();
                        tv.apps.load('usb', folderName);
                    }
                });
            });
        } catch (error) {
            console.warn(error);
        }
    };
    tv.home.onrequesttiles = REQUEST_APP_TILES;
    return tiles;
};

const REQUEST_APP_TILES = tv.home.onrequesttiles = async () => {
    const liveTVTile = tv.home.tile();
    // TODO: Create our own Live TV icon
    liveTVTile.style.backgroundImage = 'url(./assets/livetv.png)';
    liveTVTile.style.backgroundSize = 'cover';
    const hdmiInputTile = tv.home.tile();
    hdmiInputTile.style.backgroundColor='rgba(0,200,205,100)';
    hdmiInputTile.innerHTML = `<div style="justify-content:center;display:flex;flex-direction:column;text-align:center;width:100%;height:100%;"><p style="margin:0px;left:0px;font-size:24px;">HDMI</p></div>`;
    const settingsAppTile = tv.home.tile();
    settingsAppTile.style.backgroundColor='rgba(0,200,205,100)';
    settingsAppTile.innerHTML = `<div style="justify-content:center;display:flex;flex-direction:column;text-align:center;width:100%;height:100%;"><p style="margin:0px;left:0px;font-size:24px;">Options</p></div>`;
    const tiles = [
        {
            tile: liveTVTile,
            onclick: function () {
                tv.home.hide();
                tv.apps.load('live-tv');
            }
        },
        {
            tile: hdmiInputTile,
            onclick: async () => {
                if(USBStorageReader.Capable && !USBStorageReader.i.fh) {
                    try {
                        USBStorageReader.i.fh = await window.showDirectoryPicker();
                        await USBStorageReader.i.idb.set('EXT_DRIVE_HANDLE', USBStorageReader.i.fh); // We don't want to cause chaos on Chrome
                    } catch (error) {
                        console.warn(error);
                    }
                }
                tv.home.hide();
                setTimeout(() => {
                    tv.home.onrequesttiles = REQUEST_INPUT_TILES;
                    tv.home.show().catch(exception => console.warn(exception));
                }, 445);
            }
        },
        {
            tile: settingsAppTile,
            onclick: function () {
                tv.home.hide();
                tv.ui.settings.show();
            }
        }
    ];
    [].forEach(sysapp => {
        const SysAppTile = tv.home.tile();
        if(sysapp.background) {
            SysAppTile.style.backgroundColor = sysapp.background;
        }
        SysAppTile.style.backgroundImage = `url(./assets/${sysapp.asset}.png)`;
        SysAppTile.style.backgroundSize = 'contain';
        SysAppTile.style.backgroundRepeat = 'no-repeat';
        SysAppTile.style.backgroundPosition =  'center';
        tiles.push({
            tile: SysAppTile,
            onclick: function () {
                tv.home.hide();
                tv.apps.load(sysapp.id);
            }
        });
    });
    return tiles;
};

const onbuttonpressed = (event) => {
    if(tv.system.app === 'live-tv') {
        if(event.key === 'up') {
            if(tv.live.channel === CHANNELS[tv.live.region].length - 1) {
                tv.live.start(0);
            } else {
                tv.live.start(tv.live.channel + 1);
            }
        } else if(event.key === 'down') {
            if(tv.live.channel === 0) {
                tv.live.start(CHANNELS[tv.live.region].length - 1);
            } else {
                tv.live.start(tv.live.channel - 1);
            }
        }
    } else if(tv.system.app === 'hdmi') {
        // TO DO: Handle HDMI-CEC here
    } else if(tv.system.app === 'usb') {
        onbuttonpressedusbreader(event);
    } else {
        tv.apps.dispatchKey(event);
    }
};

/** @param {string} key */
const onbuttonpressedusbreader = ({ key, repeat }) => {
    if(tv.usbdrive.section === 'browse') {
        if(key === 'up') {
            if(tv.usbdrive.sfi > 0) {
                tv.usbdrive.sfi -= 1;
                tv.usbdrive.focusFileButton(tv.usbdrive.sfi);
            }
        } else if(key === 'down') {
            if(tv.usbdrive.sfi < tv.usbdrive.kf.length - 1) {
                tv.usbdrive.sfi += 1;
                tv.usbdrive.focusFileButton(tv.usbdrive.sfi);
            }
        } else if(key === 'ok') {
            // TO DO: Select the button.
            const entry = tv.usbdrive.kf[tv.usbdrive.sfi];
            if(entry === 'BACK') {
                const split = tv.usbdrive.path.split('/');
                const cleanPath = [];
                for(let i = 0; i < split.length; i++) {
                    if(split[i].trim()) {
                        cleanPath.push(split[i])
                    }
                }
                const prev = cleanPath.pop();
                tv.usbdrive.renderFolder(cleanPath.length > 1 ? cleanPath.join('/') : '', prev);
                return;
            }

            const endingSpliiter = entry.name.toLowerCase().split('.');
            const ending = endingSpliiter[endingSpliiter.length - 1];

            if(entry.kind === 'directory') {
                tv.usbdrive.renderFolder(tv.usbdrive.path + entry.name + '/');
            } else if(entry.name.endsWith('.txt')) {
                tv.usbdrive.openTextFile(entry.name);
            } else if('png,jpg,jpeg,gif'.split(',').includes(ending)) {
                tv.usbdrive.openImageFile(entry.name);
            } else if('mp3,m4a,wav'.split(',').includes(ending)) {
                tv.usbdrive.openAudioFile(entry.name);
            }
        } else if(key === 'exit') {
            if(tv.usbdrive.path != '/') {
                const split = tv.usbdrive.path.split('/');
                const cleanPath = [];
                for(let i = 0; i < split.length; i++) {
                    if(split[i].trim()) {
                        cleanPath.push(split[i])
                    }
                }
                const prev = cleanPath.pop();
                tv.usbdrive.renderFolder(cleanPath.length > 1 ? cleanPath.join('/') : '', prev);
            }
        }
    } else if(tv.usbdrive.section === 'text') {
        if(key === 'up') {
            document.querySelector('.usb-text').scrollBy({
                top: -100,
                behavior: repeat ? 'instant' : 'smooth'
            });
        } else if(key === 'down') {
            document.querySelector('.usb-text').scrollBy({
                top: 100,
                behavior: repeat ? 'instant' : 'smooth'
            });
        } else if(key === 'exit') {
            document.querySelector('.usb-text').style.display = 'none';
            document.querySelector('.usb-main').style.display = '';
            tv.usbdrive.section = 'browse';
        }
    } else if(tv.usbdrive.section === 'image-viewer') {
        if(key === 'exit') {
            URL.revokeObjectURL(tv.usbdrive.objectUrl);
            tv.usbdrive.objectUrl = '';
            document.querySelector('.usb-image-viewer').style.display = 'none';
            document.querySelector('.usb-main').style.display = '';
            tv.usbdrive.section = 'browse';
        }
    } else if(tv.usbdrive.section === 'audio') {
        if(key === 'exit') {
            URL.revokeObjectURL(tv.usbdrive.objectUrl);
            if(!$usbvideo.paused) $usbvideo.pause();
            tv.usbdrive.objectUrl = '';
            document.querySelector('.usb-audio').style.display = 'none';
            document.querySelector('.usb-main').style.display = '';
            tv.usbdrive.section = 'browse';
        } else if(key === 'ok') {
            if($usbvideo.paused) $usbvideo.play();
            else $usbvideo.pause();
        }
    }
}

const onbuttonpressedonhome = (key) => {
    if(key === 'left') {
        if(tv.home.selected > 0) {
            tv.home.selected -= 1;
            tv.home.focusTile(tv.home.selected);
        }
    } else if(key === 'right') {
        if(tv.home.selected < tv.home.length()-1) {
            tv.home.selected += 1;
            tv.home.focusTile(tv.home.selected);
        }
    } else if(key === 'ok') {
        tv.home.click(tv.home.selected);
    } else if(key === 'exit') {
        tv.home.hide();
    }
};

tv.system.registerVolume();

const USBStorageReader = {
    Capable: false,
    i: {
        /**
         * @type {IDBDatabase|null}
         */
        idb: null,
        /**
         * @type {FileSystemDirectoryHandle|null}
         */
        fh: null
    }
};

if('showDirectoryPicker' in window && 'indexedDB' in window) {
    // Support reading USB devices
    Idb.Open('USBStorageDeviceReader').then(async db => {
        USBStorageReader.Capable = true;
        USBStorageReader.i.idb = db;
        try {
            USBStorageReader.i.fh = await USBStorageReader.i.idb.get('EXT_DRIVE_HANDLE');
            USBStorageReader.i.fh.requestPermission('read');
        } catch (error) {
            void(error);
        }
        if(!USBStorageReader.i.fh) {
            /**
             * @type {Promise<FileSystemDirectoryHandle>}
             */
            try {
                 USBStorageReader.i.fh = await showDirectoryPicker();
            } catch (error) {
                console.warn(error);
            }
        };
    }).catch(error => {
        console.warn(error);
    });
}


tv.apps.load(tv.system.app, true);