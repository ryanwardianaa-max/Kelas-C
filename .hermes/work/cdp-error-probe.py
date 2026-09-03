import json,time,urllib.request,websocket
wsurl=json.load(urllib.request.urlopen('http://127.0.0.1:9230/json'))[0]['webSocketDebuggerUrl']; ws=websocket.create_connection(wsurl); n=0
def c(m,p=None):
 global n;n+=1;ws.send(json.dumps({'id':n,'method':m,'params':p or {}}));
 while True:
  x=json.loads(ws.recv())
  if x.get('id')==n:return x
c('Page.enable');c('Runtime.enable');c('Page.navigate',{'url':'http://127.0.0.1:4371/tools/lab-metode-numerik/index.html'});time.sleep(2)
e="""(()=>{const p=document.querySelector('#akar');const f=p.querySelector('form');f.elements.f.value='sqrt(-1)';f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return {text:p.querySelector('.output').textContent,images:p.querySelectorAll('.output img').length,overflow:document.documentElement.scrollWidth-innerWidth}})()"""
r=c('Runtime.evaluate',{'expression':e,'returnByValue':True}); print(json.dumps(r,ensure_ascii=False));ws.close()
