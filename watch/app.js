tv.remote.onbuttonpressed = function (event={key:'unknown',source:{id:'',type:'unknown'},data:null}) {
    if(event.key === 'volup') return tv.volume.up();
    if(event.key === 'voldown') return tv.volume.down();
    if(event.key === 'mute') return tv.volume.mute();
    if(event.key === 'home') {
        if(tv.home.changing) return;
        if(tv.home.open) return tv.home.hide();
        return tv.home.show();
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
        if(device.kind === 'videoinput' && audioDevices[device.groupId]) {
            const tile = tv.home.tile();
            tile.innerHTML = `<div style="justify-content:center;display:flex;flex-direction:column;text-align:center;width:100%;height:100%;"><p style="margin:0px;left:0px;">[HDMI]${device.label.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p></div>`;
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
            const devices = await navigator.usb.getDevices();
            const entriesAsync = USBStorageReader.i.fh.keys();
            const entries = [];
            // I hate async iterators
            for await (const key of entriesAsync) entries.push(key);
            const usedNames = [];
            const toBeTiled = [];
            for(let i = 0; i < devices.length; i++) {
                try {
                    // https://www.usb.org/defined-class-codes
                    // Mass storage device is class 08h
                    const deviceName = devices[i].productName.replaceAll("..", '').replaceAll('/', '').replaceAll('\\', '').replaceAll('?', '').replaceAll(':', '').replaceAll('"', '').replaceAll('<', '').replaceAll('>', '').replaceAll('|', '');
                    let folderName = deviceName;
                    
                    if(usedNames.includes(deviceName)) {
                        let j = 1;
                        while(usedNames.includes(folderName)) {
                            folderName = `${deviceName} (${j})`;
                            j += 1;
                        }
                    }

                    usedNames.push(folderName);

                    if(entries.includes(folderName)) {
                        // Helps keep the context clean.
                        toBeTiled.push(folderName);
                    }
                } catch (error) {
                    // Separate try-catch so one USB device failing
                    // doesn't brick all the others.
                    void(error);
                }
            }
            toBeTiled.forEach(folderName => {
                const tile = tv.home.tile();
                tile.innerHTML = `<div style="justify-content:center;display:flex;flex-direction:column;text-align:center;width:100%;height:100%;"><p style="margin:0px;left:0px;">[USB]${folderName.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p></div>`;
                tiles.push({
                    tile: tile,
                    onclick: function () {
                        tv.home.hide();
                        tv.apps.load('usb', {
                            folder: folderName
                        });
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
                    } catch (error) {
                        console.warn(error);
                    }
                }
                tv.home.hide();
                setTimeout(() => {
                    tv.home.onrequesttiles = REQUEST_INPUT_TILES;
                    tv.home.show();
                }, 400);
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
    } else {
        tv.apps.dispatchKey(event);
    }
};

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


tv.apps.load(tv.system.app, true);

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

if('showDirectoryPicker' in window && 'indexedDB' in window && 'usb' in navigator) {
    Idb.Open('USBStorageDeviceReader').then(async db => {
        USBStorageReader.Capable = true;
        USBStorageReader.i.idb = db;
        try {
            USBStorageReader.i.fh = idb.get('EXT_DRIVE_HANDLE');
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