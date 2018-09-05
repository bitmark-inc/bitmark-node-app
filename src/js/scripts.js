const { ipcRenderer, remote } = require('electron');
const refreshDelay = 300; // delay of refresh frame
var nodeConsole = require('console');
var mainConsole = new nodeConsole.Console(process.stdout, process.stderr);

/* Sidebar Functions */

//Calls startBitmarkNode located in main.js and refreshes the iFrame
function startBitmarkNodeLocal(){
	mainConsole.log("startBitmarkNodeLocal start");
	//If the program is not running anything, start the container
	if(!isActionRun()){
		//Get the promise from startBitmarkNode and refresh the frame
		startBitmarkNode().then((result) => {
			mainConsole.log('startBitmarkNodeLocal Success', result);
			setTimeout(refreshFrame, refreshDelay);
		}, (error) => {
			mainConsole.log('startBitmarkNodeLocal Error', error);
			setTimeout(refreshFrame, refreshDelay);
		});
		reloadMain("index");
	}else{
		mainConsole.log("Function already running");
		newNotification("Another function is currently processing. Please allow for this action to complete before starting another one.");
	}
};

//calls stopBitmarkNode located in main.js
function stopBitmarkNodeLocal(){
	//If the program is not running anything, start the container
	if(!isActionRun()){
		//Get the promise from stopBitmarkNode and refresh the frame
		stopBitmarkNode().then((result) => {
			mainConsole.log('stopBitmarkNodeLocal Success', result);
			setTimeout(refreshFrame, refreshDelay);
		}, (error) => {
			mainConsole.log('stopBitmarkNodeLocal Error', error);
			setTimeout(refreshFrame, refreshDelay);
		});
	}else{
		mainConsole.log("Function already running");
		newNotification("Another function is currently processing. Please allow for this action to complete before starting another one.");
	}
};

function restartBitmarkNodeLocal(){
	//If the program is not running anything, start the container
	if(!isActionRun()){
		newNotification("Restarting container. This may take some time.");
		//Get the promise from createContainerHelperLocal and refresh the frame
		createContainerHelperLocal().then((result) => {
			mainConsole.log('Success', result);
			setTimeout(refreshFrame, refreshDelay);
		}, (error) => {
			mainConsole.log('Error', error);
			setTimeout(refreshFrame, refreshDelay);
		});
	}else{
		mainConsole.log("Function already running");
		newNotification("Another function is currently processing. Please allow for this action to complete before starting another one.");
	}
};

//Changes the network to Bitmark if it current isn't on it
function setNetworkBitmarkLocal(){
	// Fetch the user's preferred network
	const settings = require('electron').remote.require('electron-settings');
	var network = settings.get('network');

	//If the program is not running anything, start the container
	if(!isActionRun()){
		newNotification("Restarting container. This may take some time.");
		//Checks the network
		if(network === "testing"){
			//Update network
			settings.set('network', 'bitmark');
			mainConsole.log("Changing to bitmark");
			
			//Lets the user know what is happening
			newNotification("Changing the network to 'bitmark'. This may take some time.");
			
			//Get the promise from createContainerHelperLocal and refresh the frame
			createContainerHelperLocal().then((result) => {
				mainConsole.log('Success', result);
				setTimeout(refreshFrame, refreshDelay);
			}, (error) => {
				mainConsole.log('Error', error);
				setTimeout(refreshFrame, refreshDelay);
			});
		} else {
			mainConsole.log("Already on bitmark");
			newNotification("The network is already set to 'bitmark'.");
		}
	}else{
		mainConsole.log("Function already running");
		newNotification("Another function is currently processing. Please allow for this action to complete before starting another one.");
	}
};
//Changes the network to testing if it current isn't on it
function setNetworkTestingLocal(){
	// Fetch the user's preferred network
	const settings = require('electron').remote.require('electron-settings');
	var network = settings.get('network');

	//If the program is not running anything, start the container
	if(!isActionRun()){
		newNotification("Restarting container. This may take some time.");
		//Checks the network
		if(network === "bitmark"){
			//Update network
			settings.set('network', 'testing');
			mainConsole.log("Changing to testing");
			newNotification("Changing the network to 'testing'. This may take some time.");
			createContainerHelperLocal().then((result) => {
			  mainConsole.log('Success', result);
			  setTimeout(refreshFrame, refreshDelay);
			}, (error) => {
			  mainConsole.log('Error', error);

			});
		} else {
			mainConsole.log("Already on testing");
			//Let the user know the network is already bitmark
			newNotification("The network is already set to 'testing'.");
		}
	}else{
		mainConsole.log("Function already running");
		newNotification("Another function is currently processing. Please allow for this action to complete before starting another one.");
	}
};

function pullUpdateLocal(){
	//Get if the program is running a function
	const settings = require('electron').remote.require('electron-settings');
	//If the program is not running anything, start the container
	if(!isActionRun()){

		//Get the promise from pullUpdate and refresh the frame (a success only occurs when an update is found)
		pullUpdate().then((result) => {
			mainConsole.log('Success', result);
			setTimeout(refreshFrame, refreshDelay);
		}, (error) => {
			mainConsole.log('Error', error)
		});
	}else{
		mainConsole.log("Function already running");
		newNotification("Another function is currently processing. Please allow for this action to complete before starting another one.");
	}
};

//Create the preference window
function createPreferencesWindowLocal(){
	const {BrowserWindow} = require('electron').remote

	//define the window
	var prefWindow = new BrowserWindow({
		width: 850,
		height: 600,
		minWidth: 735,
		minHeight: 500,
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

//Reloads the iFrame
function refreshFrame() {
	document.getElementsByTagName('iframe')[0].src=document.getElementsByTagName('iframe')[0].src
};


/* Helper Functions */

//Get the network and directory and pass it to the main function to get the IP then create the container
function createContainerHelperLocal(){
	//Get the network and directory from settings
	const settings = require('electron').remote.require('electron-settings');
	var net = settings.get('network');
	var dir = settings.get('directory');

	//Get if the computer is a windows computer
	var isWin = remote.getGlobal('process').platform === "win32";

	//Return the promise from createContainerHelperIPOnly to allow the frame to be freshed
	return new Promise((resolve, reject) => {
		createContainerHelperIPOnly(net, dir, isWin).then((result) => {
			resolve(result);
		}, (error) => {
			reject(error);
		});
	});
};

//Function to handle buttons
(function () {
    const remote = require('electron').remote;
    const ipc = require('electron').ipcRenderer;
    
    function init() { 
   	  //Control the minimize button
      document.getElementById("min").addEventListener("click", function (e) {
        const window = remote.getCurrentWindow();
        window.minimize(); 
      });
      
      //Control the maximize button
      document.getElementById("max").addEventListener("click", function (e) {
        const window = remote.getCurrentWindow();
        if (!window.isMaximized()) {
          window.maximize();
        } else {
          window.unmaximize();
        }  
      });
      
      //Control the close button
      document.getElementById("close").addEventListener("click", function (e) {
        const window = remote.getCurrentWindow();
        window.close();
      }); 

      // Tell main process to show the menu when demo button is clicked
      document.getElementById('menu').addEventListener('click', function () {
        ipc.send('show-context-menu');
      });
    }; 
    
    //When the page is ready, run init
    document.onreadystatechange = function () {
      if (document.readyState == "complete") {
        init(); 
      }
    };
})();