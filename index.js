const express = require("express");
const cookieSession = require("cookie-session");
const path = require('path');
const public = path.join(__dirname, 'app');
const cors = require('cors')

const {
  getSessionFromStorage,
  getSessionIdFromStorageAll,
  Session
} = require("@inrupt/solid-client-authn-node");

const app = express();
const port = 3001;

const corsOptions = {
  origin: 'http://localhost:1234',
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(express.json());

// The following snippet ensures that the server identifies each user's session
// with a cookie using an express-specific mechanism
app.use(
  cookieSession({
    name: "session",
    // These keys are required by cookie-session to sign the cookies.
    keys: [
      "Required, but value not relevant for this demo - key1",
      "Required, but value not relevant for this demo - key2",
    ],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);


app.get("/login", async (req, res, next) => {

  console.log(req.query["issuer"])
  // 1. Create a new Session
  const session = new Session();
  req.session.sessionId = session.info.sessionId;
  const redirectToSolidIdentityProvider = (url) => {
    // Since we use Express in this example, we can call `res.redirect` to send the user to the
    // given URL, but the specific method of redirection depend on your app's particular setup.
    // For example, if you are writing a command line app, this might simply display a prompt for
    // the user to visit the given URL in their browser.
    res.redirect(url);
  };
  // 2. Start the login process; redirect handler will handle sending the user to their
  //    Solid Identity Provider.
  await session.login({
    // After login, the Solid Identity Provider will send the user back to the following
    // URL, with the data necessary to complete the authentication process
    // appended as query parameters:
    redirectUrl: `http://localhost:${port}/home`,
    // Set to the user's Solid Identity Provider; e.g., "https://login.inrupt.com" 
    // oidcIssuer: "https://localhost:3000", // THROWS ERROR
    oidcIssuer: req.query["issuer"] || "http://localhost:3000",
    // Pick an application name that will be shown when asked 
    // to approve the application's access to the requested data.
    clientName: "Server Auth",
    handleRedirect: redirectToSolidIdentityProvider,
  });
});

app.get("/home", async (req, res) => {
  // 3. If the user is sent back to the `redirectUrl` provided in step 2,
  //    it means that the login has been initiated and can be completed. In
  //    particular, initiating the login stores the session in storage, 
  //    which means it can be retrieved as follows.
  const session = await getSessionFromStorage(req.session.sessionId);

  // 4. With your session back from storage, you are now able to 
  //    complete the login process using the data appended to it as query
  //    parameters in req.url by the Solid Identity Provider:
  await session.handleIncomingRedirect(`http://localhost:${port}${req.url}`);

  // 5. `session` now contains an authenticated Session instance.
  if (session.info.isLoggedIn) {
    //res.redirect('/?webid='+session.info.webId)
    res.redirect('/')
    //return res.send(`<p>Logged in with the WebID ${session.info.webId}.</p>`)
  }
});

// 6. Once you are logged in, you can retrieve the session from storage, 
//    and perform authenticated fetches.
app.get("/fetch", async (req, res, next) => {
  console.log(req.query["resource"])
  if (typeof req.query["resource"] === "undefined") {
    res.send(
      "<p>Please pass the (encoded) URL of the Resource you want to fetch using `?resource=&lt;resource URL&gt;`.</p>"
    );
  }
  const session = await getSessionFromStorage(req.session.sessionId);
  if(session){
    console.log(await (await session.fetch(req.query["resource"])).text());
    res.send({sucess:"Performed authenticated fetch"});
   
  } else {
    console.log('No session');
    res.send({error:"unathorized"});
  }
  
});

// 7. To log out a session, just retrieve the session from storage, and 
//    call the .logout method.
app.get("/logout", async (req, res, next) => {
  const session = await getSessionFromStorage(req.session.sessionId);
  session.logout();
  res.send(`<p>Logged out.</p>`);
});

app.get("/myappid", async (req, res, next) => {  
  var options = {
    root: path.join(public)
  };
  
  var fileName = 'myappid.jsonld';
  res.sendFile(fileName, options, function (err) {
      if (err) {
          next(err);
      } else {
          console.log('Sent:', fileName);
      }
  });
});
// 8. On the server side, you can also list all registered sessions using the
//    getSessionIdFromStorageAll function.
/*app.get("/", async (req, res, next) => {
  const sessionIds = await getSessionIdFromStorageAll();
  for(const sessionId in sessionIds) {
    // Do something with the session ID...
  }
  
  res.send(
    `<p>There are currently [${sessionIds.length}] visitors.</p>`
  );
});*/
app.use('/', express.static(public));

const listSongs = [
  { id: 1, location: "http://localhost:3000/mypod/getting-started/readingList/Lypofa2.m4a" },
];

app.post("/api/newsong", (req, res) => {
  console.log(req.session)
  const newSong = { id: listSongs.length + 1, location: req.body.location };
  listSongs.push(newSong);
  res.send(newSong);
});

app.listen(port, () => {
  console.log(
    `Server running on port [${port}]. ` +
    `Visit [http://localhost:${port}/login] to log in to [login.inrupt.com].`
  );
});