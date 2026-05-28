from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import json
import server


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        try:
            item = server.search_online(params.get("query", [""])[0])
            data = json.dumps(item, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
        except Exception as error:
            data = json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
            self.send_response(404)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
