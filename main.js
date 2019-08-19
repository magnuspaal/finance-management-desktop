const { app, BrowserWindow, ipcMain } = require('electron');
const settings = require('electron-settings');

app.on('ready', function() {

  let win = new BrowserWindow({
    width: 618,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    },
    resizable: true,
    titleBarStyle: "hidden"
  })

  var logged = settings.get("logged");

  if (logged == null || !logged) {
    win.loadFile('./templates/login.html')
  } else {
    win.loadFile('./templates/index.html')
  };

  ipcMain.on('logged-in', (event, arg) => {
    settings.set("logged", true);
    settings.set("id", arg.id);
    settings.set("userName", arg.userName);
    settings.set("passwordHash", arg.passwordHash);
    settings.set("balance", arg.balance);
  })

  ipcMain.on('logged-out', () => {
    settings.set('logged', false);
    settings.set('id', 0);
    settings.set('userName', "");
    settings.set('passwordHash', "");
    settings.set("balance", 0);
  })

  ipcMain.on('get-userdata', (event, arg) => {
    event.returnValue = {
      id: settings.get("id"),
      userName: settings.get("userName"),
      passwordHash: settings.get("passwordHash")
    }
  }) 

  ipcMain.on('get-id', (event, arg) => {
    event.returnValue = settings.get("id");
  }) 

  ipcMain.on('get-username', (event, arg) => {
    event.returnValue = settings.get("userName");
  }) 

  ipcMain.on('get-balance', (event, arg) => {
    event.returnValue = settings.get("balance");
  }) 

  ipcMain.on('set-balance', (event, arg) => {
    settings.set('balance', arg);
    event.returnValue = true;
  }) 
});
