'use strict'
import { labelCreateStatus, buttonCreate, labelItemLocalStored, buttonCheckAccess } from './ui'
import { session } from './login'

import {
    addUrl,
    addStringNoLocale,
    createSolidDataset,
    createThing,
    getSolidDataset,
    getThingAll,
    getStringNoLocale,
    removeThing,
    saveSolidDatasetAt,
    setThing,
    overwriteFile, 
    getSourceUrl
} from '@inrupt/solid-client'

import { SCHEMA_INRUPT, RDF, AS } from '@inrupt/vocab-common-rdf'

const mediaContentPath = 'Media-Content/NewAlbum/'
let sellerObj  = {}

// 3. Create the Reading List
async function createList() {
    labelCreateStatus.textContent = ''
    const SELECTED_POD = document.getElementById('select-pod').value

    // For simplicity and brevity, this tutorial hardcodes the  SolidDataset URL.
    // In practice, you should add in your profile a link to this resource
    // such that applications can follow to find your list.
    const readingListUrl = `${SELECTED_POD}${mediaContentPath}new_item`

    //let titles = document.getElementById('price').value.split('\n')
    let titles = document.getElementById('price').value

    // Fetch or create a new reading list.
    let myReadingList

    try {

        // Attempt to retrieve the reading list in case it already exists.
        myReadingList = await getSolidDataset(readingListUrl, { fetch: session.fetch })
        // Clear the list to override the whole list
        let items = getThingAll(myReadingList)
        items.forEach((item) => {
            myReadingList = removeThing(myReadingList, item)
        })
    } catch (error) {
        if (typeof error.statusCode === 'number' && error.statusCode === 404) {
            // if not found, create a new SolidDataset (i.e., the reading list)
            myReadingList = createSolidDataset()
        } else {
            console.error(error.message)
        }
    }

    // Add titles to the Dataset
    // let i = 0
    // titles.forEach((title) => {
    //     if (title.trim() !== '') {
    //         let item = createThing({ name: 'price' + i })
    //         item = addUrl(item, RDF.type, AS.Article)
    //         item = addStringNoLocale(item, SCHEMA_INRUPT.productID, title)
    //         myReadingList = setThing(myReadingList, item)
    //         i++
    //     }
    // })
    let item = createThing({ name: 'price'})
    item = addUrl(item, RDF.type, AS.Article)
    item = addStringNoLocale(item, SCHEMA_INRUPT.productID, titles)
    myReadingList = setThing(myReadingList, item)

    try {
        // Save the SolidDataset
        let savedReadingList = await saveSolidDatasetAt(
            readingListUrl,
            myReadingList,
            { fetch: session.fetch }
        )

        labelCreateStatus.textContent = 'Saved'

        // Refetch the Reading List
        savedReadingList = await getSolidDataset(readingListUrl, { fetch: session.fetch })

        let items = getThingAll(savedReadingList)

        let listcontent = ''
        let item = getStringNoLocale(items[0], SCHEMA_INRUPT.productID)
        if (item !== null) {
            listcontent = item
        }
        // let listcontent = ''
        // for (let i = 0; i < items.length; i++) {
        //     let item = getStringNoLocale(items[i], SCHEMA_INRUPT.productID)
        //     if (item !== null) {
        //         //listcontent += item + '\n'
        //         listcontent += item 
        //     }
        // }
        sellerObj.price = listcontent
        sellerObj.webId = session.info.webId

        document.getElementById('savedtitles').value = listcontent
    } catch (error) {
        console.log(error)
        labelCreateStatus.textContent = 'Error' + error
        labelCreateStatus.setAttribute('role', 'alert')
    }
}

buttonCreate.onclick = function () {
    createList()
}

const dropContainer = document.getElementById('dropContainer')
dropContainer.ondragover = dropContainer.ondragenter = function (evt) {
    evt.preventDefault();
};

dropContainer.ondrop = function (evt) {
    // pretty simple -- but not for IE :(
    /*fileInput.files = evt.dataTransfer.files;

    // If you want to use some of the dropped files
    const dT = new DataTransfer();
    dT.items.add(evt.dataTransfer.files[0]);
    dT.items.add(evt.dataTransfer.files[3]);
    fileInput.files = dT.files; */
    console.log(evt.dataTransfer.files)
    handleFiles(evt.dataTransfer.files)
    evt.preventDefault();
};

function dropHandler(ev) {
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...ev.dataTransfer.items].forEach((item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === 'file') {
                const file = item.getAsFile();
                console.log(file)
                //console.log(`… file[${i}].name = ${file.name}`);
            }
        });
    } else {
        // Use DataTransfer interface to access the file(s)
        [...ev.dataTransfer.files].forEach((file, i) => {
            console.log(`… file[${i}].name = ${file.name}`);
        });
    }
}
// Upload selected files to Pod
function handleFiles(files) {
    console.log('FILES', files)
    const MY_POD_URL = document.getElementById('select-pod').value
    //const fileList = document.getElementById('fileinput').files;
    const fileList = Array.from(files)

    fileList.forEach(file => {
        writeFileToPod(file, `${MY_POD_URL}${mediaContentPath}${file.name}`);
    });
}

// Upload File to the targetFileURL.
// If the targetFileURL exists, overwrite the file.
// If the targetFileURL does not exist, create the file at the location.
async function writeFileToPod(file, targetFileURL) {
    try {
        const savedFile = await overwriteFile(
            targetFileURL,                              // URL for the file.
            file,                                       // File
            { contentType: file.type, fetch: session.fetch }    // mimetype if known, fetch from the authenticated session
        );
        const location = getSourceUrl(savedFile)
        console.log(`File saved at ${location}`);
        sellerObj.resourceUrl = location
        localStorage.setItem('myResource', JSON.stringify(sellerObj));
        const sendToBackend = await sendPost(location) // needs to be fixed
        console.log('Sent to backend ', sendToBackend)
    } catch (error) {
        console.error(error);
    }
}

async function sendPost(fileInfo){
    const data = { location: fileInfo };
    await fetch('http://localhost:3001/api/newsong', {
        
    credentials: 'include',          
    method: 'POST', // or 'PUT'
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log('Success:', data);
        return data
    })
    .catch((error) => {
        console.error('Error:', error);
        return error
    })
    
}

async function checkAccessResource(location){
    await fetch('http://localhost:3001/fetch?resource='+location)
    .then((response) => response.json())
    .then((data) => console.log(data));
}

const theResource = localStorage.getItem('myResource')

console.log(theResource)
if(theResource){
    labelItemLocalStored.innerHTML = theResource
    buttonCheckAccess.addEventListener('click', async function() {
        await checkAccessResource(theResource)
    })
}