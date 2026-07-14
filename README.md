# Lottery Web - B站抽奖工具 Web 管理面板

> **⚠️ 声明：本项目由 AI（Trae IDE）全程开发，未经过人工编写代码。代码质量和功能完整性请自行验证。**
>
> 本项目是对以下两个优秀开源项目的 **Web 管理界面封装**，核心功能完全依赖于原作者的工作：
>
> - **[LotteryAutoScript](https://github.com/shanmiteko/LotteryAutoScript)** by [@shanmiteko](https://github.com/shanmiteko) — B站动态抽奖自动化工具（GPL-3.0-or-later）
> - **[BiliBiliToolPro](https://github.com/RayWangQvQ/BiliBiliToolPro)** by [@RayWangQvQ](https://github.com/RayWangQvQ) — BiliBili 自动任务工具（GPLv3）
>
> **衷心感谢以上原作者的开源贡献！** 本项目仅在他们的工作基础上提供了统一的 Web 管理面板，不包含任何核心业务逻辑的实现。
>
> 本项目遵循 **GNU General Public License v3.0** 开源协议，与上游项目保持一致。任何基于本项目的衍生作品必须同样以 GPLv3 协议开源，并保留原作者的版权声明。

---

## 项目简介

Lottery Web 是一个基于 Docker 的 B站自动化工具 Web 管理面板，将 B站动态抽奖和 BiliBiliToolPro 两个工具整合到一个统一的 Web 界面中，方便用户通过浏览器进行配置和管理。

## 功能特性

### 🎰 抽奖自动化（基于 LotteryAutoScript）

- 📋 **账户管理** - 添加、删除、查看抽奖账户
- 📱 **扫码登录** - 通过二维码快速登录 B站账号
- ⏰ **定时任务** - 配置看门狗定时执行抽奖任务
- 📊 **状态监控** - 实时查看容器运行状态
- 📜 **日志查看** - 实时查看运行日志
- ⚙️ **配置编辑** - 在线编辑抽奖配置文件
- 🔔 **飞书通知** - 中奖后自动通过飞书推送消息（可选）

### 🛠️ BiliBiliToolPro 集成

- 🚀 **容器管理** - 一键启动、停止、重启 BiliTool 容器
- 📜 **日志查看** - 实时查看 BiliTool 运行日志
- 🍪 **Cookie 配置** - 在线编辑 Cookie 信息
- 🌐 **界面嵌入** - 通过 iframe 直接使用 BiliTool 完整 Web 界面
- 👥 **多账号支持** - 支持配置多个 B站账号

### 🤖 飞书机器人（可选）

通过飞书长连接模式，无需公网域名即可实现：

- 🔔 **中奖通知** - 中奖后自动推送消息到飞书
- 🔍 **任务完成通知** - check/clear 任务结束后自动通知（中不中奖都会通知）
- 🎮 **远程任务控制** - 通过飞书消息启动/停止/重启抽奖任务
- 📊 **状态查询** - 随时查看容器运行状态

```
抽奖工具检测到中奖 → FS_BOT_WEBHOOK → 内部转发接口 → 飞书应用 API → 个人飞书消息
飞书消息指令 ←→ 长连接 WebSocket ←→ 服务端事件处理 → Docker 容器操作
```

配置方法见下方[飞书通知配置](#飞书通知配置)章节。

## 快速开始

### 前置要求

- Docker（版本 20.10+）
- Docker Compose（版本 2.0+）
- 能够访问 GitHub Container Registry（拉取 BiliTool 镜像）

### 安装部署

1. 克隆本仓库到本地，然后进入项目目录

2. 复制配置模板

```bash
cp .env.example .env
cp config/env.example.js config/env.js
cp config/my_config.example.js config/my_config.js
cp config/bili-tool/cookies.json.example config/bili-tool/cookies.json
```

3. 填写配置

- 编辑 `config/env.js`，填入你的 B站 Cookie（详见 [Cookie 获取方法](https://github.com/shanmiteko/LotteryAutoScript#获取cookie)）
- 编辑 `config/my_config.js`，根据需要配置抽奖参数（详见 [配置说明](https://github.com/shanmiteko/LotteryAutoScript#设置说明)）
- 编辑 `.env`，根据需要调整端口和路径

4. 启动服务

```bash
docker compose up -d
```

5. 访问 Web 界面

打开浏览器访问 `http://localhost:9080`

## 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `9080` | Web 服务端口 |
| `TZ` | `Asia/Shanghai` | 时区设置 |
| `CONFIG_DIR` | `/data/config` | 容器内配置目录 |
| `HOST_CONFIG_DIR` | `./config` | 宿主机配置目录（相对路径） |
| `BILI_TOOL_CONTAINER` | `bili_tool_web` | BiliTool 容器名称 |
| `BILI_TOOL_IMAGE` | `ghcr.io/raywangqvq/bili_tool_web` | BiliTool Docker 镜像 |
| `BILI_TOOL_PORT` | `22331` | BiliTool Web 端口 |
| `BILI_TOOL_CONFIG_DIR` | `/data/config/bili-tool` | 容器内 BiliTool 配置目录 |
| `BILI_TOOL_HOST_CONFIG_DIR` | `./config/bili-tool` | 宿主机 BiliTool 配置目录 |
| `FEISHU_APP_ID` | - | 飞书应用 App ID（可选） |
| `FEISHU_APP_SECRET` | - | 飞书应用 App Secret（可选） |
| `FEISHU_OPEN_ID` | - | 接收消息的用户 open_id（可选） |

### 配置目录结构

```
config/
├── .watchdog.json          # 定时任务配置（自动生成）
├── .schedule.json          # 调度配置（自动生成）
├── env.js                  # 抽奖工具账号配置（必需）
├── my_config.js            # 抽奖工具自定义配置（必需）
└── bili-tool/
    └── cookies.json        # BiliBiliToolPro Cookie 配置
```

### 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| Web 管理面板 | 9080 | 本项目的 Web 界面 |
| BiliTool Web | 22331 | BiliBiliToolPro 的 Web 界面 |

> 💡 以上端口均可通过 `.env` 文件自定义修改。

### BiliTool 默认登录信息

BiliTool Web 界面的默认登录凭据（在「BiliTool界面」标签页也会显示）：

| 项目 | 值 |
|------|------|
| 用户名 | `admin` |
| 密码 | `BiliTool@2233` |

> ⚠️ 登录后请及时修改默认密码

### 飞书通知配置

飞书机器人是可选功能，使用**长连接模式**，无需公网域名或加密策略。配置后支持中奖通知、任务完成通知、远程任务控制等。

**第一步：创建飞书应用**

1. 打开 [飞书开放平台](https://open.feishu.cn)，登录后点击「创建企业自建应用」
2. 填写应用名称和描述，创建应用
3. 记下 **App ID** 和 **App Secret**

**第二步：开通权限**

在应用「权限管理」中开通以下权限：
- `im:message` — 读取与发送消息
- `im:message:send_as_bot` — 以应用身份发送消息

然后发布应用版本，等待管理员审核通过。

**第三步：配置事件订阅（长连接模式）**

1. 进入「事件与回调」→「事件配置」
2. 订阅方式选择「使用长连接接收事件」
3. 点击「添加事件」，搜索并添加「接收消息」事件（`im.message.receive_v1`）
4. 保存配置

**第四步：获取你的 open_id**

1. 打开 [API 调试台](https://open.feishu.cn/api-explorer)
2. 选择你的应用，扫码授权
3. 调用「获取登录用户身份」接口，获取返回中的 `open_id`（`ou_` 开头）

**第五步：填写配置**

编辑 `.env` 文件，填入飞书凭证：
```bash
FEISHU_APP_ID=你的App ID
FEISHU_APP_SECRET=你的App Secret
FEISHU_OPEN_ID=你的open_id
```

编辑 `config/env.js`，在 `push_parm` 中设置：
```javascript
FS_BOT_WEBHOOK: 'http://localhost:9080/api/notify/feishu',
```

> 💡 如果抽奖容器使用 bridge 网络而非 host 网络，请将 `localhost` 替换为 Web 容器的 IP 或宿主机 IP。

**第六步：重启服务**

```bash
docker compose up -d
```

重启后，在飞书搜索你的机器人并发送「帮助」验证连接是否成功。

### 飞书机器人指令

在飞书机器人对话中可使用以下指令（支持中文/英文）：

| 指令 | 功能 |
|------|------|
| `状态` / `status` | 📊 查看所有容器运行状态 |
| `启动抽奖` / `start` | 🎰 启动抽奖任务 |
| `启动检查` / `check` | 🔍 启动检查任务 |
| `启动清理` / `clear` | 🧹 启动清理任务 |
| `停止抽奖` / `stop` | 🛑 停止抽奖任务 |
| `重启抽奖` / `restart` | 🔄 重启抽奖任务 |
| `启动 <任务名>` | 🚀 启动指定任务（抽奖/检查/清理/账号/登录） |
| `停止 <任务名>` | 🛑 停止指定任务 |
| `重启 <任务名>` | 🔄 重启指定任务 |
| `帮助` / `help` / `?` | 📖 显示帮助信息 |

> 💡 check 和 clear 任务运行结束后会自动推送结果通知（中不中奖都会通知）。

## 使用说明

### 抽奖功能

1. **配置账号**：编辑 `config/env.js`，填入 B站 Cookie
2. **配置参数**：编辑 `config/my_config.js`，设置抽奖条件、关键词等
3. **启动任务**：在 Web 界面的「仪表盘」页面配置定时任务并启动
4. **查看状态**：在「账户」页面查看各账户运行状态和日志

### BiliTool 功能

1. **启动容器**：在「BiliTool」页面点击「启动」按钮
2. **配置 Cookie**：在「配置」标签页编辑 Cookie 信息
3. **使用界面**：在「BiliTool界面」标签页直接使用完整功能
4. **查看日志**：在「日志」标签页查看运行日志

## API 接口

### 抽奖相关

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/status` | 获取所有容器状态 |
| `POST` | `/api/container/:action/:name` | 容器操作（start/stop/remove） |
| `GET` | `/api/logs/:name` | 获取容器日志 |
| `GET` | `/api/logs/stream/:name` | 实时日志流（SSE） |
| `GET` | `/api/config/:file` | 获取配置文件内容 |
| `POST` | `/api/config/:file` | 保存配置文件 |
| `GET` | `/api/qrcode` | 生成登录二维码 |
| `GET` | `/api/qrcode/poll/:key` | 轮询二维码扫码状态 |
| `POST` | `/api/sms/send` | 发送短信验证码 |
| `POST` | `/api/sms/login` | 短信登录 |
| `GET` | `/api/watchdog` | 获取看门狗配置 |
| `POST` | `/api/watchdog` | 保存看门狗配置 |
| `GET` | `/api/schedule` | 获取调度配置 |
| `POST` | `/api/schedule` | 保存调度配置 |

### BiliTool 相关

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/bili-tool/status` | 获取容器状态 |
| `GET` | `/api/bili-tool/info` | 获取配置信息 |
| `POST` | `/api/bili-tool/start` | 启动容器 |
| `POST` | `/api/bili-tool/stop` | 停止容器 |
| `POST` | `/api/bili-tool/restart` | 重启容器 |
| `GET` | `/api/bili-tool/logs` | 获取容器日志 |
| `GET` | `/api/bili-tool/config` | 获取配置 |
| `POST` | `/api/bili-tool/config` | 保存配置 |

### 飞书机器人相关

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/notify/feishu` | 发送飞书消息通知（兼容群机器人格式） |
| `GET` | `/api/notify/feishu/status` | 检查飞书是否已配置 |

> 💡 飞书机器人通过**长连接模式**接收消息，无需公网域名。在飞书应用后台事件配置中选择「使用长连接接收事件」即可。

请求体格式（兼容原项目群机器人格式）：
```json
{
  "msg_type": "text",
  "content": { "text": "消息内容" }
}
```

## 技术栈

- **前端**：React 18 + TypeScript + Vite + TailwindCSS
- **后端**：Node.js + Express
- **容器**：Docker + Docker Compose
- **图标**：Lucide React
- **飞书机器人**：`@larksuiteoapi/node-sdk` 长连接模式（可选）

## 常见问题

### Q: 首次启动很慢？
A: 首次启动需要拉取 Docker 镜像（包括 Node.js 构建镜像和 BiliTool 镜像），请耐心等待。

### Q: BiliTool 容器启动失败？
A: 请检查：
1. Docker 是否正常运行
2. 是否能够访问 `ghcr.io` 拉取镜像
3. 端口 `22331` 是否被占用

### Q: 抽奖工具不工作？
A: 请检查：
1. `config/env.js` 中的 Cookie 是否正确
2. `config/my_config.js` 配置是否合理
3. 容器日志中是否有错误信息

### Q: 飞书通知收不到？
A: 请检查：
1. `.env` 文件中的 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_OPEN_ID` 是否已填写
2. 飞书应用是否已发布并开通 `im:message` 和 `im:message:send_as_bot` 权限
3. 事件订阅是否已配置为「长连接模式」并添加了 `im.message.receive_v1` 事件
4. `config/env.js` 中 `FS_BOT_WEBHOOK` 是否指向 `http://localhost:9080/api/notify/feishu`
5. 访问 `http://localhost:9080/api/notify/feishu/status` 确认配置状态
6. 如果抽奖容器使用 bridge 网络，需将 `FS_BOT_WEBHOOK` 中的 `localhost` 替换为宿主机 IP
7. 查看容器日志确认长连接是否成功建立：`docker compose logs lottery-web | grep "长连接"`

### Q: 飞书机器人不回复消息？
A: 请检查：
1. 飞书应用后台「事件与回调」→「事件配置」中订阅方式是否为「长连接」
2. 是否已订阅 `im.message.receive_v1`（接收消息）事件
3. 是否已开通 `im:message`（读取消息）权限
4. 容器日志中是否有 `[Feishu] 长连接已启动` 和 `ws client ready` 字样

### Q: BiliTool 默认密码是什么？
A: 默认用户名 `admin`，密码 `BiliTool@2233`，登录后请及时修改。

### Q: 如何更新配置？
A: 可以直接编辑 `config/` 目录下的配置文件，也可以通过 Web 界面在线编辑。修改后需要重启对应容器才能生效。

## 注意事项

- ⚠️ 本项目仅供学习和研究使用，请遵守 B站相关使用条款
- ⚠️ 使用自动化工具可能存在账号风险，请谨慎使用
- 💾 配置目录建议定期备份
- 🔒 请勿将包含个人 Cookie 的配置文件上传到公开仓库

## 致谢

本项目站在巨人的肩膀上，核心功能完全依赖以下开源项目：

| 项目 | 作者 | 协议 | 说明 |
|------|------|------|------|
| [LotteryAutoScript](https://github.com/shanmiteko/LotteryAutoScript) | [@shanmiteko](https://github.com/shanmiteko) | GPL-3.0-or-later | B站动态抽奖自动化工具 |
| [BiliBiliToolPro](https://github.com/RayWangQvQ/BiliBiliToolPro) | [@RayWangQvQ](https://github.com/RayWangQvQ) | GPLv3 | BiliBili 自动任务工具 |

感谢以上原作者的无私开源贡献！

## License

本项目基于 [GNU General Public License v3.0](./LICENSE) 开源协议，与上游项目保持一致。

```
Copyright (C) 2026 Lottery Web Contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
