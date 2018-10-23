//Notifications
// directory check
dirCheckFailed = 'Directories Create Failed!Please Check Permission.';
dirCheckSuccess = 'Directories Create Success!';

// action running
anotherActionIsRunning =
  'Another function is currently processing. Please allow for this action to complete before starting another one.';

// IP Check
maualIPNotValidCheckIP =
  'You have turned on manual IP setup, though your IP address is invalid. Please turn on automatic IP setup, or check your manually entered IP address. ';

//containers
createContainerStart = 'Start to create container, please wait';
containerNotSetupRestartApp =
  'The Docker container is not setup. Please restart the application.';
containerAlreadyRuning = 'The Docker container is already running.';
containerHasStart = 'The Docker container has started.';
containerFailStart = 'The Docker container has failed to start.';
containerStopTakeTime = 'Stopping the Docker container. This may take some time.';
containerHasStop = 'The Docker container has stopped.';
containerFailStop = 'The Docker container has failed to stop.';
conatinerCreateFail =
  "The Docker container failed to be created. Ensure you're connected to the Internet and Docker is running properly.";
containerCreateSucces = 'The Docker container was created successfully.';
//Update and Login
checkUpdateWait = 'Checking for updates. This may take some time.';
notLoginWarn =
  'Docker is not logged in. Sometime, it fail to pull due to not login. You could configure the Docker client to not automatically use a credential from your home directory.';

errorCheckUpdate =
  'There was an error checking for an update. Please check your Internet connection and restart the Docker application.';
noUpdateFound = 'No updates to the Bitmark Node software have been found.';
installUpdateSoftware =
  'The Bitmark Node software has downloaded. Installing updates now.';
nodeUpdated = 'The Bitmark Node software has been updated.';
containerRestartWait = 'Restarting container. This may take some time.';

//Reverse Previous Version
stableVerReverseStart = 'Bitmark-node reverse to stable version process start. This may take couple minutes';
hasUsestableVersion = 'Bitmark-node has used previous stable version';
errorPullPrevFail = 'Reverse Previous Stable Version Fail!';
reverseToPrevStable = 'Bitmark-node has reverse to previous stable version';


//network change
networkChangeBitmarkWait =
  "Changing the network to 'bitmark'. This may take some time.";
networkAlreadyBitmark = "The network is already set to 'bitmark'.";
networkAlreadyTest = "The network is already set to 'testing'.";

//Exports
exports.dirCheckFailed = dirCheckFailed;
exports.dirCheckSuccess = dirCheckSuccess;
exports.anotherActionIsRunning = anotherActionIsRunning;
//Container
exports.createContainerStart = createContainerStart;
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
//Update and Login
exports.checkUpdateWait = checkUpdateWait;
exports.stableVerReverseStart = stableVerReverseStart;
exports.hasUsestableVersion = hasUsestableVersion;
exports.errorPullPrevFail = errorPullPrevFail;
exports.reverseToPrevStable = reverseToPrevStable;
exports.notLoginWarn = notLoginWarn;
exports.errorCheckUpdate = errorCheckUpdate;
exports.noUpdateFound = noUpdateFound;
exports.installUpdateSoftware = installUpdateSoftware;
exports.nodeUpdated = nodeUpdated;
//network change
exports.networkChangeBitmarkWait = networkChangeBitmarkWait;
exports.networkAlreadyBitmark = networkAlreadyBitmark;
exports.networkAlreadyTest = networkAlreadyTest;
