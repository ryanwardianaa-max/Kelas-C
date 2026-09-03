import json, time, urllib.request, websocket

tabs=json.load(urllib.request.urlopen('http://127.0.0.1:9229/json'))
ws=websocket.create_connection(tabs[0]['webSocketDebuggerUrl'])
i=0
def call(method,params=None):
 global i
 i+=1; ws.send(json.dumps({'id':i,'method':method,'params':params or {}}))
 while True:
  r=json.loads(ws.recv())
  if r.get('id')==i: return r.get('result',{})
call('Page.enable'); call('Runtime.enable'); call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
call('Page.navigate',{'url':'http://127.0.0.1:4371/tools/lab-metode-numerik/index.html'})
time.sleep(3)
expr="""(()=>{document.querySelector('#tab-akar').click();document.querySelector('#akar form').requestSubmit();const result=document.querySelector('#akar .result strong')?.textContent;return JSON.stringify({result,rows:document.querySelectorAll('#akar tbody tr').length,svg:document.querySelectorAll('#akar svg').length,tabs:document.querySelectorAll('[role=tab]').length,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,error:document.querySelector('#akar .error')?.textContent||null})})()"""
r=call('Runtime.evaluate',{'expression':expr,'returnByValue':True})
print(r['result']['value']); ws.close()
