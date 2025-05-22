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

tv.home.onrequesttiles = async () => {
    const liveTVTile = tv.home.tile();
    liveTVTile.style.backgroundImage = 'url(./assets/livetv.png)';
    liveTVTile.style.backgroundSize = 'cover';
    const tiles = [
        {
            tile: liveTVTile,
            onclick: function () {
                tv.home.hide();
                tv.apps.load('live-tv');
            }
        }
    ];
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