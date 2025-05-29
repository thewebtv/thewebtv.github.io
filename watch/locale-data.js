locales.add('en-US', {
    tv: {
        live: {
            channelIndicator: (channelNumber) => `Channel ${channelNumber}`,
            genre: {
                news: "News",
                finance: "Finance",
                sports: "Sports",
                movies: "Movies",
                kids: "Kids",
                edu: "Education",
                mystery: "Mystery",
                anime: "Anime",
                music: "Music",
                other: "Other"
            }
        }
    }
});

locales.add('ja-JP', {
    tv: {
        live: {
            channelIndicator: (channelNumber) => `チャネル${channelNumber}`,
            genre: {
                news: "ニュース",
                finance: "お金",
                sports: "スポーツ",
                movies: "映画",
                kids: "子供向け",
                edu: "To be labeled",
                mystery: "ミステリー",
                anime: "アニメ",
                music: "音楽",
                other: "他のチャネル"
            }
        }
    }
});