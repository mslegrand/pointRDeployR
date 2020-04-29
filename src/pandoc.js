const {dialog}   =  require('electron')
const fs = require('fs')
exports.store =null

ask4PandocDialog = async ()=>{
    console.log('ask4PandocDialog')  
    const options={title: 'Navigate and select Pandoc directory', 
        buttonLabel: 'Select Dir', 
        properties:["openDirectory"]
    }
    result= await dialog.showOpenDialog( options )        
    if(result.canceled===true){
        console.log('canceling')
        Promise.resolve(false);   
    } else {// save file here    
        filePaths=result.filePaths[0]
        console.log(JSON.stringify(filePaths))
        exports.store.set("rscriptPath", filePaths)
        Promise.resolve(true)
    }      
}

exports.getPandocPath= async function(){
    const path = require('path');
    let pdpath= exports.store.get("pandocPath")
    console.log('2: pandoc='+ JSON.stringify(pdpath))
    if( fs.existsSync(pdpath)  &&
        // && //add check for name ??
        'pandocX'===path.basename(pdpath,path.extname(pdpath))
    ){ 
        return  pdpath  
    } else {
        console.log('inside else')
            inputPathYN =  await dialog.showMessageBox({
                type: 'question',
                icon: "assets/images/32x32.png",
                message: "Pandoc was not found, -(\nIf indeed, Pandoc is  installed please supply path to the Pandoc directory." ,
                buttons: ["Supply Now", "Cancel"],
                defaultId: 0, // bound to buttons array
                cancelId:  1  // bound to buttons array
            })
            if(inputPathYN.response===0){
                await ask4PandocDialog()
            } else {
                console.log('hould reject pandoc')
                throw(Error('MISSING-PANDOC'))
            }
            return exports.getPandocPath() 
    } 
}