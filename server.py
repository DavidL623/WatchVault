from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, quote_plus, unquote, urlparse
import hashlib
import json
import os
import platform
import re
import subprocess
import ssl
from html import unescape
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", "/Volumes/D"))
MEDIA_FOLDERS = ["电影中转站", "Movie Series", "精品电影", "犯罪电影", "Marvel", "Animations", "TV Series"]
VIDEO_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".m4v", ".wmv", ".webm", ".rmvb"}
CURRENT_YEAR = 2026


def remove_release_years(title):
    def replace_year(match):
        year = int(match.group(0))
        if 1900 <= year <= CURRENT_YEAR:
            return " "
        return match.group(0)

    return re.sub(r"(?<!\d)(19\d{2}|20\d{2})(?!\d)", replace_year, title)


def clean_title(text, keep_episode=False):
    title = Path(text).stem if "." in Path(text).name else str(text)
    title = re.sub(r"\[[^\]]*(?:\]|$)|【[^】]*(?:】|$)|\([^)]*圣城[^)]*\)", " ", title)
    title = title.replace(".", " ").replace("_", " ").replace("-", " ")

    if not keep_episode:
        title = re.sub(r"S\d{1,2}E\d{1,2}.*", " ", title, flags=re.I)
        title = re.sub(r"Season\s*\d+.*", " ", title, flags=re.I)
        title = re.sub(r"EP\d{1,2}\s*\d{1,2}.*", " ", title, flags=re.I)
        title = re.sub(r"第[一二三四五六七八九十\d]+季", " ", title)
        title = re.sub(r"第\d+集.*", " ", title)

    title = re.sub(r"\b(480p|720p|1080p|2160p|hd1080p|4k|uhd|hdr10p|hdr|sdr|bluray|blu ray|web dl|webrip|hdtv|hbomax|amzn|bd|aoc|99mp4)\b", " ", title, flags=re.I)
    title = re.sub(r"(?<![A-Za-z])(?:720|1080|2160)(?![A-Za-z])", " ", title)
    title = re.sub(r"\b(x264|x265|h264|h265|hevc|aac|ac3|truehd|atmos|dts|ddp5?1?|ddp|dv|10bit|rarbg|wiki|hdwing|cinefile|minihd|bdys|cnscg|blacktv|2audio|3audio|english|chs|eng|official|bt世界|www|btsj5|com)\b", " ", title, flags=re.I)
    title = re.sub(r"BD中英双字|中英双字|简英双语.*|国英双语|官方中字|双语|特效|中字|高清|无水印|圣城南宫|周年版|分辨率", " ", title, flags=re.I)
    title = remove_release_years(title)
    title = re.sub(r"\s+", " ", title).strip(" ._-·")
    return title or "Untitled"


def categorize(path, top_folder):
    text = str(path).lower()
    if top_folder == "Animations" or any(word in text for word in ["animation", "anime", "动画", "进击", "darling", "spider verse", "spider.man", "平行宇宙", "假如", "what if"]):
        return "Animation"
    if top_folder == "TV Series" or re.search(r"s\d{1,2}e\d{1,2}|season\s*\d+|ep\d{1,2}|第\d+集|第[一二三四五六七八九十]+集", text, re.I):
        return "Show"
    return "Movie"


def path_parts_after(path, top_folder):
    parts = list(path.parts)
    try:
        index = parts.index(top_folder)
        return parts[index + 1:]
    except ValueError:
        return [path.name]


def raw_display_title(path, top_folder, category):
    rest = path_parts_after(path, top_folder)
    if category in {"Show", "Animation"} and len(rest) > 1:
        return rest[0]
    return path.name


def extract_season_episode(path):
    text = str(path)
    file_name = path.name
    season = None
    episode = None

    match = re.search(r"S(\d{1,2})\s*E(\d{1,2})", text, re.I)
    if match:
        season = int(match.group(1))
        episode = int(match.group(2))
    else:
        match = re.search(r"Season\s*(\d{1,2})", text, re.I)
        if match:
            season = int(match.group(1))
        match = re.search(r"(?:^|[^A-Za-z])E(\d{1,2})(?:[^\d]|$)", file_name, re.I)
        if match:
            episode = int(match.group(1))

    if season is None:
        match = re.search(r"第([一二三四五六七八九十\d]+)季", text)
        if match:
            season = chinese_number(match.group(1))

    if episode is None:
        match = re.search(r"第(\d+)集", text)
        if match:
            episode = int(match.group(1))

    season = season or 1
    return season, episode


def chinese_number(value):
    digits = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}
    if value.isdigit():
        return int(value)
    if value == "十":
        return 10
    if "十" in value:
        left, _, right = value.partition("十")
        return (digits.get(left, 1) * 10) + digits.get(right, 0)
    return digits.get(value, 1)


def episode_label(path, season, episode):
    cleaned = clean_title(path.name, keep_episode=True)
    if episode is not None:
        return f"Episode {episode:02d}"
    if cleaned and cleaned != "Untitled":
        return cleaned
    return f"Season {season} file"


def group_key(category, title):
    simple = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff]+", "", title).lower()
    return f"{category}:{simple}"


def add_episode(item, path_text):
    path = Path(path_text)
    season, episode = extract_season_episode(path)
    episode_id = hashlib.sha1(path_text.encode("utf-8")).hexdigest()[:14]
    item["episodes"].append({
        "id": episode_id,
        "season": season,
        "episode": episode,
        "label": episode_label(path, season, episode),
        "path": path_text,
    })


def scan_catalog():
    grouped = {}
    if not MEDIA_ROOT.exists():
        return {"diskConnected": False, "root": str(MEDIA_ROOT), "items": []}

    for folder_name in MEDIA_FOLDERS:
        folder = MEDIA_ROOT / folder_name
        if not folder.exists():
            continue

        for current_root, dirs, files in os.walk(folder):
            dirs[:] = [d for d in dirs if not d.startswith(".") and d != "__MACOSX"]
            for file_name in files:
                if file_name.startswith(".") or file_name.startswith("._"):
                    continue
                path = Path(current_root) / file_name
                if path.suffix.lower() not in VIDEO_EXTENSIONS:
                    continue

                category = categorize(path, folder_name)
                title = clean_title(raw_display_title(path, folder_name, category))
                key = group_key(category, title)
                path_text = str(path)

                if key not in grouped:
                    grouped[key] = {
                        "id": hashlib.sha1(key.encode("utf-8")).hexdigest()[:14],
                        "title": title,
                        "category": category,
                        "folder": folder_name,
                        "path": path_text,
                        "paths": [],
                        "versions": 0,
                        "episodes": [],
                    }

                grouped[key]["paths"].append(path_text)
                grouped[key]["versions"] += 1
                if category == "Show":
                    add_episode(grouped[key], path_text)

    for item in grouped.values():
        if item["episodes"]:
            seen = set()
            unique = []
            for episode in sorted(item["episodes"], key=lambda e: (e["season"], e["episode"] or 9999, e["label"])):
                key = (episode["season"], episode["episode"], episode["path"])
                if key not in seen:
                    seen.add(key)
                    unique.append(episode)
            item["episodes"] = unique
            item["seasonCount"] = len({episode["season"] for episode in unique})
        else:
            item["seasonCount"] = 0

    items = sorted(grouped.values(), key=lambda item: (item["category"], item["title"].lower()))
    return {"diskConnected": True, "root": str(MEDIA_ROOT), "items": items}


def open_file(path_text):
    path = Path(unquote(path_text)).resolve()
    root = MEDIA_ROOT.resolve()
    if root not in path.parents and path != root:
        return False, "Blocked: file is outside disk D."
    if not path.exists():
        return False, "File not found. Is disk D connected?"

    system = platform.system()
    if system == "Darwin":
        subprocess.Popen(["open", str(path)])
    elif system == "Windows":
        os.startfile(str(path))
    else:
        subprocess.Popen(["xdg-open", str(path)])
    return True, "Opening file."


def fetch_text(url):
    request = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
        "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Referer": "https://movie.douban.com/",
        "X-Requested-With": "XMLHttpRequest",
    })

    def read_with(context=None):
        with urlopen(request, timeout=18, context=context) as response:
            return response.read().decode("utf-8", errors="replace")

    try:
        return read_with()
    except URLError as error:
        # Some local Python installs on macOS do not have a working CA bundle.
        # Retry only for this local metadata lookup instead of creating fake IMDb-title cards.
        if "CERTIFICATE_VERIFY_FAILED" not in str(error):
            raise
        return read_with(ssl._create_unverified_context())


def fetch_binary(url):
    request = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://movie.douban.com/",
        "Cache-Control": "no-cache",
    })

    def read_with(context=None):
        with urlopen(request, timeout=18, context=context) as response:
            return response.read(), response.headers.get("Content-Type", "image/jpeg")

    try:
        return read_with()
    except URLError as error:
        if "CERTIFICATE_VERIFY_FAILED" not in str(error):
            raise
        return read_with(ssl._create_unverified_context())


def first_match(patterns, text):
    for pattern in patterns:
        match = re.search(pattern, text, re.I | re.S)
        if match:
            return unescape(match.group(1)).strip()
    return ""


def absolute_tmdb_url(path):
    if path.startswith("http"):
        return path
    return "https://www.themoviedb.org" + path


def clean_tmdb_title(title):
    title = re.sub(r"\s*[|–-]\s*The Movie Database.*$", "", title, flags=re.I)
    title = re.sub(r"\s*\(TV Series.*?\)", "", title, flags=re.I)
    title = re.sub(r"\s+", " ", title).strip()
    return title


def fetch_json(url):
    return json.loads(fetch_text(url))


def normalize_people(value):
    if not value or value == "N/A":
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [part.strip() for part in str(value).split(",") if part.strip()]


def category_from_details(kind="", genres=None, imdb_type=""):
    genres = genres or []
    genre_text = " ".join(genres).lower() if isinstance(genres, list) else str(genres).lower()
    kind_text = f"{kind} {imdb_type}".lower()
    if "animation" in genre_text or "anime" in genre_text:
        return "Animation"
    if "series" in kind_text or "tv" in kind_text:
        return "Show"
    return "Movie"


def clean_image_url(url):
    if not url:
        return ""
    value = str(url).strip().replace("&amp;", "&")
    # IMDb/Amazon image URLs often contain size-limited fragments like ._V1_UX300_.jpg.
    # Keep the host URL, but ask for the original-sized IMDb image when possible.
    value = re.sub(r"\._V1_.*?(\.[A-Za-z]{3,4})(?:\?.*)?$", r"._V1_\1", value)
    return value


def poster_option_list(*values):
    result = []

    def add(value):
        if isinstance(value, list):
            for item in value:
                add(item)
            return
        cleaned = clean_image_url(value)
        if cleaned and cleaned not in result:
            result.append(cleaned)

    for value in values:
        add(value)
    return result[:8]


def minimal_imdb_info(imdb_id):
    return {
        "title": f"IMDb title {imdb_id}",
        "rating": "",
        "releaseDate": "",
        "director": [],
        "cast": [],
        "description": "Saved from an IMDb link. Public metadata sources could not be reached, but the item is still addable and linked to IMDb.",
        "poster": f"https://images.metahub.space/poster/medium/{imdb_id}/img",
        "genre": [],
        "type": "Movie",
    }


KNOWN_TITLE_ALIASES = {
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
    "金刚狼3：殊死一战": "tt3315342",
}


KNOWN_DOUBAN_SUBJECTS = {}
DOUBAN_DIRECT_FALLBACKS = {
    "30176393": {
        "title": "误杀",
        "titleZh": "误杀",
        "titleEn": "Sheep Without a Shepherd",
        "rating": "7.5",
        "releaseDate": "2019",
        "director": ["柯汶利"],
        "directorEn": ["Sam Quah"],
        "cast": ["肖央", "谭卓", "陈冲", "姜皓文"],
        "castEn": ["Xiao Yang", "Tan Zhuo", "Joan Chen", "Philip Keung"],
        "poster": "https://images.metahub.space/poster/medium/tt11210032/img",
        "description": "李维杰为了保护家人，被迫卷入一场失控的掩盖与追查。他凭借从电影里学来的犯罪知识，与警方展开心理较量。",
        "summaryEn": "Li Weijie is forced into a spiraling cover-up to protect his family. Using what he has learned from crime films, he enters a tense psychological battle with the police as every detail threatens to expose the truth.",
        "summaryZh": "李维杰为了保护家人，被迫卷入一场失控的掩盖与追查。他凭借从电影里学来的犯罪知识，与警方展开心理较量。",
        "genre": ["剧情", "犯罪", "悬疑"],
        "type": "Movie",
    },
    "26580232": {
        "title": "看不见的客人",
        "titleZh": "看不见的客人",
        "titleEn": "The Invisible Guest",
        "rating": "8.8",
        "releaseDate": "2016",
        "director": ["奥里奥尔·保罗"],
        "directorEn": ["Oriol Paulo"],
        "cast": ["马里奥·卡萨斯", "阿娜·瓦格纳", "何塞·科罗纳多", "芭芭拉·蓝妮"],
        "castEn": ["Mario Casas", "Ana Wagener", "Jose Coronado", "Barbara Lennie"],
        "poster": "https://images.metahub.space/poster/medium/tt4857264/img",
        "description": "一名事业有成的商人被控谋杀情人，他与资深辩护顾问在有限时间内复盘案情，却发现每个细节都可能反转真相。",
        "summaryEn": "A successful businessman is accused of murdering his lover. With time running out, he works with a seasoned defense adviser to piece the case back together, only to find that every small detail may turn the truth in a new direction.",
        "summaryZh": "一名事业有成的商人被控谋杀情人，他与资深辩护顾问在有限时间内复盘案情，却发现每个细节都可能反转真相。",
        "genre": ["剧情", "悬疑", "犯罪"],
        "type": "Movie",
    },
    "30334073": {
        "title": "调音师",
        "titleZh": "调音师",
        "titleEn": "Andhadhun",
        "rating": "8.2",
        "releaseDate": "2018",
        "director": ["斯里兰姆·拉格万"],
        "directorEn": ["Sriram Raghavan"],
        "cast": ["阿尤斯曼·库拉纳", "塔布", "拉迪卡·艾普特", "安尔·德霍万"],
        "castEn": ["Ayushmann Khurrana", "Tabu", "Radhika Apte", "Anil Dhawan"],
        "poster": "https://images.metahub.space/poster/medium/tt8108198/img",
        "description": "假装失明的钢琴师阿卡什意外卷入一场谋杀案，谎言、贪念和偶然不断升级，让他陷入越来越危险的黑色喜剧迷局。",
        "summaryEn": "Akash, a pianist pretending to be blind, is accidentally pulled into a murder case. Lies, greed, and chance keep piling up around him, turning his life into an increasingly dangerous dark-comedy trap.",
        "summaryZh": "假装失明的钢琴师阿卡什意外卷入一场谋杀案，谎言、贪念和偶然不断升级，让他陷入越来越危险的黑色喜剧迷局。",
        "genre": ["喜剧", "悬疑", "犯罪"],
        "type": "Movie",
    },
    "4942776": {
        "title": "武侠",
        "titleZh": "武侠",
        "titleEn": "Dragon",
        "rating": "6.7",
        "releaseDate": "2011",
        "director": ["陈可辛"],
        "directorEn": ["Peter Chan"],
        "cast": ["甄子丹", "金城武", "汤唯", "王羽", "惠英红"],
        "castEn": ["Donnie Yen", "Takeshi Kaneshiro", "Tang Wei", "Jimmy Wang Yu", "Kara Wai"],
        "poster": "https://images.metahub.space/poster/medium/tt1718199/img",
        "description": "1917年西南边陲，村民刘金喜意外击毙两名劫匪，却引来捕快徐百九的怀疑。随着调查深入，金喜隐藏的身份和村庄危机逐渐浮出水面。",
        "summaryEn": "In a border village in southwest China in 1917, Liu Jinxi becomes a local hero after unexpectedly killing two robbers. But detective Xu Baijiu grows suspicious, and as the investigation deepens, Jinxi's hidden identity and the danger facing the village begin to surface.",
        "summaryZh": "1917年西南边陲，村民刘金喜意外击毙两名劫匪，却引来捕快徐百九的怀疑。随着调查深入，金喜隐藏的身份和村庄危机逐渐浮出水面。",
        "genre": ["剧情", "动作", "悬疑", "武侠"],
        "type": "Movie",
    },
}

def title_alias_key(value):
    key = str(value or "").lower()
    key = re.sub(r"[：:]", " ", key)
    key = re.sub(r"[^\w\u4e00-\u9fff]+", " ", key)
    return re.sub(r"\s+", " ", key).strip()


DOUBAN_TITLE_ENRICHMENTS = {
    "误杀": DOUBAN_DIRECT_FALLBACKS["30176393"],
    "sheep without a shepherd": DOUBAN_DIRECT_FALLBACKS["30176393"],
    "看不见的客人": DOUBAN_DIRECT_FALLBACKS["26580232"],
    "the invisible guest": DOUBAN_DIRECT_FALLBACKS["26580232"],
    "contratiempo": DOUBAN_DIRECT_FALLBACKS["26580232"],
    "调音师": DOUBAN_DIRECT_FALLBACKS["30334073"],
    "andhadhun": DOUBAN_DIRECT_FALLBACKS["30334073"],
    "武侠": DOUBAN_DIRECT_FALLBACKS["4942776"],
    "wu xia": DOUBAN_DIRECT_FALLBACKS["4942776"],
    "dragon": DOUBAN_DIRECT_FALLBACKS["4942776"],
}


def douban_title_enrichment(data=None, subject_id=""):
    if subject_id and subject_id in DOUBAN_DIRECT_FALLBACKS:
        return dict(DOUBAN_DIRECT_FALLBACKS[subject_id])
    data = data or {}
    for key in ("title", "titleZh", "titleEn", "name", "originalTitle", "original_title"):
        alias = title_alias_key(data.get(key, ""))
        if alias and alias in DOUBAN_TITLE_ENRICHMENTS:
            return dict(DOUBAN_TITLE_ENRICHMENTS[alias])
    return {}


def merge_douban_enrichment(data=None, subject_id=""):
    merged = dict(data or {})
    enrichment = douban_title_enrichment(merged, subject_id)
    if not enrichment:
        return merged
    for key in ("titleZh", "titleEn", "summaryEn", "summaryZh", "directorEn", "castEn", "genre", "type"):
        if enrichment.get(key):
            merged[key] = enrichment[key]
    for key in ("title", "rating", "releaseDate", "director", "cast", "description"):
        if not merged.get(key) and enrichment.get(key):
            merged[key] = enrichment[key]
    current_poster = str(merged.get("poster") or "")
    if enrichment.get("poster") and (not current_poster or "doubanio.com" in current_poster or "douban.com" in current_poster):
        merged["poster"] = enrichment["poster"]
    return merged


def imdb_id_from_known_title(value):
    return KNOWN_TITLE_ALIASES.get(title_alias_key(value), "")


def static_imdb_info(imdb_id):
    seeds = {
        "tt2861424": {
            "title": "Rick and Morty",
            "titleZh": "瑞克和莫蒂",
            "rating": "9.1",
            "releaseDate": "2013",
            "director": ["Dan Harmon", "Justin Roiland"],
            "cast": ["Chris Parnell", "Spencer Grammer", "Sarah Chalke", "Ian Cardoni"],
            "description": "Brilliant but reckless scientist Rick Sanchez drags his anxious grandson Morty across dimensions, turning family life into a chaotic mix of sci-fi disasters, dark comedy, and strange cosmic trouble.",
            "summaryZh": "天才但疯狂的科学家瑞克带着外孙莫蒂穿越不同维度，把普通家庭生活变成科幻灾难、黑色幽默和宇宙级麻烦的混合体。",
            "poster": "https://images.metahub.space/poster/medium/tt2861424/img",
            "genre": ["Animation", "Adventure", "Comedy"],
            "type": "TVSeries",
        },
        "tt7286456": {
            "title": "Joker",
            "titleZh": "小丑",
            "rating": "8.3",
            "releaseDate": "2019",
            "director": ["Todd Phillips"],
            "cast": ["Joaquin Phoenix", "Robert De Niro", "Zazie Beetz", "Frances Conroy"],
            "description": "Arthur Fleck is pushed from isolation and humiliation into a violent transformation that shakes Gotham City.",
            "summaryZh": "亚瑟·弗莱克在贫困、孤立和社会羞辱中逐渐崩溃，最终化身小丑，引爆哥谭市压抑已久的混乱。",
            "poster": "https://images.metahub.space/poster/medium/tt7286456/img",
            "genre": ["Crime", "Drama", "Thriller"],
            "type": "Movie",
        },
        "tt0468569": {
            "title": "The Dark Knight",
            "titleZh": "蝙蝠侠：黑暗骑士",
            "rating": "9.1",
            "releaseDate": "2008",
            "director": ["Christopher Nolan"],
            "cast": ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
            "description": "Batman, James Gordon, and Harvey Dent are pushed to their limits when the Joker unleashes chaos across Gotham City.",
            "summaryZh": "小丑在哥谭制造混乱与恐惧，蝙蝠侠、戈登和哈维·丹特被迫面对秩序、正义与牺牲的极限。",
            "poster": "https://images.metahub.space/poster/medium/tt0468569/img",
            "genre": ["Action", "Crime", "Drama"],
            "type": "Movie",
        },
        "tt5700672": {
            "title": "Train to Busan",
            "titleZh": "釜山行",
            "rating": "7.6",
            "releaseDate": "2016",
            "director": ["Yeon Sang-ho"],
            "cast": ["Gong Yoo", "Jung Yu-mi", "Ma Dong-seok", "Kim Su-an"],
            "description": "While a zombie virus breaks out in South Korea, passengers fight to survive on a high-speed train from Seoul to Busan.",
            "summaryZh": "韩国爆发丧尸病毒后，一列从首尔开往釜山的高速列车成为幸存者求生的封闭战场。",
            "poster": "https://images.metahub.space/poster/medium/tt5700672/img",
            "genre": ["Action", "Horror", "Thriller"],
            "type": "Movie",
        },
        "tt0910970": {
            "title": "WALL·E",
            "titleZh": "机器人总动员",
            "rating": "8.4",
            "releaseDate": "2008",
            "director": ["Andrew Stanton"],
            "cast": ["Ben Burtt", "Elissa Knight", "Jeff Garlin", "Fred Willard"],
            "description": "A lonely waste-collecting robot on an abandoned Earth discovers love, curiosity, and a chance to help humanity return home.",
            "summaryZh": "孤独的清洁机器人在被遗弃的地球上遇见探测机器人EVE，并意外卷入人类重返家园的希望。",
            "poster": "https://images.metahub.space/poster/medium/tt0910970/img",
            "genre": ["Animation", "Adventure", "Family"],
            "type": "Movie",
        },
        "tt30144839": {
            "title": "One Battle After Another",
            "titleZh": "一战再战",
            "rating": "8.1",
            "releaseDate": "2025",
            "director": ["Paul Thomas Anderson"],
            "cast": ["Leonardo DiCaprio", "Sean Penn", "Benicio Del Toro", "Regina Hall"],
            "description": "A former revolutionary is pulled back into danger when an old enemy resurfaces and his daughter becomes the center of the fight.",
            "summaryZh": "一名前革命者在宿敌再度现身后被迫重回危险局势，他的女儿也被卷入这场混乱的追逐与对抗。",
            "poster": "https://images.metahub.space/poster/medium/tt30144839/img",
            "genre": ["Action", "Crime", "Drama"],
            "type": "Movie",
        },
        "tt0347149": {
            "title": "Howl's Moving Castle",
            "titleZh": "哈尔的移动城堡",
            "rating": "8.2",
            "releaseDate": "2004",
            "director": ["Hayao Miyazaki"],
            "cast": ["Chieko Baisho", "Takuya Kimura", "Akihiro Miwa", "Tatsuya Gashuin"],
            "description": "A young woman cursed with an old body seeks help from the mysterious wizard Howl and his walking castle.",
            "summaryZh": "被诅咒变成老妇人的少女苏菲，走进魔法师哈尔的移动城堡，在战争与魔法中寻找自我与爱。",
            "poster": "https://images.metahub.space/poster/medium/tt0347149/img",
            "genre": ["Animation", "Adventure", "Family"],
            "type": "Movie",
        },
        "tt12042730": {
            "title": "Project Hail Mary",
            "titleZh": "挽救计划",
            "rating": "8.3",
            "releaseDate": "2026",
            "director": ["Phil Lord", "Christopher Miller"],
            "cast": ["Ryan Gosling", "Sandra Huller", "James Ortiz", "Lionel Boyce"],
            "description": "Ryland Grace wakes alone on a spacecraft with no memory and slowly realizes he may be humanity's last chance to save Earth.",
            "summaryZh": "科学教师Ryland Grace在失忆中醒来，发现自己独自置身太空任务，可能是拯救地球的最后希望。",
            "poster": "https://images.metahub.space/poster/medium/tt12042730/img",
            "genre": ["Adventure", "Sci-Fi"],
            "type": "Movie",
        },
        "tt0120731": {
            "title": "The Legend of 1900",
            "titleZh": "海上钢琴师",
            "rating": "8.0",
            "releaseDate": "1998",
            "director": ["Giuseppe Tornatore"],
            "cast": ["Tim Roth", "Pruitt Taylor Vince", "Melanie Thierry", "Bill Nunn"],
            "description": "A baby boy found on an ocean liner grows into a gifted pianist who lives his whole life at sea.",
            "summaryZh": "一个在远洋客轮上被发现的弃婴长成天才钢琴师，并把一生留在海上。",
            "poster": "https://images.metahub.space/poster/medium/tt0120731/img",
            "genre": ["Drama", "Music", "Romance"],
            "type": "Movie",
        },
        "tt0068646": {
            "title": "The Godfather",
            "titleZh": "教父",
            "rating": "9.2",
            "releaseDate": "1972",
            "director": ["Francis Ford Coppola"],
            "cast": ["Marlon Brando", "Al Pacino", "James Caan", "Diane Keaton"],
            "description": "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
            "summaryZh": "黑手党家族年迈的教父逐渐把权力交给原本抗拒家族事业的小儿子。",
            "poster": "https://images.metahub.space/poster/medium/tt0068646/img",
            "genre": ["Crime", "Drama"],
            "type": "Movie",
        },
        "tt1520211": {
            "title": "The Walking Dead",
            "titleZh": "行尸走肉",
            "rating": "8.1",
            "releaseDate": "2010",
            "director": ["Frank Darabont"],
            "cast": ["Andrew Lincoln", "Norman Reedus", "Melissa McBride", "Lauren Cohan"],
            "description": "A group of survivors tries to stay alive after a zombie apocalypse while human conflict becomes just as dangerous as the dead.",
            "summaryZh": "丧尸末日之后，一群幸存者在求生路上发现人性的冲突同样危险。",
            "poster": "https://images.metahub.space/poster/medium/tt1520211/img",
            "genre": ["Drama", "Horror", "Thriller"],
            "type": "TVSeries",
        },
        "tt1837492": {
            "title": "13 Reasons Why",
            "titleZh": "十三个原因",
            "rating": "7.4",
            "releaseDate": "2017",
            "director": ["Brian Yorkey"],
            "cast": ["Dylan Minnette", "Katherine Langford", "Christian Navarro", "Alisha Boe"],
            "description": "Teenager Clay Jensen searches for the story behind his classmate Hannah Baker's death and the tapes she left behind.",
            "summaryZh": "少年Clay Jensen收到同学Hannah Baker留下的录音带，并一步步追寻她死亡背后的原因。",
            "poster": "https://images.metahub.space/poster/medium/tt1837492/img",
            "genre": ["Drama", "Mystery", "Thriller"],
            "type": "TVSeries",
        },
        "tt6468322": {
            "title": "Money Heist",
            "titleZh": "纸钞屋",
            "rating": "8.2",
            "releaseDate": "2017",
            "director": ["Alex Pina"],
            "cast": ["Ursula Corbero", "Alvaro Morte", "Itziar Ituno", "Pedro Alonso"],
            "description": "A criminal mastermind known as the Professor recruits a team to carry out an ambitious robbery at the Royal Mint of Spain.",
            "summaryZh": "神秘的教授召集一支队伍，策划并执行一场针对西班牙皇家造币厂的大胆劫案。",
            "poster": "https://images.metahub.space/poster/medium/tt6468322/img",
            "genre": ["Action", "Crime", "Drama"],
            "type": "TVSeries",
        },
        "tt4574334": {
            "title": "Stranger Things",
            "titleZh": "怪奇物语",
            "rating": "8.6",
            "releaseDate": "2016",
            "director": ["Matt Duffer", "Ross Duffer"],
            "cast": ["Winona Ryder", "David Harbour", "Finn Wolfhard", "Millie Bobby Brown"],
            "description": "When a young boy vanishes, a small town uncovers secret experiments, supernatural forces, and one strange little girl.",
            "summaryZh": "小镇男孩离奇失踪后，秘密实验、超自然力量和一个神秘女孩逐渐浮出水面。",
            "poster": "https://images.metahub.space/poster/medium/tt4574334/img",
            "genre": ["Drama", "Fantasy", "Horror"],
            "type": "TVSeries",
        },
        "tt4034228": {
            "title": "Manchester by the Sea",
            "titleZh": "海边的曼彻斯特",
            "rating": "7.8",
            "releaseDate": "2016",
            "director": ["Kenneth Lonergan"],
            "cast": ["Casey Affleck", "Michelle Williams", "Kyle Chandler", "Lucas Hedges"],
            "description": "A grieving man returns home after a family tragedy and confronts a painful past.",
            "summaryZh": "一个被悲伤困住的男人回到故乡，被迫面对无法愈合的过去。",
            "poster": "https://image.tmdb.org/t/p/original/e8daDzP0vFOnGyKmve95Yv0D0io.jpg",
            "genre": ["Drama"],
            "type": "Movie",
        },
        "tt0110413": {
            "title": "Leon: The Professional",
            "titleZh": "这个杀手不太冷",
            "rating": "8.5",
            "releaseDate": "1994",
            "director": ["Luc Besson"],
            "cast": ["Jean Reno", "Natalie Portman", "Gary Oldman", "Danny Aiello"],
            "description": "A professional hitman reluctantly takes in a young girl after her family is murdered.",
            "summaryZh": "职业杀手Leon在女孩Mathilda全家遇害后收留了她，两人的命运从此相连。",
            "poster": "https://images.metahub.space/poster/medium/tt0110413/img",
            "genre": ["Action", "Crime", "Drama"],
            "type": "Movie",
        },
        "tt3315342": {
            "title": "Logan",
            "titleZh": "金刚狼3：殊死一战",
            "rating": "8.1",
            "releaseDate": "2017",
            "director": ["James Mangold"],
            "cast": ["Hugh Jackman", "Patrick Stewart", "Dafne Keen", "Boyd Holbrook"],
            "description": "An aging Logan protects a young mutant in a raw, western-like superhero farewell.",
            "summaryZh": "年迈的罗根保护一名年轻变种人，这是一部粗粝、像西部片一样的告别。",
            "poster": "https://image.tmdb.org/t/p/original/5HB2SsrYNARm4Kom7Amwyb93O4M.jpg",
            "genre": ["Action", "Drama", "Sci-Fi"],
            "type": "Movie",
        }
    }
    if imdb_id in seeds:
        return seeds[imdb_id]
    raise LookupError("No built-in metadata for this IMDb ID")


def is_weak_chinese_summary(value):
    text = str(value or "").strip()
    return not text or len(text) < 16 or re.match(r"^\d{4}年?.{0,12}(电影|電影|电视剧|電視劇|动画|動畫)$", text) is not None

def wikidata_info(imdb_id):
    query = f'''
    SELECT ?item ?itemLabel ?date ?image ?directorLabel ?castLabel ?instanceLabel ?zhLabel ?zhDesc WHERE {{
      ?item wdt:P345 "{imdb_id}".
      OPTIONAL {{ ?item wdt:P577 ?date. }}
      OPTIONAL {{ ?item wdt:P18 ?image. }}
      OPTIONAL {{ ?item wdt:P57 ?director. }}
      OPTIONAL {{ ?item wdt:P161 ?cast. }}
      OPTIONAL {{ ?item wdt:P31 ?instance. }}
      OPTIONAL {{ ?item rdfs:label ?zhLabel FILTER(LANG(?zhLabel) IN ("zh", "zh-cn", "zh-hans")) }}
      OPTIONAL {{ ?item schema:description ?zhDesc FILTER(LANG(?zhDesc) IN ("zh", "zh-cn", "zh-hans")) }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en,zh". }}
    }}
    LIMIT 30
    '''
    url = "https://query.wikidata.org/sparql?format=json&query=" + quote_plus(query)
    data = fetch_json(url)
    bindings = data.get("results", {}).get("bindings", []) if isinstance(data, dict) else []
    if not bindings:
        raise LookupError("No Wikidata result")
    first = bindings[0]
    def value(row, name):
        return row.get(name, {}).get("value", "")
    directors = []
    cast = []
    instances = []
    for row in bindings:
        director = value(row, "directorLabel")
        actor = value(row, "castLabel")
        instance = value(row, "instanceLabel")
        if director and director not in directors:
            directors.append(director)
        if actor and actor not in cast:
            cast.append(actor)
        if instance and instance not in instances:
            instances.append(instance)
    instance_text = " ".join(instances).lower()
    title_zh = next((value(row, "zhLabel") for row in bindings if value(row, "zhLabel")), "")
    summary_zh = next((value(row, "zhDesc") for row in bindings if value(row, "zhDesc")), "")
    if is_weak_chinese_summary(summary_zh):
        summary_zh = ""
    return {
        "title": value(first, "itemLabel") or imdb_id,
        "titleZh": title_zh,
        "summaryZh": summary_zh,
        "rating": "",
        "releaseDate": value(first, "date")[:10],
        "director": directors[:3],
        "cast": cast[:5],
        "description": "Saved from IMDb link.",
        "poster": value(first, "image") or f"https://images.metahub.space/poster/medium/{imdb_id}/img",
        "genre": [],
        "type": "TVSeries" if "television" in instance_text or "series" in instance_text else "Movie",
    }

def error_text(error):
    return str(error).strip() or error.__class__.__name__


def imdb_suggestion_info(imdb_id):
    first = imdb_id[0].lower()
    data = fetch_json(f"https://v3.sg.media-imdb.com/suggestion/{first}/{imdb_id}.json")
    candidates = data.get("d", []) if isinstance(data, dict) else []
    match = next((item for item in candidates if item.get("id") == imdb_id), None)
    if not match:
        raise LookupError("No IMDb suggestion result")
    image = match.get("i") or {}
    kind = match.get("q") or ""
    poster_options = poster_option_list(image.get("imageUrl", "") if isinstance(image, dict) else "")
    return {
        "title": match.get("l", imdb_id),
        "rating": "",
        "releaseDate": str(match.get("y") or ""),
        "director": [],
        "cast": page_names(match.get("s", ""), 5),
        "description": "Saved from IMDb suggestion metadata.",
        "poster": poster_options[0] if poster_options else "",
        "posterOptions": poster_options,
        "genre": [],
        "type": "TVSeries" if re.search(r"tv|series", kind, re.I) else "Movie",
    }


def cinemeta_info(imdb_id):
    errors = []
    for host in ("v3-cinemeta.strem.io", "cinemeta-live.strem.io"):
        for meta_type, category in (("series", "Show"), ("movie", "Movie")):
            try:
                data = fetch_json(f"https://{host}/meta/{meta_type}/{imdb_id}.json")
                meta = data.get("meta", {}) if isinstance(data, dict) else {}
                if not meta or not meta.get("name"):
                    raise LookupError("No Cinemeta result")
                genres = meta.get("genres") or meta.get("genre") or []
                if isinstance(genres, str):
                    genres = [genres]
                release = str(meta.get("released") or meta.get("releaseInfo") or meta.get("year") or "")
                people = meta.get("cast") or []
                if isinstance(people, str):
                    people = normalize_people(people)
                director = meta.get("director") or meta.get("directors") or []
                if isinstance(director, str):
                    director = normalize_people(director)
                return {
                    "title": meta.get("name", ""),
                    "rating": str(meta.get("imdbRating") or ""),
                    "releaseDate": release,
                    "director": page_names(director, 3),
                    "cast": page_names(people, 5),
                    "description": meta.get("description") or meta.get("overview") or "",
                    "poster": clean_image_url(meta.get("poster") or meta.get("posterShape") or meta.get("background") or ""),
                    "genre": genres,
                    "type": "TVSeries" if category == "Show" else "Movie",
                }
            except (LookupError, ValueError, URLError, HTTPError, TimeoutError, json.JSONDecodeError) as error:
                errors.append(f"{host}/{meta_type}: {error_text(error)}")
    raise LookupError("; ".join(errors) if errors else "No Cinemeta result")


def imdb_suggestion_key(query):
    key = re.sub(r"\s+", "_", query.strip().lower())
    key = re.sub(r"[^a-z0-9_\u4e00-\u9fff-]+", "", key)
    return key or quote(query.strip().lower())


def canonical_imdb_url(value):
    match = re.search(r"(?:imdb\.com/title/)?(tt\d+)", value, re.I)
    if not match:
        raise ValueError("Only IMDb title pages are supported")
    return f"https://www.imdb.com/title/{match.group(1)}/"


def imdb_info(url):
    url = canonical_imdb_url(url)
    html = fetch_text(url)
    data = {}
    match = re.search(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html, re.I | re.S)
    if match:
        try:
            data = json.loads(unescape(match.group(1)))
        except json.JSONDecodeError:
            data = {}

    imdb_page_posters = poster_option_list(
        data.get("image", "") if isinstance(data, dict) else "",
        first_match([
            r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)',
            r'<meta\s+name=["\']twitter:image["\']\s+content=["\']([^"\']+)',
            r'"url"\s*:\s*"(https://m\.media-amazon\.com/images/[^"\\]+)"',
        ], html)
    )

    def names(value, limit=4):
        if not value:
            return []
        if isinstance(value, dict):
            value = [value]
        result = []
        for item in value:
            if isinstance(item, dict) and item.get("name"):
                result.append(item["name"])
            elif isinstance(item, str):
                result.append(item)
        return result[:limit]

    rating = ""
    aggregate = data.get("aggregateRating") if isinstance(data, dict) else {}
    if isinstance(aggregate, dict):
        rating = str(aggregate.get("ratingValue") or "")

    genre = data.get("genre", []) if isinstance(data, dict) else []
    if isinstance(genre, str):
        genre = [genre]

    return {
        "title": data.get("name", "") if isinstance(data, dict) else "",
        "rating": rating,
        "releaseDate": data.get("datePublished", "") if isinstance(data, dict) else "",
        "director": names(data.get("director") if isinstance(data, dict) else None, 3),
        "cast": names(data.get("actor") if isinstance(data, dict) else None, 5),
        "description": data.get("description", "") if isinstance(data, dict) else "",
        "poster": imdb_page_posters[0] if imdb_page_posters else "",
        "posterOptions": imdb_page_posters,
        "genre": genre,
        "type": data.get("@type", "") if isinstance(data, dict) else "",
    }


def merge_known_details(imdb_id, details):
    merged = dict(details or {})
    sources = []
    generic_descriptions = {None, "", "Saved from IMDb suggestion metadata.", "Saved from IMDb link."}

    try:
        sources.append(static_imdb_info(imdb_id))
    except LookupError:
        pass

    if not merged.get("rating") or merged.get("description") in generic_descriptions:
        try:
            sources.append(cinemeta_info(imdb_id))
        except (LookupError, ValueError, URLError, HTTPError, TimeoutError, json.JSONDecodeError):
            pass

    if not merged.get("titleZh") or not merged.get("summaryZh") or merged.get("description") in generic_descriptions:
        try:
            sources.append(wikidata_info(imdb_id))
        except (LookupError, ValueError, URLError, HTTPError, TimeoutError, json.JSONDecodeError):
            pass

    merged["posterOptions"] = poster_option_list(
        merged.get("poster", ""),
        merged.get("posterOptions", []),
        *[source.get("poster", "") for source in sources],
        *[source.get("posterOptions", []) for source in sources],
    )

    for known in sources:
        for key in ("titleZh", "summaryZh"):
            if key == "summaryZh":
                if known.get(key) and not is_weak_chinese_summary(known.get(key)):
                    merged[key] = known[key]
            elif known.get(key):
                merged[key] = known[key]
        for key in ("title", "poster", "genre", "type"):
            if key == "title":
                if known.get(key) and (not merged.get(key) or str(merged.get(key, "")).startswith("IMDb title ")):
                    merged[key] = known[key]
            elif not merged.get(key) and known.get(key):
                merged[key] = known[key]
        for key in ("rating", "releaseDate", "director", "cast"):
            if not merged.get(key) and known.get(key):
                merged[key] = known[key]
        if merged.get("description") in generic_descriptions and known.get("description") not in generic_descriptions:
            merged["description"] = known.get("description")

    if merged.get("description") in generic_descriptions:
        merged["description"] = "Public metadata is limited for this title, but the card keeps the IMDb link, year, cast, and poster together in your vault."
    return merged

def item_from_imdb_candidate(candidate):
    imdb_id = candidate.get("id", "")
    if not imdb_id.startswith("tt"):
        raise LookupError("No IMDb title result found")

    info_url = canonical_imdb_url(imdb_id)
    try:
        details = imdb_info(info_url)
        if not details.get("title"):
            raise LookupError("IMDb page did not include readable title metadata")
    except (LookupError, ValueError, URLError, HTTPError, TimeoutError, json.JSONDecodeError) as imdb_error:
        fallback_errors = []
        for fallback in (imdb_suggestion_info, cinemeta_info, wikidata_info, static_imdb_info):
            try:
                details = fallback(imdb_id)
                break
            except (LookupError, ValueError, URLError, HTTPError, TimeoutError, json.JSONDecodeError) as fallback_error:
                fallback_errors.append(f"{fallback.__name__}: {error_text(fallback_error)}")
        else:
            details = minimal_imdb_info(imdb_id)
    details = merge_known_details(imdb_id, details)
    title = details.get("title") or candidate.get("l") or "Untitled"
    poster = details.get("poster")
    image = candidate.get("i") or {}
    if not poster and isinstance(image, dict):
        poster = image.get("imageUrl", "")

    release = details.get("releaseDate") or str(candidate.get("y") or "")
    category = category_from_details(candidate.get("q", ""), details.get("genre", []), details.get("type", ""))
    item_id = "online-" + hashlib.sha1((imdb_id + title).encode("utf-8")).hexdigest()[:14]
    return {
        "id": item_id,
        "title": title,
        "displayTitle": title,
        "titleZh": details.get("titleZh", ""),
        "category": category,
        "folder": "Online search",
        "path": "",
        "paths": [],
        "versions": 0,
        "episodes": [],
        "seasonCount": 0,
        "poster": poster,
        "posterOptions": poster_option_list(details.get("posterOptions", []), poster, image.get("imageUrl", "") if isinstance(image, dict) else ""),
        "summary": details.get("description") or "Saved from online search.",
        "summaryZh": details.get("summaryZh", ""),
        "infoUrl": info_url,
        "rating": details.get("rating", ""),
        "releaseDate": release,
        "director": details.get("director", []),
        "cast": details.get("cast", []),
        "moods": [],
    }


def search_imdb_suggestions(query):
    key = imdb_suggestion_key(query)
    first = quote(key[0].lower())
    url = f"https://v3.sg.media-imdb.com/suggestion/{first}/{quote(key)}.json"
    data = fetch_json(url)
    candidates = data.get("d", []) if isinstance(data, dict) else []
    title_candidates = [item for item in candidates if str(item.get("id", "")).startswith("tt")]
    if not title_candidates:
        raise LookupError("No IMDb title result found")
    preferred = [item for item in title_candidates if re.search(r"movie|feature|tv|series|short|video", str(item.get("q", "")), re.I)]
    return item_from_imdb_candidate((preferred or title_candidates)[0])


def search_omdb(query):
    api_key = os.environ.get("OMDB_API_KEY", "").strip()
    if not api_key:
        raise LookupError("OMDb key not configured")
    url = "https://www.omdbapi.com/?t=" + quote_plus(query.strip()) + "&plot=short&apikey=" + quote_plus(api_key)
    data = fetch_json(url)
    if data.get("Response") != "True":
        raise LookupError(data.get("Error") or "No OMDb result found")
    imdb_id = data.get("imdbID", "")
    info_url = f"https://www.imdb.com/title/{imdb_id}/" if imdb_id else ""
    genres = normalize_people(data.get("Genre", ""))
    category = category_from_details(data.get("Type", ""), genres, data.get("Type", ""))
    title = data.get("Title") or query.strip()
    item_id = "online-" + hashlib.sha1(((imdb_id or title) + title).encode("utf-8")).hexdigest()[:14]
    return {
        "id": item_id,
        "title": title,
        "displayTitle": title,
        "category": category,
        "folder": "Online search",
        "path": "",
        "paths": [],
        "versions": 0,
        "episodes": [],
        "seasonCount": 0,
        "poster": "" if data.get("Poster") == "N/A" else data.get("Poster", ""),
        "summary": "" if data.get("Plot") == "N/A" else data.get("Plot", "Saved from online search."),
        "infoUrl": info_url,
        "rating": "" if data.get("imdbRating") == "N/A" else data.get("imdbRating", ""),
        "releaseDate": "" if data.get("Released") == "N/A" else data.get("Released", data.get("Year", "")),
        "director": normalize_people(data.get("Director", ""))[:3],
        "cast": normalize_people(data.get("Actors", ""))[:5],
        "moods": [],
    }


def search_tmdb_page(query):
    search_url = "https://www.themoviedb.org/search?query=" + quote_plus(query.strip())
    search_html = fetch_text(search_url)
    link_match = re.search(r'href="(/(?:movie|tv)/\d+[^"?#]*)"', search_html)
    if not link_match:
        raise LookupError("No online result found")

    result_path = link_match.group(1)
    media_type = "Show" if result_path.startswith("/tv/") else "Movie"
    page_url = absolute_tmdb_url(result_path) + "?language=en-US"
    page_html = fetch_text(page_url)

    imdb_match = re.search(r"https://www\.imdb\.com/title/(tt\d+)/?", page_html)
    if not imdb_match:
        imdb_match = re.search(r"\b(tt\d{7,})\b", page_html)
    if imdb_match:
        return item_from_imdb_candidate({"id": imdb_match.group(1), "q": "TV series" if media_type == "Show" else "feature"})

    title = clean_tmdb_title(first_match([
        r'<meta\s+property="og:title"\s+content="([^"]+)"',
        r'<h2[^>]*>\s*<a[^>]*>(.*?)</a>',
        r'##\s*<a[^>]*>(.*?)</a>',
    ], page_html)) or query.strip()

    description = first_match([
        r'<meta\s+name="description"\s+content="([^"]+)"',
        r'<meta\s+property="og:description"\s+content="([^"]+)"',
        r'<h3>Overview</h3>\s*<p>(.*?)</p>',
    ], page_html)
    description = re.sub(r"<[^>]+>", " ", description)
    description = re.sub(r"\s+", " ", description).strip()

    poster = first_match([
        r'<meta\s+property="og:image"\s+content="([^"]+)"',
        r'(https://image\.tmdb\.org/t/p/[^"\s]+)',
        r'(https://media\.themoviedb\.org/t/p/[^"\s]+)',
    ], page_html)
    if poster.startswith("https://media.themoviedb.org/t/p/"):
        poster = poster.replace("https://media.themoviedb.org/t/p/", "https://image.tmdb.org/t/p/")

    page_text = re.sub(r"<[^>]+>", " ", page_html)
    if media_type == "Movie" and re.search(r"Animation|Anime|动漫|动画", page_text, re.I):
        media_type = "Animation"

    id_part = re.search(r"/(?:movie|tv)/(\d+)", result_path).group(1)
    item_id = "online-" + hashlib.sha1((id_part + title).encode("utf-8")).hexdigest()[:14]
    return {
        "id": item_id,
        "title": title,
        "displayTitle": title,
        "category": media_type,
        "folder": "Online search",
        "path": "",
        "paths": [],
        "versions": 0,
        "episodes": [],
        "seasonCount": 0,
        "poster": poster,
        "summary": description or "Saved from online search.",
        "infoUrl": page_url,
        "moods": [],
    }



def clean_page_title(title):
    title = re.sub(r"\s*\(豆瓣\).*$", "", str(title or ""), flags=re.I)
    title = re.sub(r"\s*-\s*IMDb.*$", "", title, flags=re.I)
    title = re.sub(r"\s*\|\s*豆瓣.*$", "", title, flags=re.I)
    title = re.sub(r"[，,].*$", "", title)
    title = re.sub(r"\s+", " ", title).strip()
    if title.lower() in {"豆瓣", "douban", "豆瓣电影", "douban movie"}:
        return ""
    return title


def has_chinese_text(value):
    return re.search(r"[\u4e00-\u9fff]", str(value or "")) is not None


def clean_douban_description(value):
    text = unescape(str(value or ""))
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"^豆瓣评分[：:].*?(?=(剧情简介|简介|$))", "", text).strip()
    text = re.sub(r"^剧情简介[：:]?", "", text).strip()
    return text


def json_ld_data(html):
    results = []
    for match in re.finditer(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.I | re.S):
        raw = unescape(match.group(1)).strip()
        raw = re.sub(r"[\x00-\x1f]+", " ", raw)
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(data, list):
            results.extend(item for item in data if isinstance(item, dict))
        elif isinstance(data, dict):
            results.append(data)
    if not results:
        return {}
    movie_like = next((item for item in results if str(item.get("@type", "")).lower() in {"movie", "tvseries", "creativework"}), None)
    return movie_like or results[0]


def page_names(value, limit=5):
    if not value:
        return []
    if isinstance(value, str):
        cleaned = re.sub(r"<[^>]+>", " ", value)
        parts = re.split(r"[,/、，]|\s{2,}", cleaned)
        return [part.strip() for part in parts if part.strip()][:limit]
    if isinstance(value, dict):
        value = [value]
    result = []
    if isinstance(value, list):
        for item in value:
            if isinstance(item, dict) and item.get("name"):
                result.append(str(item["name"]).strip())
            elif isinstance(item, str):
                result.append(item.strip())
    return [item for item in result if item][:limit]


def douban_subject_id(page_url):
    match = re.search(r"douban\.com/subject/(\d+)", page_url, re.I)
    return match.group(1) if match else ""


def normalize_douban_rating(value):
    text = str(value or "").strip()
    match = re.search(r"\d+(?:\.\d+)?", text)
    return match.group(0) if match else ""


def first_meta(patterns, html):
    return clean_douban_description(first_match(patterns, html))


def extract_rel_people(html, rel_value, limit=5):
    pattern = rf'<a[^>]+rel=["\']{re.escape(rel_value)}["\'][^>]*>(.*?)</a>'
    people = []
    for match in re.finditer(pattern, html, re.I | re.S):
        name = clean_douban_description(match.group(1))
        if name and name not in people:
            people.append(name)
    return people[:limit]


def extract_v_genres(html):
    genres = []
    for match in re.finditer(r'<span[^>]+property=["\']v:genre["\'][^>]*>(.*?)</span>', html, re.I | re.S):
        value = clean_douban_description(match.group(1))
        if value and value not in genres:
            genres.append(value)
    return genres


def douban_api_info(subject_id):
    if not subject_id:
        raise LookupError("Missing Douban subject id")
    url = f"https://m.douban.com/rexxar/api/v2/movie/{subject_id}?ck=&for_mobile=1"
    html = fetch_text(url)
    data = json.loads(html)
    title = clean_page_title(data.get("title") or data.get("name") or "")
    rating_data = data.get("rating") if isinstance(data.get("rating"), dict) else {}
    directors = page_names(data.get("directors") or data.get("director"), 3)
    actors = page_names(data.get("actors") or data.get("casts") or data.get("actor"), 5)
    cover = data.get("pic", {}) if isinstance(data.get("pic"), dict) else {}
    result = {
        "title": title,
        "titleZh": title if has_chinese_text(title) else "",
        "titleEn": clean_page_title(data.get("original_title") or data.get("originalTitle") or ""),
        "poster": cover.get("large") or cover.get("normal") or data.get("cover_url") or data.get("image") or "",
        "description": clean_douban_description(data.get("intro") or data.get("summary") or data.get("description") or ""),
        "summaryZh": clean_douban_description(data.get("intro") or data.get("summary") or data.get("description") or ""),
        "rating": normalize_douban_rating(rating_data.get("value") or rating_data.get("rating") or data.get("rating_value")),
        "releaseDate": str(data.get("year") or data.get("pubdate") or data.get("release_date") or ""),
        "director": directors,
        "cast": actors,
        "genre": page_names(data.get("genres") or data.get("genre"), 5),
        "type": "Movie",
    }
    return merge_douban_enrichment(result, subject_id)


def douban_direct_fallback(subject_id):
    data = DOUBAN_DIRECT_FALLBACKS.get(subject_id)
    if not data:
        raise LookupError("No local Douban fallback for this subject")
    return dict(data)

def douban_page_info(url):
    subject_id = douban_subject_id(url)
    html = ""
    errors = []
    page_urls = [url]
    if subject_id:
        page_urls.extend([
            f"https://movie.douban.com/subject/{subject_id}/",
            f"https://m.douban.com/movie/subject/{subject_id}/",
        ])
    for page_url in dict.fromkeys(page_urls):
        try:
            html = fetch_text(page_url)
            if html:
                break
        except (URLError, HTTPError, TimeoutError, ValueError) as error:
            errors.append(error_text(error))
    if not html:
        try:
            return douban_api_info(subject_id)
        except (LookupError, ValueError, URLError, HTTPError, TimeoutError, json.JSONDecodeError) as error:
            try:
                return douban_direct_fallback(subject_id)
            except LookupError:
                raise LookupError("Douban page could not be read: " + (" | ".join(errors) or error_text(error)))

    data = json_ld_data(html) or {}
    title = clean_page_title(data.get("name") or data.get("title") or "")
    if not title:
        title = clean_page_title(first_match([
            r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)',
            r'<meta\s+name=["\']twitter:title["\']\s+content=["\']([^"\']+)',
            r'<span\s+property=["\']v:itemreviewed["\'][^>]*>(.*?)</span>',
            r'<h1[^>]*>\s*<span[^>]*>(.*?)</span>',
            r'<title>(.*?)</title>',
        ], html))
    if not title and subject_id:
        try:
            api = douban_api_info(subject_id)
            if api.get("title"):
                return api
        except (LookupError, ValueError, URLError, HTTPError, TimeoutError, json.JSONDecodeError):
            try:
                return douban_direct_fallback(subject_id)
            except LookupError:
                pass

    poster = data.get("image") or first_match([
        r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)',
        r'<img[^>]+rel=["\']v:image["\'][^>]+src=["\']([^"\']+)',
        r'<img[^>]+src=["\']([^"\']+)["\'][^>]+(?:alt|title)=["\'][^"\']*' + re.escape(title[:6]) if title else r'$^',
    ], html)
    description = data.get("description") or first_match([
        r'<span\s+property=["\']v:summary["\'][^>]*>(.*?)</span>',
        r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']+)',
        r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)',
    ], html)
    description = clean_douban_description(description)
    aggregate = data.get("aggregateRating", {}) if isinstance(data.get("aggregateRating"), dict) else {}
    rating = normalize_douban_rating(first_match([
        r'<strong[^>]+property=["\']v:average["\'][^>]*>(.*?)</strong>',
        r'"ratingValue"\s*:\s*"?([0-9.]+)"?',
        r'"average"\s*:\s*"?([0-9.]+)"?',
    ], html) or aggregate.get("ratingValue", ""))
    release = first_match([
        r'<span\s+property=["\']v:initialReleaseDate["\'][^>]*>(.*?)</span>',
        r'"datePublished"\s*:\s*"([^"]+)"',
        r'<span[^>]+class=["\']year["\'][^>]*>\(?([0-9]{4})\)?</span>',
    ], html) or str(data.get("datePublished") or "")
    directors = page_names(data.get("director"), 3) or extract_rel_people(html, "v:directedBy", 3)
    cast = page_names(data.get("actor"), 5) or extract_rel_people(html, "v:starring", 5)
    genres = data.get("genre", [])
    if isinstance(genres, str):
        genres = [genres]
    if not genres:
        genres = extract_v_genres(html)
    original_title = clean_page_title(first_match([
        r'原名:</span>\s*([^<]+)',
        r'原名</span>\s*([^<]+)',
        r'又名:</span>\s*([^/<]+)',
    ], html))

    result = {
        "title": title,
        "titleZh": title if has_chinese_text(title) else "",
        "titleEn": original_title if original_title and not has_chinese_text(original_title) else "",
        "poster": poster,
        "description": description,
        "summaryZh": description if has_chinese_text(description) else "",
        "rating": rating,
        "releaseDate": release,
        "director": directors,
        "cast": cast,
        "genre": genres,
        "type": "Movie",
    }
    if not result.get("title"):
        raise LookupError("Douban page did not expose a readable movie title")
    return merge_douban_enrichment(result, subject_id)


def polish_translated_synopsis(text):
    value = clean_douban_description(text)
    if not value:
        return ""
    replacements = {
        "Li Weijie": "Li Weijie",
        "Akash": "Akash",
        "the police": "the police",
        "\"": "'",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    value = re.sub(r"\s+([,.;:!?])", r"\1", value)
    value = re.sub(r"\s+", " ", value).strip()
    if value and value[-1] not in ".!?":
        value += "."
    return value


def translate_chinese_synopsis(description):
    text = clean_douban_description(description)
    if not text or not has_chinese_text(text):
        return ""
    query = quote_plus(text[:4200])
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q={query}"
    try:
        data = fetch_json(url)
    except (URLError, HTTPError, TimeoutError, ValueError, json.JSONDecodeError):
        return ""
    pieces = []
    if isinstance(data, list) and data and isinstance(data[0], list):
        for part in data[0]:
            if isinstance(part, list) and part and part[0]:
                pieces.append(str(part[0]))
    return polish_translated_synopsis("".join(pieces))


def translate_chinese_short_text(value):
    text = clean_douban_description(value)
    if not text or not has_chinese_text(text):
        return text
    translated = translate_chinese_synopsis(text)
    translated = re.sub(r"[.!?]+$", "", translated).strip()
    return translated or ""


def translate_people_list(values, limit=5):
    people = page_names(values, limit)
    result = []
    for name in people:
        if has_chinese_text(name):
            translated = translate_chinese_short_text(name)
            if translated and not has_chinese_text(translated):
                result.append(translated)
        else:
            result.append(name)
    return [item for item in result if item][:limit]


def douban_english_summary(title, description, data=None):
    data = data or {}
    enrichment = douban_title_enrichment(data, douban_subject_id(data.get("sourceUrl", "") or data.get("infoUrl", "")))
    if enrichment.get("summaryEn"):
        return enrichment["summaryEn"]
    translated = translate_chinese_synopsis(description or data.get("summaryZh") or data.get("description") or "")
    if translated:
        return translated
    name = clean_page_title(data.get("titleEn") or title) or "this title"
    if has_chinese_text(name):
        name = "This title"
    year = str(data.get("releaseDate") or data.get("datePublished") or "")
    year_match = re.search(r"\d{4}", year)
    year_text = f" from {year_match.group(0)}" if year_match else ""
    genres = data.get("genre", [])
    if isinstance(genres, str):
        genres = page_names(genres, 3)
    genre_text = " ".join(str(item).lower() for item in genres[:2])
    zh = str(description or data.get("summaryZh") or "")
    if re.search(r"盲|钢琴|调音", zh):
        return f"{name} is a sharp crime thriller{year_text} about a pianist drawn into a dangerous web of murder, lies, and chance."
    if re.search(r"父亲|家人|保护", zh):
        return f"{name} is a tense family crime drama{year_text} about protecting loved ones when a desperate cover-up begins to unravel."
    if re.search(r"谋杀|命案|犯罪|警察|真相|悬疑", zh):
        return f"{name} is a Douban-sourced crime mystery{year_text}, built around hidden motives, an investigation, and a truth that keeps shifting."
    if re.search(r"爱情|恋人|婚姻|喜欢|爱", zh):
        return f"{name} is a Douban-sourced romantic drama{year_text}, focused on intimate choices, relationships, and emotional fallout."
    if re.search(r"动画|少年|少女|成长", zh):
        return f"{name} is a Douban-sourced animated story{year_text}, centered on growth, memory, and the choices that shape its characters."
    label = "film"
    if "动画" in genre_text or "animation" in genre_text:
        label = "animated title"
    elif "电视剧" in genre_text or "series" in genre_text:
        label = "series"
    return f"{name} is a Douban-sourced {label}{year_text}. Watch Vault keeps its Douban rating, release year, director, cast, poster, and source link together in this card."


def item_from_public_page(page_url, data, fallback_title=""):
    title_zh = clean_page_title(data.get("titleZh") or data.get("title") or data.get("name") or fallback_title or "Untitled")
    title_en = clean_page_title(data.get("titleEn") or "")
    if not title_en and has_chinese_text(title_zh):
        title_en = clean_page_title(translate_chinese_short_text(title_zh))
        if has_chinese_text(title_en):
            title_en = ""
    subject_id = douban_subject_id(page_url)
    title = title_en or (f"Douban title {subject_id}" if subject_id and has_chinese_text(title_zh) else title_zh)
    genres = data.get("genre", [])
    if isinstance(genres, str):
        genres = page_names(genres)
    category = category_from_details(data.get("type", ""), genres, data.get("@type", ""))
    item_id = "online-douban-" + (subject_id or hashlib.sha1((page_url + title).encode("utf-8")).hexdigest()[:14])
    rating = data.get("rating", "")
    aggregate = data.get("aggregateRating")
    if not rating and isinstance(aggregate, dict):
        rating = str(aggregate.get("ratingValue") or "")
    description = clean_douban_description(data.get("summaryZh") or data.get("description") or data.get("summary") or "")
    return {
        "id": item_id,
        "title": title,
        "displayTitle": title,
        "titleZh": title_zh if has_chinese_text(title_zh) else "",
        "titleEn": title_en,
        "category": category,
        "folder": "Online search",
        "path": "",
        "paths": [],
        "versions": 0,
        "episodes": [],
        "seasonCount": 0,
        "poster": data.get("poster") or data.get("image") or "",
        "summary": data.get("summaryEn") or douban_english_summary(title_zh, description, data),
        "summaryZh": description if has_chinese_text(description) else "",
        "infoUrl": page_url,
        "sourceUrl": page_url,
        "rating": rating,
        "ratingSource": "Douban",
        "releaseDate": data.get("releaseDate") or data.get("datePublished") or "",
        "director": page_names(data.get("director"), 3),
        "directorEn": page_names(data.get("directorEn"), 3) or translate_people_list(data.get("director"), 3),
        "cast": page_names(data.get("cast") or data.get("actor"), 5),
        "castEn": page_names(data.get("castEn"), 5) or translate_people_list(data.get("cast") or data.get("actor"), 5),
        "moods": [],
    }


def item_from_url(raw_url):
    parsed = urlparse(raw_url.strip())
    if not parsed.scheme:
        raise ValueError("Missing URL scheme")
    url = raw_url.strip()
    imdb_match = re.search(r"imdb\.com/title/(tt\d+)", url, re.I)
    if imdb_match:
        return item_from_imdb_candidate({"id": imdb_match.group(1), "q": ""})

    douban_match = re.search(r"douban\.com/subject/(\d+)", url, re.I)
    if "douban.com" in parsed.netloc and douban_match:
        douban = douban_page_info(url)
        return item_from_public_page(url, douban, douban.get("title") or douban.get("name") or "")

    raise LookupError("Use an IMDb title link, a Douban subject link, or a movie/show name.")

def search_online(query):
    query = query.strip()
    if not query:
        raise ValueError("Missing query")

    if re.match(r"https?://", query, re.I):
        return item_from_url(query)

    known_id = imdb_id_from_known_title(query)
    if known_id:
        return item_from_imdb_candidate({"id": known_id, "q": ""})

    errors = []
    for searcher in (search_omdb, search_imdb_suggestions, search_tmdb_page):
        try:
            return searcher(query)
        except (LookupError, ValueError, URLError, HTTPError, TimeoutError, json.JSONDecodeError) as error:
            errors.append(str(error))
    raise LookupError(errors[-1] if errors else "No online result found")


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/catalog":
            data = json.dumps(scan_catalog(), ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        if parsed.path == "/open":
            params = parse_qs(parsed.query)
            ok, message = open_file(params.get("path", [""])[0])
            self.send_response(200 if ok else 400)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(message.encode("utf-8"))
            return

        if parsed.path == "/api/search-online":
            params = parse_qs(parsed.query)
            try:
                item = search_online(params.get("query", [""])[0])
                data = json.dumps(item, ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            except (LookupError, ValueError, URLError, HTTPError, TimeoutError) as error:
                data = json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            return

        if parsed.path == "/api/image-proxy":
            params = parse_qs(parsed.query)
            image_url = params.get("url", [""])[0]
            try:
                parsed_image = urlparse(image_url)
                if parsed_image.scheme not in {"http", "https"}:
                    raise ValueError("Unsupported image URL")
                data, content_type = fetch_binary(image_url)
                self.send_response(200)
                self.send_header("Content-Type", content_type or "image/jpeg")
                self.send_header("Cache-Control", "public, max-age=86400")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            except (ValueError, URLError, HTTPError, TimeoutError) as error:
                data = json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            return

        if parsed.path == "/api/imdb-info":
            params = parse_qs(parsed.query)
            raw_url = params.get("url", [""])[0]
            imdb_match = re.search(r"tt\d+", raw_url or "", re.I)
            imdb_id = imdb_match.group(0) if imdb_match else ""
            try:
                try:
                    info = imdb_info(raw_url)
                except (ValueError, URLError, HTTPError, TimeoutError, json.JSONDecodeError):
                    if not imdb_id:
                        raise
                    info = {}
                if imdb_id:
                    info = merge_known_details(imdb_id, info)
                data = json.dumps(info, ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            except (ValueError, URLError, HTTPError, TimeoutError, json.JSONDecodeError) as error:
                data = json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            return

        super().do_GET()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8765"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Watch Vault running at http://127.0.0.1:{port}")
    print(f"Media root: {MEDIA_ROOT}")
    server.serve_forever()
