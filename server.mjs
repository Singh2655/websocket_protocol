import { createServer } from "http";
import crypto from "crypto";

const PORT = 8080;
const WEBSOCKET_MAGIC_STRING_KEY = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const SEVEN_BIT_INTEGET_MARKER = 125;
const SIXTEEN_BIT_INTEGET_MARKER = 126;
const SIXTYFOUR_BIT_INTEGET_MARKER = 127;

const MASK_KEY_BYTES_LENGTH = 4;

const FIRST_BIT = 128;

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
  const recievedDate=decoded.toString('utf8')
  console.log(recievedDate)
}

function unMask(encodedBuffer,maskKey){
    const finalBUffer=Buffer.from(encodedBuffer)
    for(let i=0;i<encodedBuffer.length;i++){
        finalBUffer[i]=encodedBuffer[i]^maskKey[i%4]
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
    .join("");
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
