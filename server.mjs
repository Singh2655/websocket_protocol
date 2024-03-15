import {createServer} from "http"
import crypto from "crypto"

const PORT=8080
const WEBSOCKET_MAGIC_STRING_KEY='258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

const server=createServer((req,res)=>{
    res.writeHead(200)
    res.end("Hey there")
})
.listen(PORT,()=>console.log(`server listening on port ${PORT}`))

server.on('upgrade',onSocketUpgrade)

function onSocketUpgrade(req,socket,head){
    const {'sec-websocket-key':webSocketClientKey}=req.headers
    console.log(`${webSocketClientKey} connected`)
    const headers=prepareHandshakeHeader(webSocketClientKey)
    socket.write(headers)
}

function prepareHandshakeHeader(id){
    const acceptKey=createSocketAccept(id)
    const headers=[
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        ''
    ].map(line=>line.concat('\r\n')).join('')
    return headers
}

function createSocketAccept(id){
    const shaum=crypto.createHash('sha1')
    shaum.update(id+WEBSOCKET_MAGIC_STRING_KEY)
    return shaum.digest('base64')
}

;
[
    "uncaughtException",
    "unhandledRejection"

]
.map( event=> {
    process.on(event,(err)=>{
        console.log(`Something bad happened! event: ${event} msg: ${err.stack || err}`)
    })
    
});