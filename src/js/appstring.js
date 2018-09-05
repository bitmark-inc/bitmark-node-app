//Notifications
// directory check
const dirCheckFailed = "Directories Create Failed!Please Check Permission.";
const dirCheckSuccess = "Directories Create Success!";

// action running
const anotherActionIsRunning = "Another function is currently processing. Please allow for this action to complete before starting another one.";

// IP Check
const maualIPNotValidCheckIP = "You have turned on manual IP setup, though your IP address is invalid. Please turn on automatic IP setup, or check your manually entered IP address. ";

//containers
const containerNotSetupRestartApp = "The Docker container is not setup. Please restart the application.";
const containerAlreadyRuning = "The Docker container is already running.";
const containerHasStart = "The Docker container has started.";
const containerFailStart = "The Docker container has failed to start.";
const containerStopTakeTime = "Stopping the Docker container. This may take some time.";
const containerHasStop = "The Docker container has stopped.";
const containerFailStop = "The Docker container has failed to stop.";
const conatinerCreateFail = "The Docker container failed to be created. Ensure you're connected to the Internet and Docker is running properly.";
const containerCreateSucces = "The Docker container was created successfully.";
const checkUpdateWait = "Checking for updates. This may take some time.";
const notLoginWarn = "Docker is not logged in. Sometime, it fail to pull due to not login. You could configure the Docker client to not automatically use a credential from your home directory.";
//update
const errorCheckUpdate = "There was an error checking for an update. Please check your Internet connection and restart the Docker application.";
const noUpdateFound = "No updates to the Bitmark Node software have been found.";
const installUpdateSoftware = "The Bitmark Node software has downloaded. Installing updates now.";
const nodeUpdated = "The Bitmark Node software has been updated.";
const containerRestartWait = "Restarting container. This may take some time.";
//network change
const networkChangeBitmarkWait = "Changing the network to 'bitmark'. This may take some time.";
const networkAlreadyBitmark = "The network is already set to 'bitmark'.";
const networkAlreadyTest = "The network is already set to 'testing'.";


//Exports
exports.dirCheckFailed = dirCheckFailed;
exports.dirCheckSuccess= dirCheckSuccess;
exports.anotherActionIsRunning = anotherActionIsRunning;
exports.containerNotSetupRestartApp = containerNotSetupRestartApp;
exports.containerAlreadyRuning = containerAlreadyRuning;
exports.containerHasStart = containerHasStart;
exports.containerFailStart = containerFailStart;
exports.containerStopTakeTime = containerStopTakeTime;
exports.containerFailStop = containerFailStop;
exports.containerHasStop = containerHasStop;
exports.containerRestartWait = containerRestartWait;
exports.maualIPNotValidCheckIP = maualIPNotValidCheckIP;
exports.conatinerCreateFail = conatinerCreateFail;
exports.containerCreateSucces = containerCreateSucces;
exports.checkUpdateWait = checkUpdateWait;
exports.notLoginWarn = notLoginWarn;
exports.errorCheckUpdate = errorCheckUpdate;
exports.noUpdateFound = noUpdateFound;
exports.installUpdateSoftware = installUpdateSoftware;
exports.nodeUpdated = nodeUpdated;
exports.networkChangeBitmarkWait = networkChangeBitmarkWait;
exports.networkAlreadyBitmark = networkAlreadyBitmark;
exports.networkAlreadyTest = networkAlreadyTest;