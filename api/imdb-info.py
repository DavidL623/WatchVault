from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import json
import re
import server


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        raw_url = params.get("url", [""])[0]
        imdb_match = re.search(r"tt\d+", raw_url or "", re.I)
        imdb_id = imdb_match.group(0) if imdb_match else ""
        try:
            try:
                info = server.imdb_info(raw_url)
            except Exception:
                if not imdb_id:
                    raise
                info = {}
            if imdb_id:
                info = server.merge_known_details(imdb_id, info)
            data = json.dumps(info, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
        except Exception as error:
            data = json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
            self.send_response(404)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
