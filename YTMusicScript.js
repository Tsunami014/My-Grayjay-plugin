const REGEX_DETAILS_URL = /https?:\/\/music\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/

const USER_AGENT_TABLET = "Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1";

const YTM_DOMAIN = "https://music.youtube.com"
const YT_DOMAIN = "https://www.youtube.com"
const YTM_WATCH_URL = YTM_DOMAIN + "/watch?v="
const YTM_BASE_API = YT_DOMAIN + "/youtubei/v1/"
const YTM_PARAMS = "?alt=json"

const info = {
    'context': {
        'client': {
            'clientName': 'ANDROID_MUSIC',
            'clientVersion': '5.16.51',
            'androidSdkVersion': 30
        }
    },
    'header': {
        'User-Agent': 'com.google.android.apps.youtube.music/'
    },
    'api_key': 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
}

const ctx = {
    "context": {
        "client": {
            "clientName": "WEB_REMIX",
            "clientVersion": "1." + new Date().toISOString().split('T')[0].replace(/-/g, '') + ".01.00",
        },
        "user": {},
    }
}

const abr_itags = {
    139: "48kbps",  // MP4
    140: "128kbps",  // MP4
    141: "256kbps",  // MP4
    171: "128kbps",  // WEBM
    172: "256kbps",  // WEBM
    249: "50kbps",  // WEBM
    250: "70kbps",  // WEBM
    251: "160kbps",  // WEBM
    256: "192kbps",  // MP4
    258: "384kbps",  // MP4
}

const PLATFORM_ID = new PlatformID("YouTube Music", "YouTube Music", 9876543123456789876543278)

function send_request(endpoint, body, additionalParams = "") {
    Object.assign(body, ctx);
    let headers = {"Accept-Language": "en-US", "Cookie": "PREF=hl=en&gl=US" };
    if(true) //useMobile
		headers["User-Agent"] = USER_AGENT_TABLET;
        const resp = http.POST(YTM_BASE_API + endpoint + YTM_PARAMS + additionalParams, JSON.stringify(body), headers, false);
        return JSON.parse(resp.body);
}

source.enable = function (conf) {
    /**
     * @param conf: SourceV8PluginConfig (the SomeConfig.js)
     */
}

function executeRequest(url, headers = {}, data = null) {
    let baseHeaders = {
        "User-Agent": "Mozilla/5.0",
        "accept-language": "en-US,en"
    };
    if (headers) {
        baseHeaders = {...baseHeaders, ...headers};
    }
    if (data) {
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }
    }
    if (!url.toLowerCase().startsWith("http")) {
        throw new Error("Invalid URL");
    }
    const resp = http.POST(url, data, baseHeaders, false);
    return JSON.parse(resp.body);
}

function player(video_id) {
    const endpoint = `${YTM_BASE_API}player`;
    const query = {
        'videoId': video_id,
        'key': info['api_key'],
        'contentCheckOk': true,
        'racyCheckOk': true
    };
    const endpoint_url = `${endpoint}?${Object.keys(query).map(key => `${key}=${encodeURIComponent(query[key])}`).join('&')}`;
    const headers = {'Content-Type': 'application/json', ...info['header']};
    const response = executeRequest(
        endpoint_url,
        headers,
        {'context': info['context']}
    );
    return response;
}

function applyDescrambler(streamData) {
    if ('url' in streamData) {
        return null;
    }

    // Merge formats and adaptiveFormats into a single list
    let formats = [];
    if ('formats' in streamData) {
        formats = formats.concat(streamData['formats']);
    }
    if ('adaptiveFormats' in streamData) {
        formats = formats.concat(streamData['adaptiveFormats']);
    }

    // Extract url and s from signatureCiphers as necessary
    for (let i = 0; i < formats.length; i++) {
        if (!('url' in formats[i])) {
            if ('signatureCipher' in formats[i]) {
                let cipherUrl = new URLSearchParams(formats[i]['signatureCipher']);
                formats[i]['url'] = cipherUrl.get('url');
                formats[i]['s'] = cipherUrl.get('s');
            }
        }
        formats[i]['is_otf'] = formats[i]['type'] === 'FORMAT_STREAM_TYPE_OTF';
    }

    return formats;
}

function get_author_link(channelId) {
    let resp = send_request("browse", {"browseId": channelId})
    if (!resp.header.musicImmersiveHeaderRenderer) {
        return new PlatformAuthorLink(
            PLATFORM_ID, 
            "????", 
            YTM_DOMAIN + "/channel/" + channelId, 
        );
    }
    let thumbnails = resp.header.musicImmersiveHeaderRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
    return new PlatformAuthorLink(
        PLATFORM_ID, 
        resp.header.musicImmersiveHeaderRenderer.title.runs[0].text, 
        YTM_DOMAIN + "/channel/" + channelId, 
        thumbnails[thumbnails.length-1].url
    );
}

function get_video(video_id) {
    let data = send_request("player", {"video_id": video_id}).videoDetails;
    return new PlatformVideo({
        id: PLATFORM_ID,
        name: data.title,
        thumbnails: new Thumbnails(data.thumbnail.thumbnails.map(function(s) {
            return new Thumbnail(s.url, s.width);
        })),
        author: get_author_link(data.channelId),
        uploadDate: 1696880568,
        duration: parseInt(data.lengthSeconds),
        viewCount: parseInt(data.viewCount),
        url: YTM_WATCH_URL + video_id,
        isLive: data.isLiveContent
    });
}

function get_video_details(video_id) {
    let data = send_request("player", {"video_id": video_id}).videoDetails;

    const streams = applyDescrambler(player(video_id).streamingData);

    let Sources = []
    let s;

    for (let i = 0; i < streams.length; i++) {
        s = streams[i];
        // 'video/webm; codecs="vp8, vorbis"' -> 'video/webm', ['vp8', 'vorbis']
        const pat = /(\w+\/\w+)\;\scodecs=\"([a-zA-Z-0-9.,\s]*)\"/;
        let results = s["mimeType"].match(pat);
        if (!results) {
            throw new Error(`RegexMatchError: mime_type_codec, pattern=${pat}`);
        }
        let mimeType = results[1];
        let codecs = results[2].split(",").map(c => c.trim());

        // 'video/webm' -> 'video', 'webm'
        let typeSubtype = mimeType.split("/");
        let type = typeSubtype[0];
        let subtype = typeSubtype[1];
        let itag = "unknown"
        if (s.itag in abr_itags) {
            itag = abr_itags[s.itag];
        }
        if (type == "audio") {
            Sources.push(new AudioUrlSource({
                name: mimeType + ' ' + itag,
                url: s.url,
                bitrate: parseInt(s.bitrate),
                codec: codecs[0],
                duration: parseInt(data.lengthSeconds),
            }));
        }
    }

	return new PlatformVideoDetails({ //TODO: The rest of the details below
        id: PLATFORM_ID,
        name: data.title,
        thumbnails: new Thumbnails(data.thumbnail.thumbnails.map(function(s) {
            return new Thumbnail(s.url, s.width);
        })),
        author: get_author_link(data.channelId),
        uploadDate: 1696880568,
        //duration: parseInt(data.lengthSeconds),
        viewCount: parseInt(data.viewCount),
        url: YTM_WATCH_URL + video_id,
        isLive: false,//data.isLiveContent,
    
        description: "Some description",
        video: new UnMuxVideoSourceDescriptor([], Sources),
        //live: null,
        rating: new RatingLikes(123),
        subtitles: []
    });
}

source.getHome = function(continuationToken) {
    /**
     * @param continuationToken: any?
     * @returns: VideoPager
     */
    let resp;
    if (continuationToken) {
        resp = send_request("browse", {"browseId": "FEmusic_home"}, "&ctoken=" + continuationToken + "&continuation=" + continuationToken)
    } else {
        resp = send_request("browse", {"browseId": "FEmusic_home"})
    }
    const videos = resp.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicCarouselShelfRenderer.contents.map(function(s) {
        return get_video(s.musicResponsiveListItemRenderer.playlistItemData.videoId)
    }); // The results (PlatformVideo)
    const hasMore = true; // Are there more pages?
    const context = { continuationToken: resp.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.continuations[0].nextContinuationData.continuation}; // Relevant data for the next page
    return new SomeHomeVideoPager(videos, hasMore, context);
}

source.searchSuggestions = function(query) {
    /**
     * @param query: string
     * @returns: string[]
     */

    const suggestions = []; //The suggestions for a specific search query
    return suggestions;
}

source.getSearchCapabilities = function() {
    //This is an example of how to return search capabilities like available sorts, filters and which feed types are available (see source.js for more details) 
	return {
		types: [Type.Feed.Mixed],
		sorts: [Type.Order.Chronological, "^release_time"],
		filters: [
			{
				id: "date",
				name: "Date",
				isMultiSelect: false,
				filters: [
					{ id: Type.Date.Today, name: "Last 24 hours", value: "today" },
					{ id: Type.Date.LastWeek, name: "Last week", value: "thisweek" },
					{ id: Type.Date.LastMonth, name: "Last month", value: "thismonth" },
					{ id: Type.Date.LastYear, name: "Last year", value: "thisyear" }
				]
			},
		]
	};
}

source.search = function (query, type, order, filters, continuationToken) {
    /**
     * @param query: string
     * @param type: string
     * @param order: string
     * @param filters: Map<string, Array<string>>
     * @param continuationToken: any?
     * @returns: VideoPager
     */
    const response = send_request("search", {"query": query});
    const resp = response.contents.tabbedSearchResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents.slice(1).reduce((acc, i) => {
        const title = i.musicShelfRenderer.title.runs[0].text;
        acc[title] = i.musicShelfRenderer.contents;
        return acc;
    }, {});

    //TODO: Make it just the videos to make there more results

    const videos = resp['Songs'].map(i => { // The results (PlatformVideo)
        return get_video(YTM_WATCH_URL + i.musicResponsiveListItemRenderer.playlistItemData.videoId);
    });
    const hasMore = false; // Are there more pages?
    const context = { query: query, type: type, order: order, filters: filters, continuationToken: continuationToken }; // Relevant data for the next page
    return new SomeSearchVideoPager(videos, hasMore, context);
}

source.getSearchChannelContentsCapabilities = function () {
    //This is an example of how to return search capabilities on a channel like available sorts, filters and which feed types are available (see source.js for more details)
	return {
		types: [Type.Feed.Mixed],
		sorts: [Type.Order.Chronological],
		filters: []
	};
}

source.searchChannelContents = function (url, query, type, order, filters, continuationToken) {
    /**
     * @param url: string
     * @param query: string
     * @param type: string
     * @param order: string
     * @param filters: Map<string, Array<string>>
     * @param continuationToken: any?
     * @returns: VideoPager
     */

    const videos = []; // The results (PlatformVideo)
    const hasMore = false; // Are there more pages?
    const context = { channelUrl: channelUrl, query: query, type: type, order: order, filters: filters, continuationToken: continuationToken }; // Relevant data for the next page
    return new SomeSearchChannelVideoPager(videos, hasMore, context);
}

source.searchChannels = function (query, continuationToken) {
    /**
     * @param query: string
     * @param continuationToken: any?
     * @returns: ChannelPager
     */

    const channels = []; // The results (PlatformChannel)
    const hasMore = false; // Are there more pages?
    const context = { query: query, continuationToken: continuationToken }; // Relevant data for the next page
    return new SomeChannelPager(channels, hasMore, context);
}

source.isChannelUrl = function(url) {
    /**
     * @param url: string
     * @returns: boolean
     */

	return REGEX_CHANNEL_URL.test(url);
}

source.getChannel = function(url) {
	return new PlatformChannel({
		//... see source.js for more details
	});
}

source.getChannelContents = function(url, type, order, filters, continuationToken) {
    /**
     * @param url: string
     * @param type: string
     * @param order: string
     * @param filters: Map<string, Array<string>>
     * @param continuationToken: any?
     * @returns: VideoPager
     */

    const videos = []; // The results (PlatformVideo)
    const hasMore = false; // Are there more pages?
    const context = { url: url, query: query, type: type, order: order, filters: filters, continuationToken: continuationToken }; // Relevant data for the next page
    return new SomeChannelVideoPager(videos, hasMore, context);
}

source.isContentDetailsUrl = function(url) {
    /**
     * @param url: string
     * @returns: boolean
     */

	return REGEX_DETAILS_URL.test(url);
}

source.getContentDetails = function(url) {
    /**
     * @param url: string
     * @returns: PlatformVideoDetails
     */
    const parts = url.split('v=');
    const id = parts.pop() || parts.pop();  // handle potential trailing slash
    return get_video_details(id);
    
}

source.getComments = function (url, continuationToken) {
    /**
     * @param url: string
     * @param continuationToken: any?
     * @returns: CommentPager
     */

    const comments = []; // The results (Comment)
    const hasMore = false; // Are there more pages?
    const context = { url: url, continuationToken: continuationToken }; // Relevant data for the next page
    return new SomeCommentPager(comments, hasMore, context);

}
source.getSubComments = function (comment) {
    /**
     * @param comment: Comment
     * @returns: SomeCommentPager
     */

	if (typeof comment === 'string') {
		comment = JSON.parse(comment);
	}

	return getCommentsPager(comment.context.claimId, comment.context.claimId, 1, false, comment.context.commentId);
}

class SomeCommentPager extends CommentPager {
    constructor(results, hasMore, context) {
        super(results, hasMore, context);
    }

    nextPage() {
        return source.getComments(this.context.url, this.context.continuationToken);
    }
}

class SomeHomeVideoPager extends VideoPager {
	constructor(results, hasMore, context) {
		super(results, hasMore, context);
	}
	
	nextPage() {
		return source.getHome(this.context.continuationToken);
	}
}

class SomeSearchVideoPager extends VideoPager {
	constructor(results, hasMore, context) {
		super(results, hasMore, context);
	}
	
	nextPage() {
		return source.search(this.context.query, this.context.type, this.context.order, this.context.filters, this.context.continuationToken);
	}
}

class SomeSearchChannelVideoPager extends VideoPager {
	constructor(results, hasMore, context) {
		super(results, hasMore, context);
	}
	
	nextPage() {
		return source.searchChannelContents(this.context.channelUrl, this.context.query, this.context.type, this.context.order, this.context.filters, this.context.continuationToken);
	}
}

class SomeChannelPager extends ChannelPager {
	constructor(results, hasMore, context) {
		super(results, hasMore, context);
	}
	
	nextPage() {
		return source.searchChannelContents(this.context.query, this.context.continuationToken);
	}
}

class SomeChannelVideoPager extends VideoPager {
	constructor(results, hasMore, context) {
		super(results, hasMore, context);
	}
	
	nextPage() {
		return source.getChannelContents(this.context.url, this.context.type, this.context.order, this.context.filters, this.context.continuationToken);
	}
}
