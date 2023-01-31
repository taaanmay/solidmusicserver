'use strict'
import { buttonRead, buttonLogin, selectorIdP } from './ui'
import {
    login,
    handleIncomingRedirect,
    getDefaultSession
} from '@inrupt/solid-client-authn-browser'

export let session = null
// 1a. Start Login Process. Call login() function.
function loginToSelectedIdP() {
    const SELECTED_IDP = document.getElementById('select-idp').value

    return login({
        oidcIssuer: SELECTED_IDP,
        redirectUrl: window.location.href,
        clientName: 'Getting started app'
    })
}

// 1b. Login Redirect. Call handleIncomingRedirect() function.
// When redirected after login, finish the process by retrieving session information.
async function handleRedirectAfterLogin() {
    await handleIncomingRedirect({ restorePreviousSession: true })

    session = getDefaultSession()

    if (session.info.isLoggedIn) {
        // Update the page with the status.
        document.getElementById('myWebID').value = session.info.webId

        // Enable Read button to read Pod URL
        buttonRead.removeAttribute('disabled')
    }
}

// The example has the login redirect back to the index.html.
// This calls the function to process login information.
// If the function is called when not part of the login redirect, the function is a no-op.
handleRedirectAfterLogin()

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
