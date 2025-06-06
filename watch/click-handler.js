const KEYMAP = {
    '104': 'up',
    '88': 'down',
    '138': 'left',
    '10': 'right',
    '200': 'ok',
    '152': 'exit',
    '136': 'home',
    '0': 'pointer',
    '50': 'options',
    '24': 'volup',
    '8': 'voldown',
    '130': 'mute'
};

function uBitEventHandler(reason, device, data) {
    if(reason === 'console') {
        if(data&&data.data&&KEYMAP[String(data.data).trim()]) {
            tv.remote.trigger({
                key: KEYMAP[String(data.data).trim()],
                source: {
                    id: device.id,
                    type: 'usb:bbc-microbit'
                },
                data: data.data
            });
        }
    };
}

navigator.usb.getDevices().then(devices => {
    devices.forEach(device => uBitOpenDevice(device, uBitEventHandler));
});

const CLICK_USB = function () {
    uBitConnectDevice(uBitEventHandler);
};

window.onclick = CLICK_USB;