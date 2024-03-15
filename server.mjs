import { createServer } from "http";
import crypto from "crypto";

const PORT = 8080;
const WEBSOCKET_MAGIC_STRING_KEY = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const SEVEN_BIT_INTEGET_MARKER = 125;
const SIXTEEN_BIT_INTEGET_MARKER = 126;
const SIXTYFOUR_BIT_INTEGET_MARKER = 127;

const MASK_KEY_BYTES_LENGTH = 4;

const FIRST_BIT = 128;
const OPCODE_TEXT=0x01

const server = createServer((req, res) => {
  res.writeHead(200);
  res.end("Hey there");
}).listen(PORT, () => console.log(`server listening on port ${PORT}`));

server.on("upgrade", onSocketUpgrade);

function onSocketUpgrade(req, socket, head) {
  const { "sec-websocket-key": webSocketClientKey } = req.headers;
  console.log(`${webSocketClientKey} connected`);
  const headers = prepareHandshakeHeader(webSocketClientKey);
  socket.write(headers);
  socket.on("readable", () => onSocketReadable(socket));
}

function sendMessage(message,socket){
    const dataFrameBuffer=prepareMessage(message)
    socket.write(dataFrameBuffer)
}

function prepareMessage(message){
    const msg=Buffer.from(message)
    const msgSize=msg.length
    let dataFrameBuffer
    const offset=2
    const firstByte=0x80|OPCODE_TEXT

    if(msgSize<=SEVEN_BIT_INTEGET_MARKER){
        const bytes=[firstByte]
        dataFrameBuffer=Buffer.from(bytes.concat(msgSize))
    }else {
        throw new Error('message too long!!')
    }
    const toatalLength=dataFrameBuffer.byteLength+msgSize
    const dataFrameResponse=concat([dataFrameBuffer,msg],toatalLength)
    return dataFrameResponse
}

function concat(bufferList,toatalLength){
    const target=Buffer.allocUnsafe(toatalLength)
    let offset=0
    for(const buffer of bufferList){
        target.set(buffer,offset)
        offset+=buffer.length
    }
    return target
}
function onSocketReadable(socket) {
  socket.read(1);
  const [markerAndPayloadLength] = socket.read(1);
  const lengthIndicatorInBits = markerAndPayloadLength - FIRST_BIT;

  let messageLength = 0;
  if (messageLength <= SEVEN_BIT_INTEGET_MARKER) {
    messageLength = lengthIndicatorInBits;
  } else {
    throw new Error(
      "your message is too long!! we don't handle 64bit messages"
    );
  }
  const maskKey=socket.read(MASK_KEY_BYTES_LENGTH)
  const encoded=socket.read(messageLength)
  const decoded=unMask(encoded,maskKey)
  const recieved=decoded.toString('utf8')
  const data=JSON.parse(recieved)
  console.log(`message recieved: ${data}`)

  const msg=JSON.stringify({
    message:data
  })
  sendMessage(msg,socket)
}



function unMask(encodedBuffer,maskKey){
    const finalBUffer=Buffer.from(encodedBuffer)

    const fillWithEightZeros=t=>t.padStart(8,'0')
    const toBinary=(t)=>fillWithEightZeros(t.toString(2))
    const fromBinaryToDecimal=(t)=>parseInt(toBinary(t),2)
    const getCharFromBinary=(t)=>String.fromCharCode(fromBinaryToDecimal(t))

    for(let i=0;i<encodedBuffer.length;i++){
        finalBUffer[i]=encodedBuffer[i]^maskKey[i%MASK_KEY_BYTES_LENGTH]

        const logger={
            unMaskCalc:`${toBinary(encodedBuffer[i])} ^ ${toBinary(maskKey[i%MASK_KEY_BYTES_LENGTH])}=${toBinary(finalBUffer[i])}`,
            decoded:getCharFromBinary(finalBUffer[i])
        }
        console.log(logger)
    }
    return finalBUffer
}

function prepareHandshakeHeader(id) {
  const acceptKey = createSocketAccept(id);
  const headers = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey}`,
    "",
  ]
    .map((line) => line.concat("\r\n"))
    .join('');
  return headers;
}

function createSocketAccept(id) {
  const shaum = crypto.createHash("sha1");
  shaum.update(id + WEBSOCKET_MAGIC_STRING_KEY);
  return shaum.digest("base64");
}

["uncaughtException", "unhandledRejection"].map((event) => {
  process.on(event, (err) => {
    console.log(
      `Something bad happened! event: ${event} msg: ${err.stack || err}`
    );
  });
});
