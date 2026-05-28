let mediaItems = [];
let diskConnected = false;
let serverMode = false;
const planKey = "watchVaultPlan";
const ratingKey = "watchVaultRatings";
const wikiCacheKey = "watchVaultWikiCache";
const publicInfoKey = "watchVaultPublicInfo";
const themeKey = "watchVaultTheme";
const languageKey = "watchVaultLanguage";
let currentLanguage = localStorage.getItem(languageKey) || "en";
const customKey = "watchVaultCustomItems";
const hiddenKey = "watchVaultHiddenItems";
const orderKey = "watchVaultOrder";
const passwordKey = "watchVaultDeletePassword";
let activeCategory = "";
let editMode = false;
let recommendationOffset = 0;
let recommendationHistory = readStorage("watchVaultRecommendationHistory", []);
let lastRecommendationSignature = "";
let pendingOnlineItem = null;
const APP_VERSION = "20260528-restore-old";

const knownOnlineItems = {
  tt2861424: {
    title: "Rick and Morty", titleZh: "瑞克和莫蒂", category: "Animation", rating: "9.1", releaseDate: "2013",
    director: ["Dan Harmon", "Justin Roiland"], cast: ["Chris Parnell", "Spencer Grammer", "Sarah Chalke", "Ian Cardoni"],
    poster: "https://images.metahub.space/poster/medium/tt2861424/img",
    summary: "Brilliant but reckless scientist Rick Sanchez drags his anxious grandson Morty across dimensions, turning family life into a chaotic mix of sci-fi disasters, dark comedy, and strange cosmic trouble.",
    summaryZh: "天才但疯狂的科学家瑞克带着外孙莫蒂穿越不同维度，把普通家庭生活变成科幻灾难、黑色幽默和宇宙级麻烦的混合体。"
  },
  tt11210032: {
    title: "Sheep Without a Shepherd", titleZh: "误杀", category: "Movie", rating: "6.7", releaseDate: "2019",
    director: ["Sam Quah"], cast: ["Xiao Yang", "Tan Zhuo", "Joan Chen", "Philip Keung"],
    poster: "https://images.metahub.space/poster/medium/tt11210032/img",
    summary: "A father uses everything he has learned from crime films to protect his family after a desperate cover-up spirals out of control.",
    summaryZh: "李维杰为了保护家人，被迫卷入一场失控的掩盖与追查。他凭借从电影里学来的犯罪知识，与警方展开心理较量。"
  },
  tt4857264: {
    title: "The Invisible Guest", titleZh: "看不见的客人", category: "Movie", rating: "8.0", releaseDate: "2016",
    director: ["Oriol Paulo"], cast: ["Mario Casas", "Ana Wagener", "Jose Coronado", "Barbara Lennie"],
    poster: "https://images.metahub.space/poster/medium/tt4857264/img",
    summary: "A successful businessman accused of murder works with an expert witness preparation lawyer to build a defense before time runs out.",
    summaryZh: "事业有成的商人被控谋杀，他与一名资深辩护顾问在有限时间内复盘案情，却发现每个细节都可能反转真相。"
  },
  tt7286456: {
    title: "Joker", titleZh: "小丑", category: "Movie", rating: "8.3", releaseDate: "2019",
    director: ["Todd Phillips"], cast: ["Joaquin Phoenix", "Robert De Niro", "Zazie Beetz", "Frances Conroy"],
    poster: "https://images.metahub.space/poster/medium/tt7286456/img",
    summary: "Arthur Fleck is pushed from isolation and humiliation into a violent transformation that shakes Gotham City.",
    summaryZh: "亚瑟·弗莱克在贫困、孤立和社会羞辱中逐渐崩溃，最终化身小丑，引爆哥谭市压抑已久的混乱。"
  },
  tt0468569: {
    title: "The Dark Knight", titleZh: "蝙蝠侠：黑暗骑士", category: "Movie", rating: "9.1", releaseDate: "2008",
    director: ["Christopher Nolan"], cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
    poster: "https://images.metahub.space/poster/medium/tt0468569/img",
    summary: "Batman, James Gordon, and Harvey Dent are pushed to their limits when the Joker unleashes chaos across Gotham City.",
    summaryZh: "小丑在哥谭制造混乱与恐惧，蝙蝠侠、戈登和哈维·丹特被迫面对秩序、正义与牺牲的极限。"
  },
  tt5700672: {
    title: "Train to Busan", titleZh: "釜山行", category: "Movie", rating: "7.6", releaseDate: "2016",
    director: ["Yeon Sang-ho"], cast: ["Gong Yoo", "Jung Yu-mi", "Ma Dong-seok", "Kim Su-an"],
    poster: "https://images.metahub.space/poster/medium/tt5700672/img",
    summary: "While a zombie virus breaks out in South Korea, passengers fight to survive on a high-speed train from Seoul to Busan.",
    summaryZh: "韩国爆发丧尸病毒后，一列从首尔开往釜山的高速列车成为幸存者求生的封闭战场。"
  },
  tt0910970: {
    title: "WALL·E", titleZh: "机器人总动员", category: "Animation", rating: "8.4", releaseDate: "2008",
    director: ["Andrew Stanton"], cast: ["Ben Burtt", "Elissa Knight", "Jeff Garlin", "Fred Willard"],
    poster: "https://images.metahub.space/poster/medium/tt0910970/img",
    summary: "A lonely waste-collecting robot on an abandoned Earth discovers love, curiosity, and a chance to help humanity return home.",
    summaryZh: "孤独的清洁机器人在被遗弃的地球上遇见探测机器人EVE，并意外卷入人类重返家园的希望。"
  },
  tt30144839: {
    title: "One Battle After Another", titleZh: "一战再战", category: "Movie", rating: "8.1", releaseDate: "2025",
    director: ["Paul Thomas Anderson"], cast: ["Leonardo DiCaprio", "Sean Penn", "Benicio Del Toro", "Regina Hall"],
    poster: "https://images.metahub.space/poster/medium/tt30144839/img",
    summary: "A former revolutionary is pulled back into danger when an old enemy resurfaces and his daughter becomes the center of the fight.",
    summaryZh: "一名前革命者在宿敌再度现身后被迫重回危险局势，他的女儿也被卷入这场混乱的追逐与对抗。"
  },
  tt0347149: {
    title: "Howl's Moving Castle", titleZh: "哈尔的移动城堡", category: "Animation", rating: "8.2", releaseDate: "2004",
    director: ["Hayao Miyazaki"], cast: ["Chieko Baisho", "Takuya Kimura", "Akihiro Miwa", "Tatsuya Gashuin"],
    poster: "https://images.metahub.space/poster/medium/tt0347149/img",
    summary: "A young woman cursed with an old body seeks help from the mysterious wizard Howl and his walking castle.",
    summaryZh: "被诅咒变成老妇人的少女苏菲，走进魔法师哈尔的移动城堡，在战争与魔法中寻找自我与爱。"
  },
  tt12042730: {
    title: "Project Hail Mary", titleZh: "挽救计划", category: "Movie", rating: "8.3", releaseDate: "2026",
    director: ["Phil Lord", "Christopher Miller"], cast: ["Ryan Gosling", "Sandra Huller", "James Ortiz", "Lionel Boyce"],
    poster: "https://images.metahub.space/poster/medium/tt12042730/img",
    summary: "Ryland Grace wakes alone on a spacecraft with no memory and slowly realizes he may be humanity's last chance to save Earth.",
    summaryZh: "科学教师Ryland Grace在失忆中醒来，发现自己独自置身太空任务，可能是拯救地球的最后希望。"
  },
  tt0120731: {
    title: "The Legend of 1900", titleZh: "海上钢琴师", category: "Movie", rating: "8.0", releaseDate: "1998",
    director: ["Giuseppe Tornatore"], cast: ["Tim Roth", "Pruitt Taylor Vince", "Melanie Thierry", "Bill Nunn"],
    poster: "https://images.metahub.space/poster/medium/tt0120731/img",
    summary: "A baby boy found on an ocean liner grows into a gifted pianist who lives his whole life at sea.",
    summaryZh: "一个在远洋客轮上被发现的弃婴长成天才钢琴师，并把一生留在海上。"
  },
  tt0068646: {
    title: "The Godfather", titleZh: "教父", category: "Movie", rating: "9.2", releaseDate: "1972",
    director: ["Francis Ford Coppola"], cast: ["Marlon Brando", "Al Pacino", "James Caan", "Diane Keaton"],
    poster: "https://images.metahub.space/poster/medium/tt0068646/img",
    summary: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    summaryZh: "黑手党家族年迈的教父逐渐把权力交给原本抗拒家族事业的小儿子。"
  },
  tt1520211: {
    title: "The Walking Dead", titleZh: "行尸走肉", category: "Show", rating: "8.1", releaseDate: "2010",
    director: ["Frank Darabont"], cast: ["Andrew Lincoln", "Norman Reedus", "Melissa McBride", "Lauren Cohan"],
    poster: "https://images.metahub.space/poster/medium/tt1520211/img",
    summary: "A group of survivors tries to stay alive after a zombie apocalypse while human conflict becomes just as dangerous as the dead.",
    summaryZh: "丧尸末日之后，一群幸存者在求生路上发现人性的冲突同样危险。"
  },
  tt1837492: {
    title: "13 Reasons Why", titleZh: "十三个原因", category: "Show", rating: "7.4", releaseDate: "2017",
    director: ["Brian Yorkey"], cast: ["Dylan Minnette", "Katherine Langford", "Christian Navarro", "Alisha Boe"],
    poster: "https://images.metahub.space/poster/medium/tt1837492/img",
    summary: "Teenager Clay Jensen searches for the story behind his classmate Hannah Baker's death and the tapes she left behind.",
    summaryZh: "少年Clay Jensen收到同学Hannah Baker留下的录音带，并一步步追寻她死亡背后的原因。"
  },
  tt6468322: {
    title: "Money Heist", titleZh: "纸钞屋", category: "Show", rating: "8.2", releaseDate: "2017",
    director: ["Alex Pina"], cast: ["Ursula Corbero", "Alvaro Morte", "Itziar Ituno", "Pedro Alonso"],
    poster: "https://images.metahub.space/poster/medium/tt6468322/img",
    summary: "A criminal mastermind known as the Professor recruits a team to carry out an ambitious robbery at the Royal Mint of Spain.",
    summaryZh: "神秘的教授召集一支队伍，策划并执行一场针对西班牙皇家造币厂的大胆劫案。"
  },
  tt4574334: {
    title: "Stranger Things", titleZh: "怪奇物语", category: "Show", rating: "8.6", releaseDate: "2016",
    director: ["Matt Duffer", "Ross Duffer"], cast: ["Winona Ryder", "David Harbour", "Finn Wolfhard", "Millie Bobby Brown"],
    poster: "https://images.metahub.space/poster/medium/tt4574334/img",
    summary: "When a young boy vanishes, a small town uncovers secret experiments, supernatural forces, and one strange little girl.",
    summaryZh: "小镇男孩离奇失踪后，秘密实验、超自然力量和一个神秘女孩逐渐浮出水面。"
  },
  tt4034228: {
    title: "Manchester by the Sea", titleZh: "海边的曼彻斯特", category: "Movie", rating: "7.8", releaseDate: "2016",
    director: ["Kenneth Lonergan"], cast: ["Casey Affleck", "Michelle Williams", "Kyle Chandler", "Lucas Hedges"],
    poster: "https://image.tmdb.org/t/p/original/e8daDzP0vFOnGyKmve95Yv0D0io.jpg",
    summary: "A grieving man returns home after a family tragedy and confronts a painful past.",
    summaryZh: "一个被悲伤困住的男人回到故乡，被迫面对无法愈合的过去。"
  },
  tt0110413: {
    title: "Leon: The Professional", titleZh: "这个杀手不太冷", category: "Movie", rating: "8.5", releaseDate: "1994",
    director: ["Luc Besson"], cast: ["Jean Reno", "Natalie Portman", "Gary Oldman", "Danny Aiello"],
    poster: "https://images.metahub.space/poster/medium/tt0110413/img",
    summary: "A professional hitman reluctantly takes in a young girl after her family is murdered.",
    summaryZh: "职业杀手Leon在女孩Mathilda全家遇害后收留了她，两人的命运从此相连。"
  },
  tt3315342: {
    title: "Logan", titleZh: "金刚狼3：殊死一战", category: "Movie", rating: "8.1", releaseDate: "2017",
    director: ["James Mangold"], cast: ["Hugh Jackman", "Patrick Stewart", "Dafne Keen", "Boyd Holbrook"],
    poster: "https://image.tmdb.org/t/p/original/5HB2SsrYNARm4Kom7Amwyb93O4M.jpg",
    summary: "An aging Logan protects a young mutant in a raw, western-like superhero farewell.",
    summaryZh: "年迈的罗根保护一名年轻变种人，这是一部粗粝、像西部片一样的告别。"
  }
};

const knownDoubanItems = {
  "30176393": {
    title: "Sheep Without a Shepherd", titleZh: "误杀", category: "Movie", rating: "7.5", ratingSource: "Douban", releaseDate: "2019",
    director: ["柯汶利"], directorEn: ["Sam Quah"], cast: ["肖央", "谭卓", "陈冲", "姜皓文"], castEn: ["Xiao Yang", "Tan Zhuo", "Joan Chen", "Philip Keung"],
    poster: "https://images.metahub.space/poster/medium/tt11210032/img",
    summary: "Li Weijie is forced into a spiraling cover-up to protect his family. Using what he has learned from crime films, he enters a tense psychological battle with the police as every detail threatens to expose the truth.",
    summaryZh: "李维杰为了保护家人，被迫卷入一场失控的掩盖与追查。他凭借从电影里学来的犯罪知识，与警方展开心理较量。"
  },
  "26580232": {
    title: "The Invisible Guest", titleZh: "看不见的客人", category: "Movie", rating: "8.8", ratingSource: "Douban", releaseDate: "2016",
    director: ["奥里奥尔·保罗"], directorEn: ["Oriol Paulo"], cast: ["马里奥·卡萨斯", "阿娜·瓦格纳", "何塞·科罗纳多", "芭芭拉·蓝妮"], castEn: ["Mario Casas", "Ana Wagener", "Jose Coronado", "Barbara Lennie"],
    poster: "https://images.metahub.space/poster/medium/tt4857264/img",
    summary: "A successful businessman is accused of murdering his lover. With time running out, he works with a seasoned defense adviser to piece the case back together, only to find that every small detail may turn the truth in a new direction.",
    summaryZh: "一名事业有成的商人被控谋杀情人，他与资深辩护顾问在有限时间内复盘案情，却发现每个细节都可能反转真相。"
  },
  "30334073": {
    title: "Andhadhun", titleZh: "调音师", category: "Movie", rating: "8.2", ratingSource: "Douban", releaseDate: "2018",
    director: ["斯里兰姆·拉格万"], directorEn: ["Sriram Raghavan"], cast: ["阿尤斯曼·库拉纳", "塔布", "拉迪卡·艾普特", "安尔·德霍万"], castEn: ["Ayushmann Khurrana", "Tabu", "Radhika Apte", "Anil Dhawan"],
    poster: "https://images.metahub.space/poster/medium/tt8108198/img",
    summary: "Akash, a pianist pretending to be blind, is accidentally pulled into a murder case. Lies, greed, and chance keep piling up around him, turning his life into an increasingly dangerous dark-comedy trap.",
    summaryZh: "假装失明的钢琴师阿卡什意外卷入一场谋杀案，谎言、贪念和偶然不断升级，让他陷入越来越危险的黑色喜剧迷局。"
  },
  "4942776": {
    title: "Dragon", titleZh: "武侠", category: "Movie", rating: "6.7", ratingSource: "Douban", releaseDate: "2011",
    director: ["陈可辛"], directorEn: ["Peter Chan"], cast: ["甄子丹", "金城武", "汤唯", "王羽", "惠英红"], castEn: ["Donnie Yen", "Takeshi Kaneshiro", "Tang Wei", "Jimmy Wang Yu", "Kara Wai"],
    poster: "https://images.metahub.space/poster/medium/tt1718199/img",
    summary: "In a border village in southwest China in 1917, Liu Jinxi becomes a local hero after unexpectedly killing two robbers. But detective Xu Baijiu grows suspicious, and as the investigation deepens, Jinxi's hidden identity and the danger facing the village begin to surface.",
    summaryZh: "1917年西南边陲，村民刘金喜意外击毙两名劫匪，却引来捕快徐百九的怀疑。随着调查深入，金喜隐藏的身份和村庄危机逐渐浮出水面。"
  }
};

const knownTitleAliases = {
  "sheep without a shepherd": "tt11210032",
  "误杀": "tt11210032",
  "the invisible guest": "tt4857264",
  "contratiempo": "tt4857264",
  "看不见的客人": "tt4857264",
  "andhadhun": "tt8108198",
  "调音师": "tt8108198",
  "rick and morty": "tt2861424",
  "瑞克和莫蒂": "tt2861424",
  "wu xia": "tt1718199",
  "wuxia": "tt1718199",
  "武侠": "tt1718199",
  "joker": "tt7286456",
  "小丑": "tt7286456",
  "the dark knight": "tt0468569",
  "dark knight": "tt0468569",
  "batman the dark knight": "tt0468569",
  "蝙蝠侠 黑暗骑士": "tt0468569",
  "蝙蝠侠：黑暗骑士": "tt0468569",
  "黑暗骑士": "tt0468569",
  "train to busan": "tt5700672",
  "釜山行": "tt5700672",
  "wall e": "tt0910970",
  "walle": "tt0910970",
  "机器人总动员": "tt0910970",
  "one battle after another": "tt30144839",
  "一战再战": "tt30144839",
  "howl s moving castle": "tt0347149",
  "howls moving castle": "tt0347149",
  "hauru no ugoku shiro": "tt0347149",
  "哈尔的移动城堡": "tt0347149",
  "哈尔移动城堡": "tt0347149",
  "project hail mary": "tt12042730",
  "挽救计划": "tt12042730",
  "the legend of 1900": "tt0120731",
  "legend of 1900": "tt0120731",
  "海上钢琴师": "tt0120731",
  "the godfather": "tt0068646",
  "教父": "tt0068646",
  "the walking dead": "tt1520211",
  "行尸走肉": "tt1520211",
  "13 reasons why": "tt1837492",
  "thirteen reasons why": "tt1837492",
  "十三个原因": "tt1837492",
  "money heist": "tt6468322",
  "la casa de papel": "tt6468322",
  "纸钞屋": "tt6468322",
  "stranger things": "tt4574334",
  "怪奇物语": "tt4574334",
  "manchester by the sea": "tt4034228",
  "海边的曼彻斯特": "tt4034228",
  "leon": "tt0110413",
  "leon the professional": "tt0110413",
  "léon": "tt0110413",
  "这个杀手不太冷": "tt0110413",
  "logan": "tt3315342",
  "金刚狼3": "tt3315342",
  "金刚狼3 殊死一战": "tt3315342",
  "金刚狼3：殊死一战": "tt3315342"
};

function getKnownIdFromTitle(value) {
  const key = String(value || "")
    .toLowerCase()
    .replace(/[：:]/g, " ")
    .replace(/[^\w\u4e00-\u9fff]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return knownTitleAliases[key] || "";
}

function getImdbId(value) {
  const match = String(value || "").match(/tt\d+/i);
  return match ? match[0].toLowerCase() : "";
}

function getDoubanId(value) {
  const match = String(value || "").match(/douban\.com\/subject\/(\d+)/i);
  return match ? match[1] : "";
}

function pageUrl(path) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${APP_VERSION}`;
}

function detailUrl(id) {
  return `details.html?id=${encodeURIComponent(id)}&v=${APP_VERSION}`;
}

function homeUrl() {
  return pageUrl("index.html");
}


function getKnownOnlineItem(item) {
  if (!item) return null;
  const infoUrl = String(item.infoUrl || "");
  const imdbFromUrl = getImdbId(infoUrl);
  if (infoUrl.includes("douban.com") && !imdbFromUrl) {
    return null;
  }
  return knownOnlineItems[
    imdbFromUrl ||
    getImdbId(item.id) ||
    getImdbId(item.title) ||
    getKnownIdFromTitle(item.title) ||
    getKnownIdFromTitle(item.displayTitle)
  ] || null;
}

function normalizeOnlineItem(item) {
  if (!item) return item;
  const doubanId = getDoubanId(item.infoUrl || item.sourceUrl || "");
  const knownDouban = doubanId ? knownDoubanItems[doubanId] : null;
  if (knownDouban) {
    return Object.assign({}, item, knownDouban, {
      id: "online-douban-" + doubanId,
      infoUrl: item.infoUrl || "https://movie.douban.com/subject/" + doubanId + "/",
      sourceUrl: item.sourceUrl || item.infoUrl || "https://movie.douban.com/subject/" + doubanId + "/",
      displayTitle: knownDouban.title,
      poster: item.poster || knownDouban.poster || "",
      posterOptions: item.posterOptions || knownDouban.posterOptions || [],
      posterLocked: Boolean(item.posterLocked),
      summary: item.summary || knownDouban.summary || "",
      folder: item.folder || "Online search",
      path: item.path || "",
      paths: item.paths || [],
      versions: item.versions || 0,
      episodes: item.episodes || [],
      seasonCount: item.seasonCount || 0
    });
  }
  const known = getKnownOnlineItem(item);
  if (!known) return item;
  return Object.assign({}, item, known, {
    id: item.id || "online-" + getImdbId(item.infoUrl),
    infoUrl: item.infoUrl || "https://www.imdb.com/title/" + getImdbId(item.id || item.title) + "/",
    displayTitle: known.title,
    poster: item.poster || known.poster || "",
    posterOptions: item.posterOptions || known.posterOptions || [],
    posterLocked: Boolean(item.posterLocked),
    summary: item.summary || known.summary || "",
    summaryZh: item.summaryZh || known.summaryZh || "",
    rating: item.rating || known.rating || "",
    releaseDate: item.releaseDate || known.releaseDate || "",
    director: item.director && item.director.length ? item.director : known.director || [],
    cast: item.cast && item.cast.length ? item.cast : known.cast || [],
    folder: item.folder || "Online search",
    path: item.path || "",
    paths: item.paths || [],
    versions: item.versions || 0,
    episodes: item.episodes || [],
    seasonCount: item.seasonCount || 0
  });
}

const metadataRules = [
  {
    match: /beaky|peaky/i,
    canonicalTitle: "Peaky Blinders",
    poster: "https://image.tmdb.org/t/p/original/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg",
    infoUrl: "https://www.imdb.com/title/tt2442560/",
    summary: "A stylish British crime epic centered on Tommy Shelby and the Peaky Blinders gang in post-war Birmingham.",
    moods: ["crime", "intense"]
  },
  {
    match: /breaking bad/i,
    canonicalTitle: "Breaking Bad",
    poster: "https://image.tmdb.org/t/p/original/2U0dZkcNjkZkMsUxsHo0KRxHzVX.jpg",
    infoUrl: "https://www.imdb.com/title/tt0903747/",
    summary: "Walter White, a chemistry teacher turned criminal mastermind, descends into the meth trade with Jesse Pinkman.",
    moods: ["crime", "intense"]
  },
  {
    match: /bettercallsaul|better call/i,
    canonicalTitle: "Better Call Saul",
    poster: "https://image.tmdb.org/t/p/original/zjg4jpK1Wp2kiRvtt5ND0kznako.jpg",
    infoUrl: "https://www.imdb.com/title/tt3032476/",
    summary: "Jimmy McGill transforms into Saul Goodman, the slippery criminal lawyer from the Breaking Bad universe.",
    moods: ["crime"]
  },
  {
    match: /the boys/i,
    canonicalTitle: "The Boys",
    poster: "https://image.tmdb.org/t/p/original/k2LRPGbN2yu5KPO9hQkZx9LXtYX.jpg",
    infoUrl: "https://www.imdb.com/title/tt1190634/",
    summary: "A violent superhero satire where Homelander and Vought twist celebrity power into something terrifying.",
    moods: ["intense"]
  },
  {
    match: /亢奋|euphoria/i,
    canonicalTitle: "Euphoria",
    poster: "https://image.tmdb.org/t/p/original/3Q0hd3heuWwDWpwcDkhQOA6TYWI.jpg",
    infoUrl: "https://www.imdb.com/title/tt8772296/",
    summary: "Rue and her classmates move through addiction, identity, friendship, desire, and chaos in a neon Gen-Z drama.",
    moods: ["intense"]
  },
  {
    match: /洛基|loki/i,
    canonicalTitle: "Loki",
    poster: "https://image.tmdb.org/t/p/original/3lLvpyxoGjUYQgtvyxP2XOGBCQi.jpg",
    infoUrl: "https://www.imdb.com/title/tt9140554/",
    summary: "Loki is pulled into the Time Variance Authority and forced into a surreal fight over timelines and identity.",
    moods: ["sci-fi"]
  },
  {
    match: /爱，死亡和机器人|love.*death.*robot/i,
    canonicalTitle: "Love, Death & Robots",
    poster: "https://image.tmdb.org/t/p/original/asDqvkE66EegtKJJXIRhBJPxscr.jpg",
    infoUrl: "https://www.imdb.com/title/tt9561862/",
    summary: "An animated anthology of sci-fi, fantasy, horror, violence, strange futures, and sharp visual experiments.",
    moods: ["sci-fi", "animation", "intense"]
  },
  {
    match: /^her(?:\s|$)/i,
    canonicalTitle: "Her",
    poster: "https://image.tmdb.org/t/p/original/wSJnfXvqSTJbN77gBTHVmwZnNMf.jpg",
    infoUrl: "https://www.imdb.com/title/tt1798709/",
    summary: "A lonely writer falls in love with Samantha, an advanced AI operating system, in Spike Jonze's intimate sci-fi romance.",
    moods: ["sci-fi", "comfort"]
  },
  {
    match: /birdman/i,
    canonicalTitle: "Birdman",
    poster: "https://media.themoviedb.org/t/p/w600_and_h900_bestv2/rHUg2AuIuLSIYMYFgavVwqt1jtc.jpg",
    infoUrl: "https://www.imdb.com/title/tt2562232/",
    summary: "An Oscar-winning dark comedy about a fading superhero actor trying to prove himself on Broadway.",
    moods: ["intense"]
  },
  {
    match: /blade runner 2049/i,
    canonicalTitle: "Blade Runner 2049",
    poster: "https://image.tmdb.org/t/p/original/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    infoUrl: "https://www.imdb.com/title/tt1856101/",
    summary: "A blade runner named K uncovers a secret that could reshape the future of humans and replicants.",
    moods: ["sci-fi", "intense"]
  },
  { match: /银翼杀手|blade runner/i, canonicalTitle: "Blade Runner", poster: "https://image.tmdb.org/t/p/original/zHKWxyG4j404HVeSYHNH4niUpkW.jpg", infoUrl: "https://www.imdb.com/title/tt0083658/", summary: "Ridley Scott's foundational neo-noir sci-fi film about replicants, memory, and what makes someone human.", moods: ["sci-fi", "intense"] },
  { match: /沙丘|dune/i, canonicalTitle: "Dune", poster: "https://image.tmdb.org/t/p/original/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", infoUrl: "https://www.imdb.com/title/tt1160419/", summary: "Paul Atreides is drawn into war, prophecy, and power on the desert planet Arrakis.", moods: ["sci-fi", "intense"] },
  { match: /降临|arrival/i, canonicalTitle: "Arrival", poster: "https://image.tmdb.org/t/p/original/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg", infoUrl: "https://www.imdb.com/title/tt2543164/", summary: "A linguist faces first contact with alien visitors in a meditative sci-fi story about language and time.", moods: ["sci-fi"] },
  { match: /黑客帝国$/, canonicalTitle: "The Matrix", poster: "https://image.tmdb.org/t/p/original/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", infoUrl: "https://www.imdb.com/title/tt0133093/", summary: "Neo discovers reality is a simulation and joins the fight against machine control.", moods: ["sci-fi", "intense"] },
  { match: /瞬息全宇宙/i, canonicalTitle: "Everything Everywhere All at Once", poster: "https://image.tmdb.org/t/p/original/u68AjlvlutfEIcpmbYpKcdi09ut.jpg", infoUrl: "https://www.imdb.com/title/tt6710474/", summary: "A laundromat owner is thrown into a multiverse adventure about family, regret, and possibility.", moods: ["sci-fi", "comfort"] },
  { match: /阿甘正传|forrest/i, canonicalTitle: "Forrest Gump", poster: "https://image.tmdb.org/t/p/original/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", infoUrl: "https://www.imdb.com/title/tt0109830/", summary: "Forrest Gump moves through American history with sincerity, chance, and an unforgettable life story.", moods: ["comfort"] },
  { match: /love actually/i, canonicalTitle: "Love Actually", poster: "https://image.tmdb.org/t/p/original/7QPeVsr9rcFU9Gl90yg0gTOTpVv.jpg", infoUrl: "https://www.imdb.com/title/tt0314331/", summary: "A Christmas ensemble romance following many kinds of love across London.", moods: ["comfort"] },
  { match: /notebook/i, canonicalTitle: "The Notebook", poster: "https://image.tmdb.org/t/p/original/qom1SZSENdmHFNZBXbtJAU0WTlC.jpg", infoUrl: "https://www.imdb.com/title/tt0332280/", summary: "A sweeping romantic drama about memory, devotion, and a love that lasts across decades.", moods: ["comfort"] },
  { match: /pulp fiction|低俗小说/i, canonicalTitle: "Pulp Fiction", poster: "https://image.tmdb.org/t/p/original/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", infoUrl: "https://www.imdb.com/title/tt0110912/", summary: "Quentin Tarantino's nonlinear crime classic of hitmen, boxers, diners, and bad decisions.", moods: ["crime", "intense"] },
  { match: /reservoir dogs/i, canonicalTitle: "Reservoir Dogs", poster: "https://image.tmdb.org/t/p/original/xi8Iu6qyTfyZVDVy60raIOYJJmk.jpg", infoUrl: "https://www.imdb.com/title/tt0105236/", summary: "A botched robbery tears apart a crew of criminals who suspect one of them is an undercover cop.", moods: ["crime", "intense"] },
  { match: /疾速追杀4|john wick.*4|chapter 4/i, canonicalTitle: "John Wick: Chapter 4", poster: "https://image.tmdb.org/t/p/original/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", infoUrl: "https://www.imdb.com/title/tt10366206/", summary: "John Wick takes his fight against the High Table across the world in a brutal final gauntlet.", moods: ["crime", "intense"] },
  { match: /疾速追杀3|john wick.*3|parabellum/i, canonicalTitle: "John Wick: Chapter 3 - Parabellum", poster: "https://image.tmdb.org/t/p/original/ziEuG1essDuWuC5lpWUaw1uXY2O.jpg", infoUrl: "https://www.imdb.com/title/tt6146586/", summary: "John Wick is excommunicated and hunted by assassins after breaking the Continental's rules.", moods: ["crime", "intense"] },
  { match: /疾速追杀2|john wick.*2|chapter 2/i, canonicalTitle: "John Wick: Chapter 2", poster: "https://image.tmdb.org/t/p/original/r687UV1zQ5KDB9AxRokRscWIRvt.jpg", infoUrl: "https://www.imdb.com/title/tt4425200/", summary: "John Wick is pulled back into the assassin world by a blood oath and a dangerous Rome contract.", moods: ["crime", "intense"] },
  { match: /john wick|疾速追杀/i, canonicalTitle: "John Wick", poster: "https://image.tmdb.org/t/p/original/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg", infoUrl: "https://www.imdb.com/title/tt2911666/", summary: "A retired assassin is dragged back into the underworld he left behind.", moods: ["crime", "intense"] },
  { match: /你的名字/i, canonicalTitle: "Your Name", poster: "https://image.tmdb.org/t/p/original/q719jXXEzOoYaps6babgKnONONX.jpg", infoUrl: "https://www.imdb.com/title/tt5311514/", summary: "Two teenagers mysteriously swap bodies across distance and fate in Makoto Shinkai's romantic fantasy.", moods: ["animation", "comfort"] },
  { match: /天气之子/i, canonicalTitle: "Weathering with You", poster: "https://image.tmdb.org/t/p/original/qgrk7r1fV4IjuoeiGS5HOhXNdLJ.jpg", infoUrl: "https://www.imdb.com/title/tt9426210/", summary: "A runaway boy meets a girl who can change the weather in a rain-soaked Tokyo fantasy.", moods: ["animation", "comfort"] },
  { match: /进击的巨人|attack on titan/i, canonicalTitle: "Attack on Titan", poster: "https://image.tmdb.org/t/p/original/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg", infoUrl: "https://www.imdb.com/title/tt2560140/", summary: "Humanity fights for survival behind walls against giant man-eating Titans.", moods: ["animation", "intense"] },
,
  { match: /inglourious/i, canonicalTitle: "Inglourious Basterds", poster: "https://image.tmdb.org/t/p/original/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg", infoUrl: "https://www.imdb.com/title/tt0361748/", summary: "Tarantino's alternate-history WWII revenge film about a squad hunting Nazis and a cinema owner plotting payback.", moods: ["intense"] },
  { match: /sinners/i, canonicalTitle: "Sinners", poster: "https://image.tmdb.org/t/p/original/jYfMTSiFFK7ffbY2lay4zyvTkEk.jpg", infoUrl: "https://www.imdb.com/title/tt31193180/", summary: "A supernatural Southern gothic thriller about twin brothers returning home and facing a terrifying evil.", moods: ["intense"] },
  { match: /hateful eight/i, canonicalTitle: "The Hateful Eight", poster: "https://image.tmdb.org/t/p/original/jIywvdPjia2t3eKYbjVTcwBQlG8.jpg", infoUrl: "https://www.imdb.com/title/tt3460252/", summary: "Eight dangerous strangers are trapped together during a blizzard in Tarantino's chamber-piece western.", moods: ["intense"] },
  { match: /亡命驾驶|drive/i, canonicalTitle: "Drive", poster: "https://image.tmdb.org/t/p/original/602vevIURmpDfzbnv5Ubi6wIkQm.jpg", infoUrl: "https://www.imdb.com/title/tt0780504/", summary: "A quiet Hollywood stunt driver and getaway driver is pulled into a violent criminal spiral.", moods: ["crime", "intense"] },
  { match: /指环王1|护戒/i, canonicalTitle: "The Lord of the Rings: The Fellowship of the Ring", poster: "https://image.tmdb.org/t/p/original/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", infoUrl: "https://www.imdb.com/title/tt0120737/", summary: "Frodo begins the journey to destroy the One Ring with the Fellowship at his side.", moods: ["comfort"] },
  { match: /指环王2|双塔/i, canonicalTitle: "The Lord of the Rings: The Two Towers", poster: "https://image.tmdb.org/t/p/original/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg", infoUrl: "https://www.imdb.com/title/tt0167261/", summary: "The Fellowship is divided as war grows across Middle-earth.", moods: ["comfort", "intense"] },
  { match: /指环王3|王者/i, canonicalTitle: "The Lord of the Rings: The Return of the King", poster: "https://image.tmdb.org/t/p/original/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg", infoUrl: "https://www.imdb.com/title/tt0167260/", summary: "The final battle for Middle-earth unfolds as Frodo reaches Mordor.", moods: ["comfort", "intense"] },
  { match: /无间道2/i, canonicalTitle: "Infernal Affairs II", poster: "https://image.tmdb.org/t/p/original/q9MCjc4CMXju59slJEzYEtr7F3W.jpg", infoUrl: "https://www.imdb.com/title/tt0369060/", summary: "A prequel expanding the police and triad world of Infernal Affairs.", moods: ["crime"] },
  { match: /无间道3/i, canonicalTitle: "Infernal Affairs III", poster: "https://image.tmdb.org/t/p/original/kXTHj16K8Lr1EgwdzuzAB1j4Cy5.jpg", infoUrl: "https://www.imdb.com/title/tt0374339/", summary: "The concluding chapter follows the aftermath of betrayal and identity in the Infernal Affairs saga.", moods: ["crime"] },
  { match: /无间道/i, canonicalTitle: "Infernal Affairs", poster: "https://image.tmdb.org/t/p/original/gix9thDBXfjJ8M7rYbihqbQGBcP.jpg", infoUrl: "https://www.imdb.com/title/tt0338564/", summary: "A police mole and a triad mole race to discover each other's identity in Hong Kong.", moods: ["crime", "intense"] },
  { match: /杀死比尔2/i, canonicalTitle: "Kill Bill: Vol. 2", poster: "https://image.tmdb.org/t/p/original/2yhg0mZQMhDyvUQ4rG1IZ4oIA8L.jpg", infoUrl: "https://www.imdb.com/title/tt0378194/", summary: "The Bride continues her revenge journey toward Bill.", moods: ["intense"] },
  { match: /杀死比尔/i, canonicalTitle: "Kill Bill: Vol. 1", poster: "https://image.tmdb.org/t/p/original/v7TaX8kXMXs5yFFGR41guUDNcnB.jpg", infoUrl: "https://www.imdb.com/title/tt0266697/", summary: "The Bride wakes from a coma and begins a blood-soaked revenge campaign.", moods: ["intense"] },
  { match: /某种物质|substance/i, canonicalTitle: "The Substance", poster: "https://image.tmdb.org/t/p/original/lqoMzCcZYEFK729d6qzt349fB4o.jpg", infoUrl: "https://www.imdb.com/title/tt17526714/", summary: "A fading celebrity takes a body-horror drug promising a younger, better self.", moods: ["intense"] },
  { match: /海边的曼彻斯特|manchester/i, canonicalTitle: "Manchester by the Sea", poster: "https://image.tmdb.org/t/p/original/e8daDzP0vFOnGyKmve95Yv0D0io.jpg", infoUrl: "https://www.imdb.com/title/tt4034228/", summary: "A grieving man returns home after a family tragedy and confronts a painful past.", moods: ["intense"] },
  { match: /^saw$|电锯惊魂/i, canonicalTitle: "Saw", poster: "https://image.tmdb.org/t/p/original/4da0TS3iQ1IzuyhDS8elgkmOfrN.jpg", infoUrl: "https://www.imdb.com/title/tt0387564/", summary: "Two men wake chained in a room as a sadistic game of survival begins.", moods: ["intense"] },
  { match: /疯狂的麦克斯|mad max/i, canonicalTitle: "Mad Max: Fury Road", poster: "https://upload.wikimedia.org/wikipedia/en/6/6e/Mad_Max_Fury_Road.jpg", infoUrl: "https://www.imdb.com/title/tt1392190/", summary: "Furiosa and Max tear across the wasteland in one of modern cinema's great action spectacles.", moods: ["intense"] },
  { match: /看见恶魔|saw the devil/i, canonicalTitle: "I Saw the Devil", poster: "https://image.tmdb.org/t/p/original/zp5NrmYp80axIGiEiYPmm1CW6uH.jpg", infoUrl: "https://www.imdb.com/title/tt1588170/", summary: "A secret agent hunts a serial killer in a brutal Korean revenge thriller.", moods: ["crime", "intense"] },
  { match: /美国往事/i, canonicalTitle: "Once Upon a Time in America", poster: "https://image.tmdb.org/t/p/original/i0enkzsL5dPeneWnjl1fCWm6L7k.jpg", infoUrl: "https://www.imdb.com/title/tt0087843/", summary: "Sergio Leone's sweeping gangster epic about friendship, memory, betrayal, and time.", moods: ["crime"] },
  { match: /致命ID|identity/i, canonicalTitle: "Identity", poster: "https://image.tmdb.org/t/p/original/jSSgqRcLaDLh56t5ko1ywAKq0q9.jpg", infoUrl: "https://www.imdb.com/title/tt0309698/", summary: "Strangers trapped at a motel are killed one by one in a psychological mystery thriller.", moods: ["crime", "intense"] },
  { match: /被解救的姜戈|django/i, canonicalTitle: "Django Unchained", poster: "https://image.tmdb.org/t/p/original/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg", infoUrl: "https://www.imdb.com/title/tt1853728/", summary: "A freed slave joins a bounty hunter to rescue his wife from a brutal plantation owner.", moods: ["intense"] },
  { match: /金刚狼3|logan/i, canonicalTitle: "Logan", poster: "https://image.tmdb.org/t/p/original/5HB2SsrYNARm4Kom7Amwyb93O4M.jpg", infoUrl: "https://www.imdb.com/title/tt3315342/", summary: "An aging Logan protects a young mutant in a raw, western-like superhero farewell.", moods: ["intense"] },
  { match: /阿修罗/i, canonicalTitle: "Asura: The City of Madness", poster: "https://image.tmdb.org/t/p/original/vJmSw2QFvX5vqdGQSBGe1x7HEcJ.jpg", infoUrl: "https://www.imdb.com/title/tt5918028/", summary: "A corrupt detective is squeezed between a vicious mayor and prosecutors in a Korean crime thriller.", moods: ["crime", "intense"] },
  { match: /雷霆特攻队|thunderbolts/i, canonicalTitle: "Thunderbolts*", poster: "https://image.tmdb.org/t/p/original/zctISSBEZRgVQPG178HqRJMnc4x.jpg", infoUrl: "https://www.imdb.com/title/tt20969586/", summary: "A group of antiheroes is pushed into a dangerous mission in the Marvel universe.", moods: ["intense"] },
  { match: /黄海|yellow sea/i, canonicalTitle: "The Yellow Sea", poster: "https://image.tmdb.org/t/p/original/16Pkg2ChCdACbBKVIAPAZtLL6eb.jpg", infoUrl: "https://www.imdb.com/title/tt1230385/", summary: "A desperate cab driver is sent from China to Korea for a deadly mission.", moods: ["crime", "intense"] },
  { match: /黑客帝国2|重装上阵/i, canonicalTitle: "The Matrix Reloaded", poster: "https://image.tmdb.org/t/p/original/9TGHDvWrqKBzwDxDodHYXEmOE6J.jpg", infoUrl: "https://www.imdb.com/title/tt0234215/", summary: "Neo, Trinity, and Morpheus continue the war against the machines as Zion faces destruction.", moods: ["sci-fi", "intense"] },
  { match: /黑客帝国3|矩阵革命/i, canonicalTitle: "The Matrix Revolutions", poster: "https://image.tmdb.org/t/p/original/qEWiBXJGXK28jGBAm8oFKKTB0WD.jpg", infoUrl: "https://www.imdb.com/title/tt0242653/", summary: "The Matrix trilogy reaches its machine-war conclusion.", moods: ["sci-fi", "intense"] },
  { match: /5 centimeters/i, canonicalTitle: "5 Centimeters per Second", poster: "https://image.tmdb.org/t/p/original/dFipUR6W0y3PPkuVS8gjFd929m2.jpg", infoUrl: "https://www.imdb.com/title/tt0983213/", summary: "Makoto Shinkai's quiet triptych about distance, memory, and young love drifting apart.", moods: ["animation", "comfort"] },
  { match: /darling/i, canonicalTitle: "Darling in the Franxx", poster: "https://image.tmdb.org/t/p/original/yyUxeNpQoD23XWEdPXLJRGQEtHT.jpg", infoUrl: "https://www.imdb.com/title/tt7865090/", summary: "Teen pilots fight in giant mecha while discovering identity, desire, and rebellion.", moods: ["animation", "sci-fi"] },
  { match: /言叶之庭/i, canonicalTitle: "The Garden of Words", poster: "https://image.tmdb.org/t/p/original/mXUCVq3HMtS4Y9IQ8vmEOPyN0vH.jpg", infoUrl: "https://www.imdb.com/title/tt2591814/", summary: "A student and an older woman meet during rainy mornings in a Tokyo garden.", moods: ["animation", "comfort"] },
  { match: /假如|what if/i, canonicalTitle: "What If...?", poster: "https://image.tmdb.org/t/p/original/lztz5XBMG1x6Y5ubz7CxfPFsAcW.jpg", infoUrl: "https://www.imdb.com/title/tt10168312/", summary: "Marvel stories are remixed across alternate animated timelines.", moods: ["animation", "sci-fi"] },
  { match: /蜘蛛侠|spider/i, canonicalTitle: "Spider-Man: Into the Spider-Verse", poster: "https://image.tmdb.org/t/p/original/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg", infoUrl: "https://www.imdb.com/title/tt4633694/", summary: "Miles Morales becomes Spider-Man and meets heroes from across the multiverse in a kinetic animated landmark.", moods: ["animation", "comfort"] }];


const zhTitleRules = [
  { match: /peaky|beaky/i, title: "浴血黑帮" },
  { match: /breaking bad/i, title: "绝命毒师" },
  { match: /bettercallsaul|better call/i, title: "风骚律师" },
  { match: /the boys/i, title: "黑袍纠察队" },
  { match: /亢奋|euphoria/i, title: "亢奋" },
  { match: /洛基|loki/i, title: "洛基" },
  { match: /爱，死亡和机器人|love.*death.*robot/i, title: "爱，死亡和机器人" },
  { match: /^her(?:\s|$)/i, title: "她" },
  { match: /birdman/i, title: "鸟人" },
  { match: /blade runner 2049/i, title: "银翼杀手2049" },
  { match: /银翼杀手|blade runner/i, title: "银翼杀手" },
  { match: /沙丘|dune/i, title: "沙丘" },
  { match: /降临|arrival/i, title: "降临" },
  { match: /黑客帝国2|reloaded/i, title: "黑客帝国2：重装上阵" },
  { match: /黑客帝国3|revolutions/i, title: "黑客帝国3：矩阵革命" },
  { match: /黑客帝国|matrix/i, title: "黑客帝国" },
  { match: /瞬息全宇宙|everything everywhere/i, title: "瞬息全宇宙" },
  { match: /阿甘正传|forrest/i, title: "阿甘正传" },
  { match: /love actually/i, title: "真爱至上" },
  { match: /notebook/i, title: "恋恋笔记本" },
  { match: /pulp fiction|低俗小说/i, title: "低俗小说" },
  { match: /reservoir dogs/i, title: "落水狗" },
  { match: /疾速追杀4|john wick.*4|chapter 4/i, title: "疾速追杀4" },
  { match: /疾速追杀3|john wick.*3|parabellum/i, title: "疾速追杀3" },
  { match: /疾速追杀2|john wick.*2|chapter 2/i, title: "疾速追杀2" },
  { match: /john wick|疾速追杀/i, title: "疾速追杀" },
  { match: /你的名字|your name/i, title: "你的名字" },
  { match: /天气之子|weathering/i, title: "天气之子" },
  { match: /进击的巨人|attack on titan/i, title: "进击的巨人" },
  { match: /inglourious/i, title: "无耻混蛋" },
  { match: /sinners/i, title: "罪人" },
  { match: /hateful eight/i, title: "八恶人" },
  { match: /亡命驾驶|drive/i, title: "亡命驾驶" },
  { match: /指环王1|护戒|fellowship/i, title: "指环王1：护戒使者" },
  { match: /指环王2|双塔|two towers/i, title: "指环王2：双塔奇兵" },
  { match: /指环王3|王者|return of the king/i, title: "指环王3：王者无敌" },
  { match: /无间道2|infernal affairs ii/i, title: "无间道2" },
  { match: /无间道3|infernal affairs iii/i, title: "无间道3" },
  { match: /无间道|infernal affairs/i, title: "无间道" },
  { match: /杀死比尔2|kill bill.*2/i, title: "杀死比尔2" },
  { match: /杀死比尔|kill bill/i, title: "杀死比尔" },
  { match: /某种物质|substance/i, title: "某种物质" },
  { match: /海边的曼彻斯特|manchester/i, title: "海边的曼彻斯特" },
  { match: /^saw$|电锯惊魂/i, title: "电锯惊魂" },
  { match: /疯狂的麦克斯|mad max/i, title: "疯狂的麦克斯4：狂暴之路" },
  { match: /看见恶魔|saw the devil/i, title: "看见恶魔" },
  { match: /美国往事|once upon a time in america/i, title: "美国往事" },
  { match: /致命ID|identity/i, title: "致命ID" },
  { match: /被解救的姜戈|django/i, title: "被解救的姜戈" },
  { match: /金刚狼3|logan/i, title: "金刚狼3：殊死一战" },
  { match: /阿修罗|asura/i, title: "阿修罗" },
  { match: /雷霆特攻队|thunderbolts/i, title: "雷霆特攻队*" },
  { match: /黄海|yellow sea/i, title: "黄海" },
  { match: /5 centimeters/i, title: "秒速五厘米" },
  { match: /darling/i, title: "DARLING in the FRANXX" },
  { match: /言叶之庭|garden of words/i, title: "言叶之庭" },
  { match: /假如|what if/i, title: "假如…？" },
  { match: /蜘蛛侠|spider/i, title: "蜘蛛侠：平行宇宙" }
];


const factRules = [
  { match: /peaky|beaky/i, rating: "8.7", releaseDate: "2013", director: ["Steven Knight"], cast: ["Cillian Murphy", "Paul Anderson", "Sophie Rundle"] },
  { match: /breaking bad/i, rating: "9.5", releaseDate: "2008", director: ["Vince Gilligan"], cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn"] },
  { match: /bettercallsaul|better call/i, rating: "9.0", releaseDate: "2015", director: ["Vince Gilligan", "Peter Gould"], cast: ["Bob Odenkirk", "Rhea Seehorn", "Jonathan Banks"] },
  { match: /the boys/i, rating: "8.6", releaseDate: "2019", director: ["Eric Kripke"], cast: ["Karl Urban", "Jack Quaid", "Antony Starr"] },
  { match: /亢奋|euphoria/i, rating: "8.3", releaseDate: "2019", director: ["Sam Levinson"], cast: ["Zendaya", "Hunter Schafer", "Sydney Sweeney"] },
  { match: /洛基|loki/i, rating: "8.2", releaseDate: "2021", director: ["Michael Waldron"], cast: ["Tom Hiddleston", "Sophia Di Martino", "Owen Wilson"] },
  { match: /爱，死亡和机器人|love.*death.*robot/i, rating: "8.4", releaseDate: "2019", director: ["Tim Miller"], cast: ["Fred Tatasciore", "Scott Whyte", "Nolan North"] },
  { match: /^her(?:\s|$)/i, rating: "8.0", releaseDate: "2013", director: ["Spike Jonze"], cast: ["Joaquin Phoenix", "Scarlett Johansson", "Amy Adams"] },
  { match: /birdman/i, rating: "7.7", releaseDate: "2014", director: ["Alejandro G. Inarritu"], cast: ["Michael Keaton", "Zach Galifianakis", "Edward Norton"] },
  { match: /blade runner 2049/i, rating: "8.0", releaseDate: "2017", director: ["Denis Villeneuve"], cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas"] },
  { match: /银翼杀手|blade runner/i, rating: "8.1", releaseDate: "1982", director: ["Ridley Scott"], cast: ["Harrison Ford", "Rutger Hauer", "Sean Young"] },
  { match: /沙丘|dune/i, rating: "8.0", releaseDate: "2021", director: ["Denis Villeneuve"], cast: ["Timothee Chalamet", "Rebecca Ferguson", "Zendaya"] },
  { match: /降临|arrival/i, rating: "7.9", releaseDate: "2016", director: ["Denis Villeneuve"], cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker"] },
  { match: /黑客帝国2|重装上阵/i, rating: "7.2", releaseDate: "2003", director: ["Lana Wachowski", "Lilly Wachowski"], cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"] },
  { match: /黑客帝国3|矩阵革命/i, rating: "6.7", releaseDate: "2003", director: ["Lana Wachowski", "Lilly Wachowski"], cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"] },
  { match: /黑客帝国$|the matrix$/i, rating: "8.7", releaseDate: "1999", director: ["Lana Wachowski", "Lilly Wachowski"], cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"] },
  { match: /瞬息全宇宙|everything everywhere/i, rating: "7.8", releaseDate: "2022", director: ["Daniel Kwan", "Daniel Scheinert"], cast: ["Michelle Yeoh", "Ke Huy Quan", "Stephanie Hsu"] },
  { match: /阿甘正传|forrest/i, rating: "8.8", releaseDate: "1994", director: ["Robert Zemeckis"], cast: ["Tom Hanks", "Robin Wright", "Gary Sinise"] },
  { match: /love actually/i, rating: "7.6", releaseDate: "2003", director: ["Richard Curtis"], cast: ["Hugh Grant", "Liam Neeson", "Emma Thompson"] },
  { match: /notebook/i, rating: "7.8", releaseDate: "2004", director: ["Nick Cassavetes"], cast: ["Ryan Gosling", "Rachel McAdams", "Gena Rowlands"] },
  { match: /pulp fiction|低俗小说/i, rating: "8.9", releaseDate: "1994", director: ["Quentin Tarantino"], cast: ["John Travolta", "Uma Thurman", "Samuel L. Jackson"] },
  { match: /reservoir dogs/i, rating: "8.3", releaseDate: "1992", director: ["Quentin Tarantino"], cast: ["Harvey Keitel", "Tim Roth", "Michael Madsen"] },
  { match: /疾速追杀4|john wick.*4|chapter 4/i, rating: "7.7", releaseDate: "2023", director: ["Chad Stahelski"], cast: ["Keanu Reeves", "Donnie Yen", "Bill Skarsgard"] },
  { match: /疾速追杀3|john wick.*3|parabellum/i, rating: "7.4", releaseDate: "2019", director: ["Chad Stahelski"], cast: ["Keanu Reeves", "Halle Berry", "Ian McShane"] },
  { match: /疾速追杀2|john wick.*2|chapter 2/i, rating: "7.4", releaseDate: "2017", director: ["Chad Stahelski"], cast: ["Keanu Reeves", "Common", "Laurence Fishburne"] },
  { match: /john wick|疾速追杀/i, rating: "7.4", releaseDate: "2014", director: ["Chad Stahelski", "David Leitch"], cast: ["Keanu Reeves", "Michael Nyqvist", "Alfie Allen"] },
  { match: /你的名字|your name/i, rating: "8.4", releaseDate: "2016", director: ["Makoto Shinkai"], cast: ["Ryunosuke Kamiki", "Mone Kamishiraishi", "Ryo Narita"] },
  { match: /天气之子|weathering/i, rating: "7.5", releaseDate: "2019", director: ["Makoto Shinkai"], cast: ["Kotaro Daigo", "Nana Mori", "Shun Oguri"] },
  { match: /进击的巨人|attack on titan/i, rating: "9.1", releaseDate: "2013", director: ["Hajime Isayama"], cast: ["Yuki Kaji", "Yui Ishikawa", "Marina Inoue"] },
  { match: /inglourious/i, rating: "8.4", releaseDate: "2009", director: ["Quentin Tarantino"], cast: ["Brad Pitt", "Diane Kruger", "Christoph Waltz"] },
  { match: /sinners/i, rating: "7.6", releaseDate: "2025", director: ["Ryan Coogler"], cast: ["Michael B. Jordan", "Miles Caton", "Hailee Steinfeld"] },
  { match: /hateful eight/i, rating: "7.8", releaseDate: "2015", director: ["Quentin Tarantino"], cast: ["Samuel L. Jackson", "Kurt Russell", "Jennifer Jason Leigh"] },
  { match: /亡命驾驶|drive/i, rating: "7.8", releaseDate: "2011", director: ["Nicolas Winding Refn"], cast: ["Ryan Gosling", "Carey Mulligan", "Bryan Cranston"] },
  { match: /指环王1|护戒|fellowship/i, rating: "8.9", releaseDate: "2001", director: ["Peter Jackson"], cast: ["Elijah Wood", "Ian McKellen", "Viggo Mortensen"] },
  { match: /指环王2|双塔|two towers/i, rating: "8.8", releaseDate: "2002", director: ["Peter Jackson"], cast: ["Elijah Wood", "Ian McKellen", "Viggo Mortensen"] },
  { match: /指环王3|王者|return of the king/i, rating: "9.0", releaseDate: "2003", director: ["Peter Jackson"], cast: ["Elijah Wood", "Viggo Mortensen", "Ian McKellen"] },
  { match: /无间道2|infernal affairs ii/i, rating: "7.3", releaseDate: "2003", director: ["Andrew Lau", "Alan Mak"], cast: ["Anthony Wong", "Eric Tsang", "Carina Lau"] },
  { match: /无间道3|infernal affairs iii/i, rating: "6.8", releaseDate: "2003", director: ["Andrew Lau", "Alan Mak"], cast: ["Tony Leung", "Andy Lau", "Leon Lai"] },
  { match: /无间道|infernal affairs/i, rating: "8.0", releaseDate: "2002", director: ["Andrew Lau", "Alan Mak"], cast: ["Andy Lau", "Tony Leung", "Anthony Wong"] },
  { match: /杀死比尔2|kill bill.*2/i, rating: "8.0", releaseDate: "2004", director: ["Quentin Tarantino"], cast: ["Uma Thurman", "David Carradine", "Michael Madsen"] },
  { match: /杀死比尔|kill bill/i, rating: "8.2", releaseDate: "2003", director: ["Quentin Tarantino"], cast: ["Uma Thurman", "Lucy Liu", "Vivica A. Fox"] },
  { match: /某种物质|substance/i, rating: "7.3", releaseDate: "2024", director: ["Coralie Fargeat"], cast: ["Demi Moore", "Margaret Qualley", "Dennis Quaid"] },
  { match: /海边的曼彻斯特|manchester/i, rating: "7.8", releaseDate: "2016", director: ["Kenneth Lonergan"], cast: ["Casey Affleck", "Michelle Williams", "Kyle Chandler"] },
  { match: /^saw$|电锯惊魂/i, rating: "7.6", releaseDate: "2004", director: ["James Wan"], cast: ["Cary Elwes", "Leigh Whannell", "Danny Glover"] },
  { match: /疯狂的麦克斯|mad max/i, rating: "8.1", releaseDate: "2015", director: ["George Miller"], cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult"] },
  { match: /看见恶魔|saw the devil/i, rating: "7.8", releaseDate: "2010", director: ["Kim Jee-woon"], cast: ["Lee Byung-hun", "Choi Min-sik", "Jeon Gook-hwan"] },
  { match: /美国往事|once upon a time in america/i, rating: "8.3", releaseDate: "1984", director: ["Sergio Leone"], cast: ["Robert De Niro", "James Woods", "Elizabeth McGovern"] },
  { match: /致命ID|identity/i, rating: "7.3", releaseDate: "2003", director: ["James Mangold"], cast: ["John Cusack", "Ray Liotta", "Amanda Peet"] },
  { match: /被解救的姜戈|django/i, rating: "8.5", releaseDate: "2012", director: ["Quentin Tarantino"], cast: ["Jamie Foxx", "Christoph Waltz", "Leonardo DiCaprio"] },
  { match: /金刚狼3|logan/i, rating: "8.1", releaseDate: "2017", director: ["James Mangold"], cast: ["Hugh Jackman", "Patrick Stewart", "Dafne Keen"] },
  { match: /阿修罗|asura/i, rating: "6.6", releaseDate: "2016", director: ["Kim Sung-su"], cast: ["Jung Woo-sung", "Hwang Jung-min", "Ju Ji-hoon"] },
  { match: /雷霆特攻队|thunderbolts/i, rating: "7.2", releaseDate: "2025", director: ["Jake Schreier"], cast: ["Florence Pugh", "Sebastian Stan", "David Harbour"] },
  { match: /黄海|yellow sea/i, rating: "7.3", releaseDate: "2010", director: ["Na Hong-jin"], cast: ["Ha Jung-woo", "Kim Yoon-seok", "Cho Seong-ha"] },
  { match: /5 centimeters/i, rating: "7.5", releaseDate: "2007", director: ["Makoto Shinkai"], cast: ["Kenji Mizuhashi", "Yoshimi Kondo", "Satomi Hanamura"] },
  { match: /darling/i, rating: "7.3", releaseDate: "2018", director: ["Atsushi Nishigori"], cast: ["Yuto Uemura", "Haruka Tomatsu", "Kana Ichinose"] },
  { match: /言叶之庭|garden of words/i, rating: "7.4", releaseDate: "2013", director: ["Makoto Shinkai"], cast: ["Miyu Irino", "Kana Hanazawa", "Fumi Hirano"] },
  { match: /假如|what if/i, rating: "7.4", releaseDate: "2021", director: ["A.C. Bradley"], cast: ["Jeffrey Wright", "Hayley Atwell", "Josh Keaton"] },
  { match: /蜘蛛侠|spider/i, rating: "8.4", releaseDate: "2018", director: ["Bob Persichetti", "Peter Ramsey", "Rodney Rothman"], cast: ["Shameik Moore", "Jake Johnson", "Hailee Steinfeld"] }
];

const uiText = {
  en: {
    brand: "Watch Vault",
    languageButton: "Language",
    themeButton: "Theme",
    watchlist: "Watchlist",
    addShow: "Add Show",
    library: "Watch Vault",
    searchPlaceholder: "Search your library...",
    all: "All",
    movies: "Movies",
    tvSeries: "TV Series",
    animation: "Animation",
    surprise: "Surprise me",
    refresh: "Refresh picks",
    cleanTitles: "Clean titles",
    shows: "Shows",
    recommendation: "Recommendation",
    startHere: "Start here",
    filmShelf: "Film shelf",
    seriesShelf: "Series shelf",
    animationShelf: "Animation shelf",
    backToSearch: "Back to search",
    footerLeft: "Private local collection page",
    footerRight: "Saved library · watchlist · local ratings",
    waitingRoom: "Waiting room",
    clearWatchlist: "Clear watchlist",
    emptyWatchlist: "Your watchlist is empty. Add something from the library or use Add Show.",
    notRated: "not rated yet",
    watched: "Watched",
    details: "Details",
    waitingNote: "Waiting for the right night.",
    addSearchTitle: "Search online",
    addSearchLabel: "Movie, TV series, animation name or IMDb/Douban link",
    addPlaceholder: "Try Blade Runner 2049, Pulp Fiction, 5 Centimeters per Second, or paste an IMDb/Douban link...",
    findAndAdd: "Find match",
    addHint: "Searches online and shows a preview first. Nothing is saved until you confirm.",
    searching: "Searching online...",
    addedToWatchlist: "added to Watch Vault",
    searchFailed: "Search failed. Try the official English title, add the year, or check that Watch Vault was opened through the launcher.",
    backHome: "Back home",
    category: "Category",
    loading: "Loading...",
    loadingInfo: "Loading public info...",
    addToWatchlist: "Add to watchlist",
    added: "Added to watchlist",
    watchNow: "Watch now",
    infoPage: "Info page",
    yourRating: "Your rating",
    folder: "Folder",
    filesGrouped: "Files grouped",
    recommendationReason: "Recommendation reason",
    localItem: "Local item from your personal collection.",
    manual: "Manual",
    manualItem: "Manual item",
    movieReason: "Grouped as a movie and deduplicated when multiple file versions share the same clean title.",
    showReason: "Grouped as a series so repeated episodes do not flood the front page.",
    animationReason: "Grouped from your animation/anime folders, cleaned into one title where possible.",
    noMatch: "No items match this search.",
    seasons: "Seasons",
    season: "Season",
    watchAvailable: "Watch available",
    imdbRating: "IMDb",
    release: "Released",
    director: "Director",
    cast: "Cast",
    imdbLoading: "IMDb info loading",
    editLibrary: "Edit Library",
    doneEditing: "Done",
    dragHint: "Long press and drag cards to reorder.",
    moveUp: "Up",
    moveDown: "Down",
    deleteItem: "Delete",
    changePassword: "Change password",
    deleteConfirm: "Delete this item from Watch Vault?",
    setDeletePasswordPrompt: "Create a delete password first. You will need it for future deletes.",
    deletePasswordPrompt: "Enter delete password",
    currentPasswordPrompt: "Enter current password",
    newPasswordPrompt: "Enter new password",
    passwordCreated: "Delete password saved in this browser.",
    passwordChanged: "Password changed.",
    wrongPassword: "Wrong password.",
    confirmAddHint: "Review this match before adding it to your vault.",
    confirmedAddHint: "added to Watch Vault",
    backToTop: "Back to top",
    posterPicker: "Choose poster",
    posterUrlPlaceholder: "Paste another poster image URL",
    usePosterUrl: "Use poster"
  },
  zh: {
    brand: "影视库",
    languageButton: "English",
    themeButton: "主题",
    watchlist: "稍后观看",
    addShow: "添加片单",
    library: "影视库",
    searchPlaceholder: "搜索片名、剧集或动画...",
    all: "全部",
    movies: "电影",
    tvSeries: "电视剧",
    animation: "动漫",
    surprise: "随便挑一部",
    refresh: "换一组",
    cleanTitles: "整理后的条目",
    shows: "剧集",
    recommendation: "推荐",
    startHere: "今晚可以看这些",
    filmShelf: "电影库",
    seriesShelf: "电视剧",
    animationShelf: "动漫",
    backToSearch: "回到筛选",
    footerLeft: "本地私人影视库",
    footerRight: "离线影视库 · 稍后观看 · 本地评分",
    waitingRoom: "稍后观看",
    clearWatchlist: "清空列表",
    emptyWatchlist: "这里还没有内容。可以从影视库里加入，或者之后用添加片单功能补充。",
    notRated: "还没评分",
    watched: "看过了",
    details: "详情",
    waitingNote: "留给合适的晚上。",
    addSearchTitle: "添加片单",
    addSearchLabel: "输入电影、剧集、动画名称，或粘贴 IMDb / 豆瓣链接",
    addPlaceholder: "例如：银翼杀手2049、低俗小说、秒速五厘米，或直接粘贴 IMDb / 豆瓣链接...",
    findAndAdd: "查找作品",
    addHint: "输入片名后会先生成预览卡片，确认后才会保存到这个浏览器。",
    searching: "正在查找...",
    addedToWatchlist: "已加入影视库",
    searchFailed: "搜索失败。可以试试英文正式片名、加上年份，或确认是通过 Watch Vault 启动器打开的。",
    backHome: "返回影视库",
    category: "类型",
    loading: "加载中...",
    loadingInfo: "正在读取影片信息...",
    addToWatchlist: "加入稍后观看",
    added: "已加入稍后观看",
    watchNow: "播放",
    infoPage: "资料页",
    yourRating: "我的评分",
    folder: "所在文件夹",
    filesGrouped: "合并文件",
    recommendationReason: "推荐理由",
    localItem: "来自你的本地私人影视库。",
    manual: "手动添加",
    manualItem: "手动条目",
    movieReason: "已按电影合并同名或不同版本文件。",
    showReason: "已按剧集合并，避免每一集都挤在首页。",
    animationReason: "已从动画文件夹整理成清晰条目。",
    noMatch: "没有符合条件的内容。",
    seasons: "分季",
    season: "第 {n} 季",
    watchAvailable: "可以播放",
    imdbRating: "IMDb评分",
    release: "上映",
    director: "导演",
    cast: "主演",
    imdbLoading: "正在读取IMDb资料",
    editLibrary: "整理片库",
    doneEditing: "完成",
    dragHint: "长按卡片并拖动，就能调整顺序。",
    moveUp: "上移",
    moveDown: "下移",
    deleteItem: "删除",
    changePassword: "修改密码",
    deleteConfirm: "确定要从影视库删除这个条目吗？",
    setDeletePasswordPrompt: "请先设置删除密码。以后删除条目都要输入它。",
    deletePasswordPrompt: "请输入删除密码",
    currentPasswordPrompt: "请输入当前密码",
    newPasswordPrompt: "请输入新密码",
    passwordCreated: "删除密码已保存在这个浏览器里。",
    passwordChanged: "密码已修改。",
    wrongPassword: "密码不正确。",
    confirmAddHint: "请先确认这是你要加入的作品。",
    confirmedAddHint: "已加入影视库",
    backToTop: "回到顶部",
    posterPicker: "选择海报",
    posterUrlPlaceholder: "粘贴另一张海报图片链接",
    usePosterUrl: "使用这张"
  }
};

function readStorage(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getPlan() {
  return readStorage(planKey, []);
}

function getRatings() {
  return readStorage(ratingKey, {});
}

function isBrokenOnlineItem(item) {
  const title = String((item && (item.title || item.displayTitle)) || "").trim().toLowerCase();
  return title === "豆瓣" || title === "douban" || title === "豆瓣电影" || title === "douban movie";
}

function getCustomItems() {
  return readStorage(customKey, []).map(normalizeOnlineItem).filter(item => !isBrokenOnlineItem(item));
}

function writeCustomItems(items) {
  writeStorage(customKey, items.map(normalizeOnlineItem));
}

function itemIdentity(item) {
  item = normalizeOnlineItem(item);
  if (!item) return "";
  const imdb = getImdbId(item.infoUrl) || getImdbId(item.id) || getImdbId(item.title) || getKnownIdFromTitle(item.title) || getKnownIdFromTitle(item.displayTitle);
  if (imdb) return "imdb::" + imdb;
  return (item.category || "Movie") + "::" + (item.displayTitle || item.title || item.id || "").toString().toLowerCase();
}

function itemOrderToken(item) {
  return itemIdentity(item) || (item && item.id) || "";
}

function mergeUniqueItems(items) {
  const seen = new Set();
  return items.map(normalizeOnlineItem).filter(Boolean).filter(function (item) {
    const key = itemIdentity(item) || (item.id || item.title || "").toString().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getHiddenItems() {
  return readStorage(hiddenKey, []);
}

function getSavedOrder() {
  return readStorage(orderKey, []);
}

function revealSavedCustomItems(items) {
  const keys = new Set();
  items.map(normalizeOnlineItem).filter(Boolean).forEach(function (item) {
    keys.add(item.id);
    keys.add(itemIdentity(item));
    keys.add(itemOrderToken(item));
  });
  if (!keys.size) return;
  const hidden = getHiddenItems().filter(saved => !keys.has(saved));
  writeStorage(hiddenKey, hidden);
}

function applyLibraryPrefs(items) {
  const hidden = new Set(getHiddenItems());
  const order = getSavedOrder();
  const rank = new Map(order.map(function (id, index) { return [id, index]; }));
  return mergeUniqueItems(items).filter(function (item) {
    return !hidden.has(item.id) && !hidden.has(itemIdentity(item));
  }).sort(function (a, b) {
    const aRank = rank.has(itemOrderToken(a)) ? rank.get(itemOrderToken(a)) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(itemOrderToken(b)) ? rank.get(itemOrderToken(b)) : Number.MAX_SAFE_INTEGER;
    return aRank - bRank;
  });
}

function saveCurrentOrder() {
  writeStorage(orderKey, mediaItems.map(itemOrderToken).filter(Boolean));
}

function getWikiCache() {
  return readStorage(wikiCacheKey, {});
}

function saveWikiCache(cache) {
  writeStorage(wikiCacheKey, cache);
}

function getPublicInfoCache() {
  return readStorage(publicInfoKey, {});
}

function savePublicInfoCache(cache) {
  writeStorage(publicInfoKey, cache);
}

function getInitial(title) {
  return (title || "?").trim().charAt(0).toUpperCase();
}

function itemById(id) {
  const item = mediaItems.find(function (item) {
    return item.id === id;
  });
  return normalizeOnlineItem(item);
}

function getRule(item) {
  item = normalizeOnlineItem(item);
  if (item && item.poster) {
    return {
      match: /.*/,
      canonicalTitle: item.displayTitle || item.title,
      poster: item.poster,
      infoUrl: item.infoUrl || "",
      summary: item.summary || item.note || "Saved from online search.",
      moods: item.moods || []
    };
  }
  return metadataRules.filter(Boolean).find(function (rule) {
    return rule.match.test(item.title);
  });
}

function getFactRule(item) {
  item = normalizeOnlineItem(item);
  if (!item) {
    return null;
  }
  return factRules.find(function (rule) {
    return rule.match.test(item.title) || (item.displayTitle && rule.match.test(item.displayTitle));
  });
}

function t(key) {
  return (uiText[currentLanguage] && uiText[currentLanguage][key]) || uiText.en[key] || key;
}

function getChineseTitle(item) {
  item = normalizeOnlineItem(item);
  if (!item) {
    return "";
  }
  if (item.titleZh) {
    return item.titleZh;
  }
  const rule = zhTitleRules.find(function (entry) {
    return entry.match.test(item.title) || (item.displayTitle && entry.match.test(item.displayTitle));
  });
  return rule ? rule.title : item.title;
}

function getDisplayTitle(item) {
  if (currentLanguage === "zh") {
    return getChineseTitle(item);
  }
  const rule = getRule(item);
  return rule && rule.canonicalTitle ? rule.canonicalTitle : item.title;
}

function getCategoryLabel(category) {
  if (category === "Movie") return t("movies");
  if (category === "Show") return t("tvSeries");
  if (category === "Animation") return t("animation");
  return category || t("movies");
}

function getFileLabel(item) {
  const count = item.versions || 0;
  if (currentLanguage === "zh") {
    return count > 0 ? `${count} 个文件` : t("waitingNote");
  }
  return count > 0 ? `${count} file${count > 1 ? "s" : ""}` : t("waitingNote");
}

function getShowMeta(item) {
  const seasons = item.seasonCount || 1;
  if (currentLanguage === "zh") {
    return `${seasons} 季 · ${item.versions || 0} 个视频文件`;
  }
  return `${seasons} season${seasons === 1 ? "" : "s"} · ${item.versions || 0} episode files`;
}

function getRatingLabel(id, ratings) {
  if (!ratings[id]) {
    return t("notRated");
  }
  return currentLanguage === "zh" ? `${ratings[id]} 星` : `${ratings[id]} stars`;
}

function getReleaseYear(info) {
  const value = info && info.releaseDate ? String(info.releaseDate) : "";
  const match = value.match(/\d{4}/);
  return match ? match[0] : value;
}

function ratingSourceLabel(info) {
  if (!info) return "IMDb";
  if (info.ratingSource) return info.ratingSource;
  return String(info.infoUrl || info.sourceUrl || "").includes("douban.com") ? "Douban" : "IMDb";
}

function formatCardFacts(info) {
  if (!info) {
    return `<span class="card-facts muted-chip">${t("imdbLoading")}</span>`;
  }
  const bits = [];
  const source = ratingSourceLabel(info);
  if (info.rating) bits.push(`<span class="card-rating"><span class="star">&#9733;</span><strong>${info.rating}</strong><small>${source}</small></span>`);
  const year = getReleaseYear(info);
  if (year) bits.push(`<span class="card-year">${year}</span>`);
  return bits.length ? `<span class="card-facts">${bits.join("")}</span>` : `<span class="card-facts muted-chip">${t("imdbLoading")}</span>`;
}

function localizedPeople(info, key) {
  if (!info) return [];
  const englishKey = key + "En";
  const primary = currentLanguage === "zh" ? info[key] : (info[englishKey] && info[englishKey].length ? info[englishKey] : info[key]);
  const values = Array.isArray(primary) ? primary : [];
  if (currentLanguage !== "zh") {
    return values.filter(value => !hasChineseText(value));
  }
  return values;
}

function formatPublicFacts(info) {
  if (!info) {
    return `<span class="detail-loading muted-chip">${t("imdbLoading")}</span>`;
  }
  const rows = [];
  const year = getReleaseYear(info);
  if (year) rows.push(`<div class="detail-fact-row"><span>${t("release")}</span><strong>${year}</strong></div>`);
  const directors = localizedPeople(info, "director");
  const cast = localizedPeople(info, "cast");
  if (directors.length) rows.push(`<div class="detail-fact-row"><span>${t("director")}</span><strong>${directors.join(", ")}</strong></div>`);
  if (cast.length) rows.push(`<div class="detail-fact-row"><span>${t("cast")}</span><strong>${cast.slice(0, 4).join(", ")}</strong></div>`);
  const source = ratingSourceLabel(info);
  const rating = info.rating ? `<div class="detail-rating"><span class="star">&#9733;</span><strong>${info.rating}</strong><small>${source}</small></div>` : "";
  const stack = rows.length ? `<div class="detail-fact-stack">${rows.join("")}</div>` : "";
  return rating || stack ? `${rating}${stack}` : `<span class="detail-loading muted-chip">${t("imdbLoading")}</span>`;
}
function translateSummary(text) {
  const source = text || "";
  const entries = [
    ["A stylish British crime epic centered on Tommy Shelby and the Peaky Blinders gang in post-war Birmingham.", "战后的伯明翰，汤米·谢尔比带领家族帮派在街头、政界和地下世界之间扩张势力。"],
    ["Walter White, a chemistry teacher turned criminal mastermind, descends into the meth trade with Jesse Pinkman.", "一名高中化学老师在绝境中走向制毒犯罪，与杰西·平克曼一起越陷越深。"],
    ["Jimmy McGill transforms into Saul Goodman, the slippery criminal lawyer from the Breaking Bad universe.", "吉米·麦吉尔一步步变成索尔·古德曼，一个游走在法律、道德和犯罪之间的律师。"],
    ["A violent superhero satire where Homelander and Vought twist celebrity power into something terrifying.", "超级英雄被包装成明星和商品，祖国人与沃特公司的权力游戏逐渐失控。"],
    ["Rue and her classmates move through addiction, identity, friendship, desire, and chaos in a neon Gen-Z drama.", "Rue和同龄人在成瘾、身份、友情与欲望之间摇摆，情绪浓烈而锋利。"],
    ["Loki is pulled into the Time Variance Authority and forced into a surreal fight over timelines and identity.", "洛基被卷入时间变异管理局，在混乱时间线中重新面对自己的身份。"],
    ["An animated anthology of sci-fi, fantasy, horror, violence, strange futures, and sharp visual experiments.", "科幻、奇幻、恐怖与暴力混合成一组短篇动画，每一集都有不同的视觉风格。"],
    ["A lonely writer falls in love with Samantha, an advanced AI operating system, in Spike Jonze's intimate sci-fi romance.", "孤独的作家爱上了人工智能系统Samantha，这是一部温柔又刺痛的近未来爱情片。"],
    ["Batman, James Gordon, and Harvey Dent are pushed to their limits when the Joker unleashes chaos across Gotham City.", "小丑在哥谭制造混乱与恐惧，蝙蝠侠、戈登和哈维·丹特被迫面对秩序、正义与牺牲的极限。"],
    ["When a menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman, James Gordon and Harvey Dent must work together to put an end to the madness.", "小丑在哥谭制造混乱与恐惧，蝙蝠侠、戈登和哈维·丹特必须联手阻止这场疯狂。"],
    ["An Oscar-winning dark comedy about a fading superhero actor trying to prove himself on Broadway.", "过气超级英雄演员试图在百老汇重新证明自己，现实、舞台和自我幻觉交织在一起。"],
    ["A blade runner named K uncovers a secret that could reshape the future of humans and replicants.", "银翼杀手K发现一个足以改变人类与复制人未来的秘密。"],
    ["Ridley Scott's foundational neo-noir sci-fi film about replicants, memory, and what makes someone human.", "雷德利·斯科特的经典科幻黑色电影，讨论复制人、记忆和人何以为人。"],
    ["Paul Atreides is drawn into war, prophecy, and power on the desert planet Arrakis.", "保罗·厄崔迪被卷入沙漠星球厄拉科斯的战争、预言与权力斗争。"],
    ["A linguist faces first contact with alien visitors in a meditative sci-fi story about language and time.", "语言学家面对外星文明的首次接触，故事关于语言、时间和选择。"],
    ["Neo discovers reality is a simulation and joins the fight against machine control.", "尼奥发现现实只是一套模拟系统，并加入反抗机器统治的战斗。"],
    ["A laundromat owner is thrown into a multiverse adventure about family, regret, and possibility.", "洗衣店老板被卷入多元宇宙，在荒诞冒险中重新面对家庭、遗憾与可能性。"],
    ["Forrest Gump moves through American history with sincerity, chance, and an unforgettable life story.", "阿甘以单纯和坚持穿过美国几十年历史，留下一段不可思议的人生。"],
    ["A Christmas ensemble romance following many kinds of love across London.", "圣诞前的伦敦，多组人物交织出关于亲情、爱情和遗憾的故事。"],
    ["A sweeping romantic drama about memory, devotion, and a love that lasts across decades.", "一段跨越数十年的爱情，在记忆、陪伴和承诺中被反复讲述。"],
    ["Quentin Tarantino's nonlinear crime classic of hitmen, boxers, diners, and bad decisions.", "昆汀的非线性犯罪经典，杀手、拳击手、餐馆与一连串荒诞选择交错发生。"],
    ["A botched robbery tears apart a crew of criminals who suspect one of them is an undercover cop.", "一次失败的抢劫让犯罪团伙互相猜疑，他们怀疑其中有人是卧底。"],
    ["John Wick takes his fight against the High Table across the world in a brutal final gauntlet.", "约翰·威克把对抗高桌会的战斗推向全球，动作场面更加极致。"],
    ["John Wick is excommunicated and hunted by assassins after breaking the Continental's rules.", "约翰·威克违反大陆酒店规则后被除名，全球杀手开始追杀他。"],
    ["John Wick is pulled back into the assassin world by a blood oath and a dangerous Rome contract.", "一份血誓把约翰·威克再次拖回杀手世界，并引向罗马的危险任务。"],
    ["A retired assassin is dragged back into the underworld he left behind.", "退休杀手约翰·威克被迫重返地下世界，展开冷酷而精准的复仇。"],
    ["Two teenagers mysteriously swap bodies across distance and fate in Makoto Shinkai's romantic fantasy.", "两个素未谋面的少年少女在梦中交换身体，命运也因此被重新连接。"],
    ["A runaway boy meets a girl who can change the weather in a rain-soaked Tokyo fantasy.", "离家少年在雨中的东京遇见能改变天气的女孩，城市与命运一起摇晃。"],
    ["Humanity fights for survival behind walls against giant man-eating Titans.", "人类躲在高墙之后，对抗吞食人类的巨人，并逐渐发现世界真相。"],
    ["Tarantino's alternate-history WWII revenge film about a squad hunting Nazis and a cinema owner plotting payback.", "昆汀改写二战历史，一支小队猎杀纳粹，一位影院老板也在策划复仇。"],
    ["A supernatural Southern gothic thriller about twin brothers returning home and facing a terrifying evil.", "双胞胎兄弟回到故乡，却遇上潜伏在南方小镇里的恐怖邪恶力量。"],
    ["Eight dangerous strangers are trapped together during a blizzard in Tarantino's chamber-piece western.", "暴风雪中，八个危险陌生人被困在同一处驿站，猜忌和暴力逐步升级。"],
    ["A quiet Hollywood stunt driver and getaway driver is pulled into a violent criminal spiral.", "沉默的特技车手兼逃亡司机被卷入犯罪漩涡，暴力逐渐逼近。"],
    ["Frodo begins the journey to destroy the One Ring with the Fellowship at his side.", "弗罗多踏上摧毁至尊魔戒的旅程，护戒远征队由此集结。"],
    ["The Fellowship is divided as war grows across Middle-earth.", "远征队分散，中土大战逼近，每个人都被推向自己的战场。"],
    ["The final battle for Middle-earth unfolds as Frodo reaches Mordor.", "中土世界的最终决战展开，弗罗多也一步步接近魔多。"],
    ["A prequel expanding the police and triad world of Infernal Affairs.", "《无间道》的前传，展开警队与黑帮之间更早期的权力与身份纠葛。"],
    ["The concluding chapter follows the aftermath of betrayal and identity in the Infernal Affairs saga.", "系列终章延续卧底身份与背叛的后果，每个人都被过去追上。"],
    ["A police mole and a triad mole race to discover each other's identity in Hong Kong.", "警队卧底与黑帮内鬼互相追查身份，香港犯罪片的经典双雄对局。"],
    ["The Bride continues her revenge journey toward Bill.", "新娘继续复仇之路，最终走向与Bill的正面对决。"],
    ["The Bride wakes from a coma and begins a blood-soaked revenge campaign.", "新娘从昏迷中醒来，开始一场血腥、凌厉的复仇。"],
    ["A fading celebrity takes a body-horror drug promising a younger, better self.", "过气明星使用能制造年轻自我的药物，却引发失控的身体恐怖。"],
    ["A grieving man returns home after a family tragedy and confronts a painful past.", "一个被悲伤困住的男人回到故乡，被迫面对无法愈合的过去。"],
    ["Two men wake chained in a room as a sadistic game of survival begins.", "两个男人醒来后发现自己被锁在密室中，一场残酷的生存游戏开始。"],
    ["Furiosa and Max tear across the wasteland in one of modern cinema's great action spectacles.", "弗瑞奥萨与麦克斯穿越废土狂奔，构成现代动作电影最猛烈的奇观之一。"],
    ["A secret agent hunts a serial killer in a brutal Korean revenge thriller.", "秘密特工追捕连环杀手，复仇逐渐变成更残酷的深渊。"],
    ["Sergio Leone's sweeping gangster epic about friendship, memory, betrayal, and time.", "赛尔乔·莱昂内的黑帮史诗，关于友情、记忆、背叛与时间。"],
    ["Strangers trapped at a motel are killed one by one in a psychological mystery thriller.", "一群陌生人被困汽车旅馆，接连发生命案，真相逐渐扭曲。"],
    ["A freed slave joins a bounty hunter to rescue his wife from a brutal plantation owner.", "被解放的奴隶与赏金猎人联手，试图从残暴庄园主手中救回妻子。"],
    ["An aging Logan protects a young mutant in a raw, western-like superhero farewell.", "年迈的罗根保护一名年轻变种人，这是一部粗粝、像西部片一样的告别。"],
    ["A corrupt detective is squeezed between a vicious mayor and prosecutors in a Korean crime thriller.", "腐败刑警被夹在残酷市长与检方之间，韩国黑色犯罪气质浓烈。"],
    ["A group of antiheroes is pushed into a dangerous mission in the Marvel universe.", "一群反英雄被推入危险任务，在漫威世界中组成临时队伍。"],
    ["A desperate cab driver is sent from China to Korea for a deadly mission.", "走投无路的出租车司机从中国来到韩国，卷入一场致命任务。"],
    ["Neo, Trinity, and Morpheus continue the war against the machines as Zion faces destruction.", "锡安面临毁灭，尼奥、崔妮蒂和墨菲斯继续对抗机器世界。"],
    ["The Matrix trilogy reaches its machine-war conclusion.", "《黑客帝国》三部曲走向机器战争的终局。"],
    ["Makoto Shinkai's quiet triptych about distance, memory, and young love drifting apart.", "新海诚以三段故事讲述距离、记忆和年少爱情的渐行渐远。"],
    ["Teen pilots fight in giant mecha while discovering identity, desire, and rebellion.", "少年少女驾驶巨大机甲战斗，也在过程中理解身份、情感和反抗。"],
    ["A student and an older woman meet during rainy mornings in a Tokyo garden.", "雨天的东京庭园中，少年与年长女性相遇，孤独与温柔慢慢靠近。"],
    ["Marvel stories are remixed across alternate animated timelines.", "漫威故事在不同动画时间线中被重新组合，展示另一种可能。"],
    ["Miles Morales becomes Spider-Man and meets heroes from across the multiverse in a kinetic animated landmark.", "迈尔斯·莫拉莱斯成为蜘蛛侠，并遇见来自多元宇宙的蜘蛛侠们。"]
  ];
  const found = entries.find(function (entry) {
    return source === entry[0];
  });
  return found ? found[1] : source;
}

function isGenericSummary(text) {
  return /^Saved from IMDb suggestion metadata\.?$/i.test(String(text || "")) || /^Saved from IMDb link\.?$/i.test(String(text || ""));
}

function isWeakChineseSummary(text) {
  const value = String(text || "").trim();
  return !value || value.length < 16 || /^\d{4}年?.{0,12}(电影|電影|电视剧|電視劇|动画|動畫)$/.test(value);
}

function hasChineseText(text) {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
}

function extractChineseSummary(text) {
  const value = String(text || "").trim();
  const index = value.search(/[\u4e00-\u9fff]/);
  return index >= 0 ? value.slice(index).replace(/^[:：\s]+/, "").trim() : "";
}

function englishDoubanFallbackSummary(item) {
  let title = item.title || item.displayTitle || item.titleZh || "This title";
  if (hasChineseText(title)) {
    title = "This title";
  }
  const year = getReleaseYear(item);
  const yearText = year ? ` from ${year}` : "";
  const directors = Array.isArray(item.director) ? item.director.filter(Boolean).slice(0, 2).join(", ") : "";
  const cast = Array.isArray(item.cast) ? item.cast.filter(Boolean).slice(0, 3).join(", ") : "";
  const directorText = directors ? `, directed by ${directors}` : "";
  const castText = cast ? ` and starring ${cast}` : "";
  return `${title} is a Douban-sourced title${yearText}${directorText}${castText}. Watch Vault keeps its Douban rating, poster, original source link, and Chinese synopsis together in this card.`;
}

function getLocalizedSummary(item, englishSummary) {
  item = normalizeOnlineItem(item);
  const summary = englishSummary || item.summary || item.note || "";
  if (currentLanguage !== "zh") {
    if (isGenericSummary(summary)) {
      return "Public metadata is limited for this title, but the card keeps the source link, year, cast, and poster together in your vault.";
    }
    if (/^Added from Douban\./i.test(summary)) {
      return englishDoubanFallbackSummary(item);
    }
    if (hasChineseText(summary) && String(item.infoUrl || item.sourceUrl || "").includes("douban.com")) {
      return englishDoubanFallbackSummary(item);
    }
    return summary;
  }
  if (item.summaryZh && hasChineseText(item.summaryZh) && !isWeakChineseSummary(item.summaryZh)) {
    return item.summaryZh;
  }
  if (isGenericSummary(summary)) {
    return "这个条目的公开简介暂时不完整，但页面会保留资料链接、年份、演员和海报，方便之后继续补全。";
  }
  const translated = translateSummary(summary);
  if (translated !== summary) {
    return translated;
  }
  const chinesePart = extractChineseSummary(summary);
  if (chinesePart && !isWeakChineseSummary(chinesePart)) {
    return chinesePart;
  }
  if (item.summaryZh && hasChineseText(item.summaryZh)) {
    return item.summaryZh;
  }
  return "这个条目已经收录评分、年份、导演、主演和海报。中文简介暂时没有可靠来源，之后可以用 IMDb 或豆瓣链接继续补全。";
}

function getMoods(item) {
  const rule = getRule(item);
  const moods = rule ? rule.moods.slice() : [];
  if (item.category === "Animation" && !moods.includes("animation")) {
    moods.push("animation");
  }
  if (item.category === "Show" && item.versions > 20 && !moods.includes("intense")) {
    moods.push("intense");
  }
  return moods;
}

async function loadCatalog() {
  const savedItems = (window.STATIC_CATALOG && window.STATIC_CATALOG.items) || [];
  const customItems = getCustomItems();
  revealSavedCustomItems(customItems);
  writeCustomItems(customItems);

  try {
    const response = await fetch("/api/catalog");
    if (response.ok) {
      const data = await response.json();
      serverMode = true;
      diskConnected = Boolean(data.diskConnected);
      const liveItems = data.items && data.items.length > 0 ? data.items : savedItems;
      mediaItems = applyLibraryPrefs(liveItems.concat(customItems));
      return;
    }
  } catch (error) {
    serverMode = false;
  }

  mediaItems = applyLibraryPrefs(savedItems.concat(customItems));
  diskConnected = false;
}

function updateDiskStatus() {
  const detailStatus = document.querySelector("#detailDiskStatus");
  if (detailStatus) {
    detailStatus.textContent = serverMode && diskConnected ? "Watch available" : "";
  }
}

function currentSearchText() {
  const searchInput = document.querySelector("#searchInput");
  return searchInput ? searchInput.value.trim().toLowerCase() : "";
}

function filteredItems() {
  const text = currentSearchText();
  const category = activeCategory;
  const seen = new Set();
  const base = mediaItems.map(normalizeOnlineItem).filter(function (item) {
    return category === "" || item.category === category;
  });

  function titleParts(item) {
    const known = getKnownOnlineItem(item) || {};
    return [getDisplayTitle(item), item.title, item.displayTitle, item.titleZh, known.title, known.titleZh]
      .filter(Boolean)
      .map(value => String(value).toLowerCase());
  }

  const exactMatches = text ? base.filter(function (item) {
    return titleParts(item).some(title => title === text);
  }) : [];
  const source = exactMatches.length ? exactMatches : base.filter(function (item) {
    const known = getKnownOnlineItem(item) || {};
    const haystack = [
      getDisplayTitle(item),
      item.title,
      item.displayTitle,
      item.titleZh,
      known.title,
      known.titleZh,
      item.folder,
      item.infoUrl
    ].join(" ").toLowerCase();
    return !text || haystack.includes(text);
  });

  return source.filter(function (item) {
    const key = itemIdentity(item) || item.category + "::" + (item.id || getDisplayTitle(item)).toString().toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function renderStats(items) {
  if (!document.querySelector("#totalCount")) {
    return;
  }
  document.querySelector("#totalCount").textContent = items.length;
  document.querySelector("#movieCount").textContent = items.filter(i => i.category === "Movie").length;
  document.querySelector("#showCount").textContent = items.filter(i => i.category === "Show").length;
  document.querySelector("#animationCount").textContent = items.filter(i => i.category === "Animation").length;
}

function recommendationSeed() {
  return Math.floor(Date.now() / 60000) + recommendationOffset * 17;
}

function seededIndex(seed, length) {
  if (length <= 0) return 0;
  const x = Math.sin(seed * 999) * 10000;
  return Math.abs(Math.floor(x)) % length;
}

function rotateList(list, seed) {
  if (!list.length) return [];
  const start = seededIndex(seed, list.length);
  return list.slice(start).concat(list.slice(0, start));
}

function recommendationKey(item) {
  return itemIdentity(item) || item.id || `${item.category || "Item"}::${getDisplayTitle(item)}`;
}

function recentRecommendationIds() {
  return new Set(recommendationHistory.slice(0, 3).flatMap(entry => entry.ids || []));
}

function rememberRecommendationPicks(picks) {
  const ids = picks.map(recommendationKey).filter(Boolean);
  const signature = ids.join("|");
  if (!signature || signature === lastRecommendationSignature) return;
  lastRecommendationSignature = signature;
  recommendationHistory = [{ ids, when: Date.now() }].concat(recommendationHistory || []).slice(0, 3);
  writeStorage("watchVaultRecommendationHistory", recommendationHistory);
}

function pickRecommendation(list, seed, blocked, taken) {
  const rotated = rotateList(list, seed);
  const free = rotated.filter(function (item) {
    const key = recommendationKey(item);
    return !taken.has(key) && !blocked.has(key);
  });
  const fallback = rotated.filter(function (item) {
    return !taken.has(recommendationKey(item));
  });
  const pick = (free.length ? free : fallback)[0] || null;
  if (pick) taken.add(recommendationKey(pick));
  return pick;
}

function recommendationPicks(items) {
  const seed = recommendationSeed();
  const blocked = recentRecommendationIds();
  const taken = new Set();
  if (activeCategory) {
    const list = items.filter(item => item.category === activeCategory);
    return [0, 1, 2].map(index => pickRecommendation(list, seed + index * 29, blocked, taken)).filter(Boolean);
  }
  const categories = rotateList(["Movie", "Show", "Animation"], seed);
  return categories.map(function (category, index) {
    const list = items.filter(item => item.category === category);
    return pickRecommendation(list, seed + index * 31, blocked, taken);
  }).filter(Boolean);
}

function renderRecommendations(items) {
  const box = document.querySelector("#recommendations");
  if (!box) {
    return;
  }

  const picks = recommendationPicks(items);
  rememberRecommendationPicks(picks);
  box.innerHTML = picks.map(function (item) {
    return `
      <a class="feature-card poster-feature" href="${detailUrl(item.id)}" data-feature-id="${item.id}">
        <div class="feature-poster" data-poster-id="${item.id}"><span>${getInitial(getDisplayTitle(item))}</span></div>
        <div>
          <span>${getCategoryLabel(item.category)}</span>
          <strong>${getDisplayTitle(item)}</strong>
          <small class="credit-line" data-meta-id="${item.id}">${t("imdbLoading")}</small>
          <small data-summary-id="${item.id}">${getLocalizedSummary(item, item.summary || item.note || "") || t("waitingNote")}</small>
        </div>
      </a>
    `;
  }).join("");

  enrichVisibleMedia(picks);
}

function canWatch() {
  return serverMode && diskConnected;
}

async function watchPath(path) {
  if (!canWatch() || !path) {
    return;
  }
  try {
    await fetch("/open?path=" + encodeURIComponent(path));
  } catch (error) {
    console.warn("Could not open file", error);
  }
}

function getWatchButton(item) {
  if (!canWatch() || !item.path || item.category === "Show") {
    return "";
  }
  return `<button class="button primary tiny" type="button" data-watch="${encodeURIComponent(item.path)}">Watch</button>`;
}

function renderEpisodeGroups(item) {
  if (!item.episodes || item.episodes.length === 0) {
    return "";
  }

  const seasons = {};
  item.episodes.forEach(function (episode) {
    if (!seasons[episode.season]) {
      seasons[episode.season] = [];
    }
    seasons[episode.season].push(episode);
  });

  return `
    <div class="episode-panel hidden" id="episodes-${item.id}">
      ${Object.keys(seasons).sort((a, b) => Number(a) - Number(b)).map(function (season) {
        return `
          <section class="season-block">
            <h4>Season ${season}</h4>
            <div class="episode-grid">
              ${seasons[season].map(function (episode) {
                const watchButton = canWatch()
                  ? `<button class="episode-watch" type="button" data-watch="${encodeURIComponent(episode.path)}">Watch</button>`
                  : "";
                return `<div class="episode-row"><span>${episode.label}</span>${watchButton}</div>`;
              }).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function managementButtons(item) {
  if (!editMode) return "";
  return `
    <span class="drag-cue" aria-hidden="true">⋮⋮</span>
    <button class="button danger tiny" type="button" data-delete-item="${item.id}">${t("deleteItem")}</button>
  `;
}

function renderShelf(targetId, items, category) {
  const shelf = document.querySelector(targetId);
  if (!shelf) {
    return;
  }

  const list = items.filter(item => item.category === category);
  if (list.length === 0) {
    shelf.innerHTML = `<p class="muted">${t("noMatch")}</p>`;
    return;
  }

  shelf.innerHTML = list.map(function (item) {
    const showMeta = getCategoryLabel(item.category);
    const showButton = item.category === "Show"
      ? `<button class="button secondary tiny" type="button" data-toggle="${item.id}">${t("seasons")}</button>`
      : "";

    return `
      <article class="media-item poster-card ${editMode ? "editing-card" : ""} ${item.category === "Show" ? "show-item" : item.category === "Animation" ? "animation-item" : "movie-item"}" data-card-id="${item.id}" draggable="${editMode ? "true" : "false"}">
        <div class="poster-surface ${item.category}" data-poster-id="${item.id}">
          <span>${getInitial(item.title)}</span>
        </div>
        <div class="media-info">
          <h3>${getDisplayTitle(item)}</h3>
          <p>${showMeta}</p>
          <small class="credit-line" data-meta-id="${item.id}">${t("imdbLoading")}</small>
          <small class="summary-line" data-summary-id="${item.id}"></small>
          <div class="card-actions">
            <a class="button secondary tiny" href="${detailUrl(item.id)}">${t("details")}</a>
            ${showButton}
            ${getWatchButton(item)}
            <button class="button quiet tiny" type="button" data-plan="${item.id}">${t("watchlist")} +</button>
            ${managementButtons(item)}
          </div>
          ${renderEpisodeGroups(item)}
        </div>
      </article>
    `;
  }).join("");

  shelf.querySelectorAll("[data-plan]").forEach(function (button) {
    button.addEventListener("click", function () {
      const item = itemById(button.dataset.plan);
      addToPlan(item);
      button.textContent = currentLanguage === "zh" ? "已加入" : "Queued";
      renderPlan();
    });
  });

  shelf.querySelectorAll("[data-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      const panel = document.querySelector("#episodes-" + button.dataset.toggle);
      if (panel) {
        panel.classList.toggle("hidden");
      }
    });
  });

  shelf.querySelectorAll("[data-watch]").forEach(function (button) {
    button.addEventListener("click", function () {
      watchPath(decodeURIComponent(button.dataset.watch));
    });
  });

  setupDragReorder(shelf, category);

  shelf.querySelectorAll("[data-delete-item]").forEach(function (button) {
    button.addEventListener("click", async function () {
      await deleteLibraryItem(button.dataset.deleteItem);
    });
  });

  enrichVisibleMedia(list);
}

function setSectionVisibility(items) {
  const hasSearch = currentSearchText().length > 0;
  const map = {
    Movie: document.querySelector("#movies"),
    Show: document.querySelector("#shows"),
    Animation: document.querySelector("#animations")
  };
  Object.keys(map).forEach(function (category) {
    if (!map[category]) {
      return;
    }
    const categoryHasResults = items.some(item => item.category === category);
    const hiddenByChip = activeCategory !== "" && activeCategory !== category;
    const hiddenBySearch = hasSearch && !categoryHasResults;
    map[category].classList.toggle("hidden", hiddenByChip || hiddenBySearch);
  });
}

function renderLibrary() {
  mediaItems = applyLibraryPrefs(mediaItems);
  const items = filteredItems();
  const hasSearch = currentSearchText().length > 0;
  document.body.classList.toggle("search-active", hasSearch);
  renderStats(items);
  const recommendations = document.querySelector(".recommendations");
  if (recommendations) {
    recommendations.classList.toggle("compact-recommendations", activeCategory !== "");
    recommendations.classList.toggle("hidden", hasSearch);
  }
  if (!hasSearch) {
    renderRecommendations(items);
  }
  setSectionVisibility(items);
  renderShelf("#movieShelf", items, "Movie");
  renderShelf("#showShelf", items, "Show");
  renderShelf("#animationShelf", items, "Animation");
}

function moveLibraryItemNear(sourceId, targetId, placeAfter) {
  if (!sourceId || !targetId || sourceId === targetId) return;
  const source = itemById(sourceId);
  const target = itemById(targetId);
  if (!source || !target || source.category !== target.category) return;
  const nextItems = mediaItems.filter(item => item.id !== sourceId);
  const targetIndex = nextItems.findIndex(item => item.id === targetId);
  if (targetIndex < 0) return;
  nextItems.splice(targetIndex + (placeAfter ? 1 : 0), 0, source);
  mediaItems = nextItems;
  saveCurrentOrder();
  renderLibrary();
}

let dragScrollFrame = 0;
let dragScrollSpeed = 0;

function updateDragAutoScroll(event) {
  const edge = 150;
  const y = event.clientY;
  const height = window.innerHeight || document.documentElement.clientHeight;
  if (y < edge) {
    dragScrollSpeed = -Math.max(14, Math.round(((edge - y) / edge) * 64));
  } else if (y > height - edge) {
    dragScrollSpeed = Math.max(14, Math.round(((y - (height - edge)) / edge) * 64));
  } else {
    dragScrollSpeed = 0;
  }
  if (dragScrollSpeed && !dragScrollFrame) {
    const tick = function () {
      if (!dragScrollSpeed) {
        dragScrollFrame = 0;
        return;
      }
      window.scrollBy(0, dragScrollSpeed);
      dragScrollFrame = window.requestAnimationFrame(tick);
    };
    dragScrollFrame = window.requestAnimationFrame(tick);
  }
}

function stopDragAutoScroll() {
  dragScrollSpeed = 0;
  if (dragScrollFrame) {
    window.cancelAnimationFrame(dragScrollFrame);
    dragScrollFrame = 0;
  }
}

function ensureDropMarker(shelf) {
  let marker = shelf.querySelector(":scope > .drop-insert-marker");
  if (!marker) {
    marker = document.createElement("div");
    marker.className = "drop-insert-marker";
    marker.setAttribute("aria-hidden", "true");
    shelf.appendChild(marker);
  }
  return marker;
}

function clearDropMarker(shelf) {
  if (!shelf) return;
  shelf.classList.remove("edit-drop-active");
  delete shelf.dataset.dropTarget;
  delete shelf.dataset.dropAfter;
  const marker = shelf.querySelector(":scope > .drop-insert-marker");
  if (marker) marker.remove();
}

function dragInsertPosition(shelf, event, sourceId) {
  const cards = Array.from(shelf.querySelectorAll(".poster-card[data-card-id]")).filter(function (card) {
    return card.dataset.cardId !== sourceId;
  });
  if (!cards.length) return null;

  const pointerY = event.clientY;
  const pointerX = event.clientX;
  const rowTolerance = 34;
  const measured = cards.map(function (card) {
    const rect = card.getBoundingClientRect();
    return { card, rect, centerY: rect.top + rect.height / 2, centerX: rect.left + rect.width / 2 };
  });
  let row = measured.filter(function (entry) {
    return pointerY >= entry.rect.top - rowTolerance && pointerY <= entry.rect.bottom + rowTolerance;
  });
  if (!row.length) {
    const nearestY = measured.reduce(function (best, entry) {
      return Math.abs(entry.centerY - pointerY) < Math.abs(best.centerY - pointerY) ? entry : best;
    }, measured[0]).centerY;
    row = measured.filter(function (entry) {
      return Math.abs(entry.centerY - nearestY) < Math.max(24, entry.rect.height / 2);
    });
  }
  row.sort(function (a, b) { return a.rect.left - b.rect.left; });

  let target = row[row.length - 1];
  let placeAfter = true;
  for (const entry of row) {
    if (pointerX < entry.centerX) {
      target = entry;
      placeAfter = false;
      break;
    }
  }

  const shelfRect = shelf.getBoundingClientRect();
  const x = (placeAfter ? target.rect.right : target.rect.left) - shelfRect.left;
  const y = target.rect.top - shelfRect.top;
  return {
    targetId: target.card.dataset.cardId,
    placeAfter,
    x,
    y,
    height: target.rect.height
  };
}

function showDropMarker(shelf, position) {
  if (!position) return;
  const marker = ensureDropMarker(shelf);
  shelf.classList.add("edit-drop-active");
  shelf.dataset.dropTarget = position.targetId;
  shelf.dataset.dropAfter = position.placeAfter ? "true" : "false";
  marker.style.left = `${Math.round(position.x)}px`;
  marker.style.top = `${Math.round(position.y)}px`;
  marker.style.height = `${Math.round(position.height)}px`;
}

function setupDragReorder(shelf, category) {
  if (!editMode || !shelf) return;
  let holdTimer = null;

  if (!shelf.dataset.dragShelfBound) {
    shelf.dataset.dragShelfBound = "true";
    shelf.addEventListener("dragover", function (event) {
      const draggedId = shelf.dataset.draggedId || "";
      if (!draggedId) return;
      event.preventDefault();
      updateDragAutoScroll(event);
      const position = dragInsertPosition(shelf, event, draggedId);
      showDropMarker(shelf, position);
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    });

    shelf.addEventListener("dragleave", function (event) {
      if (!shelf.contains(event.relatedTarget)) {
        clearDropMarker(shelf);
      }
    });

    shelf.addEventListener("drop", function (event) {
      const draggedId = shelf.dataset.draggedId || "";
      if (!draggedId) return;
      event.preventDefault();
      const sourceId = (event.dataTransfer && event.dataTransfer.getData("text/plain")) || draggedId;
      const targetId = shelf.dataset.dropTarget;
      const placeAfter = shelf.dataset.dropAfter === "true";
      stopDragAutoScroll();
      delete shelf.dataset.draggedId;
      clearDropMarker(shelf);
      moveLibraryItemNear(sourceId, targetId, placeAfter);
    });
  }

  shelf.querySelectorAll(".poster-card[data-card-id]").forEach(function (card) {
    card.addEventListener("pointerdown", function () {
      holdTimer = setTimeout(function () {
        card.classList.add("long-press-ready");
      }, 220);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (eventName) {
      card.addEventListener(eventName, function () {
        clearTimeout(holdTimer);
        card.classList.remove("long-press-ready");
      });
    });
    card.addEventListener("dragstart", function (event) {
      shelf.dataset.draggedId = card.dataset.cardId;
      card.classList.add("dragging-card");
      shelf.classList.add("drag-reorder-live");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", card.dataset.cardId);
      }
    });
    card.addEventListener("dragend", function () {
      delete shelf.dataset.draggedId;
      stopDragAutoScroll();
      clearDropMarker(shelf);
      shelf.classList.remove("drag-reorder-live");
      shelf.querySelectorAll(".dragging-card,.drop-target,.long-press-ready").forEach(function (node) {
        node.classList.remove("dragging-card", "drop-target", "long-press-ready");
      });
    });
  });
}

function ensureVaultDialog() {
  let dialog = document.querySelector("#vaultDialog");
  if (dialog) return dialog;
  dialog = document.createElement("div");
  dialog.id = "vaultDialog";
  dialog.className = "vault-dialog hidden";
  dialog.innerHTML = `
    <div class="vault-dialog-card" role="dialog" aria-modal="true">
      <h3 id="vaultDialogTitle"></h3>
      <p id="vaultDialogMessage"></p>
      <input id="vaultDialogInput" type="password" autocomplete="current-password">
      <div class="vault-dialog-actions">
        <button class="button quiet tiny" type="button" id="vaultDialogCancel"></button>
        <button class="button primary tiny" type="button" id="vaultDialogConfirm"></button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
  return dialog;
}

function vaultDialog(options) {
  return new Promise(function (resolve) {
    const dialog = ensureVaultDialog();
    const title = dialog.querySelector("#vaultDialogTitle");
    const message = dialog.querySelector("#vaultDialogMessage");
    const input = dialog.querySelector("#vaultDialogInput");
    const cancel = dialog.querySelector("#vaultDialogCancel");
    const confirm = dialog.querySelector("#vaultDialogConfirm");
    title.textContent = options.title || "Watch Vault";
    message.textContent = options.message || "";
    input.value = "";
    input.placeholder = options.placeholder || "";
    input.type = options.inputType || "password";
    input.classList.toggle("hidden", !options.needsInput);
    cancel.textContent = options.cancelText || (currentLanguage === "zh" ? "取消" : "Cancel");
    confirm.textContent = options.confirmText || (currentLanguage === "zh" ? "确认" : "Confirm");
    cancel.classList.toggle("hidden", options.alertOnly === true);
    dialog.classList.remove("hidden");

    function close(value) {
      dialog.classList.add("hidden");
      cancel.onclick = null;
      confirm.onclick = null;
      input.onkeydown = null;
      resolve(value);
    }

    cancel.onclick = function () { close(null); };
    confirm.onclick = function () { close(options.needsInput ? input.value : true); };
    input.onkeydown = function (event) {
      if (event.key === "Enter") close(input.value);
      if (event.key === "Escape") close(null);
    };
    if (options.needsInput) setTimeout(function () { input.focus(); }, 30);
  });
}

async function vaultAlert(message, title) {
  await vaultDialog({ title: title || "Watch Vault", message: message, alertOnly: true, confirmText: currentLanguage === "zh" ? "知道了" : "OK" });
}

async function vaultConfirm(message, title) {
  return await vaultDialog({ title: title || "Watch Vault", message: message, needsInput: false }) === true;
}

async function vaultPrompt(message, title) {
  return await vaultDialog({ title: title || "Watch Vault", message: message, needsInput: true, placeholder: currentLanguage === "zh" ? "输入密码" : "Enter password" });
}

async function verifyDeletePassword() {
  const saved = localStorage.getItem(passwordKey) || "";
  if (!saved) {
    const created = await vaultPrompt(t("setDeletePasswordPrompt"), t("deleteItem"));
    if (!created) return false;
    localStorage.setItem(passwordKey, created);
    await vaultAlert(t("passwordCreated"));
    return true;
  }
  const typed = await vaultPrompt(t("deletePasswordPrompt"), t("deleteItem"));
  if (typed !== saved) {
    await vaultAlert(t("wrongPassword"));
    return false;
  }
  return true;
}

async function changeDeletePassword() {
  const saved = localStorage.getItem(passwordKey) || "";
  if (saved) {
    const current = await vaultPrompt(t("currentPasswordPrompt"), t("changePassword"));
    if (current !== saved) {
      await vaultAlert(t("wrongPassword"));
      return;
    }
  }
  const next = await vaultPrompt(t("newPasswordPrompt"), t("changePassword"));
  if (!next) return;
  localStorage.setItem(passwordKey, next);
  await vaultAlert(saved ? t("passwordChanged") : t("passwordCreated"));
}

async function deleteLibraryItem(id) {
  const item = itemById(id);
  if (!item) return;
  const confirmed = await vaultConfirm(t("deleteConfirm") + "\n" + getDisplayTitle(item), t("deleteItem"));
  if (!confirmed) return;
  if (!await verifyDeletePassword()) return;
  const identity = itemIdentity(item);
  const hidden = Array.from(new Set(getHiddenItems().concat([item.id, identity]).filter(Boolean)));
  writeStorage(hiddenKey, hidden);
  writeCustomItems(getCustomItems().filter(saved => saved.id !== item.id && itemIdentity(saved) !== identity));
  writeStorage(planKey, getPlan().filter(saved => saved.id !== item.id && itemIdentity(saved) !== identity));
  mediaItems = applyLibraryPrefs(mediaItems.filter(saved => saved.id !== item.id && itemIdentity(saved) !== identity));
  saveCurrentOrder();
  renderLibrary();
  renderPlan();
}

function renderManagementBar() {
  const form = document.querySelector("#filterForm");
  if (!form) return;
  let bar = document.querySelector("#managementBar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "managementBar";
    bar.className = "management-bar";
    form.insertAdjacentElement("afterend", bar);
  }
  bar.innerHTML = `
    <button class="button secondary tiny" type="button" id="editLibraryButton">${editMode ? t("doneEditing") : t("editLibrary")}</button>
    ${editMode ? `<span class="edit-hint">${t("dragHint")}</span><button class="button quiet tiny" type="button" id="changePasswordButton">${t("changePassword")}</button>` : ""}
  `;
  const editButton = document.querySelector("#editLibraryButton");
  if (editButton) {
    editButton.addEventListener("click", function () {
      editMode = !editMode;
      renderManagementBar();
      renderLibrary();
    });
  }
  const passwordButton = document.querySelector("#changePasswordButton");
  if (passwordButton) {
    passwordButton.addEventListener("click", async function () { await changeDeletePassword(); });
  }
}

function addToPlan(item) {
  if (!item) {
    return;
  }
  const plan = getPlan();
  if (!plan.some(saved => saved.id === item.id)) {
    plan.push({ id: item.id, title: getDisplayTitle(item), category: item.category, note: item.note || item.summary || "", poster: item.poster || (getRule(item) && getRule(item).poster) || "", infoUrl: item.infoUrl || (getRule(item) && getRule(item).infoUrl) || "", summary: item.summary || (getRule(item) && getRule(item).summary) || "" });
    writeStorage(planKey, plan);
  }
}

function removeFromPlan(id) {
  writeStorage(planKey, getPlan().filter(item => item.id !== id));
}

function renderPlan() {
  const box = document.querySelector("#plannedList");
  if (!box) {
    return;
  }

  const ratings = getRatings();
  const plan = getPlan();
  if (plan.length === 0) {
    box.innerHTML = `<p class="muted">${t("emptyWatchlist")}</p>`;
    return;
  }

  box.innerHTML = plan.map(function (item) {
    return `
      <article class="media-item poster-card watchlist-card ${item.category === "Show" ? "show-item" : item.category === "Animation" ? "animation-item" : "movie-item"}">
        <div class="poster-surface ${item.category || "Movie"}" data-poster-id="${item.id}"><span>${getInitial(item.title)}</span></div>
        <div class="media-info">
          <h3>${getDisplayTitle(item)}</h3>
          <p>${getCategoryLabel(item.category || "Movie")} · ${getRatingLabel(item.id, ratings)}</p>
          <small class="credit-line" data-meta-id="${item.id}">${t("imdbLoading")}</small>
          <small class="summary-line" data-summary-id="${item.id}">${getLocalizedSummary(item, item.summary || item.note || t("waitingNote"))}</small>
          <div class="card-actions">
            <a class="button secondary tiny" href="${detailUrl(item.id)}">${t("details")}</a>
            <button class="button primary tiny" type="button" data-remove="${item.id}">${t("watched")}</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  box.querySelectorAll("[data-remove]").forEach(function (button) {
    button.addEventListener("click", function () {
      removeFromPlan(button.dataset.remove);
      renderPlan();
    });
  });
  enrichVisibleMedia(plan);
}

function setupIndex() {
  const form = document.querySelector("#filterForm");
  if (!form) {
    return;
  }

  const searchInput = document.querySelector("#searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", renderLibrary);
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    renderLibrary();
  });

  document.querySelectorAll("[data-category-chip]").forEach(function (button) {
    button.addEventListener("click", function () {
      activeCategory = button.dataset.categoryChip;
      document.querySelectorAll("[data-category-chip]").forEach(chip => chip.classList.remove("active"));
      button.classList.add("active");
      renderLibrary();
    });
  });

  const surpriseButton = document.querySelector("#surpriseButton");
  if (surpriseButton) {
    surpriseButton.addEventListener("click", function () {
      const items = filteredItems();
      if (items.length === 0) {
        return;
      }
      const item = items[Math.floor(Math.random() * items.length)];
      window.location.href = detailUrl(item.id);
    });
  }

  const refresh = document.querySelector("#refreshRecommendations");
  if (refresh) {
    refresh.addEventListener("click", function () {
      recommendationOffset += 1;
      renderRecommendations(filteredItems());
    });
  }

  renderManagementBar();
  renderLibrary();
}

function setupWatchlist() {
  if (!document.querySelector("#plannedList")) {
    return;
  }
  const clear = document.querySelector("#clearPlanButton");
  if (clear) {
    clear.addEventListener("click", function () {
      writeStorage(planKey, []);
      renderPlan();
    });
  }
  renderPlan();
}

function saveOnlineItem(item) {
  const selectedPoster = item && item.poster ? item.poster : "";
  const normalized = normalizeOnlineItem(item);
  if (selectedPoster && item.posterLocked) {
    normalized.poster = selectedPoster;
    normalized.posterLocked = true;
  }
  const identity = itemIdentity(normalized);
  const token = itemOrderToken(normalized);
  const hidden = getHiddenItems().filter(saved => saved !== normalized.id && saved !== identity && saved !== token);
  writeStorage(hiddenKey, hidden);
  const customItems = getCustomItems().filter(saved => saved.id !== normalized.id && itemIdentity(saved) !== identity);
  customItems.unshift(normalized);
  writeCustomItems(customItems);
  const order = getSavedOrder().filter(saved => saved !== token && saved !== normalized.id && saved !== identity);
  order.unshift(token);
  writeStorage(orderKey, order);
  mediaItems = applyLibraryPrefs([normalized].concat(mediaItems.filter(saved => saved.id !== normalized.id && itemIdentity(saved) !== identity)));
}

function renderOnlinePreview(item, saved) {
  const confirmButton = saved
    ? `<a class="button primary tiny" href="${detailUrl(item.id)}">${t("details")}</a>`
    : `<button class="button primary tiny" type="button" data-confirm-online="${item.id}">${currentLanguage === "zh" ? "确认加入" : "Confirm add"}</button>`;
  const savedLine = saved ? `<p class="muted">${getDisplayTitle(item)} ${t("confirmedAddHint")}.</p>` : `<p class="muted">${t("confirmAddHint")}</p>`;
  return `
    <article class="media-item poster-card online-result-card ${item.category === "Show" ? "show-item" : item.category === "Animation" ? "animation-item" : "movie-item"}">
      <div class="poster-surface ${item.category || "Movie"}" data-poster-id="${item.id}"><span>${getInitial(getDisplayTitle(item))}</span></div>
      <div class="media-info">
        <h3>${getDisplayTitle(item)}</h3>
        <p>${getCategoryLabel(item.category || "Movie")}</p>
        <small class="credit-line">${formatCardFacts(item)}</small>
        <small class="summary-line">${getLocalizedSummary(item, item.summary || t("waitingNote"))}</small>
        ${renderPosterPicker(item, saved)}
        <div class="card-actions">
          ${confirmButton}
          ${item.infoUrl ? `<a class="button secondary tiny" href="${item.infoUrl}" target="_blank" rel="noreferrer">${t("infoPage")}</a>` : ""}
          <a class="button secondary tiny" href="${homeUrl()}">${t("backHome")}</a>
        </div>
      </div>
    </article>
    ${savedLine}
  `;
}

function posterOptionUrls(item) {
  item = normalizeOnlineItem(item);
  const urls = [];
  const add = function (url) {
    const value = String(url || "").trim();
    if (value && !urls.includes(value)) urls.push(value);
  };
  [].concat((item && item.posterOptions) || []).forEach(add);
  add(item && item.poster);
  const known = getKnownOnlineItem(item);
  add(known && known.poster);
  const rule = getRule(item);
  add(rule && rule.poster);
  const doubanId = getDoubanId((item && (item.infoUrl || item.sourceUrl)) || "");
  add(doubanId && knownDoubanItems[doubanId] && knownDoubanItems[doubanId].poster);
  const imdbId = getImdbId((item && (item.infoUrl || item.id || item.title)) || "");
  if (imdbId) {
    add(`https://images.metahub.space/poster/medium/${imdbId}/img`);
    add(`https://images.metahub.space/background/medium/${imdbId}/img`);
  }
  return urls.slice(0, 6);
}

function renderPosterPicker(item, saved) {
  if (saved) return "";
  const options = posterOptionUrls(item);
  return `
    <div class="poster-picker">
      <strong>${t("posterPicker")}</strong>
      <div class="poster-choice-grid">
        ${options.map(function (url) {
          const active = url === item.poster ? " active" : "";
          return `<button class="poster-choice${active}" type="button" data-poster-choice="${encodeURIComponent(url)}" aria-label="${t("posterPicker")}"><span data-poster-preview="${encodeURIComponent(url)}"></span></button>`;
        }).join("")}
      </div>
      <div class="poster-url-row">
        <input id="posterUrlInput" type="url" placeholder="${t("posterUrlPlaceholder")}">
        <button class="button secondary tiny" type="button" data-apply-poster-url>${t("usePosterUrl")}</button>
      </div>
    </div>
  `;
}

function setupAddOnline() {
  const form = document.querySelector("#onlineAddForm");
  if (!form) {
    return;
  }
  const input = document.querySelector("#onlineTitle");
  const result = document.querySelector("#onlineResult");
  result.addEventListener("click", function (event) {
    const posterChoice = event.target.closest("[data-poster-choice]");
    if (posterChoice && pendingOnlineItem) {
      pendingOnlineItem.poster = decodeURIComponent(posterChoice.dataset.posterChoice || "");
      pendingOnlineItem.posterLocked = true;
      result.innerHTML = renderOnlinePreview(pendingOnlineItem, false);
      applyWikiInfo(pendingOnlineItem, {
        thumbnail: pendingOnlineItem.poster,
        rating: pendingOnlineItem.rating,
        releaseDate: pendingOnlineItem.releaseDate,
        director: pendingOnlineItem.director,
        cast: pendingOnlineItem.cast,
        extract: getLocalizedSummary(pendingOnlineItem, pendingOnlineItem.summary || "")
      });
      applyPosterChoicePreviews(result);
      return;
    }
    const applyPosterUrl = event.target.closest("[data-apply-poster-url]");
    if (applyPosterUrl && pendingOnlineItem) {
      const posterInput = result.querySelector("#posterUrlInput");
      const posterUrl = posterInput ? posterInput.value.trim() : "";
      if (!posterUrl) return;
      pendingOnlineItem.poster = posterUrl;
      pendingOnlineItem.posterLocked = true;
      result.innerHTML = renderOnlinePreview(pendingOnlineItem, false);
      applyWikiInfo(pendingOnlineItem, {
        thumbnail: pendingOnlineItem.poster,
        rating: pendingOnlineItem.rating,
        releaseDate: pendingOnlineItem.releaseDate,
        director: pendingOnlineItem.director,
        cast: pendingOnlineItem.cast,
        extract: getLocalizedSummary(pendingOnlineItem, pendingOnlineItem.summary || "")
      });
      applyPosterChoicePreviews(result);
      return;
    }
    const confirm = event.target.closest("[data-confirm-online]");
    if (!confirm || !pendingOnlineItem) return;
    saveOnlineItem(pendingOnlineItem);
    result.dataset.pending = "false";
    result.innerHTML = renderOnlinePreview(pendingOnlineItem, true);
    applyWikiInfo(pendingOnlineItem, {
      thumbnail: pendingOnlineItem.poster,
      rating: pendingOnlineItem.rating,
      releaseDate: pendingOnlineItem.releaseDate,
      director: pendingOnlineItem.director,
      cast: pendingOnlineItem.cast,
      extract: getLocalizedSummary(pendingOnlineItem, pendingOnlineItem.summary || "")
    });
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) {
      return;
    }
    if (!serverMode) {
      result.innerHTML = `<div class="lookup-panel"><strong>${currentLanguage === "zh" ? "搜索功能还没启动" : "Search is not running"}</strong><p>${currentLanguage === "zh" ? "请通过 Watch Vault 启动器打开网页。直接打开 add.html 时，浏览器不能在线查 IMDb 资料。" : "Open the page through the Watch Vault launcher. If you open add.html directly, the browser cannot search IMDb data."}</p></div>`;
      return;
    }
    result.innerHTML = `<p class="muted">${t("searching")}</p>`;
    try {
      const response = await fetch("/api/search-online?query=" + encodeURIComponent(query));
      const item = normalizeOnlineItem(await response.json());
      if (!response.ok || item.error) {
        throw new Error(item.error || t("searchFailed"));
      }
      pendingOnlineItem = item;
      result.dataset.pending = "true";
      result.innerHTML = renderOnlinePreview(item, false);
      applyPosterChoicePreviews(result);
      applyWikiInfo(item, await loadWikiInfo(item));
    } catch (error) {
      const message = error && error.message ? error.message : t("searchFailed");
      result.innerHTML = `
        <div class="lookup-panel">
          <strong>${currentLanguage === "zh" ? "没有添加成功" : "Nothing was added"}</strong>
          <p>${t("searchFailed")}</p>
          <small>${message}</small>
        </div>
      `;
    }
  });
}

function setupDetails() {
  const title = document.querySelector("#detailTitle");
  if (!title) {
    return;
  }

  const id = new URLSearchParams(window.location.search).get("id");
  let item = itemById(id) || getPlan().find(saved => saved.id === id);
  item = normalizeOnlineItem(item);
  if (!item) {
    title.textContent = currentLanguage === "zh" ? "没有找到这个条目" : "Item not found";
    document.querySelector("#detailPath").textContent = currentLanguage === "zh" ? "返回影视库再选一个。" : "Go back and choose another item.";
    return;
  }

  document.querySelector("#detailInitial").textContent = getInitial(item.title);
  document.querySelector("#detailPoster").classList.add(item.category || "Movie");
  document.querySelector("#detailCategory").textContent = getCategoryLabel(item.category);
  title.textContent = getDisplayTitle(item);
  document.querySelector("#detailSummary").textContent = t("loadingInfo");
  document.querySelector("#detailPath").textContent = item.note || (item.folder === "Online search" ? (currentLanguage === "zh" ? "通过在线资料添加到你的影视库。" : "Added from online lookup into your Watch Vault.") : t("localItem"));
  document.querySelector("#detailFolder").textContent = item.folder || t("manual");
  document.querySelector("#detailVersions").textContent = item.versions ? (currentLanguage === "zh" ? `${item.versions} 个合并文件` : `${item.versions} grouped file${item.versions > 1 ? "s" : ""}`) : t("manualItem");
  document.querySelector("#detailReason").textContent = getReason(item);
  const initialFacts = document.querySelector("#publicFacts");
  if (initialFacts) {
    initialFacts.innerHTML = formatPublicFacts(null);
  }

  document.querySelector("#planButton").addEventListener("click", function () {
    addToPlan(item);
    this.textContent = t("added");
  });

  const watch = document.querySelector("#watchNowButton");
  if (serverMode && diskConnected && item.path) {
    watch.classList.remove("hidden");
    watch.href = "#";
    watch.addEventListener("click", function (event) {
      event.preventDefault();
      watchPath(item.path);
    });
  }

  loadWikiInfo(item).then(function (info) {
    const summary = document.querySelector("#detailSummary");
    const poster = document.querySelector("#detailPoster");
    const infoButton = document.querySelector("#infoButton");
    const facts = document.querySelector("#publicFacts");
    if (facts) {
      facts.innerHTML = formatPublicFacts(info);
    }
    if (info && info.extract) {
      summary.textContent = info.extract;
    } else {
      summary.textContent = getReason(item);
    }
    if (info && info.thumbnail) {
      applyPosterImage(poster, info.thumbnail, "linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.72))");
    }
    if (info && info.url) {
      infoButton.href = info.url;
      infoButton.classList.remove("hidden");
    }
  });

  renderRatingButtons(item.id);
}

function getReason(item) {
  if (item.category === "Animation") {
    return t("animationReason");
  }
  if (item.category === "Show") {
    return t("showReason");
  }
  return t("movieReason");
}

function renderRatingButtons(id) {
  const box = document.querySelector("#ratingButtons");
  if (!box) {
    return;
  }
  const ratings = getRatings();
  const current = ratings[id] || 0;
  box.innerHTML = "";
  for (let score = 1; score <= 5; score += 1) {
    const button = document.createElement("button");
    button.className = "star-button";
    button.type = "button";
    button.textContent = score <= current ? "★" : "☆";
    button.addEventListener("click", function () {
      ratings[id] = score;
      writeStorage(ratingKey, ratings);
      renderRatingButtons(id);
    });
    box.appendChild(button);
  }
}

function getWikiSlug(item) {
  return null;
}

async function fetchPublicInfo(item, info) {
  if (!serverMode || !info.url || !info.url.includes("imdb.com/title/")) {
    return info;
  }
  const keepLocalizedExtract = function (nextExtract) {
    if (currentLanguage === "zh") {
      return info.extract;
    }
    return isGenericSummary(nextExtract) || /^Public metadata is limited/i.test(String(nextExtract || ""))
      ? info.extract
      : nextExtract || info.extract;
  };
  const cache = getPublicInfoCache();
  if (cache[info.url]) {
    const cached = cache[info.url];
    return Object.assign({}, info, {
      rating: cached.rating || info.rating,
      releaseDate: cached.releaseDate || info.releaseDate,
      director: cached.director && cached.director.length ? cached.director : info.director,
      directorEn: info.directorEn || [],
      cast: cached.cast && cached.cast.length ? cached.cast : info.cast,
      castEn: info.castEn || [],
      ratingSource: cached.ratingSource || info.ratingSource || ratingSourceLabel(info),
      thumbnail: info.thumbnail || cached.poster || cached.thumbnail || "",
      extract: keepLocalizedExtract(cached.description || cached.extract)
    });
  }
  try {
    const response = await fetch("/api/imdb-info?url=" + encodeURIComponent(info.url));
    if (!response.ok) {
      return info;
    }
    const publicInfo = await response.json();
    cache[info.url] = publicInfo;
    savePublicInfoCache(cache);
    return Object.assign({}, info, {
      rating: publicInfo.rating || info.rating,
      releaseDate: publicInfo.releaseDate || info.releaseDate,
      director: publicInfo.director && publicInfo.director.length ? publicInfo.director : info.director,
      directorEn: info.directorEn || [],
      cast: publicInfo.cast && publicInfo.cast.length ? publicInfo.cast : info.cast,
      castEn: info.castEn || [],
      ratingSource: publicInfo.ratingSource || info.ratingSource || ratingSourceLabel(info),
      thumbnail: info.thumbnail || publicInfo.poster || publicInfo.thumbnail || "",
      extract: keepLocalizedExtract(publicInfo.description)
    });
  } catch (error) {
    return info;
  }
}

async function loadWikiInfo(item) {
  const rule = getRule(item);
  if (!rule) {
    return null;
  }
  const itemFacts = {
    rating: item.rating || "",
    releaseDate: item.releaseDate || "",
    director: item.director || [],
    directorEn: item.directorEn || [],
    cast: item.cast || [],
    castEn: item.castEn || [],
    ratingSource: item.ratingSource || ""
  };
  const facts = Object.assign(itemFacts, getFactRule(item) || {});
  const info = Object.assign({
    title: rule.canonicalTitle || item.title,
    extract: getLocalizedSummary(item, rule.summary || ""),
    thumbnail: rule.poster || "",
    url: rule.infoUrl || "",
  }, facts);
  return fetchPublicInfo(item, info);
}

function proxiedPosterUrl(url) {
  const value = String(url || "");
  if (!value || !serverMode) return value;
  if (value.includes("doubanio.com") || value.includes("douban.com")) {
    return "/api/image-proxy?url=" + encodeURIComponent(value);
  }
  return value;
}

function applyPosterImage(element, url, shade) {
  if (!element || !url) {
    return;
  }
  const safeUrl = proxiedPosterUrl(url);
  const image = new Image();
  image.onload = function () {
    const overlay = shade || "linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.72))";
    element.style.backgroundImage = `${overlay}, url("${safeUrl}")`;
    element.classList.add("poster-loaded");
  };
  image.onerror = function () {
    element.classList.remove("poster-loaded");
  };
  image.src = safeUrl;
}

function applyPosterChoicePreviews(scope) {
  const root = scope || document;
  root.querySelectorAll("[data-poster-preview]").forEach(function (preview) {
    const url = decodeURIComponent(preview.dataset.posterPreview || "");
    if (url) applyPosterImage(preview, url, "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.12))");
  });
}

function applyWikiInfo(item, info) {
  if (!info) {
    return;
  }
  document.querySelectorAll(`[data-poster-id="${item.id}"]`).forEach(function (poster) {
    if (info.thumbnail) {
      applyPosterImage(poster, info.thumbnail, "linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.72))");
    }
  });
  document.querySelectorAll(`[data-meta-id="${item.id}"]`).forEach(function (meta) {
    meta.innerHTML = formatCardFacts(info);
  });
  document.querySelectorAll(`[data-summary-id="${item.id}"]`).forEach(function (summary) {
    if (info.extract) {
      summary.textContent = currentLanguage === "zh" ? info.extract : info.extract.split(". ").slice(0, 2).join(". ");
    }
  });
}

function enrichVisibleMedia(items) {
  items.forEach(function (item) {
    loadWikiInfo(item).then(function (info) {
      applyWikiInfo(item, info);
    });
  });
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach(function (element) {
    element.textContent = value;
  });
}

function setPlaceholder(selector, value) {
  document.querySelectorAll(selector).forEach(function (element) {
    element.placeholder = value;
    element.setAttribute("aria-label", value);
  });
}

function applyLanguageStatic() {
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
  setText(".brand span:last-child", t("brand"));
  const languageSelect = document.querySelector("#languageSelect");
  if (languageSelect) languageSelect.value = currentLanguage;
  setText("#themeToggle", t("themeButton"));
  setText("#backToTop", `⌃ ${t("backToTop")}`);
  setText('.nav-links a[href^="watchlist.html"]', t("watchlist"));
  setText('.nav-links a[href^="add.html"]', t("addShow"));
  setText('.nav-links a[href^="index.html"]', t("library"));
  setPlaceholder("#searchInput", t("searchPlaceholder"));
  setText('[data-category-chip=""]', t("all"));
  setText('[data-category-chip="Movie"]', t("movies"));
  setText('[data-category-chip="Show"]', t("tvSeries"));
  setText('[data-category-chip="Animation"]', t("animation"));
  setText("#surpriseButton", t("surprise"));
  setText("#refreshRecommendations", t("refresh"));
  const statLabels = document.querySelectorAll(".stats-strip span");
  if (statLabels.length >= 4) {
    statLabels[0].textContent = t("cleanTitles");
    statLabels[1].textContent = t("movies");
    statLabels[2].textContent = t("shows");
    statLabels[3].textContent = t("animation");
  }
  const recommendation = document.querySelector(".recommendations .eyebrow");
  if (recommendation) recommendation.textContent = t("recommendation");
  const start = document.querySelector(".recommendations h2");
  if (start) start.textContent = t("startHere");
  const movieHead = document.querySelector("#movies h2");
  if (movieHead) movieHead.textContent = t("filmShelf");
  const showHead = document.querySelector("#shows h2");
  if (showHead) showHead.textContent = t("seriesShelf");
  const animationHead = document.querySelector("#animations h2");
  if (animationHead) animationHead.textContent = t("animationShelf");
  setText(".jump-link", t("backToSearch"));
  const foot = document.querySelectorAll(".footer span");
  if (foot.length >= 2) {
    foot[0].textContent = t("footerLeft");
    foot[1].textContent = t("footerRight");
  }
  const watchlistEyebrow = document.querySelector(".watchlist-page .eyebrow");
  if (watchlistEyebrow) watchlistEyebrow.textContent = t("watchlist");
  const watchlistTitle = document.querySelector(".watchlist-page h2");
  if (watchlistTitle) watchlistTitle.textContent = t("waitingRoom");
  setText("#clearPlanButton", t("clearWatchlist"));
  const addEyebrow = document.querySelector(".add-online-page .eyebrow");
  if (addEyebrow) addEyebrow.textContent = t("addShow");
  const addTitle = document.querySelector(".add-online-page h2");
  if (addTitle) addTitle.textContent = t("addSearchTitle");
  const addLabel = document.querySelector('label[for="onlineTitle"]');
  if (addLabel) addLabel.textContent = t("addSearchLabel");
  setPlaceholder("#onlineTitle", t("addPlaceholder"));
  const addButton = document.querySelector("#onlineAddForm .primary");
  if (addButton) addButton.textContent = t("findAndAdd");
  const addHint = document.querySelector("#onlineAddForm .muted");
  if (addHint) addHint.textContent = t("addHint");
  const backHome = document.querySelector('.detail-top a[href^="index.html"]');
  if (backHome) backHome.textContent = t("backHome");
  setText("#planButton", t("addToWatchlist"));
  setText("#watchNowButton", t("watchNow"));
  setText("#infoButton", t("infoPage"));
  const ratingTitle = document.querySelector(".rating-box strong");
  if (ratingTitle) ratingTitle.textContent = t("yourRating");
  const dts = document.querySelectorAll(".detail-info dt");
  if (dts.length >= 3) {
    dts[0].textContent = t("folder");
    dts[1].textContent = t("filesGrouped");
    dts[2].textContent = t("recommendationReason");
  }
}

function setupLanguage() {
  applyLanguageStatic();
  const select = document.querySelector("#languageSelect");
  if (!select) {
    return;
  }
  select.value = currentLanguage;
  select.addEventListener("change", function () {
    currentLanguage = select.value;
    localStorage.setItem(languageKey, currentLanguage);
    mediaItems = applyLibraryPrefs(mediaItems.map(normalizeOnlineItem));
    writeCustomItems(getCustomItems());
    applyLanguageStatic();
    renderManagementBar();
    renderLibrary();
    renderPlan();
    setupDetails();
  });
}

function setupBackToTop() {
  const button = document.querySelector("#backToTop");
  if (!button) return;
  const update = function () {
    const middlePoint = Math.max(900, (document.documentElement.scrollHeight - window.innerHeight) * 0.45);
    button.classList.toggle("hidden", window.scrollY < middlePoint);
  };
  window.addEventListener("scroll", update, { passive: true });
  button.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  update();
}

function setupTheme() {
  const saved = localStorage.getItem(themeKey) || "dark";
  document.body.classList.toggle("theme-alt", saved === "alt");
  const button = document.querySelector("#themeToggle");
  if (!button) {
    return;
  }
  button.textContent = t("themeButton");
  button.addEventListener("click", function () {
    const next = document.body.classList.toggle("theme-alt") ? "alt" : "dark";
    localStorage.setItem(themeKey, next);
    button.textContent = t("themeButton");
  });
}

async function boot() {
  setupTheme();
  setupLanguage();
  await loadCatalog();
  updateDiskStatus();
  setupIndex();
  setupWatchlist();
  setupAddOnline();
  setupDetails();
  setupBackToTop();
}

boot();
