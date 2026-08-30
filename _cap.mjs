import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
const DB='postgres://localhost/solvex_e2e';
execSync(`psql ${DB} -tAc "delete from rate_limit_bucket where bucket_key like 'login:%'"`);
const OUT='docs/teacher/screenshots/final';
const B=await chromium.launch();
const p=await (await B.newContext({viewport:{width:1440,height:1100}, colorScheme:'dark'})).newPage();
async function login(){
  for(let a=0;a<5;a++){
    await p.goto('http://localhost:3000/login',{waitUntil:'domcontentloaded'});
    await p.waitForSelector('input[type="password"]',{timeout:60000});
    const i=await p.$$('input'); await i[0].fill('aigul'); await i[1].fill('solvex-demo-2026');
    let st=0; const seen=r=>{if(r.url().includes('/api/auth/login')) st=r.status();};
    p.on('response',seen);
    await p.getByRole('button',{name:/Кіру|Войти/}).click(); await p.waitForTimeout(9000);
    p.off('response',seen);
    console.log(`  attempt ${a+1}: api=${st} url=${p.url()}`);
    if(!p.url().includes('/login')) return true;
    execSync(`psql ${DB} -tAc "delete from rate_limit_bucket where bucket_key like 'login:%'"`);
  } return false;
}
if(!await login()){ console.log('FATAL login'); await B.close(); process.exit(1); }
await p.goto('http://localhost:3000/teacher?class=grade-9a',{waitUntil:'networkidle'});
await p.waitForTimeout(3000);
await p.getByRole('button',{name:'Русский'}).click().catch(()=>{}); await p.waitForTimeout(2500);

for (const [name,w] of [['assessments-review',1440],['assessments-review',375]]) {
  await p.setViewportSize({width:w,height:1100});
  await p.goto('http://localhost:3000/teacher/assessments?class=grade-9a',{waitUntil:'networkidle'});
  await p.waitForTimeout(2500);
  const of=await p.evaluate(()=>{const s=window.scrollX;window.scrollTo(9999,0);const a=window.scrollX;window.scrollTo(s,0);return a;});
  await p.screenshot({path:`${OUT}/${name}-${w}.png`,fullPage:true});
  console.log(`${name} @${w} overflow=${of}`);
}
// the panel with the action area
await p.setViewportSize({width:1440,height:1100});
await p.goto('http://localhost:3000/teacher/assessments?class=grade-9a',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
await p.getByRole('button',{name:/Читать/}).first().click();
await p.waitForTimeout(3500);
await p.screenshot({path:`${OUT}/review-panel-action-1440.png`});
console.log('panel captured, dialog=', await p.$eval('dialog',e=>e.open));
// overview
await p.keyboard.press('Escape'); await p.waitForTimeout(500);
await p.goto('http://localhost:3000/teacher?class=grade-9a',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
await p.screenshot({path:`${OUT}/overview-1440.png`,fullPage:true});
console.log('overview captured');
await B.close();
