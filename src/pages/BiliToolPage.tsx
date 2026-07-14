import { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, FileText, Settings, ExternalLink, Terminal, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
interface BiliToolStatus {
 exists: boolean;
 running: boolean;
 status?: string;
 startedAt?: string;
 finishedAt?: string;
 exitCode?: number;
}
interface BiliToolInfo {
 containerName: string;
 image: string;
 port: number;
 configDir: string;
}
export default function BiliToolPage() {
 const [status, setStatus] = useState<BiliToolStatus>({ exists: false, running: false });
 const [info, setInfo] = useState<BiliToolInfo | null>(null);
 const [logs, setLogs] = useState('');
 const [config, setConfig] = useState('');
 const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'config' | 'embed'>('dashboard');
 const [loading, setLoading] = useState(false);
 const [message, setMessage] = useState('');
 useEffect(() => {
 fetchStatus();
 fetchInfo();
 }, []);
 const fetchInfo = async () => {
 try {
 const res = await fetch('/api/bili-tool/info');
 if (res.ok) {
 setInfo(await res.json());
 }
 } catch (err) {}
 };
 const biliToolUrl = info ? `http://${window.location.hostname}:${info.port}` : 'http://localhost:22331';
 const fetchStatus = async () => {
 try {
 const res = await fetch('/api/bili-tool/status');
 if (res.ok) {
 setStatus(await res.json());
 }
 } catch (err) {
 setMessage('获取状态失败');
 }
 };
 const handleStart = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/bili-tool/start', { method: 'POST' });
 const data = await res.json();
 if (res.ok) {
 setMessage('容器启动成功');
 setTimeout(fetchStatus, 2000);
 } else {
 setMessage(data.error || '启动失败');
 }
 } catch (err: any) {
 setMessage(err.message || '启动失败');
 } finally {
 setLoading(false);
 }
 };
 const handleStop = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/bili-tool/stop', { method: 'POST' });
 const data = await res.json();
 if (res.ok) {
 setMessage('容器已停止');
 setTimeout(fetchStatus, 1000);
 } else {
 setMessage(data.error || '停止失败');
 }
 } catch (err: any) {
 setMessage(err.message || '停止失败');
 } finally {
 setLoading(false);
 }
 };
 const handleRestart = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/bili-tool/restart', { method: 'POST' });
 const data = await res.json();
 if (res.ok) {
 setMessage('容器重启成功');
 setTimeout(fetchStatus, 2000);
 } else {
 setMessage(data.error || '重启失败');
 }
 } catch (err: any) {
 setMessage(err.message || '重启失败');
 } finally {
 setLoading(false);
 }
 };
 const handleFetchLogs = async () => {
 try {
 const res = await fetch('/api/bili-tool/logs?lines=200');
 if (res.ok) {
 const data = await res.json();
 setLogs(data.logs);
 } else {
 setMessage('获取日志失败');
 }
 } catch (err: any) {
 setMessage(err.message || '获取日志失败');
 }
 };
 const handleFetchConfig = async () => {
 try {
 const res = await fetch('/api/bili-tool/config');
 if (res.ok) {
 const data = await res.json();
 setConfig(data.content);
 } else {
 setMessage('获取配置失败');
 }
 } catch (err: any) {
 setMessage(err.message || '获取配置失败');
 }
 };
 const handleSaveConfig = async () => {
 try {
 const res = await fetch('/api/bili-tool/config', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ content: config })
 });
 if (res.ok) {
 setMessage('配置保存成功');
 } else {
 setMessage('保存失败');
 }
 } catch (err: any) {
 setMessage(err.message || '保存失败');
 }
 };
 useEffect(() => {
 if (activeTab === 'logs') {
 handleFetchLogs();
 } else if (activeTab === 'config') {
 handleFetchConfig();
 }
 }, [activeTab]);
 const tabs = [
 { id: 'dashboard', label: '仪表盘', icon: Settings },
 { id: 'logs', label: '日志', icon: Terminal },
 { id: 'config', label: '配置', icon: FileText },
 { id: 'embed', label: 'BiliTool界面', icon: ExternalLink },
 ] as const;
 const renderDashboard = () => (<div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className={`glass-card p-6 ${status.running ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
 <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${status.running ? 'bg-emerald-500/20' : 'bg-red-500/20'} mb-4`}>
 {status.running ? <CheckCircle2 className="w-6 h-6 text-emerald-400"/> : <AlertCircle className="w-6 h-6 text-red-400"/>}
 </div>
 <div className="text-2xl font-bold text-white mb-1">{status.running ? '运行中' : '已停止'}</div>
 <div className="text-sm text-gray-400">容器状态</div>
 </div>

 <div className="glass-card p-6">
 <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-lottery-pink/20 mb-4">
 <Clock className="w-6 h-6 text-lottery-pink"/>
 </div>
 <div className="text-2xl font-bold text-white mb-1">{status.exists ? '已创建' : '未创建'}</div>
 <div className="text-sm text-gray-400">容器状态</div>
 </div>

 <div className="glass-card p-6">
 <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-lottery-gold/20 mb-4">
 <ExternalLink className="w-6 h-6 text-lottery-gold"/>
 </div>
 <div className="text-lg font-bold text-white mb-1">{biliToolUrl}</div>
 <div className="text-sm text-gray-400">访问地址</div>
 </div>
 </div>

 <div className="glass-card p-6">
 <h3 className="text-lg font-semibold text-white mb-4">容器控制</h3>
 <div className="flex flex-wrap gap-3">
 {!status.running ? (<button onClick={handleStart} disabled={loading} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
 <Play className="w-5 h-5"/>
 {loading ? '启动中...' : '启动容器'}
 </button>) : (<>
 <button onClick={handleStop} disabled={loading} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
 <Square className="w-5 h-5"/>
 {loading ? '停止中...' : '停止容器'}
 </button>
 <button onClick={handleRestart} disabled={loading} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
 <RotateCcw className="w-5 h-5"/>
 {loading ? '重启中...' : '重启容器'}
 </button>
 </>)}
 </div>
 </div>

 <div className="glass-card p-6">
 <h3 className="text-lg font-semibold text-white mb-4">功能说明</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
 <span className="text-gray-300">扫码登录，自动更新cookie</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
 <span className="text-gray-300">每日获取满额升级经验（登录、投币、点赞、分享）</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
 <span className="text-gray-300">直播间挂机</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
 <span className="text-gray-300">每天漫画签到</span>
 </div>
 </div>
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
 <span className="text-gray-300">银瓜子兑换为硬币</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
 <span className="text-gray-300">每月领取大会员福利</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
 <span className="text-gray-300">直播中心天选时刻自动参与抽奖</span>
 </div>
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
 <span className="text-gray-300">支持多账号</span>
 </div>
 </div>
 </div>
 </div>
 </div>);
 const renderLogs = () => (<div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-semibold text-white">容器日志</h3>
 <button onClick={handleFetchLogs} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lottery-card text-gray-300 hover:text-white transition-colors">
 <RotateCcw className="w-4 h-4"/>
 刷新
 </button>
 </div>
 <div className="glass-card p-4">
 <pre className="text-sm text-gray-400 overflow-x-auto max-h-[600px] overflow-y-auto">{logs || '暂无日志'}</pre>
 </div>
 </div>);
 const renderConfig = () => (<div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-semibold text-white">cookies.json 配置</h3>
 <button onClick={handleSaveConfig} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-lottery-pink to-lottery-rose text-white font-medium hover:opacity-90 transition-opacity">
 <FileText className="w-4 h-4"/>
 保存
 </button>
 </div>
 <div className="glass-card p-4">
 <textarea value={config} onChange={e => setConfig(e.target.value)} className="w-full h-[500px] p-4 rounded-lg bg-lottery-dark/50 border border-lottery-border text-white font-mono text-sm focus:outline-none focus:border-lottery-pink/50 resize-none" placeholder="{}"/>
 </div>
 </div>);
 const renderEmbed = () => (<div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-semibold text-white">BiliTool Web 界面</h3>
 <a href={biliToolUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lottery-card text-gray-300 hover:text-white transition-colors">
 <ExternalLink className="w-4 h-4"/>
 在新窗口打开
 </a>
 </div>
 <div className="glass-card p-4">
 <iframe src={biliToolUrl} className="w-full h-[700px] rounded-lg border-0 bg-white" title="BiliTool Web"/>
 </div>
 </div>);
 return (<div className="p-4 md:p-8">
 <div className="max-w-7xl mx-auto">
 <div className="flex items-center gap-4 mb-8">
 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
 <ExternalLink className="w-6 h-6 text-white"/>
 </div>
 <div>
 <h1 className="text-2xl font-bold text-white">BiliBiliToolPro</h1>
 <p className="text-gray-400">B站每日任务自动化工具管理</p>
 </div>
 </div>

 {message && (<div className="mb-6 p-4 rounded-xl bg-lottery-card border border-lottery-border">
 <p className="text-gray-300">{message}</p>
 </div>)}

 <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
 {tabs.map(tab => {
 const Icon = tab.icon;
 return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
 ? 'bg-lottery-pink/20 text-lottery-pink border border-lottery-pink/30'
 : 'text-gray-400 hover:text-white hover:bg-lottery-card'}`}>
 <Icon className="w-4 h-4"/>
 {tab.label}
 </button>);
 })}
 </div>

 {activeTab === 'dashboard' && renderDashboard()}
 {activeTab === 'logs' && renderLogs()}
 {activeTab === 'config' && renderConfig()}
 {activeTab === 'embed' && renderEmbed()}
 </div>
 </div>);
}