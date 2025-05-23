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
        onbuttonpressed(event.key)
    }
}

const REQUEST_TILES = tv.home.onrequesttiles = async () => {
    const liveTVTile = tv.home.tile();
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
            onclick: function () {
                tv.home.hide();
                setTimeout(() => {
                    tv.home.onrequesttiles = async () => {
                        const tiles = [];
                        const devices = await navigator.mediaDevices.enumerateDevices();
                        const audioDevices = [];
                        devices.forEach(k => { if(k.kind==='audioinput') audioDevices.push(k.groupId) });
                        devices.forEach(device => {
                            if(device.kind === 'videoinput') {
                                const tile = tv.home.tile();
                                tile.innerHTML = `<div style="justify-content:center;display:flex;flex-direction:column;text-align:center;width:100%;height:100%;"><p style="margin:0px;left:0px;">${device.label.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p></div>`;
                                tiles.push({
                                    tile: tile,
                                    onclick: function () {
                                        tv.home.hide();
                                        tv.apps.load('hdmi', device.groupId);
                                    }
                                });
                            }
                        });
                        tv.home.onrequesttiles = REQUEST_TILES;
                        return tiles;
                    };
                    tv.home.show();
                },1000);
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
    [
        {
            asset: 'iheart.ico',
            background: 'black',
            id: 'iheart'
        }
    ].forEach(sysapp => {
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

const onbuttonpressed = (key) => {
    if(tv.system.app === 'live-tv') {
        if(key === 'up') {
            if(tv.live.channel === CHANNELS.length - 1) {
                tv.live.start(0);
            } else {
                tv.live.start(tv.live.channel + 1);
            }
        } else if(key === 'down') {
            if(tv.live.channel === 0) {
                tv.live.start(CHANNELS.length - 1);
            } else {
                tv.live.start(tv.live.channel - 1);
            }
        }
    } else if(tv.system.app === 'iheart') {
        if(key === 'ok') {
            tv.iheart.start();
        }
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

tv.apps.load(tv.system.app, true);