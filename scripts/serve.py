#!/usr/bin/env python3
"""无缓存静态文件服务器。

python3 -m http.server 默认不发 Cache-Control 头，浏览器会启发式缓存
index.html，导致 ?v= 缓存破坏对子资源失效（因为 index.html 本身是旧的）。
本服务器给所有响应加 no-store 头，确保每次重载都拿最新文件。

用法: python3 scripts/serve.py [port]   (默认 8082)
"""
import http.server
import socketserver
import sys
import os

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 对所有响应发 no-store，浏览器不缓存 HTML / JS / CSS
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8082
    # 以项目根目录为服务根
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    with socketserver.TCPServer(("", port), NoCacheHandler) as httpd:
        print(f"Serving {root} at http://localhost:{port} (no-cache)")
        print("Ctrl+C 停止")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n停止")

if __name__ == '__main__':
    main()
