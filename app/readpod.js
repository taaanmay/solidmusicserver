'use strict'
import { buttonRead, buttonCreate, selectorPod } from './ui'
import { session } from './login'

import {
    getPodUrlAll
} from '@inrupt/solid-client'

// 2. Get Pod(s) associated with the WebID
async function getMyPods() {
    const webID = document.getElementById('myWebID').value
    const mypods = await getPodUrlAll(webID, { fetch: session.fetch })

    // TODO: for localhost there's a problem when retrieving the pod url
    if (mypods.length === 0) {
        mypods.push('http://localhost:3000/mypod2/')
    }

    // Update the page with the retrieved values.

    mypods.forEach((mypod) => {

        let podOption = document.createElement('option')
        podOption.textContent = mypod
        podOption.value = mypod
        selectorPod.appendChild(podOption)
    })
}

buttonRead.onclick = function () {
    getMyPods()
}

selectorPod.addEventListener('change', podSelectionHandler)
function podSelectionHandler() {
    if (selectorPod.value === '') {
        buttonCreate.setAttribute('disabled', 'disabled')
    } else {
        buttonCreate.removeAttribute('disabled')
    }
}