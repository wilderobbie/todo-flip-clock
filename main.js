const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')

// 允许音频免用户手势自动播放（翻页音效由计时器触发）
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

// 窗口控制 IPC（自绘标题栏按钮）——全局注册一次
ipcMain.handle('win:minimize', e => BrowserWindow.fromWebContents(e.sender)?.minimize())
ipcMain.handle('win:toggleMaximize', e => {
  const win = BrowserWindow.fromWebContents(e.sender)
  if (!win) return
  win.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.handle('win:close', e => BrowserWindow.fromWebContents(e.sender)?.close())

const sendMax = win => win.webContents.send('win:maximized', win.isMaximized())
app.on('browser-window-created', (_e, win) => {
  win.on('maximize', () => sendMax(win))
  win.on('unmaximize', () => sendMax(win))
})

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Todo',
    icon: path.join(__dirname, 'assets', 'icons', 'icon.ico'),
    autoHideMenuBar: true,
    frame: process.platform === 'darwin', // Windows 使用自绘标题栏以跟随主题
    backgroundColor: '#f5f6f8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile('index.html')
  // 显式补设一次窗口/任务栏图标
  mainWindow.setIcon(path.join(__dirname, 'assets', 'icons', 'icon.ico'))
}

app.whenReady().then(() => {
  // Windows 任务栏图标
  if (process.platform === 'win32') app.setAppUserModelId('com.todo.flipclock')
  // macOS Dock 图标（开发模式 BrowserWindow icon 不作用于 Dock）
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(path.join(__dirname, 'assets', 'icons', 'icon.png'))
  }
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
