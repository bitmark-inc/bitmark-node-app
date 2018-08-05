const electron = require('electron'); //Electron
const {app, BrowserWindow} = require('electron'); //Electron Default BrowserWindow - Used to display UI
const {Menu} = require('electron'); //Electron Default Menu
const MenuItem = electron.MenuItem //Electron Menu Item - Context Menu
const path = require('path'); //Electron-Preferences (https://github.com/tkambler/electron-preferences)
const os = require('os'); //Electron-Preferences (https://github.com/tkambler/electron-preferences)
const ElectronPreferences = require('electron-preferences'); //Electron-Preferences (https://github.com/tkambler/electron-preferences)
const publicIp = require('public-ip'); //Public-IP - Used to get external IP address (https://github.com/sindresorhus/public-ip)
const notifier = require('node-notifier'); //Notifications (https://www.npmjs.com/package/node-notifier)
const { exec } = require('child_process'); //Electron Default Child Process - Used to run CLI commands
const windowStateKeeper = require('electron-window-state'); //Electron-Window-State - Keep window state from instances of program (https://www.npmjs.com/package/electron-window-state)
const ipc = electron.ipcMain //IPC used to display context menu (hamburger menu)

var fs = require('fs'); //Used to check to see if directories exist/create ones
var userHome = require('user-home'); //User-Home (https://github.com/sindresorhus/user-home)

//Get the location of the preferences file
const prefLoc = path.resolve(app.getPath('userData'), 'preferences.json');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

//Set dataDirectory
var dataDir = `${userHome}`;
//Check if platform is windows
if(process.platform === "win32"){
	//Update to correct Windows User Directory
	dataDir = `${userHome}\\AppData\\Roaming`;
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, prefWindow;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {

	//On application start-up, run containerCheck
	containerCheck();

	// Load the previous state with fallback to defaults
	let mainWindowState = windowStateKeeper({
	  defaultWidth: 1200,
	  defaultHeight: 800
	});
		
	// Create the window using the state information
	mainWindow = new BrowserWindow({
		// Set window location and size as what is was on close
		'x': mainWindowState.x,
		'y': mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		minWidth: 985,
		minHeight: 440,
		title: "Bitmark Node User Interface",
		icon: path.join(__dirname, 'assets/icons/app_icon.png'),
    	frame: false,
    	trasparent: true,
    	darkTheme: true
	});

	//Load the webpage
	mainWindow.loadURL(`file://${__dirname}/index.html`);

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

	//Check for check for updates if auto update is on after 2 seconds
	setTimeout(autoUpdateCheck, 2000);
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
function createPreferencesWindow(){

	//Define the preferences window
	prefWindow = new BrowserWindow({
		width: 850,
		height: 600,
		title: "Preferences",
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
};

//Display notification with str text
function newNotification(str){
	notifier.notify(
		{
			title: "Bitmark Node",
			message: `${str}`,
			icon: path.join(__dirname, 'assets/icons/app_icon.png'),
			sound: true,
			wait: false
		}
	);
};

//Pull update if auto_update is on
function autoUpdateCheck(){
	//get the auto update value
	const auto_update = preferences.value('update.auto_update');
	if(auto_update == true){
		console.log("Checking for updates with auto updater");
		pullUpdate();
	}
};


/* Terminal Calling Functions */

// Ran on startup and checks the status of the container
//  1. If the container is not setup, it creates it
//  2. If the container is not start, it starts it
//  3. If the container is running, it does nothing

function containerCheck(){

	//Get the container status of bitmarkNode
	exec("docker inspect -f '{{.State.Running}}' bitmarkNode", (err, stdout, stderr) => {
	  //If the container is not setup, create it
	  if (err) {
	  	createContainerHelper();
	  	mainWindow.reload();
	  }

	  //If the container is stopped, start it
	  var str = stdout.toString().trim();
	  if(str === "false"){
		startBitmarkNode_noNotif();
		mainWindow.reload();
	  }
	});
};

// Start the bitmarkNode Docker container
function startBitmarkNode(){

	//Get the container status of bitmarkNode
	exec("docker inspect -f '{{.State.Running}}' bitmarkNode", (err, stdout, stderr) => {
	  //If the container is not setup, create it
	  if (err) {
	  	console.log("Failed to start container");
	  	newNotification("The Docker container is not setup. Please restart the application.");
	  	return;
	  }

	  //If the container is stopped, start it
	  var str = stdout.toString().trim();
	  if(str === "true"){
	  	console.log("Container already running.");
	  	newNotification("The Docker container is already running.");
	  }else{
	  	//Start the container named bitmarkNode
	  	exec("docker start bitmarkNode", (err, stdout, stderr) => {
	  	  if (err) {
	  	    // node couldn't execute the command
	  	    console.log("Failed to start container");
	  	    newNotification("The Docker container has failed to start.");
	  	    return;
	  	  }

	  	  newNotification("The Docker container has started.");

	  	  console.log(`${stdout}`);
	  	});
	  }
	});
};

// Start the bitmarkNode Docker container without a notification
function startBitmarkNode_noNotif(){
	//Start the container named bitmarkNode
	exec("docker start bitmarkNode", (err, stdout, stderr) => {
	  if (err) {
	    // node couldn't execute the command
	    console.log("Failed to start container");
	    return;
	  }

	  console.log(`${stdout}`);
	  //Reload mainWindow
	  mainWindow.reload();
	});
};

// Stop the bitmarkNode Docker container
function stopBitmarkNode(){
	
	newNotification("Stopping the Docker container. This may take some time.");

	//Stop the container named bitmarkNode
	exec("docker stop bitmarkNode", (err, stdout, stderr) => {
	  if (err) {
	    // node couldn't execute the command
	    console.log("Failed to stop container");
	    newNotification("The Docker container has failed to stop.");
	    return;
	  }

	  console.log(`${stdout}`);
	  newNotification("The Docker container has stopped.");
	  //Reloads mainWindow
	  mainWindow.reload();
	});
};


//Create the container with no information given
function createContainerHelper(){
	//Get network and directory from preferences json file
	const net = preferences.value('blockchain.network');
	const dir = preferences.value('directory.folder');
	var isWin = process.platform === "win32"; //Check if platform is windows

	//Get the users public IP
	publicIp.v4().then(ip => {
	  createContainer(ip, net, dir, isWin);
	});
}

// Create the container with the network and directory given
function createContainerHelperIPOnly(net, dir, isWin){
	//Get the users public IP
	publicIp.v4().then(ip => {
	  createContainer(ip, net, dir, isWin);
	});
}

//Create the docker container
function createContainer(ip, net, dir, isWin){
	//Check to make sure the needed directories exist
	directoryCheckHelper(dir);

	//Attempt to remove and stop the container before creating the container.
	exec("docker stop bitmarkNode", (err, stdout, stderr) => {
		exec("docker rm bitmarkNode", (err, stdout, stderr) => {

			//Use the command suited for the platform
	    	if(isWin){
	    		//The windows command is the same as the linux command, except with \\ (\\ to delimit the single backslash) instead of /
	    		console.log("Windows");
	    		var command = `docker run -d --name bitmarkNode -p 9980:9980 -p 2136:2136 -p 2130:2130 -e PUBLIC_IP=${ip} -e NETWORK=${net} -v ${dir}\\bitmark-node-data\\db:\\.config\\bitmark-node\\db -v ${dir}\\bitmark-node-data\\data:\\.config\\bitmark-node\\bitmarkd\\bitmark\\data -v ${dir}\\bitmark-node-data\\data-test:\\.config\\bitmark-node\\bitmarkd\\testing\\data bitmark/bitmark-node`
			}else{
				console.log("Non-Windows");
	    		var command = `docker run -d --name bitmarkNode -p 9980:9980 -p 2136:2136 -p 2130:2130 -e PUBLIC_IP=${ip} -e NETWORK=${net} -v ${dir}/bitmark-node-data/db:/.config/bitmark-node/db -v ${dir}/bitmark-node-data/data:/.config/bitmark-node/bitmarkd/bitmark/data -v ${dir}/bitmark-node-data/data-test:/.config/bitmark-node/bitmarkd/testing/data bitmark/bitmark-node`
	    	}
	    	
	    	//Run the command
	    	exec(command, (err, stdout, stderr) => {
	    		if (err) {
	        		console.log("Failed to create container");
	        		newNotification("The Docker container failed to be created. Ensure you're connected to the Internet and Docker is running properly.");
	        		return;
	    		}

	    		console.log(`${stdout}`);
	    		newNotification("The Docker container was created successfully. Please refresh you window.");
	    	});
		});
	});
	//Reload the window when completed
	mainWindow.reload();
};

// Check for updates from bitmark/bitmark-node
function pullUpdate(){

	newNotification("Checking for updates. This may take some time.");

	//Pull updates from the docker bitmark-node repo
	exec("docker pull bitmark/bitmark-node", (err, stdout, stderr) => {
	  if (err) {
	    // node couldn't execute the command
	    console.log("Failed to pull update");
	    newNotification("There was an error checking for an update. Please check your Internet connection and restart the Docker application.");
	    return;
	  }

	  //get the output
	  var str = stdout.toString();

	  //Check to see if the up to date text is present
	  if(str.indexOf("Image is up to date for bitmark/bitmark-node") !== -1){
	  	console.log("No Updates");
	  	newNotification("No updates to the Bitmark Node software have been found.");
	  }
	  //Check to see if the updated text is present
	  else if(str.indexOf("Downloaded newer image for bitmark/bitmark-node") !== -1){
	  	console.log("Updated");
	  	newNotification("The Bitmark Node software has downloaded. Installing updates now.");
	  	createContainerHelper();
	  	newNotification("The Bitmark Node software has been updated.");
	  }else{
	  	console.log("Unknown update error");
	  	newNotification("There was an error checking for an update. Please check your Internet connection and restart the Docker application.");
	  }
	});
};

/* Directory Functions */

//Check to see if dir is defined and if not create it
function directoryCheck(dir){
	//If the directory doesn't exist, create it
	if (!fs.existsSync(dir)){
	    fs.mkdirSync(dir);
	    console.log(`The directory ${dir} does not exist. Creating it now.`);
	}else{
		console.log("The directory exists.")
	}
};

//Check directories
function directoryCheckHelper(dir){

	//Get each directory and store it in a variable
	const folder = dir;
	var bitmarknode = `${folder}/bitmark-node-data`;
	var db = `${bitmarknode}/db`;
	var data = `${bitmarknode}/data`;
	var datatest = `${bitmarknode}/data-test`;

	//Pass each variable to directoryCheck
	directoryCheck(bitmarknode);
	directoryCheck(db);
	directoryCheck(data);
	directoryCheck(datatest);
};

//Create the file submenu
var fileMenu = new Menu()
fileMenu.append(new MenuItem({ label: 'Preferences', click() { createPreferencesWindow(); }}))
fileMenu.append(new MenuItem({ role: 'quit' }))

//create the view submenu
var viewMenu = new Menu()
viewMenu.append(new MenuItem({ label: 'Reload', accelerator: 'CmdOrCtrl+R', click (item, focusedWindow) { if (focusedWindow) focusedWindow.reload(); }}))
viewMenu.append(new MenuItem({ type: 'separator' }))
viewMenu.append(new MenuItem({ role: 'resetzoom' }))
viewMenu.append(new MenuItem({ role: 'zoomin' }))
viewMenu.append(new MenuItem({ role: 'zoomout' }))

//Create the main menu
var menu = new Menu()
menu.append(new MenuItem({ label: 'File', submenu: fileMenu }))
menu.append(new MenuItem({ label: 'View', submenu: viewMenu }))
menu.append(new MenuItem({ label: 'About', click() { electron.shell.openExternal('https://bitmark.com') }}))

//Show the menu on click
ipc.on('show-context-menu', function (event) {
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup(win)
})

//Right Click Context Menu (Cut, Copy, Paste)
require('electron-context-menu')({
    prepend: (params, browserWindow) => [{
        label: 'Rainbow',
        // Only show it when right-clicking images
        visible: params.mediaType === 'image'
    }]
});

//Preferences Menu
//Get the default data directory
const preferences = new ElectronPreferences({
    /**
     * Where should preferences be saved?
     */
    'dataStore': prefLoc,
    /**
     * Default values.
     */
    'defaults': {
        "blockchain": {
            "network": "bitmark"
        },
        "update": {
            "auto_update": true
        },
        "directory": {
            "folder": dataDir
        },
    },
    /**
     * If the `onLoad` method is specified, this function will be called immediately after
     * preferences are loaded for the first time. The return value of this method will be stored as the
     * preferences object.
     */
    'onLoad': (preferences) => {
        // ...
        return preferences;
    },
    /**
     * The preferences window is divided into sections. Each section has a label, an icon, and one or
     * more fields associated with it. Each section should also be given a unique ID.
     */
    'sections': [
        {
            'id': 'update',
            'label': 'Update Settings',
            'icon': 'square-download',
            'form': {
                'groups': [
                    {
                        /**
                         * Group heading is optional.
                         */
                        'label': 'Update Settings',
                        'fields': [
                            {
                                'label': 'How would you like to check for updates?',
                                'key': 'auto_update',
                                'type': 'radio',
                                'options': [
                                    {'label': 'Automatically check for updates', 'value': true},
                                    {'label': 'Manually check for updates', 'value': false},
                                ],
                                'help': 'Note: If an update is found, it will automatically be installed.'
                            },
                        ]
                    }
                ]
            }
        },
        {
            'id': 'about',
            'label': 'About',
            'icon': 'badge-13',
            'form': {
                'groups': [
                    {
                        'label': 'About Bitmark Node',
                        'fields': [
                        	{
                        	    'label': 'description',
                        	    'heading': 'Description',
                        	    'content': "<p>The Bitmark node software enables any computer on the Internet to join the Bitmark network as a fully-validating peer.\
                        	                   The Bitmark blockchain is an independent chain, optimized for storing property titles, or bitmarks, and does not have its own internal currency (transaction fees are in bitcoin or litecoin).\
                        	                   The peer-to-peer network is written in Go and uses the ZeroMQ distributed messaging library. Consensus is secured using the Argon2 hashing algorithm as proof-of-work.</p>",
                        	    'type': 'message',
                        	},
                            {
                                'label': 'container',
                                'heading': 'Bitmark Node Docker Container',
                                'content': 'Read more about the Bitmark Node software that allows you to connect to the Bitmark network <a href="https://hub.docker.com/r/bitmark/bitmark-node/" base target="_blank" style="color:black">here</a>.',
                                'type': 'message',
                            },
                            {
                                'label': 'electron',
                                'heading': 'Electron',
                                'content': 'Read more about the Electron Framework used to build this application <a href="https://electronjs.org/" base target="_blank" style="color:black">here</a>.',
                                'type': 'message',
                            },
                        ]
                    }
                ]
            }
        }
    ]
});
