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
def evaluate(expr):
 return call('Runtime.evaluate',{'expression':expr,'returnByValue':True})['result'].get('value')
call('Page.navigate',{'url':'http://127.0.0.1:4371/tools/lab-metode-numerik/index.html'}); time.sleep(3)
setup="""(()=>Object.fromEntries([...document.querySelectorAll('[role=tabpanel]')].map(p=>[p.id,[...p.querySelector('select[name=method]').options].map(o=>o.value)])))()"""
methods=evaluate(setup); results=[]
for panel,names in methods.items():
 for name in names:
  expr=json.dumps(name); pid=json.dumps(panel)
  code=f"""(()=>{{const p=document.getElementById({pid}),f=p.querySelector('form'),s=f.elements.method;s.value={expr};s.dispatchEvent(new Event('change'));f.requestSubmit();return JSON.stringify({{panel:{pid},method:{expr},result:p.querySelector('.result strong')?.textContent||null,error:p.querySelector('.error')?.textContent||null,rows:p.querySelectorAll('tbody tr').length,svg:p.querySelectorAll('svg').length}})}})()"""
  results.append(json.loads(evaluate(code)))
print(json.dumps(results,ensure_ascii=False,indent=2))
failed=[r for r in results if r['error'] or not r['result']]
print('TOTAL',len(results),'FAILED',len(failed),'WITH_GRAPH',sum(r['svg']>0 for r in results))
ws.close()
