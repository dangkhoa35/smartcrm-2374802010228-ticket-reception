const test = require('node:test');
const assert = require('node:assert');
const net = require('node:net');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// BUG: khi cổng đã bị chiếm, Express 5 gọi callback của listen() kèm lỗi thay vì ném lỗi;
// server.js bỏ qua lỗi đó, vẫn ghi "API đã khởi động" rồi thoát mã 0.
test('cổng đã bị chiếm -> server thoát mã 1, ghi log ERROR, không báo "đã khởi động"', async () => {
  const giuCong = net.createServer();
  await new Promise((xong) => giuCong.listen(0, xong));
  const port = giuCong.address().port;

  const kq = spawnSync(process.execPath, [path.join(__dirname, '..', 'src', 'backend', 'server.js')], {
    env: { ...process.env, PORT: String(port), DATABASE_URL: 'postgres://x:y@127.0.0.1:1/z' },
    encoding: 'utf8',
    timeout: 5000,
  });
  giuCong.close();

  assert.strictEqual(kq.status, 1);
  assert.ok(kq.stdout.includes('"muc":"error"'));
  assert.ok(!kq.stdout.includes('API đã khởi động'));
});