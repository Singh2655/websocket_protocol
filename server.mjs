import {createServer} from "http"

const PORT=8080

const server=createServer((req,res)=>{
    res.writeHead(200)
    // throw new Error('test')
    res.end("Hey there")
})
.listen(PORT,()=>console.log(`server listening on port ${PORT}`))

server.on('upgrade',(req,socket,head)=>{
    console.log({head:req.headers})
})

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