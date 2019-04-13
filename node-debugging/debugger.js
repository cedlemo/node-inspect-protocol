const WebSocket = require('ws')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
})

const args = process.argv
if (args.length !== 3) {
  displayUsage()
  process.exit(1)
}

const url = args[2]

let ws = null
try {
  ws = new WebSocket(url)
} catch (e) {
  console.log('Unable to initiate connection', e.message)
  process.exit(1)
}

let sources = []
let responses = {}
let commandsQueue = []
let historyQueue = []

let idGenerator = function () {
  let id = 1
  return {
    next: function () {
      id += 1
      return this.value()
    },
    value: function () {
      return id
    },
    reset: function () {
      id = 0
    }
  }
}

let id = idGenerator()

let debuggerId

// Each command will have this form:
// take a websocket
// get an id
// register an object in the commandsQueue. This object will have the following
// field:
// id: the id of the command
// onMessageUntilEnded: a function that will be triggered on each event related
// to the current command until this command has been answered
// result: a function executed when the server return a result message for this
// command.
// The two last functions return true or false if we want it to not be logged in
// the on 'message' event.

let sendDebuggerEnable = (ws) => {
  let _id = id.next()
  let cmd = { 'id': _id, 'method': 'Debugger.enable' }
  commandsQueue.push({
    id: _id,
    onMessageUntilEnded: (jsonData) => {
      if (jsonData.method === 'Debugger.scriptParsed') {
        console.log('Debugger.enable: ', jsonData.params.url)
        let source = jsonData.params
        sources.push(source)
        return true
      }
      return false
    },
    result: (jsonData) => {
      debuggerId = jsonData.debuggerId
      console.log('Debugger.enable command response: debuggerId -> ', debuggerId)
      return true
    }
  })
  ws.send(JSON.stringify(cmd))
}

ws.on('message', data => {
  let jsonData = JSON.parse(data)
  let handled = false //
  for (let i = 0; i < commandsQueue.length; i++) {
    let command = commandsQueue[i]
    if (jsonData.id === command.id) {
      if (command.result(jsonData.result)) { handled = true }
      historyQueue.push(commandsQueue.splice(i, 1))
      i--
    } else {
      if (command.onMessageUntilEnded(jsonData)) { handled = true }
    }
  }
  if (!handled) { console.log('Message recieved:', data) }
})

ws.on('error', data => {
  console.log('Error')
  console.log(data)
})

ws.on('open', _data => {
  console.log('Connection opened')
  console.log('Send debugger information')
  // let cmd = {"seq":1, "id":12, "type":"request", "command": "Debugger.getPossibleBreakPoints"}
  sendDebuggerEnable(ws)

  // dirtySleep(100)
  // Find the scriptId for the server.js file
  console.log('Find server file')
  let serverFile = `file://${__dirname}/server.js`
  let scriptId = sources.find(elt => {elt.url.match(/serverFile/)})
  console.log(scriptId)
  // List break points /!\ need a location https://chromedevtools.github.io/devtools-protocol/v8/Debugger#type-Location
  // cmd = {'id':3, 'method': 'Debugger.getPossibleBreakpoints', 'data': {'start': 0}}
  // ws.send(JSON.stringify(cmd))
  // rl.on('line', line => {
  //   if(line === 'q') {
  //     rl.close()
  //     ws.close()
  //     process.exit(0)
  //   }
  //   ws.send(line)
  // })
})

// async function dirtySleep (ms) {
//   await (new Promise(resolve => setTimeout(resolve, ms)))
// }

ws.on('close', data => {
  console.log('Connection closed')
})

function displayUsage () {
  console.log('Usage:')
  console.log('\tnode debugger.js url')
  console.log('with url:')
  console.log('\tws://127.0.0.1:9229/d0559b7d-1b92-4e42-8b09-ef804627e57a')
}

rl.on('line', line => {
  console.log(line)
})
