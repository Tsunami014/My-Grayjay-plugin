const PLATFORM_CLAIMTYPE = 12;
var config = {};

source.enable = function(conf, settings, savedState){
	config = conf ?? {};
}

source.getHome = function() {
	//const contentData = getOdyseeContentData();
	//const featured = contentData.categories["PRIMARY_CONTENT"];
	// const query = {
	// 	channel_ids: featured.channelIds,
    //     claim_type: featured.claimType,
    //     order_by: ["trending_group", "trending_mixed"],
    //     page: 1,
    //     page_size: 20,
    //     limit_claims_per_channel: 1
	// };
	return new ContentPager([
        getSample()
    ]);
};

function getPlatformAuthorLink(item, context) {
	return new PlatformAuthorLink(new PlatformID(config.name, item?.relationships?.campaign?.data?.id, config.id, PLATFORM_CLAIMTYPE),
		context?.name,
		context?.url,
		context?.thumbnail,
		context?.subscribers ?? 0)
}

function getSample() {
    // const resp = http.GET("https://webcache.googleusercontent.com/search?q=cache:https%3A%2F%2Fwww.cantorsparadise.com%2Fa-magical-theorem-was-undiscovered-for-thousands-of-years-7d1a7cdca766", {}, false);
    // if(!resp.isOk) {
    //     //Handle your exception
    //     throw new ScriptException("Something went wrong while loading the medium webpage!");
    // }
    //eg. for a json response
    //const resultData = JSON.parse(resp.body);
    "<script.*>(.*\n)*</script>\n" // Remove ALL script tags, untested, the below works fine anyways
    "<script.*></script>" // Remove script tags if you're loading the HTML
    //Use your json result   
    return new PlatformPostDetails({
        id: new PlatformID('hi', 'bye', 'cyasoon'),
        name: 'HELLO',
        author: new PlatformAuthorLink(new PlatformID(config.platform, "SomeID"), "Some name", "", 'https://cdn.pixabay.com/photo/2016/07/07/16/46/dice-1502706_640.jpg'),
        datetime: parseInt(Date.parse('2024-01-02') / 1000),
        url: 'test.com',
        description: "Description of Post",
        images: ['https://cdn.pixabay.com/photo/2016/07/07/16/46/dice-1502706_640.jpg', 'https://miro.medium.com/v2/resize:fit:1400/1*M7_GzV-glZaZLNuSiNdiPQ.png'],
        thumbnails: [
            new Thumbnails([
                new Thumbnail('https://cdn.pixabay.com/photo/2016/07/07/16/46/dice-1502706_640.jpg', 1),
                new Thumbnail('https://miro.medium.com/v2/resize:fit:1400/1*M7_GzV-glZaZLNuSiNdiPQ.png', 1)
            ])
        ],
        rating: new RatingLikes(123),
        textType: Type.Text.Html,
        content: "<p>image:</p><br><img src='https://cdn.pixabay.com/photo/2016/07/07/16/46/dice-1502706_640.jpg'></img><img src'https://miro.medium.com/v2/resize:fit:1400/1*M7_GzV-glZaZLNuSiNdiPQ.png'></img><h1>I REALLY SAID HI</h1>"
    })

    // new PlatformPost({
    //     id: new PlatformID(config.name, item?.id, config.id),
    //     name: item?.attributes?.title,
    //     author: getPlatformAuthorLink(item, context),
    //     datetime: (Date.parse(item?.attributes?.published_at) / 1000),
    //     url: item?.attributes?.url,
    //     description: "Description of Post",
    //     images: ["../url/to/image1.png", "../url/to/image2.png"],
    //     thumbnails: new Thumbnails([
    //             new Thumbnail("https://.../...", 720),
    //             new Thumbnail("https://.../...", 1080),
    //         ])
    // });
}

//source.getHome = function(continuationToken) {
    /**
     * @param continuationToken: any?
     * @returns: VideoPager
     */
/*    const videos = []; // The results (PlatformVideo)
    const hasMore = false; // Are there more pages?
    const context = { continuationToken: continuationToken }; // Relevant data for the next page
    return new SomeHomeVideoPager(videos, hasMore, context);
}*/

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
    const videos = []; // The results (PlatformVideo)
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

	return new PlatformVideoDetails({
		//... see source.js for more details
	});
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

class HomePager extends CommentPager {
	constructor(query, initialResults) {
        this.results = initialResults;
		super();
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
