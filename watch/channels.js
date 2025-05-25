const CHANNELS = {
    us: [
        {
            id: 'abc',
            name: "ABC News HD",
            feed: "https://livetv-fa.tubi.video/abc-news/index.m3u8",
            category: 'News',
            quality: 'hd'
        },
        {
            id: 'cbs-news',
            name: "CBS News HD",
            feed: "https://cbsn-dal.cbsnstream.cbsnews.com/out/v1/ffa98bbf7d2b4c038c229bd4d9122708/master.m3u8",
            category: 'News',
            quality: 'hd'
        },
        {
            id: 'nbc-now',
            name: "NBC News NOW",
            feed: "https://epg.provider.plex.tv/library/parts/5e20b730f2f8d5003d739db7-5fc70600dd53a6002d8f93ca/variant.m3u8?x-plex-token=pBAhJwbvHDSzsvJyQxTe&url=9cfe799c2b08f5c9e35e6cee404a1a99-566d10681034d59d58fe2d518af741368ca3817c1cd528aeac1c7e1b73cffc5d04883b10afd074ad03956c7aca90c745b5d61442339ca3627a7b8dbb00fc4fe61832f102258e7f5840f46da2a0b7c9bba3b5dd91512027d076acc9455957c84d810ad98065722ce5cd27e17dfbdc7a2b40dc071edd97563be484fced28fc33abdd0243dedcefe21637e54975ceef56ae82b074ca044c83bff0a03e63ce3fef4f",
            category: 'News',
            quality: 'hd',
            guide: async () => {
                const EPGURL = 'https://epg.provider.plex.tv/channels/5e20b730f2f8d5003d739db7-5fc70600dd53a6002d8f93ca/tune';
                const EPG = await (await fetch(EPGURL.json()));
                const data = [];
                EPG.MediaContainer.MediaSubscription[0].MediaGrabOperation.forEach(item => {
                    data.push({
                        rating: item.contentRating,
                        name: item.grandparentTitle || item.title,
                        start: new Date(item.Media[0].beginsAt*1000),
                        ends: new Date(item.Media[0].endsAt*1000)
                    });
                });
            }
        },
        {
            id: 'bbc',
            name: "BBC News",
            feed: "https://vs-hls-pushb-ntham-gcomm-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_world_news_north_america/pc_hd_abr_v2.m3u8",
            category: 'News',
            qualtiy: 'full-hd'
        },
        {
            id: 'quicktake',
            name: "Bloomberg Quicktake HD",
            feed: "https://bloomberg-quicktake-1-be.samsung.wurl.tv/playlist.m3u8",
            category: 'Finance',
            quality: 'hd'
        },
        {
            id: 'cheddar',
            name: 'Cheddar',
            feed: "https://livestream.chdrstatic.com/b93e5b0d43ea306310a379971e384964acbe4990ce193c0bd50078275a9a657d/cheddar-42620/cheddarweblive/cheddar/primary/2.m3u8",
            category: 'Finance',
            quality: 'full-hd'
        },
        {
            id: 'nbc-sports-now',
            name: "NBC Sports NOW",
            feed: "https://d4whmvwm0rdvi.cloudfront.net/10007/99951253/hls/master.m3u8?ads.xumo_channelId=99951253&ads.asnw=169843&ads.afid=380753925&ads.sfid=19208128",
            category: 'Sports',
            quality: 'hd'
        },
        {
            id: 'cbs-sports-hq',
            name: "CBS Sports HQ",
            feed: "https://dai.google.com/linear/hls/pa/event/9Lq0ERvoSR-z9AwvFS-xYA/stream/518a7fc2-3dc0-455f-9b31-611710ac9350:CHS/variant/f1394531f46e3ae55a7bfe72b32eddec/bandwidth/5859480.m3u8",
            category: 'Sports',
            quality: 'hd'
        },
        {
            id: 'ion-mystery',
            name: "ION Mystery",
            feed: "https://scripps-ionmystery-1-us.xumo.wurl.tv/playlist.m3u8",
            category: 'Mystery',
            quality: 'hd'
        },
        {
            id: 'filmrise-true-crime',
            name: "Filmrise True Crime",
            feed: "https://live-manifest.production-public.tubi.io/live/04431aed-2da0-46e2-b481-c6b0582ccc03/playlist.m3u8",
            category: 'Mystery',
            quality: 'hd'
        },
        {
            id: 'ae-crime-360',
            name: "A&E Crime 360",
            feed: "https://live-manifest.production-public.tubi.io/live/8cba5c00-34f4-45da-a73a-1e3d813a0cfb/playlist.m3u8?token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJjb3VudHJ5IjoiVVMiLCJkZXZpY2VfaWQiOiJlYTY2NjBmMC0zNzY2LTRiZTQtOGQ2Yy1iNGM1ZWNjNTFhNTQiLCJleHAiOjE3NDgzMDM5ODksImlzcyI6ImxpdmVfbmV3c19tYW5pZmVzdCIsInBsYXRmb3JtIjoiV0VCIiwicnNzIjoiYXA6Y3JpbWUtMzYwIiwidXNlcl9pZCI6MH0.7OfV5rg9H5fgAT9CpGwl2ELD5zNEFpitPDFFMK53AQSReDe2uK-9oSxFvH9UF3VLmmWa131JPh2do_XE57Mhvw",
            category: 'Mystery',
            quality: 'hd'
        },
        {
            id: 'anime-hidive',
            name: 'ANIME\u00D7HIDIVE',
            feed: 'https://epg.provider.plex.tv/library/parts/5e20b730f2f8d5003d739db7-63dea56a2a2abb171ff6dadf/variant.m3u8?x-plex-token=kzqpW6LW2_fWpux7K8n3&url=496b9079fc931fd603c92491195cdd28-556698f111b9f2950eaefe06143d701fa0498026bb2d8e05168d0faf1c171b3a4f3374158ac91156bb6e1f4dca3180501d32c2a73c9ca00e2586d75aac5edd0bfc5d0bfc6be06337f18d834180126edf571a554e6483cd33ae3a24fd81857f68313c5dec074d5d69bbd5b4114c552d2411bf6c266c7170042a1455a0082d5a26f1337f3e253fced622c6191a60fc1497feab48ed80e74df5a7736bb42f65a18364346fab7f0b7f3110c7a65b1472d5a72cef1ff3567e1531cd4f06a8adde218e',
            category: 'Anime',
            quality: 'hd'
        }
    ]
};