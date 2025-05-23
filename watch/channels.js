const CHANNELS = [
    {
        id: 'abc',
        name: "ABC News HD",
        feed: "https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd987b6be.m3u8",
        category: 'News',
        quality: 'hd',
        schedule: {
            available: false
        },
        provider: 'uplynk'
    },
    {
        id: 'quicktake',
        name: "Bloomberg Quicktake HD",
        feed: "https://bloomberg-quicktake-1-be.samsung.wurl.tv/playlist.m3u8",
        category: 'Finance',
        quality: 'hd',
        schedule: {
            available: false
        },
        provider: 'samsungtv'
    },
    {
        id: 'anime-all-day',
        name: "Anime All Day",
        feed: "https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5812b7d3249444e05d09cc49/master.m3u8?appName=web&appVersion=unknown&clientTime=0&deviceDNT=0&deviceId=6c26a781-30d3-11ef-9cf5-e9ddff8ff496&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&serverSideAds=false&sid=6903cfae-183e-4d3b-a482-b7acf38ce356",
        category: 'Entertainment',
        quality: 'sd',
        schedule: {
            available: false
        },
        provider: 'plutotv'
    }
];