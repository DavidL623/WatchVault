from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import json
import server


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        image_url = params.get("url", [""])[0]
        try:
            parsed = urlparse(image_url)
            if parsed.scheme not in {"http", "https"}:
                raise ValueError("Unsupported image URL")
            data, content_type = server.fetch_binary(image_url)
            self.send_response(200)
            self.send_header("Content-Type", content_type or "image/jpeg")
            self.send_header("Cache-Control", "public, max-age=86400")
        except Exception as error:
            data = json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
            self.send_response(404)
            self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
