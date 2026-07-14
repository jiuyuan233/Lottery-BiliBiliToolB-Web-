import express from 'express';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import qrcode from 'qrcode';
import * as lark from '@larksuiteoapi/node-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const CONFIG_DIR = process.env.CONFIG_DIR || '/lottery-config';
const HOST_CONFIG_DIR = process.env.HOST_CONFIG_DIR || CONFIG_DIR;
const IMAGE_NAME = 'shanmite/lottery_auto_docker';

const CONTAINERS = {
  start: 'shanmite-lottery-start',
  check: 'shanmite-lottery-check',
  clear: 'shanmite-lottery-clear',
  account: 'shanmite-lottery-account',
  login: 'shanmite-lottery-login',
};

const WATCHDOG_FILE = path.join(CONFIG_DIR, '.watchdog.json');

function loadWatchdogConfig() {
  try {
    if (fs.existsSync(WATCHDOG_FILE)) {
      return JSON.parse(fs.readFileSync(WATCHDOG_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {
    enabled: false,
    interval: 60,
    containers: { start: true, check: false, clear: false },
  };
}

function saveWatchdogConfig(config) {
  try {
    fs.writeFileSync(WATCHDOG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

let watchdogConfig = loadWatchdogConfig();
let watchdogTimer = null;

async function runWatchdogCheck() {
  if (!watchdogConfig.enabled) return;
  for (const [name, shouldWatch] of Object.entries(watchdogConfig.containers)) {
    if (!shouldWatch) continue;
    const containerName = CONTAINERS[name];
    if (!containerName) continue;
    try {
      const status = await getContainerStatus(containerName);
      if (status.exists && !status.running) {
        console.log(`[Watchdog] ${name} stopped, restarting...`);
        await execCmd(`docker rm -f ${containerName} 2>/dev/null || true`);
        await execCmd(`docker run -d \
          -v ${HOST_CONFIG_DIR}/env.js:/lottery/env.js \
          -v ${HOST_CONFIG_DIR}/my_config.js:/lottery/my_config.js \
          --network host \
          --name ${containerName} \
          ${IMAGE_NAME} \
          ${name}`);
        console.log(`[Watchdog] ${name} restarted successfully`);
      }
    } catch (e) {
      console.error(`[Watchdog] Failed to restart ${name}:`, e.message);
    }
  }
}

function startWatchdog() {
  if (watchdogTimer) clearInterval(watchdogTimer);
  if (watchdogConfig.enabled) {
    const interval = Math.max(10, watchdogConfig.interval || 60) * 1000;
    watchdogTimer = setInterval(runWatchdogCheck, interval);
    console.log(`[Watchdog] Started, interval: ${watchdogConfig.interval}s`);
  }
}

startWatchdog();

const SCHEDULE_FILE = path.join(CONFIG_DIR, '.schedule.json');

function loadScheduleConfig() {
  try {
    if (fs.existsSync(SCHEDULE_FILE)) {
      return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {
    enabled: false,
    startTime: '09:00',
    stopTime: '23:00',
    containers: { start: true, check: false, clear: false },
    days: [0, 1, 2, 3, 4, 5, 6],
  };
}

function saveScheduleConfig(config) {
  try {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

let scheduleConfig = loadScheduleConfig();
let scheduleTimer = null;
let lastStartDate = '';
let lastStopDate = '';

function getBeijingTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijing = new Date(utc + 8 * 3600000);
  const y = beijing.getUTCFullYear();
  const m = beijing.getUTCMonth();
  const d = beijing.getUTCDate();
  return {
    date: beijing,
    dayOfWeek: beijing.getUTCDay(),
    hours: beijing.getUTCHours(),
    minutes: beijing.getUTCMinutes(),
    dateString: `${y}-${m}-${d}`,
  };
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return { h, m };
}

function isTimeInRange(now, start, stop) {
  const nowMin = now.h * 60 + now.m;
  const startMin = start.h * 60 + start.m;
  const stopMin = stop.h * 60 + stop.m;
  if (startMin <= stopMin) {
    return nowMin >= startMin && nowMin < stopMin;
  } else {
    return nowMin >= startMin || nowMin < stopMin;
  }
}

async function startScheduledContainers() {
  const bt = getBeijingTime();
  if (lastStartDate === bt.dateString) return;
  lastStartDate = bt.dateString;
  lastStopDate = '';
  console.log('[Schedule] Starting scheduled containers...');
  for (const [name, shouldRun] of Object.entries(scheduleConfig.containers)) {
    if (!shouldRun) continue;
    const containerName = CONTAINERS[name];
    if (!containerName) continue;
    try {
      await execCmd(`docker rm -f ${containerName} 2>/dev/null || true`);
      await execCmd(`docker run -d \
        -v ${HOST_CONFIG_DIR}/env.js:/lottery/env.js \
        -v ${HOST_CONFIG_DIR}/my_config.js:/lottery/my_config.js \
        --network host \
        --name ${containerName} \
        ${IMAGE_NAME} \
        ${name}`);
      console.log(`[Schedule] ${name} started`);
    } catch (e) {
      console.error(`[Schedule] Failed to start ${name}:`, e.message);
    }
  }
}

async function stopScheduledContainers() {
  const bt = getBeijingTime();
  if (lastStopDate === bt.dateString) return;
  lastStopDate = bt.dateString;
  lastStartDate = '';
  console.log('[Schedule] Stopping scheduled containers...');
  for (const [name, shouldRun] of Object.entries(scheduleConfig.containers)) {
    if (!shouldRun) continue;
    const containerName = CONTAINERS[name];
    if (!containerName) continue;
    try {
      await execCmd(`docker stop ${containerName} 2>/dev/null || true`);
      await execCmd(`docker rm -f ${containerName} 2>/dev/null || true`);
      console.log(`[Schedule] ${name} stopped`);
    } catch (e) {
      console.error(`[Schedule] Failed to stop ${name}:`, e.message);
    }
  }
}

async function runScheduleCheck() {
  if (!scheduleConfig.enabled) return;
  const bt = getBeijingTime();
  if (!scheduleConfig.days.includes(bt.dayOfWeek)) return;
  const nowTime = { h: bt.hours, m: bt.minutes };
  const startTime = parseTime(scheduleConfig.startTime);
  const stopTime = parseTime(scheduleConfig.stopTime);
  if (isTimeInRange(nowTime, startTime, stopTime)) {
    await startScheduledContainers();
  } else {
    await stopScheduledContainers();
  }
}

function startSchedule() {
  if (scheduleTimer) clearInterval(scheduleTimer);
  if (scheduleConfig.enabled) {
    scheduleTimer = setInterval(runScheduleCheck, 30 * 1000);
    runScheduleCheck();
    console.log(`[Schedule] Started, ${scheduleConfig.startTime} - ${scheduleConfig.stopTime}`);
  } else {
    stopScheduledContainers();
    console.log('[Schedule] Stopped');
  }
}

startSchedule();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'dist')));

function execCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function getContainerStatus(name) {
  return new Promise((resolve) => {
    exec(`docker inspect --format='{{json .State}}' ${name} 2>/dev/null`, (error, stdout) => {
      if (error) {
        resolve({ exists: false, running: false });
      } else {
        try {
          const state = JSON.parse(stdout.trim());
          resolve({
            exists: true,
            running: state.Running,
            status: state.Status,
            startedAt: state.StartedAt,
            finishedAt: state.FinishedAt,
            exitCode: state.ExitCode,
          });
        } catch {
          resolve({ exists: false, running: false });
        }
      }
    });
  });
}

app.get('/api/status', async (req, res) => {
  try {
    const result = {};
    for (const [key, name] of Object.entries(CONTAINERS)) {
      result[key] = await getContainerStatus(name);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/config/:file', async (req, res) => {
  try {
    const file = req.params.file;
    if (!['env.js', 'my_config.js'].includes(file)) {
      return res.status(400).json({ error: 'Invalid file name' });
    }
    const filePath = path.join(CONFIG_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/config/:file', async (req, res) => {
  try {
    const file = req.params.file;
    if (!['env.js', 'my_config.js'].includes(file)) {
      return res.status(400).json({ error: 'Invalid file name' });
    }
    const { content } = req.body;
    const filePath = path.join(CONFIG_DIR, file);
    const backupPath = `${filePath}.bak.${Date.now()}`;
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    res.json({ success: true, backup: path.basename(backupPath) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/container/:action/:name', async (req, res) => {
  try {
    const { action, name } = req.params;
    const containerName = CONTAINERS[name];
    if (!containerName) {
      return res.status(400).json({ error: 'Invalid container name' });
    }

    let cmd = '';
    switch (action) {
      case 'start': {
        const status = await getContainerStatus(containerName);
        if (status.running) {
          return res.json({ message: 'Container already running', container: containerName });
        }
        if (status.exists) {
          await execCmd(`docker rm -f ${containerName} 2>/dev/null || true`);
        }
        cmd = `docker run -d \
          -v ${HOST_CONFIG_DIR}/env.js:/lottery/env.js \
          -v ${HOST_CONFIG_DIR}/my_config.js:/lottery/my_config.js \
          --network host \
          --name ${containerName} \
          ${IMAGE_NAME} \
          ${name}`;
        break;
      }
      case 'cleanStart': {
        await execCmd(`docker rm -f ${containerName} 2>/dev/null || true`);
        cmd = `docker run -d \
          -v ${HOST_CONFIG_DIR}/env.js:/lottery/env.js \
          -v ${HOST_CONFIG_DIR}/my_config.js:/lottery/my_config.js \
          --network host \
          --name ${containerName} \
          ${IMAGE_NAME} \
          ${name}`;
        break;
      }
      case 'stop':
        cmd = `docker stop ${containerName} 2>/dev/null || true`;
        break;
      case 'restart': {
        const status = await getContainerStatus(containerName);
        if (status.exists) {
          await execCmd(`docker rm -f ${containerName} 2>/dev/null || true`);
        }
        cmd = `docker run -d \
          -v ${HOST_CONFIG_DIR}/env.js:/lottery/env.js \
          -v ${HOST_CONFIG_DIR}/my_config.js:/lottery/my_config.js \
          --network host \
          --name ${containerName} \
          ${IMAGE_NAME} \
          ${name}`;
        break;
      }
      case 'remove':
        cmd = `docker rm -f ${containerName} 2>/dev/null || true`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const result = await execCmd(cmd);
    res.json({ success: true, ...result, action, container: containerName });
  } catch (err) {
    res.status(500).json({ error: err.error || err.message });
  }
});

app.get('/api/logs/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const containerName = CONTAINERS[name];
    if (!containerName) {
      return res.status(400).json({ error: 'Invalid container name' });
    }
    const lines = req.query.lines || 200;
    const result = await execCmd(`docker logs --tail ${lines} ${containerName} 2>&1`);
    res.json({ logs: result.stdout || result.stderr || '' });
  } catch (err) {
    res.status(500).json({ error: err.error || err.message, logs: '' });
  }
});

app.get('/api/logs/stream/:name', (req, res) => {
  try {
    const { name } = req.params;
    const containerName = CONTAINERS[name];
    if (!containerName) {
      return res.status(400).json({ error: 'Invalid container name' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const logsProcess = spawn('docker', ['logs', '-f', '--tail', '50', containerName]);

    logsProcess.stdout.on('data', (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stdout', data: data.toString() })}\n\n`);
    });

    logsProcess.stderr.on('data', (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stderr', data: data.toString() })}\n\n`);
    });

    logsProcess.on('close', () => {
      res.write(`data: ${JSON.stringify({ type: 'close' })}\n\n`);
      res.end();
    });

    req.on('close', () => {
      logsProcess.kill();
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/remove-all', async (req, res) => {
  try {
    const result = await execCmd(
      `docker rm -f $(docker ps -a | awk '/${IMAGE_NAME.replace(/\//g, '\\/')}/ {print $1}') 2>/dev/null || true`
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.error || err.message });
  }
});

app.get('/api/watchdog', (req, res) => {
  res.json(watchdogConfig);
});

app.post('/api/watchdog', (req, res) => {
  try {
    const newConfig = req.body;
    if (typeof newConfig.enabled !== 'undefined') {
      watchdogConfig.enabled = !!newConfig.enabled;
    }
    if (typeof newConfig.interval !== 'undefined') {
      const interval = parseInt(newConfig.interval, 10);
      if (!isNaN(interval) && interval >= 10) {
        watchdogConfig.interval = interval;
      }
    }
    if (newConfig.containers && typeof newConfig.containers === 'object') {
      watchdogConfig.containers = { ...watchdogConfig.containers, ...newConfig.containers };
    }
    saveWatchdogConfig(watchdogConfig);
    startWatchdog();
    res.json({ success: true, config: watchdogConfig });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/schedule', (req, res) => {
  const now = new Date();
  const nextRun = getNextRunInfo();
  res.json({ ...scheduleConfig, ...nextRun });
});

function getNextRunInfo() {
  if (!scheduleConfig.enabled) return { nextStart: null, nextStop: null, inRange: false };
  const bt = getBeijingTime();
  const startTime = parseTime(scheduleConfig.startTime);
  const stopTime = parseTime(scheduleConfig.stopTime);
  const nowMin = bt.hours * 60 + bt.minutes;
  const startMin = startTime.h * 60 + startTime.m;
  const stopMin = stopTime.h * 60 + stopTime.m;
  const days = [...scheduleConfig.days].sort();
  let inRange = false;
  let nextStartDay = 0;
  let nextStopDay = 0;
  const crossDay = startMin > stopMin;
  if (days.includes(bt.dayOfWeek)) {
    if (crossDay) {
      inRange = nowMin >= startMin || nowMin < stopMin;
    } else {
      inRange = nowMin >= startMin && nowMin < stopMin;
    }
  }
  function findNextDay(fromDay, targetMin, currentMin) {
    for (let i = 0; i < 8; i++) {
      const d = (fromDay + i) % 7;
      if (days.includes(d)) {
        if (i === 0 && currentMin < targetMin) return 0;
        if (i > 0) return i;
      }
    }
    return 7;
  }
  if (inRange) {
    nextStopDay = 0;
    if (crossDay && nowMin < stopMin) nextStopDay = 0;
    nextStartDay = -1;
  } else {
    if (nowMin < startMin && days.includes(bt.dayOfWeek) && !crossDay) {
      nextStartDay = 0;
    } else {
      nextStartDay = findNextDay(bt.dayOfWeek + 1, startMin, -1);
    }
    nextStopDay = -1;
  }
  function calcDate(daysOffset, hour, minute) {
    const d = new Date(bt.date);
    d.setUTCDate(d.getUTCDate() + daysOffset);
    d.setUTCHours(hour, minute, 0, 0);
    return d.toISOString();
  }
  return {
    inRange,
    nextStart: nextStartDay >= 0 ? calcDate(nextStartDay, startTime.h, startTime.m) : null,
    nextStop: nextStopDay >= 0 ? calcDate(nextStopDay, stopTime.h, stopTime.m) : null,
  };
}

app.post('/api/schedule', (req, res) => {
  try {
    const newConfig = req.body;
    if (typeof newConfig.enabled !== 'undefined') {
      scheduleConfig.enabled = !!newConfig.enabled;
    }
    if (typeof newConfig.startTime !== 'undefined' && /^\d{2}:\d{2}$/.test(newConfig.startTime)) {
      scheduleConfig.startTime = newConfig.startTime;
    }
    if (typeof newConfig.stopTime !== 'undefined' && /^\d{2}:\d{2}$/.test(newConfig.stopTime)) {
      scheduleConfig.stopTime = newConfig.stopTime;
    }
    if (newConfig.containers && typeof newConfig.containers === 'object') {
      scheduleConfig.containers = { ...scheduleConfig.containers, ...newConfig.containers };
    }
    if (Array.isArray(newConfig.days)) {
      scheduleConfig.days = newConfig.days.filter(d => typeof d === 'number' && d >= 0 && d <= 6);
    }
    saveScheduleConfig(scheduleConfig);
    lastStartDate = '';
    lastStopDate = '';
    startSchedule();
    const nextRun = getNextRunInfo();
    res.json({ success: true, config: { ...scheduleConfig, ...nextRun } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let qrPollingTasks = {};

function extractCookiesFromHeader(setCookieHeader) {
  if (!setCookieHeader) return {};
  const cookies = {};
  const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  cookieArray.forEach(cookie => {
    const match = cookie.match(/^([^=]+)=([^;]+)/);
    if (match) {
      cookies[match[1]] = match[2];
    }
  });
  return cookies;
}

function formatCookieString(cookies) {
  const keys = ['SESSDATA', 'bili_jct', 'DedeUserID', 'DedeUserID__ckMd5', 'sid', 'buvid3'];
  return keys.filter(k => cookies[k]).map(k => `${k}=${cookies[k]}`).join('; ');
}

async function updateEnvJsWithCookie(newCookie) {
  const envPath = path.join(CONFIG_DIR, 'env.js');
  try {
    let content = fs.readFileSync(envPath, 'utf-8');
    const cookiePattern = /COOKIE:\s*['"][^'"]*['"]/;
    const newCookieLine = `COOKIE: '${newCookie}'`;
    content = content.replace(cookiePattern, newCookieLine);
    fs.writeFileSync(envPath, content, 'utf-8');
    return true;
  } catch (e) {
    console.error('Failed to update env.js:', e.message);
    return false;
  }
}

app.get('/api/qrcode', async (req, res) => {
  try {
    const response = await axios.get('https://passport.bilibili.com/x/passport-login/web/qrcode/generate', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    
    if (response.data.code !== 0) {
      return res.status(500).json({ error: 'Failed to generate QR code' });
    }
    
    const { qrcode_key, url } = response.data.data;
    const qrImage = await qrcode.toDataURL(url);
    
    if (qrPollingTasks[qrcode_key]) {
      clearInterval(qrPollingTasks[qrcode_key]);
    }
    
    res.json({
      qrcode_key,
      qrImage,
      url
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/qrcode/poll/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const response = await axios.get('https://passport.bilibili.com/x/passport-login/web/qrcode/poll', {
      params: { qrcode_key: key },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    
    const { code, message } = response.data.data;
    
    if (code === 0) {
      const cookies = extractCookiesFromHeader(response.headers['set-cookie']);
      const cookieString = formatCookieString(cookies);
      const updated = await updateEnvJsWithCookie(cookieString);
      
      if (qrPollingTasks[key]) {
        clearInterval(qrPollingTasks[key]);
        delete qrPollingTasks[key];
      }
      
      return res.json({
        status: 'success',
        message: '登录成功',
        cookie: cookieString,
        cookies,
        updated
      });
    } else if (code === 86101) {
      return res.json({ status: 'waiting', message: '等待扫码' });
    } else if (code === 86090) {
      return res.json({ status: 'scanned', message: '已扫码，请确认' });
    } else if (code === 86038) {
      if (qrPollingTasks[key]) {
        clearInterval(qrPollingTasks[key]);
        delete qrPollingTasks[key];
      }
      return res.json({ status: 'expired', message: '二维码已过期' });
    } else {
      return res.json({ status: 'error', message: message || '未知错误' });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/sms/countries', async (req, res) => {
  try {
    const response = await axios.get('https://passport.bilibili.com/web/generic/country/list', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sms/captcha', async (req, res) => {
  try {
    const response = await axios.get('https://passport.bilibili.com/x/passport-login/captcha', {
      params: { source: 'main_web' },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sms/send', async (req, res) => {
  const { cid, tel, token, challenge, validate, seccode } = req.body;
  try {
    const response = await axios.post('https://passport.bilibili.com/x/passport-login/web/sms/send',
      new URLSearchParams({
        cid,
        tel,
        source: 'main_web',
        token,
        challenge,
        validate,
        seccode: seccode || validate + '|jordan'
      }),
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sms/login', async (req, res) => {
  const { cid, tel, code, captcha_key } = req.body;
  try {
    const response = await axios.post('https://passport.bilibili.com/x/passport-login/web/login/sms',
      new URLSearchParams({
        cid,
        tel,
        code,
        source: 'main_web',
        captcha_key: captcha_key || ''
      }),
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data.code === 0) {
      const cookies = extractCookiesFromHeader(response.headers['set-cookie']);
      const cookieString = formatCookieString(cookies);
      const updated = await updateEnvJsWithCookie(cookieString);
      res.json({
        success: true,
        message: '登录成功',
        cookie: cookieString,
        cookies,
        updated,
        data: response.data.data
      });
    } else {
      res.json({
        success: false,
        code: response.data.code,
        message: response.data.message || '登录失败'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const BILI_TOOL_CONTAINER = process.env.BILI_TOOL_CONTAINER || 'bili_tool_web';
const BILI_TOOL_IMAGE = process.env.BILI_TOOL_IMAGE || 'ghcr.io/raywangqvq/bili_tool_web';
const BILI_TOOL_PORT = process.env.BILI_TOOL_PORT || 22331;
const BILI_TOOL_CONFIG_DIR = process.env.BILI_TOOL_CONFIG_DIR || path.join(CONFIG_DIR, 'bili-tool');
const BILI_TOOL_HOST_CONFIG_DIR = process.env.BILI_TOOL_HOST_CONFIG_DIR || path.join(HOST_CONFIG_DIR, 'bili-tool');

app.get('/api/bili-tool/status', async (req, res) => {
  try {
    const result = await execCmd(`docker inspect ${BILI_TOOL_CONTAINER} 2>/dev/null`);
    if (result.stderr && result.stderr.includes('No such object')) {
      res.json({ exists: false, running: false });
      return;
    }
    const inspect = JSON.parse(result.stdout);
    if (inspect.length === 0) {
      res.json({ exists: false, running: false });
      return;
    }
    const state = inspect[0].State;
    res.json({
      exists: true,
      running: state.Running,
      status: state.Status,
      startedAt: state.StartedAt,
      finishedAt: state.FinishedAt,
      exitCode: state.ExitCode,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bili-tool/start', async (req, res) => {
  try {
    const logDir = path.join(BILI_TOOL_HOST_CONFIG_DIR, '..', 'Logs');
    const cfgDir = path.join(BILI_TOOL_HOST_CONFIG_DIR);
    const cmd = `docker start ${BILI_TOOL_CONTAINER} 2>/dev/null || docker run -d -v ${logDir}:/app/Logs -v ${cfgDir}:/app/config -p ${BILI_TOOL_PORT}:8080 --name ${BILI_TOOL_CONTAINER} ${BILI_TOOL_IMAGE}`;
    const result = await execCmd(cmd);
    if (result.stderr && !result.stderr.includes('already exists') && !result.stderr.includes('is already running')) {
      throw new Error(result.stderr);
    }
    res.json({ success: true, message: '容器已启动', containerId: result.stdout.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bili-tool/stop', async (req, res) => {
  try {
    const result = await execCmd(`docker stop ${BILI_TOOL_CONTAINER}`);
    if (result.stderr && result.stderr.includes('No such container')) {
      res.status(404).json({ error: '容器不存在' });
      return;
    }
    res.json({ success: true, message: '容器已停止' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bili-tool/restart', async (req, res) => {
  try {
    const result = await execCmd(`docker restart ${BILI_TOOL_CONTAINER}`);
    if (result.stderr && result.stderr.includes('No such container')) {
      res.status(404).json({ error: '容器不存在' });
      return;
    }
    res.json({ success: true, message: '容器已重启', containerId: result.stdout.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bili-tool/logs', async (req, res) => {
  const lines = req.query.lines || 200;
  try {
    const result = await execCmd(`docker logs --tail ${lines} ${BILI_TOOL_CONTAINER}`);
    if (result.stderr && result.stderr.includes('No such container')) {
      res.status(404).json({ error: '容器不存在' });
      return;
    }
    res.json({ logs: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bili-tool/config', async (req, res) => {
  const configPath = path.join(BILI_TOOL_CONFIG_DIR, 'cookies.json');
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      res.json({ content });
    } else {
      res.json({ content: JSON.stringify({ BiliBiliCookies: [] }, null, 2) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bili-tool/config', async (req, res) => {
  const configPath = path.join(BILI_TOOL_CONFIG_DIR, 'cookies.json');
  try {
    if (!fs.existsSync(BILI_TOOL_CONFIG_DIR)) {
      fs.mkdirSync(BILI_TOOL_CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(configPath, req.body.content, 'utf-8');
    res.json({ success: true, message: '配置已保存' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bili-tool/info', (req, res) => {
  res.json({
    containerName: BILI_TOOL_CONTAINER,
    image: BILI_TOOL_IMAGE,
    port: BILI_TOOL_PORT,
    configDir: BILI_TOOL_CONFIG_DIR,
  });
});

const FEISHU_APP_ID = process.env.FEISHU_APP_ID || '';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || '';
const FEISHU_OPEN_ID = process.env.FEISHU_OPEN_ID || '';

let feishuClient = null;
let feishuWsClient = null;

const CONTAINER_LABELS = {
  start: '抽奖任务',
  check: '检查任务',
  clear: '清理任务',
  account: '账号管理',
  login: '扫码登录',
};

async function sendFeishuMessage(text) {
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_OPEN_ID) {
    throw new Error('飞书配置不完整');
  }
  if (!feishuClient) {
    feishuClient = new lark.Client({
      appId: FEISHU_APP_ID,
      appSecret: FEISHU_APP_SECRET,
      appType: lark.AppType.SelfBuild,
      domain: lark.Domain.Feishu,
    });
  }
  const res = await feishuClient.im.message.create({
    params: { receive_id_type: 'open_id' },
    data: {
      receive_id: FEISHU_OPEN_ID,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    },
  });
  if (res.code !== 0) {
    throw new Error(res.msg || '发送飞书消息失败');
  }
  return res;
}

app.post('/api/notify/feishu', async (req, res) => {
  try {
    let text = req.body.text || req.body.content?.text || '';
    if (req.body.msg_type && req.body.content) {
      const content = typeof req.body.content === 'string' ? JSON.parse(req.body.content) : req.body.content;
      text = content.text || '';
    }
    if (!text) {
      text = '新消息通知';
    }
    await sendFeishuMessage(text);
    res.json({ code: 0, msg: 'success' });
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message });
  }
});

app.get('/api/notify/feishu/status', (req, res) => {
  res.json({
    configured: !!(FEISHU_APP_ID && FEISHU_APP_SECRET && FEISHU_OPEN_ID)
  });
});

async function runContainerAction(name, action) {
  const containerName = CONTAINERS[name];
  if (!containerName) {
    return { success: false, msg: `未知任务：${name}` };
  }
  try {
    const status = await getContainerStatus(containerName);
    switch (action) {
      case 'start': {
        if (status.running) {
          return { success: true, msg: `${CONTAINER_LABELS[name]} 已在运行中` };
        }
        if (status.exists) {
          await execCmd(`docker rm -f ${containerName} 2>/dev/null || true`);
        }
        await execCmd(`docker run -d \
          -v ${HOST_CONFIG_DIR}/env.js:/lottery/env.js \
          -v ${HOST_CONFIG_DIR}/my_config.js:/lottery/my_config.js \
          --network host \
          --name ${containerName} \
          ${IMAGE_NAME} \
          ${name}`);
        return { success: true, msg: `${CONTAINER_LABELS[name]} 已启动` };
      }
      case 'restart': {
        if (status.exists) {
          await execCmd(`docker rm -f ${containerName} 2>/dev/null || true`);
        }
        await execCmd(`docker run -d \
          -v ${HOST_CONFIG_DIR}/env.js:/lottery/env.js \
          -v ${HOST_CONFIG_DIR}/my_config.js:/lottery/my_config.js \
          --network host \
          --name ${containerName} \
          ${IMAGE_NAME} \
          ${name}`);
        return { success: true, msg: `${CONTAINER_LABELS[name]} 已重启` };
      }
      case 'stop': {
        if (!status.exists) {
          return { success: true, msg: `${CONTAINER_LABELS[name]} 未在运行` };
        }
        await execCmd(`docker stop ${containerName} 2>/dev/null || true`);
        await execCmd(`docker rm -f ${containerName} 2>/dev/null || true`);
        return { success: true, msg: `${CONTAINER_LABELS[name]} 已停止` };
      }
      case 'status': {
        if (!status.exists) {
          return { success: true, msg: `${CONTAINER_LABELS[name]}：未运行` };
        }
        return { success: true, msg: `${CONTAINER_LABELS[name]}：${status.status}${status.running ? '（运行中）' : ''}` };
      }
      default:
        return { success: false, msg: `未知操作：${action}` };
    }
  } catch (err) {
    return { success: false, msg: `操作失败：${err.message}` };
  }
}

async function sendFeishuReply(messageId, text) {
  if (!feishuClient) {
    throw new Error('飞书客户端未初始化');
  }
  const res = await feishuClient.im.message.reply({
    path: { message_id: messageId },
    data: {
      msg_type: 'text',
      content: JSON.stringify({ text }),
    },
  });
  if (res.code !== 0) {
    console.error('[Feishu] 回复消息失败:', res.code, res.msg);
  }
  return res;
}

function initFeishuLongConnection() {
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    console.log('[Feishu] App ID/Secret 未配置，跳过长连接初始化');
    return;
  }

  if (!feishuClient) {
    feishuClient = new lark.Client({
      appId: FEISHU_APP_ID,
      appSecret: FEISHU_APP_SECRET,
      appType: lark.AppType.SelfBuild,
      domain: lark.Domain.Feishu,
      loggerLevel: lark.LoggerLevel.info,
    });
  }

  const eventDispatcher = new lark.EventDispatcher({}).register({
    'im.message.receive_v1': async (data) => {
      try {
        const msg = data.message;
        const msgType = msg.message_type;
        if (msgType !== 'text') {
          await sendFeishuReply(msg.message_id, '⚠️ 仅支持文本消息指令\n\n发送"帮助"查看可用指令');
          return;
        }
        let content = '';
        try {
          content = JSON.parse(msg.content).text || '';
        } catch (e) {
          content = '';
        }
        content = content.trim().replace(/@\S+\s?/g, '').trim();
        const lowerContent = content.toLowerCase();

        if (content === '状态' || lowerContent === 'status' || content === '状态查询') {
          const dockerStatus = await execCmd('docker ps -a --format "{{.Names}}|{{.Status}}" 2>/dev/null');
          const lines = dockerStatus.stdout.trim().split('\n').filter(l => l);
          let reply = '📊 服务状态\n\n';
          for (const line of lines) {
            const idx = line.indexOf('|');
            const name = line.slice(0, idx);
            const status = line.slice(idx + 1);
            const icon = status.startsWith('Up') ? '✅' : '❌';
            reply += `${icon} ${name}: ${status}\n`;
          }
          if (!lines.length) reply += '暂无容器';
          await sendFeishuReply(msg.message_id, reply);
        } else if (
          lowerContent === 'start' || lowerContent === '启动' ||
          lowerContent === 'start start' || content === '启动抽奖' ||
          content === '开始抽奖'
        ) {
          const result = await runContainerAction('start', 'start');
          await sendFeishuReply(msg.message_id,
            `🎰 ${result.success ? '✅' : '❌'} ${result.msg}`);
        } else if (
          lowerContent === 'check' || lowerContent === '检查' ||
          lowerContent === 'start check' || content === '启动检查'
        ) {
          const result = await runContainerAction('check', 'start');
          await sendFeishuReply(msg.message_id,
            `🔍 ${result.success ? '✅' : '❌'} ${result.msg}`);
        } else if (
          lowerContent === 'clear' || lowerContent === '清理' ||
          lowerContent === 'start clear' || content === '启动清理'
        ) {
          const result = await runContainerAction('clear', 'start');
          await sendFeishuReply(msg.message_id,
            `🧹 ${result.success ? '✅' : '❌'} ${result.msg}`);
        } else if (
          lowerContent === 'stop' || lowerContent === '停止' ||
          lowerContent === 'stop start' || content === '停止抽奖'
        ) {
          const result = await runContainerAction('start', 'stop');
          await sendFeishuReply(msg.message_id,
            `🛑 ${result.success ? '✅' : '❌'} ${result.msg}`);
        } else if (
          lowerContent === 'restart' || lowerContent === '重启' ||
          lowerContent === 'restart start' || content === '重启抽奖'
        ) {
          const result = await runContainerAction('start', 'restart');
          await sendFeishuReply(msg.message_id,
            `🔄 ${result.success ? '✅' : '❌'} ${result.msg}`);
        } else if (lowerContent.startsWith('启动 ') || lowerContent.startsWith('start ')) {
          const taskName = content.slice(content.indexOf(' ') + 1).trim().toLowerCase();
          const nameMap = { '抽奖': 'start', 'start': 'start', '检查': 'check', 'check': 'check', '清理': 'clear', 'clear': 'clear', '账号': 'account', 'account': 'account', '登录': 'login', 'login': 'login' };
          const name = nameMap[taskName];
          if (!name) {
            await sendFeishuReply(msg.message_id,
              `❌ 未知任务：${taskName}\n\n支持的任务：抽奖、检查、清理、账号、登录`);
            return;
          }
          const result = await runContainerAction(name, 'start');
          await sendFeishuReply(msg.message_id,
            `🚀 ${result.success ? '✅' : '❌'} ${result.msg}`);
        } else if (lowerContent.startsWith('停止 ') || lowerContent.startsWith('stop ')) {
          const taskName = content.slice(content.indexOf(' ') + 1).trim().toLowerCase();
          const nameMap = { '抽奖': 'start', 'start': 'start', '检查': 'check', 'check': 'check', '清理': 'clear', 'clear': 'clear', '账号': 'account', 'account': 'account', '登录': 'login', 'login': 'login' };
          const name = nameMap[taskName];
          if (!name) {
            await sendFeishuReply(msg.message_id,
              `❌ 未知任务：${taskName}\n\n支持的任务：抽奖、检查、清理、账号、登录`);
            return;
          }
          const result = await runContainerAction(name, 'stop');
          await sendFeishuReply(msg.message_id,
            `🛑 ${result.success ? '✅' : '❌'} ${result.msg}`);
        } else if (lowerContent.startsWith('重启 ') || lowerContent.startsWith('restart ')) {
          const taskName = content.slice(content.indexOf(' ') + 1).trim().toLowerCase();
          const nameMap = { '抽奖': 'start', 'start': 'start', '检查': 'check', 'check': 'check', '清理': 'clear', 'clear': 'clear', '账号': 'account', 'account': 'account', '登录': 'login', 'login': 'login' };
          const name = nameMap[taskName];
          if (!name) {
            await sendFeishuReply(msg.message_id,
              `❌ 未知任务：${taskName}\n\n支持的任务：抽奖、检查、清理、账号、登录`);
            return;
          }
          const result = await runContainerAction(name, 'restart');
          await sendFeishuReply(msg.message_id,
            `🔄 ${result.success ? '✅' : '❌'} ${result.msg}`);
        } else if (content === '帮助' || lowerContent === 'help' || content === '?') {
          await sendFeishuReply(msg.message_id,
            '🤖 飞书机器人指令\n\n' +
            '📊 状态查询\n' +
            '  状态 - 查看所有容器运行状态\n\n' +
            '🎮 任务控制\n' +
            '  启动抽奖 / start - 启动抽奖任务\n' +
            '  启动检查 / check - 启动检查任务\n' +
            '  启动清理 / clear - 启动清理任务\n' +
            '  停止抽奖 / stop - 停止抽奖任务\n' +
            '  重启抽奖 / restart - 重启抽奖任务\n' +
            '  启动 <任务名> - 启动指定任务\n' +
            '  停止 <任务名> - 停止指定任务\n' +
            '  重启 <任务名> - 重启指定任务\n' +
            '  （任务名：抽奖/检查/清理/账号/登录）\n\n' +
            '💡 中奖通知会自动推送到此会话');
        } else if (content) {
          await sendFeishuReply(msg.message_id,
            `收到消息：${content}\n\n发送"帮助"查看可用指令`);
        }
      } catch (err) {
        console.error('[Feishu] 处理消息事件失败:', err.message);
      }
    },
  });

  feishuWsClient = new lark.WSClient({
    appId: FEISHU_APP_ID,
    appSecret: FEISHU_APP_SECRET,
    loggerLevel: lark.LoggerLevel.info,
    domain: lark.Domain.Feishu,
  });

  feishuWsClient.start({
    eventDispatcher,
  }).then(() => {
    console.log('[Feishu] 长连接已启动');
  }).catch((err) => {
    console.error('[Feishu] 长连接启动失败:', err.message);
  });
}

initFeishuLongConnection();

const containerMonitorState = {
  check: { wasRunning: false, notified: false },
  start: { wasRunning: false, notified: false },
  clear: { wasRunning: false, notified: false },
};

async function checkForWinInLogs(containerName) {
  try {
    const result = await execCmd(`docker logs ${containerName} 2>&1 | grep -iE "中奖|恭喜|中了|winner|winning|已中奖" | tail -5`);
    return result.stdout && result.stdout.trim().length > 0;
  } catch (e) {
    return false;
  }
}

async function getTaskSummary(containerName) {
  try {
    const result = await execCmd(`docker logs ${containerName} 2>&1 | tail -30`);
    const logs = result.stdout || '';
    let total = '';
    const match = logs.match(/共.*?[抽奖动态|动态].*?(\d+)/i) || logs.match(/参与.*?(\d+).*?抽奖/i) || logs.match(/总.*?(\d+).*?个/i);
    if (match) total = match[1];
    return { total, raw: logs };
  } catch (e) {
    return { total: '', raw: '' };
  }
}

async function runContainerMonitor() {
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_OPEN_ID) return;

  const monitorTargets = [
    { key: 'check', label: '检查任务', emoji: '🔍' },
    { key: 'clear', label: '清理任务', emoji: '🧹' },
  ];

  for (const target of monitorTargets) {
    const containerName = CONTAINERS[target.key];
    if (!containerName) continue;
    try {
      const status = await getContainerStatus(containerName);
      const state = containerMonitorState[target.key];

      if (status.running) {
        if (!state.wasRunning) {
          state.wasRunning = true;
          state.notified = false;
          console.log(`[Monitor] ${target.label} 开始运行`);
        }
      } else {
        if (state.wasRunning && !state.notified) {
          state.wasRunning = false;
          state.notified = true;
          console.log(`[Monitor] ${target.label} 已结束，检查结果...`);

          const hasWon = await checkForWinInLogs(containerName);
          const summary = await getTaskSummary(containerName);

          let title, content;
          if (hasWon) {
            title = `${target.emoji} ${target.label}完成 - 🎉 恭喜中奖！`;
            content = `${target.label}已运行完毕，检测到中奖信息！\n\n请查看详细日志确认中奖详情。`;
          } else {
            title = `${target.emoji} ${target.label}完成 - 未中奖`;
            content = `${target.label}已运行完毕，本次未检测到中奖信息。\n继续加油，下次一定！💪`;
          }

          if (summary.total) {
            content += `\n\n📊 处理数量：${summary.total}`;
          }

          const exitInfo = status.exitCode !== undefined ? `\n📝 退出码：${status.exitCode}` : '';
          content += exitInfo;

          try {
            await sendFeishuMessage(title + '\n\n' + content);
            console.log(`[Monitor] ${target.label}完成通知已发送`);
          } catch (err) {
            console.error('[Monitor] 发送通知失败:', err.message);
          }
        } else if (!status.exists) {
          state.wasRunning = false;
        }
      }
    } catch (e) {
      console.error(`[Monitor] ${target.key} 监控异常:`, e.message);
    }
  }
}

let containerMonitorTimer = null;
function startContainerMonitor() {
  if (containerMonitorTimer) clearInterval(containerMonitorTimer);
  if (FEISHU_APP_ID && FEISHU_APP_SECRET && FEISHU_OPEN_ID) {
    containerMonitorTimer = setInterval(runContainerMonitor, 15 * 1000);
    console.log('[Monitor] 容器监控已启动（15秒间隔）');
  }
}

startContainerMonitor();

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built yet');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lottery Control Panel API running on port ${PORT}`);
  console.log(`Config directory: ${CONFIG_DIR}`);
});
