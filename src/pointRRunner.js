
const MACOS   = "darwin"
const WINDOWS = "win32"
const LINUX   = "linux"

const child      = require('child_process')
const portHelper = require('./portHelper')
  
const os         = require('os')     
//var execPath     = "Rscript"
//const {  BrowserWindow } = require('electron')
const path = require('path')
const fs         = require('fs')
exports.execPath=null
exports.port=null
exports.process  = null
//exports.window   = null

var getPtRVersion=function (path2lib){
  var filePath=path.join(  path2lib, 'pointR', 'DESCRIPTION');
  console.log('DESCRIPTION filePath='+ filePath)
	var data = fs.readFileSync(filePath);
  var fileContents=data.toString();
  console.log('DESCRIPTION fileContents')
  console.log(JSON.stringify(fileContents))
	var rx = /\nVersion:(.*)\n/m;
  //var ptR_version=fileContents.match(rx) || ['Infinity']
  var ptR_version=rx.exec(fileContents);
  ptR_version= "'"+ptR_version[1]+"'";
  console.log("ptR_version" + JSON.stringify(ptR_version))
	return ptR_version;
}

exports.startPointRProcess = async (path2lib, R_LIBS_USER, RSTUDIO_PANDOC)=>{
  if(!!exports.process){ //idiot check
    console.log('cannot startPointRProcess: already started?')
    return;
  }

  //set up command and options
  console.log('prior to portHelper.randomPort')
  exports.port = portHelper.randomPort()
 // console.log( 'exports.port='+ exports.port )
  console.log('portMain=' + JSON.stringify(exports.port));
  console.log('path2lib=' + JSON.stringify(path2lib));
  var ptR_Version = getPtRVersion (path2lib); //!!! probably not needed here
  console.log('pathptR_Version=' + JSON.stringify(ptR_Version));
  
  var erLib = path2lib; 
  var libShinyCmd     = "library('shiny');library('pointR');";
  var optionsCmd  = "shiny::shinyOptions(electron=TRUE, ptRVersion=" + ptR_Version +"," + "HOME='" + os.homedir() + "');";
  var libPathCmd="";
  var path2pointR="";

   //todo add R_LIBS_USER to libPathCmd
  if( !!R_LIBS_USER && fs.existsSync(R_LIBS_USER) ){
    libPathCmd  = ".libPaths(unique(c(Sys.getenv('E_LIB'),  Sys.getenv('R_LIBS_USER'), .libPaths() )));"
  } else {
    libPathCmd  = ".libPaths(c(Sys.getenv('E_LIB'), .libPaths()));"
  }

 
  
  var hbCmd =  "host = '127.0.0.1', launch.browser = FALSE," 
  //var runPtrCmd = "shiny::runApp(Sys.getenv('E_PTR_PATH'), " + hbCmd +"  port = as.integer(Sys.getenv('E_PTR_PORT')) )"
  var runPtrCmd = "shiny::runApp(system.file('App', package = 'pointR'), " + hbCmd +"  port = as.integer(Sys.getenv('E_PTR_PORT')) )"
  var processCmd  = libPathCmd + libShinyCmd + optionsCmd + runPtrCmd;

 

  /* //alternatively
  fs.access(erLib, (err) => {
    if (err) {
        console.log('does not exist')
      } else {
        console.log('exists')
      }
  })
  */
  
  
  console.log('execPath=' + exports.execPath)
  console.log("\nrunPtrCmd")
  console.log(runPtrCmd)
  console.log("\nprocessCmd")
  console.log(processCmd)
  console.log("\nerLib")
  console.log(erLib)
  console.log("\nexports.port")
  console.log(exports.port)


  if(!!exports.process){ //idiot check
    console.log('cannot startPointRProcess: already started?')
    return;
  }
  // spawn and return
  console.log('-------> startPointRProcess:  spawning <----------')
  var env = {
    //'E_PTR_PATH':  path2pointR,
    'E_PTR_PORT':  exports.port,
    'E_LIB': erLib,
    'HOME': os.homedir(),
    'R_LIBS_USER': R_LIBS_USER
  }
  if(!! RSTUDIO_PANDOC){
    env.RSTUDIO_PANDOC = RSTUDIO_PANDOC;
  }
  exports.process = child.spawn(exports.execPath, ["-e", processCmd], {env: env});
  
  exports.process.stdout.on('data', (data) => {
    console.log(`stdout:${data}`)
  })
  exports.process.stderr.on('data', (data) => {
    console.log('ptR.stderr')
    console.log(`ouch stderr:${data}`)
  })
  exports.process.on('error', function (err) { // todo: handle error
    console.log('failure : ' + err);
    rscriptLoadError = true
  });

  
  return exports.process
}


/*
exports.start_pointR_Process = async( 
    path2lib, 
    //attempt,   //counter
    onErrorStartup, // critcial failure
    onErrorLater,  // R process dies
    onSuccess)=>{
    if (attempt > 3) {
      await progressCallback({attempt: attempt, code: 'failed'})
      await onErrorStartup()
      return
    }
    exports.port = portHelper.randomPort()
    let shinyRunning = false
    let shinyProcessAlreadyDead = false

  const onError = async (e) => {
    console.error(e)
    rShinyProcess = null
    if (shutdown) { // global state :(
      return
    }
    if (shinyRunning) {
      await onErrorLater()
    } else {
      await tryStartWebserver(attempt + 1, progressCallback, onErrorStartup, onErrorLater, onSuccess)
    }
  }

  let rscript = exports.execPath

 let ptrProcess = execa(rscript,
    ['--vanilla', '-f', path.join(app.getAppPath(),  'assets', 'start_pointr.R')],
    { 
      env: {
        'E_PTR_PORT':  exports.port,
        'E_LIB': path2lib,
        'HOME': os.homedir()
      }
    }).catch((e) => {
        shinyProcessAlreadyDead = true
        onError(e)
    })

  let url = `http://127.0.0.1:${exports.port}`
  for (let i = 0; i <= 10; i++) {
    if (shinyProcessAlreadyDead) {
      break
    }
    await waitFor(500)
    try {
      const res = await http.head(url, {timeout: 1000})
      // TODO: check that it is really shiny and not some other webserver
      if (res.status === 200) {
        //await progressCallback({attempt: attempt, code: 'success'})
        shinyRunning = true
        onSuccess(url)
        return
      }
    } catch (e) {

    }
  }

  // not sure what to do about this
  //await progressCallback({attempt: attempt, code: 'notresponding'})

  try {
    rShinyProcess.kill()
  } catch (e) {}



}
*/
