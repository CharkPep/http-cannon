import { Command } from 'commander';
import * as console from 'console';
import TcpRequest from "./request";
const program = new Command();

program
    .name('Bencher')
    .description('Simple HTTP1 benchmark tool, that allows to test API endpoint on RPS and Bytes per second')
    .version('0.0.1')
    .option('-c, --connections <number>', 'number of concurrent connection that hit server', "10")
    .option('-w --workers <number>', 'number of parallel workers', '1')
    .option('-p --pipeline <number>', 'number of pipelined request', '1')
    .option('--debug <boolean>', 'enable debug log', false)
    .option('-d --duration<number>', 'duration of benchmark in seconds (default: "30")')
    .option('-r --responseTimeout<number>', 'number in seconds how long to wait for response')
    .option('-rq --requestTimeout<number>', 'number in seconds how long to wait for request being sent')
    .option('-t -timeout<number>', 'connection timeout in seconds')
    .arguments('<string>')
    .parse()

const DEBUG = program.opts().debug == 'false' ? false : true

let totalRequests = 0
let totalResponses = 0
let totalTimeouts = 0
let totalBytes = 0
let avgLatency = 0

let connectionsPool : TcpRequest[] = []

export function debug (type : 'err' | 'error' | 'warning' | 'info', ...message: string[]): void {
    if(DEBUG) {
        const timestamp = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false,
        });
        if(type == 'error' || type == 'err'){
            console.error('\x1b[31m', `[${timestamp}] ERROR -`, ...message, '\x1b[0m');
        }
        else if (type == 'info'){
            console.log('\x1b[34m', `[${timestamp}] INFO -`, ...message, '\x1b[0m');
        }
        else{
            console.log('\x1b[33m', `[${timestamp}] WARNING -`, ...message, '\x1b[0m');
        }
    }
};

export interface Opts {
    connections : number;
    workers : number;
    pipeline : number;
    duration : number
    url : URL;
    requestTimeout : number;
    responseTimeout : number;
    connectionTimeout : number,
}

let inputtedOpts = program.opts()
try {
    var opts : Opts = {
        requestTimeout: inputtedOpts.requestTimeout || 10, 
        responseTimeout: inputtedOpts.responseTimeout || 10,
        duration : inputtedOpts.dutation || 30,
        connections: inputtedOpts.connections, 
        pipeline: inputtedOpts.pipeline, 
        url: new URL(program.args[0]), 
        workers: inputtedOpts.workers,
        connectionTimeout : inputtedOpts.connectionTimeout || 5,
    }
}
catch (err){
    debug('err', err.message)
    throw err;
}

setTimeout(() => {
    for (let connection of connectionsPool){
        connection.destroySocket()
    }
    console.log(`RPS: ${(totalRequests/opts.duration).toFixed(2)}`)
    console.log(`Bytes per second: ${(totalBytes/opts.duration).toFixed(2)}`)
    console.log(`Total requests: ${totalRequests}\nTotal reposes ${totalResponses}\nTotal timeouts ${totalTimeouts}`)
    
    process.exit(200)
}, opts.duration*1000)


function sendRequest(request : TcpRequest){
    // let error = false
    // let timeout = false
    // await request.connectSocket().catch(() => {
    //     debug('err', `Failed to connect socket №${request.id}`)
    //     error = true    
    // })
    //
    // request.on('timeout', () => {
    //     timeout = true;
    // })
    //
    // if (!error){
    //     await request.sendRequest().catch((err) => {
    //         debug('error', err)
    //     })
    // }
    // request.destroySocket()
    
    request.connectSocket().then(async () => {
        await request.sendRequest()
    }).then(() => {
        request.destroySocket()
        sendRequest(request)
    }).catch((err) => {
        debug('error', err.message || `error occurred with socket ${request.id}`)
        request.destroySocket()
        sendRequest(request)
    })
    
    
}

for (let i = 0;i < opts.connections;i++){
    let request = new TcpRequest(opts, i + 1)
    connectionsPool.push(request)
    request.on('requestSent', () => {
        totalRequests++;
        
    })

    request.on('gotReponse', (data) => {
        totalResponses++;
        totalBytes+= data.length
    })

    request.on('timeout', (data) => {
        totalTimeouts++;
    })

    // request.on('destroyed', async () => {
    //     sendRequest(request)
    //    
    // })
    
    
    sendRequest(request)
}




    

    
    
    
    
    