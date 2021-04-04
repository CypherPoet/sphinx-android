import { userStore } from "../store/user"
import { performTorRequest, RequestMethod as RNTORRequestMethod } from "./tor-utils"

export default class API {
  constructor(url:string, tokenKey?:string, tokenValue?:string, resetIPCallback?:Function) {
    this.get = addMethod('GET',url)
    this.post = addMethod('POST',url)
    this.put = addMethod('PUT',url)
    this.del = addMethod('DELETE',url)
    this.upload = addMethod('UPLOAD',url)
    if(tokenKey) this.tokenKey = tokenKey
    if(tokenValue) this.tokenValue = tokenValue
    if(resetIPCallback) this.resetIPCallback = resetIPCallback
  }
  tokenKey: string
  tokenValue: string
  get: Function
  post: Function
  put: Function
  del: Function
  upload: Function
  resetIPCallback: Function
}

const TIMEOUT = 20000

function addMethod(methodName: string, rootUrl: string): Function {
  return async function (url: string, data: any, encoding?: string) {
    data = data || {}

    try {
      const skip = isPublic(rootUrl + url)

      if (this.tokenKey && !this.tokenValue && !skip) {
        // throw new Error("no token")
        return
      }

      const headers: { [key: string]: string } = {}

      if(this.tokenKey && this.tokenValue) {
        headers[this.tokenKey] = this.tokenValue
      }

      const opts: { [key: string]: any } = { mode: 'cors' }

      if (methodName === 'POST' || methodName === 'PUT') {
        if (encoding) {
          headers['Content-Type'] = encoding
          if(encoding==='application/x-www-form-urlencoded') {
            opts.body = makeSearchParams(data)
          } else {
            opts.body = data
          }
        } else {
          headers['Content-Type'] = 'application/json'
          opts.body = JSON.stringify(data)
        }
      }
      if (methodName === 'UPLOAD') {
        headers['Content-Type'] = 'multipart/form-data'
        opts.body = data
        console.log("UPLOAD DATA:",data)
      }
      opts.headers = new Headers(headers)

      opts.method = methodName === 'UPLOAD' ? 'POST' : methodName
      if (methodName === 'BLOB') opts.method = 'GET'

      // console.log('=>',opts.method,rootUrl + url)

      const result = await fetchTimeout(rootUrl + url, TIMEOUT, opts)

      if (!result.ok) {
        console.log('Not OK!',result.status,url)
        return
      }

      let resultPayload
      if (methodName === 'BLOB') {
        resultPayload = await result.blob()
      } else {
        resultPayload = await result.json()
        if (resultPayload.token) {
          // localStorage.setItem(tokenName, res.token)
        }
        if (resultPayload.error) {
          console.warn(resultPayload.error)
          return
        }
        if (resultPayload.status && resultPayload.status==='ok') { // invite server
          return resultPayload.object
        }
        if (resultPayload.success && resultPayload.response) { // relay
          return resultPayload.response
        }
        return resultPayload
      }
    } catch (e) { // 20 is an "abort" i guess
      console.warn(e)
      const isWebAbort = e.code===20
      const isRNAbort = e.message==='Aborted'
      if(isWebAbort || isRNAbort) reportTimeout(this.resetIPCallback)
    }
  }
}

let timeoutCount = 0
function reportTimeout(resetIPCallback:Function){
  timeoutCount += 1
  if(timeoutCount===3) {
    if(resetIPCallback) resetIPCallback()
  }
}

function isPublic(url: string) {
  return url.endsWith('login')
}

async function getToken(name: string) {
  if (!name) return ""
  // return localStorage.getItem(name)
}

function makeSearchParams(params){
  return Object.keys(params).map((key) => {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&')
}

const fetchTimeout = (url, timeoutMS, options = {}) => {
  const controller = new AbortController();

  let promise;

  if (userStore.isTorEnabled) {
    promise = performTorRequest({
      url,
      method: options.method as RNTORRequestMethod,
      headers: options.headers,
      trustSSL: true,
    })
  } else {
    promise = fetch(url, { signal: controller.signal, ...options });
  }

  const timeout = setTimeout(() => controller.abort(), timeoutMS);
  return promise.finally(() => clearTimeout(timeout));
};
