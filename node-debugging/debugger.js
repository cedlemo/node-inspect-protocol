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
let commandsQueues = []

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

ws.on('message', data => {
  console.log('Message recieved:')
  let jsonData = JSON.parse(data)
  if (jsonData.id === 1) { // this is the answer to Debugger.enable
    responses[jsonData.id] = jsonData
    console.log('Parsed finished')
    // Display the parsed file information
    // sources.forEach(elt => console.log(elt))
  } else {
    if (jsonData.method === 'Debugger.scriptParsed') {
      let source = jsonData.params
      sources.push(source)
    } else {
      console.log(data)
    }
  }
})

ws.on('error', data => {
  console.log('Error')
  console.log(data)
})

ws.on('open', _data => {
  console.log('Connection opened')
  console.log('Send debugger information')
  // let cmd = {"seq":1, "id":12, "type":"request", "command": "Debugger.getPossibleBreakPoints"}
  let cmd = { 'id': 1, 'method': 'Debugger.enable' }
  ws.send(JSON.stringify(cmd))

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
