'use strict'
import { buttonRead, buttonLogin, selectorIdP } from './ui'
import {
    login,
    handleIncomingRedirect,
    getDefaultSession,
    onSessionRestore
} from '@inrupt/solid-client-authn-browser'

export const session = getDefaultSession()

// 1a. Start Login Process. Call login() function.
function loginToSelectedIdP() {
    const SELECTED_IDP = document.getElementById('select-idp').value

    return login({
        oidcIssuer: SELECTED_IDP,
        //clientId: 'http://localhost:3001/myappid.jsonld',
        redirectUrl: window.location.href,        
        clientName: 'Web App Permission'
    })
}

// 1b. Login Redirect. Call handleIncomingRedirect() function.
// When redirected after login, finish the process by retrieving session information.
async function handleRedirectAfterLogin() {
    await session.handleIncomingRedirect({ restorePreviousSession: true })

    //session = getDefaultSession()
    console.log(session)
    if (session.info.isLoggedIn) {
        // Update the page with the status.
        document.getElementById('myWebID').value = session.info.webId

        // Enable Read button to read Pod URL
        buttonRead.removeAttribute('disabled')
    } else {

    }
}

// The example has the login redirect back to the index.html.
// This calls the function to process login information.
// If the function is called when not part of the login redirect, the function is a no-op.
handleRedirectAfterLogin()
onSessionRestore((url)=>{    
    console.log('onSessionRestore', url)
 })
buttonLogin.onclick = function () {
    loginToSelectedIdP()
}

selectorIdP.addEventListener('change', idpSelectionHandler)
function idpSelectionHandler() {
    if (selectorIdP.value === '') {
        buttonLogin.setAttribute('disabled', 'disabled')
    } else {
        buttonLogin.removeAttribute('disabled')
    }
}
