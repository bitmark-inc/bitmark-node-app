//Default imports
const electron = require('electron'); //Electron
const { app, BrowserWindow } = require('electron'); //Used to display windows
const { Menu } = require('electron'); //Electron Default Menu
const MenuItem = electron.MenuItem; //Electron Menu Item - Context Menu
const ipc = electron.ipcMain; //IPC used to display context menu (hamburger menu)
const path = require('path'); //Used to interact with file paths
const os = require('os'); //Used to determine the user's current OS
var fs = require('fs'); //Used to check to see if directories exist/create ones
const parseArgs = require('electron-args'); // For electron arg

//Packages (Name - Use (Link))
const settings = require('electron-settings'); //Electron-Settings - Used to store user settings (https://github.com/nathanbuchar/electron-settings)
const publicIp = require('public-ip'); //Public-IP - Used to get external IP address (https://github.com/sindresorhus/public-ip)
const notifier = require('node-notifier'); //Notifications (https://www.npmjs.com/package/node-notifier)
const { exec } = require('child_process'); //Electron Default Child Process - Used to run CLI commands
const windowStateKeeper = require('electron-window-state'); //Electron-Window-State - Keep window state from instances of program (https://www.npmjs.com/package/electron-window-state)
const userHome = require('user-home'); //User-Home (https://github.com/sindresorhus/user-home)
var appStr = require('./js/appstring');
//ForRedirect Log
var nodeConsole = require('console');
var consoleStd = new nodeConsole.Console(process.stdout, process.stderr);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
  ``;
}

//Set dataDirectory
var dataDir = `${userHome}`;
//Check if platform is windows
var isWin = process.platform === 'win32';
if (isWin) {
  //Update to correct Windows User Directory
  dataDir = `${userHome}\\AppData\\Roaming`;
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, prefWindow;

// Keep a global actionRun to avoid run many docker commands in the same time
// keep curPage for not reload url when it is in the same page
let actionRun, curPage;

var repo = 'bitmark/bitmark-node';

//After Program start after autoUpdateCheckDelay, autoUpdateCheck process will be launch
const autoUpdateCheckDelay = 5000;

// Arg
// --repo : design for testing purpose
const cli = parseArgs(
  `
    bitmark-node-app

    Usage
      $ bitmark-node-app

    Options
      --help    show help
      --repo    alternative repository of bitmark-node-app image in docker hub
	Examples
	  $ bitmark-node-app
      $ bitmark-node-app --repo bitmark-test/bitmark-node
`,
  {
    alias: {
      h: 'help'
    },
    default: {
      auto: false
    }
  }
);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
  // Load the previous state with fallback to defaults
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 800
  });

  // Create the window using the state information
  mainWindow = new BrowserWindow({
    // Set window location and size as what is was on close
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 985,
    minHeight: 440,
    title: 'Bitmark Node App',
    icon: path.join(__dirname, 'assets/icons/app_icon.png'),
    frame: false,
    trasparent: true,
    darkTheme: true
  });
  //Load the webpage
  reloadMain('index');
  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    app.quit();
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(mainWindow);

  if (cli.flags.repo != undefined && cli.flags.repo != '') {
    repo = cli.flags.repo;
  }

  //Ensure settings are initialized on startup
  settingSetup();
  //On application start-up, run nodeRun
  //setTimeout(nodeAppRun, 3000);
  nodeAppRun();
  mainWindow.webContents.send('getRepo', getRepo()); //calling js method (async call)
  //Check for check for updates if auto update is on after 2 seconds
  setTimeout(autoUpdateCheck, autoUpdateCheckDelay);
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

/* User Interface Functions */
//Create the preferences window
function createPreferencesWindow() {
  //Define the preferences window
  prefWindow = new BrowserWindow({
    width: 850,
    height: 600,
    minWidth: 735,
    minHeight: 500,
    title: 'Preferences',
    icon: path.join(__dirname, 'assets/icons/app_icon.png'),
    frame: false,
    trasparent: true,
    darkTheme: true
  });

  //load the preferences file
  prefWindow.loadURL(`file://${__dirname}/preferences.html`);

  // Emitted when the window is closed.
  prefWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    prefWindow = null;
  });
}

//Display notification with str text
function newNotification(str) {
  notifier.notify({
    title: 'Bitmark Node App',
    message: `${str}`,
    icon: path.join(__dirname, 'assets/icons/app_icon.png'),
    sound: true,
    wait: false
  });
}

//Check to see if settings are initialized
function settingSetup() {
  if (settings.get('network') === undefined) {
    settings.set('network', 'bitmark');
  }
  if (settings.get('auto_update') === undefined) {
    settings.set('auto_update', true);
  }
  if (settings.get('auto_ip') === undefined) {
    settings.set('auto_ip', true);
  }
  if (settings.get('ip') === undefined) {
    settings.set('ip', `xxx.xxx.xxx.xxx`);
  }
  if (settings.get('directory') === undefined) {
    settings.set('directory', dataDir);
  }
}

function getRepo() {
  return repo;
}

function setActionRun(run) {
  actionRun = run;
}

function isActionRun() {
  return actionRun;
}

function reloadMain(page) {
  if (curPage != page) {
    mainWindow.loadURL(`file://${__dirname}/` + page + `.html`);
    consoleStd.log('[main]', 'load new page:', page);
  } else {
    mainWindow.reload();
    consoleStd.log('[main]', 'mainWindow reload:', curPage);
  }
  curPage = page;
}

//pull update if auto_update is on
function autoUpdateCheck() {
  //get the auto update value
  const auto_update = settings.get('auto_update');
  if (auto_update === true) {
    consoleStd.log('[main]', 'Checking for updates with auto updater');
    //Call pullUpdate and wait for the promise to return the result
    setActionRun(true);
    pullUpdateSync().then(
      (result) => {
        //If it is a success (update installed) reload the window
        setActionRun(false);
        consoleStd.log('[main]', 'autoUpdateCheck Success', result);
        reloadMain('index');
      },
      (error) => {
        // check error or no need to be updated
        setActionRun(false);
        consoleStd.log('[main]', 'Error', error);
      }
    );
  }
}

// Entry point of automation on docker operations
// Ran on startup and checks the status of the container
//  1. If the container is not setup, it creates it
//  2. If the container is not start, it starts it
//  3. If the container is running, it does nothing

function nodeAppRun() {
  const dir = settings.get('directory');
  dirCheckHelperSync(dir).then(
    (result) => {
      consoleStd.log('[main]', 'directoryCheckHelper success');
    },
    (error) => {
      newNotification(appStr.dirCheckFailed);
      return;
    }
  );
  //Get the container status of bitmarkNode
  exec("docker inspect -f '{{.State.Running}}' bitmarkNode", (err, stdout, stderr) => {
    //If the container is not setup, create it
    if (err) {
      //Call container helper and wait for the promise to reload the page on success
      const net = settings.get('network');
      const dir = settings.get('directory');
      createContainerHelperSync(net, dir, isWin).then(
        (result) => {
          consoleStd.log('[main]', 'nodeAppRun Success', result);
          reloadMain('index');
        },
        (error) => {
          consoleStd.log('[main]', 'createContainerHelperSync Error', error);
          return; //terminate, don't have to start container
        }
      );
    } else {
      //If the container is stopped, start it
      var str = stdout.toString().trim();
      if (str.includes('false')) {
        setActionRun(true);
        dockerStartSync().then(
          (result) => {
            setActionRun(false);
            consoleStd.log('[main]', 'bitmark-node start', result);
            reloadMain('index');
          },
          (error) => {
            setActionRun(false);
            consoleStd.log('[main]', 'Error', error);
            reloadMain('index');
          }
        );
      }
    }
  });
}
function dockerLoginSync() {
  return new Promise((resolve, reject) => {
    //Stop the container named bitmarkNode
    exec('docker login', (err, stdout, stderr) => {
      //Get the output
      var str = stdout.toString();
      //Is the user is logged in, create the container
      if (str.indexOf('Login Succeeded') !== -1) {
        //Get the user's IP and create the container
        resolve('Login Succeeded');
      } else {
        reject('docker login fail');
      }
    });
  });
}

// Start the bitmarkNode Docker container without a notification
function dockerStartSync() {
  consoleStd.log('[main]', 'dockerStartNode start');
  return new Promise((resolve, reject) => {
    //Start the container named bitmarkNode
    exec('docker start bitmarkNode', (err, stdout, stderr) => {
      if (err) {
        consoleStd.log('[main]', 'Failed to start container');
        reject('Failed to start container.');
      }
      consoleStd.log('[main]', 'Container started');
      resolve('The Docker container has started');
    });
  });
}

// Start the bitmarkNode Docker container without a notification
function dockerStopSync() {
  return new Promise((resolve, reject) => {
    //Stop the container named bitmarkNode
    exec('docker stop bitmarkNode', (err, stdout, stderr) => {
      if (err) {
        consoleStd.log('[main]', 'Failed to stop container');
        reject('Failed to start container.');
      } else {
        consoleStd.log('[main]', 'Container stoped');
        resolve('The Docker container has stoped');
      }
    });
  });
}

// Start the bitmarkNode Docker container
function startBitmarkNodeSync() {
  //Return a promise to allow the program to refresh the window on completion
  return new Promise((resolve, reject) => {
    //Get the container status of bitmarkNode
    setActionRun(true);
    exec("docker inspect -f '{{.State.Running}}' bitmarkNode", (err, stdout, stderr) => {
      //If the container is not setup, create it
      if (err) {
        newNotification(containerNotSetupRestartApp);
        setActionRun(false);
        reject('Failed to start container');
      }

      //If the container is stopped, start it
      var str = stdout.toString().trim();
      if (str.includes('true')) {
        setActionRun(false);
        newNotification(appStr.containerAlreadyRuning);
        reject('Container already running');
      } else {
        //Start the container named bitmarkNode
        setActionRun(true);
        dockerStartSync().then(
          (result) => {
            setActionRun(false);
            consoleStd.log('[main]', 'bitmark-node start', result);
            newNotification(appStr.containerHasStart);
          },
          (error) => {
            setActionRun(false);
            consoleStd.log('[main]', 'Error', error);
            newNotification(appStr.containerFailStart);
          }
        );
        resolve(`${stdout}`);
      }
    });
  });
}

// Stop the bitmarkNode Docker container
function stopBitmarkNodeSync() {
  newNotification(appStr.containerStopTakeTime);
  setActionRun(true);
  //Return a promise to allow the program to refresh the window on completion
  return new Promise((resolve, reject) => {
    dockerStopSync().then(
      (result) => {
        setActionRun(false);
        newNotification(appStr.containerHasStop);
        resolve('The Docker container has stopped');
      },
      (error) => {
        setActionRun(false);
        newNotification(appStr.containerFailStop);
        reject('Failed to stop container.');
      }
    );
  });
}

// This function prepares ip and network to create a new container by calling createContainerSync
function createContainerHelperSync(net, dir, isWin) {
  var auto_ip = settings.get('auto_ip');
  var user_ip = settings.get('ip');
  //Return a promise to allow the program to refresh the window on completion (passed it to createContainerHelperSync or local render process function)
  return new Promise((resolve, reject) => {
    //Check to see if auto_ip is turned on, if so get it, else use the users defined IP
    setActionRun(true);
    if (auto_ip) {
      publicIp.v4().then((ip) => {
        //Get the promise from createContainer and return the result
        createContainerSync(ip, net, dir, isWin).then(
          (result) => {
            setActionRun(false);
            resolve(result);
          },
          (error) => {
            setActionRun(false);
            reject(error);
          }
        );
      });
    } else if (user_ip === 'xxx.xxx.xxx.xxx' || user_ip === '' || user_ip === undefined) {
      newNotification(appStr.maualIPNotValidCheckIP);
      setActionRun(false);
      reject('Bad IP address');
    } else {
      //Get the promise from createContainer and return the result
      createContainerSync(user_ip, net, dir, isWin).then(
        (result) => {
          consoleStd.log('[main]', 'createContainerHelperSync : manual ip success');
          setActionRun(false);
          resolve(result);
        },
        (error) => {
          consoleStd.log('[main]', 'createContainerHelperSync : manual ip false');
          setActionRun(false);
          reject(error);
        }
      );
    }
  });
}

// This function stops and removes the container and creates a new container
function createContainerSync(ip, net, dir, isWin) {
  //Check to make sure the needed directories exist
  consoleStd.log('[main]', 'createContainer start');
  //Return a promise to allow the program to refresh the window on completion (passed it to createContainerHelperLocalIP)
  return new Promise((resolve, reject) => {
    //Attempt to remove and stop the container before creating the container.
    exec('docker stop bitmarkNode', (err, stdout, stderr) => {
      consoleStd.log('[main]', 'createContainerSync docker stop start');
      exec('docker rm bitmarkNode', (err, stdout, stderr) => {
        consoleStd.log('[main]', 'createContainerSync docker rm start');
        //Use the command suited for the platform
        if (isWin) {
          //The windows command is the same as the linux command, except with \\ (\\ to delimit the single backslash) instead of /
          var command =
            `docker run -d --name bitmarkNode -p 9980:9980 -p 2136:2136 -p 2130:2130 -e PUBLIC_IP=${ip} -e NETWORK=${net} -v ${dir}\\bitmark-node-data\\db:\\.config\\bitmark-node\\db -v ${dir}\\bitmark-node-data\\data:\\.config\\bitmark-node\\bitmarkd\\bitmark\\data -v ${dir}\\bitmark-node-data\\data-test:\\.config\\bitmark-node\\bitmarkd\\testing\\data ` +
            repo;
        } else {
          var command =
            `docker run -d --name bitmarkNode -p 9980:9980 -p 2136:2136 -p 2130:2130 -e PUBLIC_IP=${ip} -e NETWORK=${net} -v ${dir}/bitmark-node-data/db:/.config/bitmark-node/db -v ${dir}/bitmark-node-data/data:/.config/bitmark-node/bitmarkd/bitmark/data -v ${dir}/bitmark-node-data/data-test:/.config/bitmark-node/bitmarkd/testing/data ` +
            repo;
        }
        //Run the command

        exec(command, (err, stdout, stderr) => {
          consoleStd.log('[main]', 'createContainerSync docker run end');
          if (err) {
            newNotification(app.conatinerCreateFail);
            reject('Failed to create container');
          }
          newNotification(appStr.containerCreateSucces);
          resolve('Created container');
        });
      });
    });
  });
}

// Check for updates from bitmark/bitmark-node
function pullUpdateSync() {
  newNotification(appStr.checkUpdateWait);
  //Return a promise to allow the program to refresh the window on completion
  return new Promise((resolve, reject) => {
    if (isWin) {
      dockerLoginSync().then(
        (result) => {
          //login successfully, do nothing.
        },
        (error) => {
          consoleStd.log('[main]', 'Error', error);
          newNotification(appStr.notLoginWarn);
        }
      );
    }
    //Pull updates from the docker bitmark-node rep
    exec('docker pull ' + repo, (err, stdout, stderr) => {
      if (err) {
        // node couldn't execute the command
        newNotification(appStr.errorCheckUpdate);
        reject('Failed to pull update');
      }
      //get the output
      var str = stdout.toString();
      //Check to see if the up to date text is present
      if (str.indexOf('Image is up to date for ' + repo) !== -1) {
        newNotification(appStr.noUpdateFound);
        //Rejects because an update was no found, even though there was no error
        reject('No updates');
      }
      //Check to see if the updated text is present
      else if (str.indexOf('Downloaded newer image for ' + repo) !== -1) {
        consoleStd.log('[main]', 'Updated');
        newNotification(appStr.installUpdateSoftware);
        //Call container helper and wait for the promise to reload the page on success
        const net = settings.get('network');
        const dir = settings.get('directory');
        createContainerHelperSync(net, dir, isWin).then(
          (result) => {
            consoleStd.log('[main]', 'pullUpdate Success', result);
            newNotification(appStr.nodeUpdated);
            resolve(result);
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        newNotification(appStr.errorCheckUpdate);
        reject('Unknown update error.');
      }
    });
  });
}

/* Directory Functions */
//Check to see if dir is defined and if not create it
function dirCheckSync(dir) {
  //If the directory doesn't exist, create it
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    consoleStd.log('[main]', `The directory ${dir} does not exist. Creating it now.`);
  } else {
    consoleStd.log('[main]', `The directory ${dir} exist.`);
  }
}

//Check directories
function dirCheckHelperSync(dir) {
  //Get each directory and store it in a variable
  const folder = dir;
  var bitmarknode = `${folder}/bitmark-node-data`;
  var db = `${bitmarknode}/db`;
  var data = `${bitmarknode}/data`;
  var datatest = `${bitmarknode}/data-test`;
  return new Promise((resolve, reject) => {
    //Pass each variable to directoryCheck
    dirCheckSync(bitmarknode);
    dirCheckSync(db);
    dirCheckSync(data);
    dirCheckSync(datatest);
  });
}

//Create the file submenu
var fileMenu = new Menu();
fileMenu.append(
  new MenuItem({
    label: 'Preferences',
    click() {
      createPreferencesWindow();
    }
  })
);
fileMenu.append(new MenuItem({ role: 'quit' }));

//create the view submenu
var viewMenu = new Menu();
viewMenu.append(
  new MenuItem({
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click(item, focusedWindow) {
      if (focusedWindow) focusedWindow.reload();
    }
  })
);
viewMenu.append(new MenuItem({ type: 'separator' }));
viewMenu.append(new MenuItem({ role: 'resetzoom', accelerator: 'CmdOrCtrl+0' }));
viewMenu.append(new MenuItem({ role: 'zoomin', accelerator: 'CmdOrCtrl+Shift+=' }));
viewMenu.append(new MenuItem({ role: 'zoomout', accelerator: 'CmdOrCtrl+-' }));

//Create the main menu
var menu = new Menu();
menu.append(new MenuItem({ label: 'File', submenu: fileMenu }));
menu.append(new MenuItem({ label: 'View', submenu: viewMenu }));
menu.append(
  new MenuItem({
    label: 'About',
    click() {
      electron.shell.openExternal('https://bitmark.com');
    }
  })
);

//Show the menu on click
ipc.on('show-context-menu', function(event) {
  const win = BrowserWindow.fromWebContents(event.sender);
  menu.popup(win);
});

//Right Click Context Menu (Cut, Copy, Paste)
require('electron-context-menu')({});
