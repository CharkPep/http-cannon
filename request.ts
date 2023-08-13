import {debug, Opts} from "./main";
import * as net from "net";
import {RequestBuilder} from "./requetsBuilder";

const EventEmitter = require('events')

export default class TcpRequest extends EventEmitter{
    private readonly _request = RequestBuilder.buildRequest(this.opts)
    private readonly _socket = new net.Socket()
    private _reponseTimeout : NodeJS.Timeout;
    constructor(private opts : Opts, public readonly id : number) {
        super()
        EventEmitter.setMaxListeners(Infinity)
        this._socket.on('data', (data) => {
            clearTimeout(this._reponseTimeout)
            this.emit('gotReponse', data)
            debug('info', `socket №${this.id} got response`)
        })

        this.on('requestSent', () => {
            this.on('destroyed', () => {
                clearTimeout(_reponseTimeout)
            })
            
            const _reponseTimeout = setTimeout(() => {
                this.emit('timeout')
                debug('warning', `socket №${this.id} response timeout`)
            }, this.opts.responseTimeout*1000)
        })
        
    }
    
    connectSocket() : Promise<void | string>{
        return new Promise((resolve, reject) => {
            // this.on('destroyed', () => {
            //     clearTimeout(connectionTimeout)
            //     reject()
            // })
            let start = Date.now()
            const connectionTimeout = setTimeout(() => {
                this.emit('timeout')
                debug('warning', `socket №${this.id} connection timeout`)
                clearTimeout(this._reponseTimeout)
                this.destroySocket()
                reject()
            }, this.opts.connectionTimeout*1000)
            
            this._socket.on('error', (err) => {
                this.emit('socketError', { error : err })
                clearTimeout(connectionTimeout)
                debug('err', err.message)
                reject()
            })
            this._socket.connect( Number(this.opts.url.port) || 80, this.opts.url.hostname || 'http://localhost', () => {
                clearTimeout(connectionTimeout)
                this.emit('connected', { time : Date.now() - start })
                debug('info', `socket №${this.id} connected`)
                resolve()
            })
            
        })
    }
    
    sendRequest() : Promise<void | string> {
        return new Promise((resolve, reject) => {
            let start = Date.now()
            this.on('destroyed', () => {
                clearTimeout(timeout)
                reject('socket destroyed, interacting request ')
            })
            
            const timeout = setTimeout(() => {
                this.emit('timeout')
                this.destroySocket()
                reject('timeout')
            }, this.opts.requestTimeout*1000)
            
            this._socket.write(this._request, () => {
                clearTimeout(timeout)
                debug('info', `socket №${this.id} send request`)
                this.emit('requestSent', { time : Date.now() - start })
            })
            
            this.on('gotReponse', () => {
                resolve()
            })
            
        })
    }
    
    destroySocket() {
        if (!this._socket.destroyed){
            this._socket.destroy()
            debug('info', `socket №${this.id} destroyed`)
            this.emit('destroyed')
        }
        else{
            debug('warning', `attempt to destroy already destroyed socket ${this.id}`)
            this.emit('destroyed', { time : Date.now()})
            
        }
        
    }
    
    
    
}