const { execSync } = require('child_process');

function freePort(port = 5000) {
  try {
    if (process.platform === 'win32') {
      const stdout = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const lines = stdout.trim().split('\n');
      const killedPids = new Set();
      for (const line of lines) {
        if (!line.includes('LISTENING')) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== String(process.pid) && !killedPids.has(pid)) {
          killedPids.add(pid);
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`[Port Cleaner] Released port ${port} from PID ${pid}`);
          } catch (_) {}
        }
      }
    } else {
      execSync(`lsof -t -i:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch (_) {
    // Port is already free
  }
}

freePort(5000);
