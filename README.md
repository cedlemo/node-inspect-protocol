# Node inspect and exploring the debugging protocol

## Overview

When launching a JavaScript application with `node --inspect`, there is a websocket
server that wait for a debugger. The debugger can connect using an url that looks like this
one:
```
ws://127.0.0.1:9229/14936faf-0fc8-4d49-ba43-f9d8187382a3
```

After the connection is initiated, the client debugger can send command to the
server debugger in the json format.

Because of the asynchronous way of working of node, every messages send by the
client must provide an id. The server will send a result with the same id send
in the request.

The protocol used is discribed here:
* https://chromedevtools.github.io/devtools-protocol/v8/Debugger/

## Description of the protocol

### Start a debug session
The websocket connection is initialized. The first thing to do is to enable the
debugger. For this the data to send is:

```javascript
  let cmd = {'id':1, 'method':'Debugger.enable'}
  ws.send(JSON.stringify(cmd))
```

This command force node to load the script and its dependencies. When they are
parsed, it triggers the [Debugger.scriptParsed](https://chromedevtools.github.io/devtools-protocol/v8/Debugger#event-scriptParsed) event for each of them and return to the client debugger a lot of information about
those scripts.

The data returned is of the following form:

```json
{
  "method":"Debugger.scriptParsed",
  "params":{
    "scriptId":"183",
    "url":"internal/dgram.js",
    "startLine":0,"startColumn":0,
    "endLine":85,"endColumn":0,
    "executionContextId":1,
    "hash":"25db743041b0488827a8a03aa0ff67fb7ac77c17",
    "executionContextAuxData":{"isDefault":true},
    "isLiveEdit":false,
    "sourceMapURL":"",
    "hasSourceURL":false,
    "isModule":false,
    "length":1833
  }
}
```
When all the data related to the parsed script are sent, the server return a
response with the same id as the initial request and a `debuggerId`.

```json
{"id":1,"result":{"debuggerId":"(D750AD89818A150E3155AC1D6ECB7BB)"}}
```

### Managing break points

* list availables break points
* add/remove a break point
* run/rerun the current context
* explore stack trace

## Idea
* write a nvim plugin to debugg Node application

## Sources
* https://chromedevtools.github.io/devtools-protocol/v8/Debugger/
* https://nodejs.org/api/vm.html
* https://stackoverflow.com/questions/50272317/can-not-connect-to-node-js-inspector-using-websocket
* https://nodejs.org/en/docs/guides/debugging-getting-started/
* https://github.com/nodejs/node-inspect/blob/master/lib/internal/inspect_client.js
* https://medium.freecodecamp.org/supercharge-your-debugging-experience-for-node-js-3f0ddfaffbb2
* https://chromedevtools.github.io/devtools-protocol/
