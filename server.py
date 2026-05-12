import http.server
import os
import sys

PORT = int(os.environ.get('PORT', 3333))
DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')

if not os.path.isdir(DIR):
    print(f'[错误] dist 目录不存在: {DIR}')
    print('请先运行 npm run build 构建前端')
    sys.exit(1)

os.chdir(DIR)

MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
}

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
}


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/':
            path = '/index.html'
        file_path = os.path.join(DIR, path.lstrip('/'))
        safe_path = os.path.normpath(file_path)
        if not safe_path.startswith(DIR):
            self.send_error(403, 'Forbidden')
            return
        if os.path.isfile(safe_path):
            self.send_file(safe_path)
        else:
            self.send_file(os.path.join(DIR, 'index.html'))

    def send_file(self, file_path):
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            ext = os.path.splitext(file_path)[1]
            content_type = MIME_TYPES.get(ext, 'application/octet-stream')
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            for k, v in CORS_HEADERS.items():
                self.send_header(k, v)
            self.send_header('Cache-Control',
                             'public, max-age=604800' if ext in ('.css', '.js', '.woff', '.woff2', '.ttf')
                             else 'no-cache')
            self.end_headers()
            self.wfile.write(content)
        except OSError:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(204)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()

    def log_message(self, format, *args):
        print(f'[访问] {self.client_address[0]} - {format % args}')


print('=' * 50)
print('  新生宿舍舍友自主选择系统 v1.0')
print(f'  静态服务: http://0.0.0.0:{PORT}/')
print(f'  本地访问: http://127.0.0.1:{PORT}/')
print(f'  目录:     {DIR}')
print('  Ctrl+C 停止服务')
print('=' * 50)

httpd = http.server.HTTPServer(('0.0.0.0', PORT), SPAHandler)
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print('\n服务器已停止')
    httpd.server_close()
