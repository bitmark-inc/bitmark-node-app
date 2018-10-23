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
//var nodeConsole = require('console');
//var consoleStd = new nodeConsole.Console(process.stdout, process.stderr);
var log = require('electron-log');

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
let actionRun;

//After Program start after autoUpdateCheckDelay, autoUpdateCheck process will be launch
//const autoUpdateCheckDelay = 120000;
var updateCheckDelay = 40 *1000;

var repos = ["bitmark/bitmark-node", "bitmark/bitmark-node-test"];
var tags = ["latest", "prev"];
var repo = repos[0];
var tag = tags[0];
var preMode = false;


// Arg
// --repo : design for testing purpose
const cli = parseArgs(
  `
    bitmark-node-app

    Usage
      $ bitmark-node-app

    Options
      --help    show help
      --repo    0:production repo (default) 1:test repo
	Examples
	  $ bitmark-node-app
    $ bitmark-node-app --repo 1
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

  if (cli.flags.repo == '1') {
    repo = repos[1];
  } 

  //Ensure settings are initialized on startup
  settingSetup().then((resolve) => {
    //On application start-up, run nodeRun
    //setTimeout(nodeAppRun, 3000);
    nodeAppRun();
  });
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

  if (settings.get('prev_mode') === undefined) {
    settings.set('prev_mode', false);
  }
  // setup docker directory, in case environment variable PATH is not exist
  const cmd = getDockerPath().concat('docker');
  settings.set('docker_cmd', cmd);

  return new Promise((resolve) => {
    resolve();
  });
}


//A collectable possible docker executable path which will be used to search docker executable
function getDockerPath() {
  const possibleDirs = [
    '/bin/',
    '/sbin/',
    '/usr/bin/',
    '/usr/sbin/',
    '/usr/local/bin/',
    '/usr/local/sbin/',
    'C:\\Program Files\\Docker\\Docker\\resources\\bin\\'
  ];

  // default assume docker path is set
  let path = '';

  for (let i = 0; i < possibleDirs.length; i++) {
    let dir = possibleDirs[i];
    let tmp = dir + 'docker';
    if (fs.existsSync(tmp)) {
      path = dir;
    }
  }

  return path;
}

function getPrevMode() {
  return settings.get('prev_mode');
}


function useLatestVer(yes) {
  if (!yes) {
    settings.set('auto_update', false);
  }
  settings.set('prev_mode', !yes);
}

function getRepo(prevModeOn) {
  prevModeOn? newRepo = repo+ ":" + tags[1] : newRepo = repo;
  return newRepo;
}

function setActionRun(run) {
  actionRun = run;
}

function isActionRun() {
  return actionRun;
}

function reloadMain(page) {
  const options = {extraHeaders: 'pragma: no-cache\n'}
  mainWindow.loadURL(`file://${__dirname}/` + page + `.html`, options);
}

//pull update if auto_update is on
function autoUpdateCheck() {
  //get the auto update value
  const auto_update = settings.get('auto_update');

  if (auto_update === true) {
    log.info('[main]', 'Checking for updates with auto updater');
    //Call pullUpdate and wait for the promise to return the result
    setActionRun(true);
    PullUpdate().then(
      (result) => {
        //If it is a success (update installed) reload the window
        setActionRun(false);
        useLatestVer(true);
        log.info('[main]', 'autoUpdateCheck Success');
        reloadMain('index');
      },
      (error) => {
        // check error or no need to be updated
        setActionRun(false);
        log.error('[main]', 'autoUpdateCheck:' , error);
      }
    );
  }
}

// Entry point of automation on docker operations
// Ran on startup and checks the status of the container
// 1. Check Directory: fail: program stop, sucess: program process next step
// 2. Check Docker image

function nodeAppRun() {
  const dir = settings.get('directory');
  dirCheckHelper(dir).then(
    (result) => { // Directory Check Pass
      log.info('[main]Directory Check Pass');
    },
    (error) => { // Directory Check Fail, program should not continoue
      newNotification(appStr.dirCheckFailed);
      return;
    }
  );

  imageCheck().then(
    (result) => { //image exist run it and then run autoUpdate
      log.info('Start image check');
      setTimeout(autoUpdateCheck, updateCheckDelay); 
      const dockerCmd = settings.get('docker_cmd');
      //Get the container status of bitmarkNode
      exec(
        dockerCmd + " inspect -f '{{.State.Running}}' bitmarkNode",
        (err, stdout, stderr) => {
          if (err) { //container is not running
            //Call container helper and wait for the promise to reload the page on success
            const net = settings.get('network');
            const dir = settings.get('directory');
            newNotification(appStr.createContainerStart)
            createContainerHelper(net, dir, isWin, false).then(
              (result) => {
                log.info('[main]', 'nodeAppRun Success', result);
                reloadMain('index');
              },
              (error) => {
                newNotification(appStr.containerFailStart);
                log.info('[main]', 'createContainerHelper Error', error);
                return; //terminate, don't have to start container
              }
            );   
          } else { // container is running start it
            //If the container is stopped, start it
            var str = stdout.toString().trim();
            if (str.includes('false')) {
              setActionRun(true);
              dockerStart().then(
                (result) => {
                  setActionRun(false);
                  log.info('[main]', 'bitmark-node start', result);
                  reloadMain('index');
                },
                (error) => {
                  setActionRun(false);
                  log.error('[main]', error);
                  newNotification(appStr.containerFailStart);
                  reloadMain('index');
                }
              );
            }
          }
        }
      );
    },
    (error) => {// image does not exit run update immediately  
      if (getPrevMode()) {// Run 
        usePrevVersion();
      } else {
        autoUpdateCheck();
      }
      return;
    }
  );
}

function imageCheck() {
  return new Promise((resolve, reject)=>{
    log.info('[main]start imageCheck');
    const dockerCmd = settings.get('docker_cmd');
    const prevMode = setting.get('prev_mode')
    if (prevMode) {
      cmd = dockerCmd + ' inspect --type=image bitmark/bitmark-node:prev';
    } else {
      cmd = dockerCmd + ' inspect --type=image bitmark/bitmark-node';
    }
    
    exec(cmd , (err, stdout, stderr) => {
      //Get the output
      if (err) {
        reject('no image');
      } else {
        resolve('image exist');
      }
    });
  });
}

function dockerLogin() {
  return new Promise((resolve, reject) => {
    const dockerCmd = settings.get('docker_cmd');
    //Stop the container named bitmarkNode
    exec(dockerCmd + ' login', (err, stdout, stderr) => {
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
function dockerStart() {
  log.info('[main]', 'dockerStartNode start');
  return new Promise((resolve, reject) => {
    const dockerCmd = settings.get('docker_cmd');
    //Start the container named bitmarkNode
    exec(dockerCmd + ' start bitmarkNode', (err, stdout, stderr) => {
      if (err) {
        log.error('[main]', 'dockerStart:', 'Failed to start container');
        reject('Failed to start container.');
      }
      log.info('[main]', 'Container started');
      resolve('The Docker container has started');
    });
  });
}

// Start the bitmarkNode Docker container without a notification
function dockerStop() {
  return new Promise((resolve, reject) => {
    const dockerCmd = settings.get('docker_cmd');
    //Stop the container named bitmarkNode
    exec(dockerCmd + ' stop bitmarkNode', (err, stdout, stderr) => {
      if (err) {
        log.error('[main]', 'Failed to stop container');
        reject('Failed to start container.');
      } else {
        log.info('[main]', 'Container stoped');
        resolve('The Docker container has stoped');
      }
    });
  });
}

// Start the bitmarkNode Docker container
function startBitmarkNode() {
  //Return a promise to allow the program to refresh the window on completion
  return new Promise((resolve, reject) => {
    //Get the container status of bitmarkNode
    setActionRun(true);
    const dockerCmd = settings.get('docker_cmd');
    exec(
      dockerCmd + " inspect -f '{{.State.Running}}' bitmarkNode",
      (err, stdout, stderr) => {
        //If the container is not setup, create it
        if (err) {
          newNotification(containerNotSetupRestartApp);
          setActionRun(false);
          reject('Failed to start container');
        }
        var str = stdout.toString().trim();
        if (str.includes('true')) {
          setActionRun(false);
          newNotification(appStr.containerAlreadyRuning);
          reject('Container already running');
        } else {   //If the container is stopped, start it
          setActionRun(true);
          dockerStart().then(
            (result) => {
              setActionRun(false);
              log.info('[main]', 'bitmark-node start', result);
              newNotification(appStr.containerHasStart);
            },
            (error) => {
              setActionRun(false);
              log.error('[main]', 'startBitmarkNode', error);
              newNotification(appStr.containerFailStart);
            }
          );
          resolve(`${stdout}`);
        }
      }
    );
  });
}

// Stop the bitmarkNode Docker container
function stopBitmarkNode() {
  newNotification(appStr.containerStopTakeTime);
  setActionRun(true);
  //Return a promise to allow the program to refresh the window on completion
  return new Promise((resolve, reject) => {
    dockerStop().then(
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

function usePrevVersion() {
  //delete latest bitmarkd
  log.info('[main]usePrevVersion start');
  const dockerCmd = settings.get('docker_cmd');  
   //Attempt to remove and stop the container before creating the container.
  return new Promise((resolve, reject) => {
    setActionRun(true);
    exec(dockerCmd + ' stop bitmarkNode', (err, stdout, stderr) => {
      log.info('[main]', 'reversePrevVersion stop bitmarkNode');
      //Remove docker image
      exec(dockerCmd + ' rm bitmarkNode', (err, stdout, stderr) => {   
        log.info('[main]', 'reversePrevVersion rm bitmarkNode');
        if (err) {
          log.error('[main]', 'reversePrevVersion pull error:', err);
        }
        preCmd = dockerCmd + ' pull ' + getRepo(true) // pull prev version
        //Docker pull prev tag image
        exec(preCmd, (err, stdout, stderr) => {
          if (err) { //Pull Prev Fail, use latest
            log.error('[main]', 'reversePrevVersion pull bitmarkNode failed');
            //Call container helper and wait for the promise to reload the page on success
            const net = settings.get('network');
            const dir = settings.get('directory');
            createContainerHelper(net, dir, isWin, getRepo(false)).then(
              (result) => {
                setActionRun(false);
                log.info('[main]', 'reversePrevVersion pull prev version fail, use latest image', result); 
                useLatestVer(true);
                reject(appSrt.errorPullPrevFailusing + "Use latest version");
              },
              (error) => {
                setActionRun(false);
                useLatestVer(true); // although not use the latest version, but system should still think it need to use the latest Version
                reject(appSrt.errorPullPrevFailusing + "Not able to use latest version");
              }
            );
          } else {//Pull prev images successfully
            //docker remove latest image
            rmLatestCmd = dockerCmd + ' rmi ' + getRepo(false);
            exec(rmLatestCmd, (err, stdout, stderr) => {
              log.info('[main]', 'reversePrevVersion rmi ', rmLatestCmd, " result:", stdout);
              //No matter remove successful or not start docker
              const net = settings.get('network');
              const dir = settings.get('directory');
              createContainerHelper(net, dir, isWin, getRepo(true)).then(
                (result) => {
                  setActionRun(false);
                  useLatestVer(false);
                  log.info('[main]', 'createContainerHelper Success', result);
                  resolve(result);
                },
                (error) => {
                  setActionRun(false);
                  useLatestVer(false);
                  reject(error);
                }
              );
            });
          }   
        });
      });
    });
  });
 
  //pull tag:prev
  //run docker to start container in bitmark/bitmark-node:prev 

}

// This function prepares ip and network to create a new container by calling createContainer
// prevModeOn=true: use bitmark-node latest,  prevModeOn=false: use bitmark-node prev tag
function createContainerHelper(net, dir, isWin, prevModeOn) {
  var auto_ip = settings.get('auto_ip');
  var user_ip = settings.get('ip');
  //Return a promise to allow the program to refresh the window on completion (passed it to createContainerHelper or local render process function)
  return new Promise((resolve, reject) => {
    //Check to see if auto_ip is turned on, if so get it, else use the users defined IP
    setActionRun(true);
    if (auto_ip) {
      publicIp.v4().then((ip) => {
        //Get the promise from createContainer and return the result
        createContainer(ip, net, dir, isWin, prevModeOn).then(
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
      createContainer(user_ip, net, dir, isWin, prevModeOn).then(
        (result) => {
          log.info('[main]', 'createContainerHelper : ' , user_ip ,' success');
          setActionRun(false);
          resolve(result);
        },
        (error) => {
          log.error('[main]', 'createContainerHelper :' , user_ip ,' false');
          setActionRun(false);
          reject(error);
        }
      );
    }
  });
}

// This function stops and removes the container and creates a new container
function createContainer(ip, net, dir, isWin, prevModeOn) {
   //Check to make sure the needed directories exist
  log.info('[main]', 'createContainer start');
  //Return a promise to allow the program to refresh the window on completion (passed it to createContainerHelperLocalIP)
  return new Promise((resolve, reject) => {
    const dockerCmd = settings.get('docker_cmd');
    //Attempt to remove and stop the container before creating the container.
    exec(dockerCmd + ' stop bitmarkNode', (err, stdout, stderr) => {
      log.info('[main]', 'createContainer docker stop start');
      exec(dockerCmd + ' rm bitmarkNode', (err, stdout, stderr) => {
        log.info('[main]', 'createContainer docker rm start');
        //Use the command suited for the platform
        var baseCmd = `${dockerCmd} run -d --name bitmarkNode -p 9980:9980 -p 2136:2136 -p 2130:2130 -e PUBLIC_IP=${ip} -e NETWORK=${net} -v ${dir}/bitmark-node-data/db:/.config/bitmark-node/db -v ${dir}/bitmark-node-data/data:/.config/bitmark-node/bitmarkd/bitmark/data -v ${dir}/bitmark-node-data/data-test:/.config/bitmark-node/bitmarkd/testing/data`;
        var command;
        if (isWin) {
          //The windows command is the same as the linux command, except with \\ (\\ to delimit the single backslash) instead of /
          command = baseCmd.replace(/\//g, '//') + " " + getRepo(prevModeOn);
        } else {
          command = baseCmd + " " + getRepo(prevModeOn);
        }  
        //Run the command
        exec(command, (err, stdout, stderr) => {
          log.info('[main]', 'createContainer docker run end');
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
function PullUpdate() {
  newNotification(appStr.checkUpdateWait);
  //Return a promise to allow the program to refresh the window on completion
  return new Promise((resolve, reject) => {
    const dockerCmd = settings.get('docker_cmd');
    if (isWin) {
      dockerLogin().then(
        (result) => {
          //login successfully, do nothing.
        },
        (error) => {
          log.warn('[main]', 'PullUpdate Login', error);
          newNotification(appStr.notLoginWarn);
        }
      );
    }
    //Pull updates from the docker bitmark-node repo which is use latest tag
    exec(dockerCmd + ' pull ' + getRepo(false), (err, stdout, stderr) => {
      if (err) {
        // node couldn't execute the command
        newNotification(appStr.errorCheckUpdate);
        reject('Failed to pull update');
      }
      //get the output
      var str = stdout.toString();
      //Check to see if the up to date text is present
      if (str.indexOf('Image is up to date for ' + getRepo(false)) !== -1) {
        newNotification(appStr.noUpdateFound);
        //Rejects because an update was no found, even though there was no error
        reject('No updates');
      }
      //Check to see if the updated text is present
      else if (str.indexOf('Downloaded newer image for ' + getRepo(false)) !== -1) {
        log.info('[main]', 'Updated');
        newNotification(appStr.installUpdateSoftware);
        //Call container helper and wait for the promise to reload the page on success
        const net = settings.get('network');
        const dir = settings.get('directory');
        createContainerHelper(net, dir, isWin, false).then(
          (result) => {
            log.info('[main]', 'pullUpdate Success');
            newNotification(appStr.nodeUpdated);
            resolve(result);
          },
          (error) => {
            log.error('[main]', 'pullUpdate:', error);
            reject(error);
          }
        );
      } else {
        newNotification(appStr.errorCheckUpdate);
        log.error('[main]', 'pullUpdate:', appStr.errorCheckUpdate);
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
    log.info('[main]', `The directory ${dir} does not exist. Creating it now.`);
  } else {
    log.info('[main]', `The directory ${dir} exist.`);
  }
}

//Check directories
function dirCheckHelper(dir) {
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



/** Developer Note 
 *  docker inspect -f '{{.State.Running}}' bitmarkNode 
 *  container is running true
 *  container is stop but exist false
 *  container does not exist bitmark
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * **/