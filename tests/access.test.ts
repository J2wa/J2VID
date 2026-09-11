import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import express from 'express';
import { accessApp, requireSession } from '../lib/access.js';

// Redis REST test double: never used by production. Exercises actual HTTP routes,
// session cookies, role projection, revocation and fail-closed behavior.
test('login, role boundaries, presence, AI protection, and logout', async () => {
  const originalFetch = globalThis.fetch;
  const saved = { ...process.env };
  const userPassword = randomBytes(24).toString('hex');
  const adminPassword = randomBytes(24).toString('hex');
  Object.assign(process.env, { VERCEL: '1', VERCEL_ENV: 'test', USER_PASSWORD: userPassword,
    ADMIN_PASSWORD: adminPassword, UPSTASH_REDIS_REST_URL: 'https://redis.test', UPSTASH_REDIS_REST_TOKEN: 'synthetic-test-token' });
  const values = new Map<string, any>();
  const expiries = new Map<string, number>();
  let outage = false;
  globalThis.fetch = async (input, init) => {
    if (String(input) !== 'https://redis.test') return originalFetch(input, init);
    if (outage) return new Response('unavailable', { status: 503 });
    const [op, k, ...args] = JSON.parse(String(init?.body));
    for (const [name, until] of expiries) if (until <= Date.now()) values.delete(name);
    let result: any = null;
    const sorted = () => [...(values.get(k) || new Map()).entries()].sort((a,b)=>Number(a[1])-Number(b[1]));
    if (op === 'GET') result = values.get(k) ?? null;
    else if (op === 'SET') { values.set(k,args[0]); expiries.set(k,Date.now()+Number(args[2])*1000); result='OK'; }
    else if (op === 'DEL') result = Number(values.delete(k));
    else if (op === 'EXPIRE') { expiries.set(k, Date.now()+Number(args[0])*1000); result=1; }
    else if (op === 'HSET') { const row=values.get(k)||{}; for(let i=0;i<args.length;i+=2)row[args[i]]=String(args[i+1]);values.set(k,row);result=1; }
    else if (op === 'HGET') result=values.get(k)?.[args[0]] ?? null;
    else if (op === 'HGETALL') result=Object.entries(values.get(k)||{}).flat();
    else if (op === 'HINCRBY') {const row=values.get(k)||{}; result=Number(row[args[0]]||0)+Number(args[1]);row[args[0]]=String(result); values.set(k,row);}
    else if (op === 'ZADD') { const set=values.get(k)||new Map();set.set(args[1],Number(args[0]));values.set(k,set);result=1; }
    else if (op === 'ZREM') result=Number(values.get(k)?.delete(args[0])||false);
    else if (op === 'ZREMRANGEBYSCORE') {const set=values.get(k);for(const [item,score] of set||[])if(score<=Number(args[1]))set.delete(item);result=0;}
    else if (op === 'ZREMRANGEBYRANK') {const items=sorted();const end=Number(args[1])<0?items.length+Number(args[1]):Number(args[1]);for(let i=Number(args[0]);i<=end;i++)values.get(k)?.delete(items[i]?.[0]);result=0;}
    else if (op === 'ZCOUNT') result=sorted().filter(([,score])=>Number(score)>=Number(args[0])).length;
    else if (op === 'ZREVRANGEBYSCORE') result=sorted().reverse().filter(([,score])=>Number(score)>=Number(args[1])).slice(Number(args[3]),Number(args[3])+Number(args[4])).map(([id])=>id);
    else if (op === 'EVAL') {const rateKey=args[1];result=Number(values.get(rateKey)||0)+1;values.set(rateKey,result);}
    else throw new Error(`Unsupported test command: ${op}`);
    return Response.json({result});
  };
  const app=express();
  app.use('/api/access',accessApp);
  app.post('/api/annotate-video',requireSession,(_req,res)=>res.json({ok:true}));
  const server=app.listen(0,'127.0.0.1');
  await once(server,'listening');
  const origin=`http://127.0.0.1:${(server.address() as any).port}`;
  const request=(action: string, body?: any, cookie='', ip='203.0.113.10', extraHeaders: Record<string,string>={})=>originalFetch(`${origin}/api/access${body ? '' : `?action=${action}`}`, {
    method:body?'POST':'GET', headers:{ 'Content-Type':'application/json','X-J2-Request':'1',Origin:origin,Cookie:cookie,'x-vercel-forwarded-for':ip,...extraHeaders },
    ...(body?{body:JSON.stringify({...body,action})}:{}),
  });
  try {
    assert.equal((await request('dashboard')).status,401);
    assert.equal((await request('login',{username:'u',password:'wrong'})).status,401);
    assert.equal((await request('login',{username:'u',password:userPassword},'',undefined,{Origin:'https://other.test'})).status,403);
    const userLogin=await request('login',{username:'admin',password:userPassword,role:'admin'});
    assert.equal(userLogin.status,200);
    const userCookie=userLogin.headers.get('set-cookie')!.split(';')[0];
    assert.match(userLogin.headers.get('set-cookie')!,/HttpOnly/);
    assert.match(userLogin.headers.get('set-cookie')!,/Secure/);
    assert.match(userLogin.headers.get('set-cookie')!,/SameSite=Strict/);
    assert.equal((await userLogin.json()).user.role,'user');
    const adminLogin=await request('login',{username:'Owner',password:adminPassword},'','198.51.100.24');
    assert.equal(adminLogin.status,200);
    const adminCookie=adminLogin.headers.get('set-cookie')!.split(';')[0];
    assert.equal((await adminLogin.json()).user.role,'admin');
    await request('heartbeat',{activity:'editing',ip:'fake'},userCookie);
    const publicResponse=await request('dashboard',undefined,userCookie);
    assert.equal(publicResponse.headers.get('cache-control'),'no-store');
    const publicData=await publicResponse.json();
    assert.equal(publicData.online,2);
    assert.equal(publicData.ownIp,'203.0.113.10');
    assert.equal(publicData.events.length,0);
    const forged=await (await request('dashboard&admin=true&role=admin',undefined,userCookie)).json();
    assert.equal(forged.admin,false);
    assert.equal(forged.events.length,0);
    for(const row of publicData.users) { assert.equal(row.ip,undefined);assert.equal(row.username,undefined);assert.equal(row.role,undefined); }
    assert.ok(!JSON.stringify(publicData).includes('198.51.100.24'));
    const adminData=await (await request('dashboard',undefined,adminCookie,'198.51.100.24')).json();
    assert.equal(adminData.admin,true);assert.equal(adminData.users.length,2);
    assert.ok(adminData.users.some((row:any)=>row.ip==='203.0.113.10'&&row.activity==='Editing an annotation'));
    assert.ok(adminData.events.length>=2);
    const ai=(cookie:string,headers={})=>originalFetch(`${origin}/api/annotate-video`,{method:'POST',headers:{Cookie:cookie,Origin:origin,'X-J2-Request':'1','x-vercel-forwarded-for':'203.0.113.10',...headers}});
    assert.equal((await ai('')).status,401);
    assert.equal((await ai(userCookie,{'X-J2-Request':''})).status,403);
    assert.equal((await ai(userCookie)).status,200);
    const after=await (await request('dashboard',undefined,userCookie)).json();
    assert.equal(after.users.find((row:any)=>row.isYou).aiRequests,1);
    const adminId=(await (await request('me',undefined,adminCookie)).json()).user.id;
    const old=Date.now()-121_000;
    values.get('j2vid:test:seen').set(adminId,old);
    values.get(`j2vid:test:presence:${adminId}`).lastSeen=String(old);
    const idle=await (await request('dashboard',undefined,userCookie)).json();
    assert.equal(idle.online,1);
    assert.equal(idle.users.length,1);
    await request('heartbeat',{activity:'dashboard'},adminCookie,'198.51.100.24');
    assert.ok([...expiries.keys()].some(k=>k.includes('presence:')));
    // A new module/client instance reads the same store, not process-local sessions.
    assert.equal((await request('me',undefined,userCookie)).status,200);
    process.env.USER_PASSWORD='changed-for-test';
    assert.equal((await ai(userCookie)).status,401);
    process.env.USER_PASSWORD=userPassword;
    assert.equal((await request('logout',{},userCookie)).status,200);
    assert.equal((await ai(userCookie)).status,401);
    assert.equal((await request('me',undefined,userCookie)).status,401);
    const remaining=await (await request('dashboard',undefined,adminCookie)).json();
    assert.equal(remaining.online,1);
    outage=true;
    assert.equal((await request('dashboard',undefined,adminCookie)).status,503);
    assert.equal((await ai(adminCookie)).status,503);
    outage=false;
    for(let i=0;i<21;i++) await request('login',{username:'x',password:'wrong'},'','192.0.2.55');
    assert.equal((await request('login',{username:'x',password:userPassword},'','192.0.2.55')).status,429);
    delete process.env.ADMIN_PASSWORD;
    assert.equal((await request('login',{username:'u',password:userPassword})).status,503);
    assert.equal((await ai(adminCookie)).status,503);
  } finally {
    server.closeAllConnections(); await new Promise<void>(resolve=>server.close(()=>resolve()));
    globalThis.fetch=originalFetch;
    for(const name of Object.keys(process.env)) if(!(name in saved)) delete process.env[name];
    Object.assign(process.env,saved);
  }
});
