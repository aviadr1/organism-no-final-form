import { Game, ARENA, COSTS, MUTATIONS, WEAPONS } from './engine.js';
import { Soundscape } from './audio.js';
import { createFleshRenderer } from './flesh.js';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
const game=new Game();
const soundscape=new Soundscape();
const keys=new Set();let auto=true,mouse={x:0,y:0,down:false,active:false},touch={x:0,y:0},W=0,H=0,DPR=1,scale=1,origin={x:0,y:0},clock=0,last=0,accumulator=0,particles=[],toastUntil=0,bannerUntil=0,shake=0,lastPhase='',hudClock=0;
const rand=(a,b)=>a+Math.random()*(b-a),TAU=Math.PI*2;
const foodColors=['#d1f198','#a1dacb','#edc389'];
const scenery=Array.from({length:120},()=>({x:rand(0,1500),y:rand(0,1000),r:rand(1,5),seed:rand(0,TAU)}));
const plants=Array.from({length:33},(_,i)=>{const a=i/33*TAU;return{x:750+Math.cos(a)*rand(610,740),y:500+Math.sin(a)*rand(390,480),r:rand(10,24),seed:rand(0,TAU)};});
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,2);canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';const mobile=W<=700,top=mobile?175:H<=780?130:160,bottom=mobile?145:H<=780?128:155,left=mobile?14:W<=950?195:255;scale=Math.min((W-left-25)/ARENA.width,(H-top-bottom)/(ARENA.height*.72));scale=Math.max(.14,scale);origin={x:left+(W-left-25-ARENA.width*scale)/2,y:top+(H-top-bottom-ARENA.height*.72*scale)/2};}
window.addEventListener('resize',resize);resize();
function screen(x,y,z=0){return{x:origin.x+x*scale,y:origin.y+y*scale*.72-z*scale};}
function unscreen(x,y){return{x:(x-origin.x)/scale,y:(y-origin.y)/(scale*.72)};}
function path(points,stroke,width=1,fill=null){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(fill){ctx.closePath();ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}}
function ellipse(x,y,rx,ry,fill,stroke=null,width=1){ctx.beginPath();ctx.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function worldCircle(x,y,r,fill,stroke=null,width=1){const p=screen(x,y);ellipse(p.x,p.y,r*scale,r*scale*.72,fill,stroke,width);}
function glow(x,y,r,color){const p=screen(x,y);const gradient=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*scale);gradient.addColorStop(0,color);gradient.addColorStop(1,'transparent');ellipse(p.x,p.y,r*scale,r*scale*.78,gradient);}
function blob(x,y,r,colors,seed=0,z=0,speed=1){const p=screen(x,y,z),R=r*scale;ctx.beginPath();for(let i=0;i<=48;i++){const a=i/48*TAU,w=1+Math.sin(a*5+seed+clock*speed)*.065+Math.sin(a*3-clock*.7+seed)*.075;const px=p.x+Math.cos(a)*R*w,py=p.y+Math.sin(a)*R*w*.78;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();const grad=ctx.createRadialGradient(p.x-R*.3,p.y-R*.35,0,p.x+R*.1,p.y+R*.2,R*1.15);grad.addColorStop(0,colors[0]);grad.addColorStop(.5,colors[1]);grad.addColorStop(1,colors[2]);ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle=colors[3]||colors[0]+'55';ctx.lineWidth=Math.max(.6,scale);ctx.stroke();ellipse(p.x-R*.25,p.y-R*.3,R*.22,R*.08,colors[0]+'44');}
function tendril(start,end,width,color,bend=0){const a=screen(start.x,start.y,8),b=screen(end.x,end.y,4),dx=b.x-a.x,dy=b.y-a.y;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(a.x+dx*.3-dy*bend,a.y+dy*.3+dx*bend,a.x+dx*.7+dy*bend,b.y-dy*.25-dx*bend,b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=Math.max(.5,width*scale);ctx.lineCap='round';ctx.stroke();}
function addParticles(x,y,color,count=10,power=70){for(let i=0;i<count;i++)particles.push({x,y,z:rand(0,8),vx:rand(-power,power),vy:rand(-power,power),vz:rand(8,40),life:rand(.25,.8),max:.8,r:rand(1,3),color});if(particles.length>500)particles.splice(0,particles.length-500);}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');toastUntil=clock+3.8;}
function banner(kicker,text){$('banner-kicker').textContent=kicker;$('banner-text').textContent=text;$('wave-banner').classList.add('visible');bannerUntil=clock+3;}
function eventEffects(){for(const e of game.events){soundscape.effect(e.type,e);fleshRenderer.event(e);switch(e.type){
 case 'message':toast(e.text);break;
 case 'wave':banner(e.wave===6?'THE MANY-MOUTHED MOTHER APPROACHES':'FOREIGN TISSUE DETECTED',`Wave ${String(e.wave).padStart(2,'0')}`);break;
 case 'clear':banner('THE FLOOR IS STILL BREATHING',e.wave===6?'The garden is yours.':'Feed. Recover. Prepare.');break;
 case 'death':addParticles(e.x,e.y,'#a8536a',20,120);addParticles(e.x,e.y,'#caba86',9,70);break;
 case 'impact':addParticles(e.x,e.y,e.kind==='acid'?'#bfd17f':'#bc7584',6,55);break;
 case 'eat':addParticles(e.x,e.y,'#b7c483',4,30);break;
 case 'shot':addParticles(e.x,e.y,e.weapon==='bone'?'#d5c5a5':'#b99a8c',3,40);break;
 case 'bud':addParticles(e.x,e.y,'#c49293',25,90);break;
 case 'absorb':addParticles(e.x,e.y,'#c49293',14,50);break;
 case 'hurt':shake=4;break;
 case 'nesthurt':shake=3;break;
 case 'allydeath':addParticles(e.x,e.y,'#b87386',18,70);break;
 case 'end':showEnd(e);break;
 }}game.events=[];}
function terrain(){
 const bg=ctx.createRadialGradient(W*.59,H*.52,30,W*.59,H*.52,Math.max(W,H)*.7);bg.addColorStop(0,'#292329');bg.addColorStop(.6,'#181b20');bg.addColorStop(1,'#101318');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 // A shallow, oblique petri-dish floor. All entities still move on a flat plane.
 worldCircle(750,500,665,'#1b2b211c','#9cbb7b13');worldCircle(750,500,650,null,'#9cbb7b0b');
 ctx.save();ctx.globalAlpha=.35;
 for(let y=0;y<=1000;y+=70)for(let x=0;x<=1500;x+=80){const xx=x+(Math.round(y/70)%2)*40;if(Math.hypot((xx-750)/1.1,y-500)<655){const p=screen(xx,y);path([{x:p.x-2,y:p.y},{x:p.x+2,y:p.y}],'#75907033',.6);path([{x:p.x,y:p.y-2},{x:p.x,y:p.y+2}],'#75907033',.6);}}
 ctx.restore();
 const corners=[[0,0,1,1],[1500,0,-1,1],[0,1000,1,-1],[1500,1000,-1,-1]];
 for(const [x,y,dx,dy] of corners)path([screen(x+dx*35,y),screen(x,y),screen(x,y+dy*35)],'#69875c66',1);
 for(const s of scenery){const p=screen(s.x,s.y);ellipse(p.x,p.y,s.r*scale,s.r*.6*scale,'#66805713');if(s.r>4){ctx.globalAlpha=.25+Math.sin(clock*.5+s.seed)*.12;ellipse(p.x+Math.sin(clock*.25+s.seed)*8,p.y-8,1,1,'#d9eb9c');ctx.globalAlpha=1;}}
 for(const s of plants){worldCircle(s.x,s.y,s.r*1.7,'#00000015');for(let i=0;i<4;i++){const a=s.seed+i*1.8;const end={x:s.x+Math.cos(a)*s.r*1.4,y:s.y+Math.sin(a)*s.r*1.4};tendril(s,end,2,'#956c7e44',.35);blob(end.x,end.y,4,['#87656c','#4c343f','#251e2b'],i,3,.4);}blob(s.x,s.y,s.r,['#6b4d57','#392c39','#201b27'],s.seed,0,.3);}
}
const fleshRenderer=createFleshRenderer({ctx,screen,ellipse,blob,worldCircle,glow,path,game,time:()=>clock,scale:()=>scale});
function render(dt){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.save();if(shake>0){ctx.translate(rand(-shake,shake),rand(-shake,shake));shake=Math.max(0,shake-dt*16);}terrain();fleshRenderer.ground(dt);
 for(const f of game.food)fleshRenderer.food(f);
 fleshRenderer.nest();
 const entities=[...game.enemies.map(e=>({y:e.y,draw:()=>fleshRenderer.enemy(e)})),...game.allies.map(a=>({y:a.y,draw:()=>fleshRenderer.ally(a)})),{y:game.player.y,draw:()=>fleshRenderer.organism()}];entities.sort((a,b)=>a.y-b.y);entities.forEach(e=>e.draw());
 fleshRenderer.weapons();
 for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=80*dt;const s=screen(p.x,p.y,Math.max(0,p.z));ctx.globalAlpha=Math.max(0,p.life/p.max);ellipse(s.x,s.y,p.r*scale,p.r*scale,p.color);}ctx.globalAlpha=1;particles=particles.filter(p=>p.life>0);
 if(mouse.active&&game.phase==='playing'){const s={x:mouse.x,y:mouse.y};ellipse(s.x,s.y,7,7,null,'#bdcf9680',1);path([{x:s.x-11,y:s.y},{x:s.x-5,y:s.y}],'#bdcf9680');path([{x:s.x+5,y:s.y},{x:s.x+11,y:s.y}],'#bdcf9680');}
 ctx.restore();
}
function setPanel(id){$('overlay').hidden=!id;$('overlay').style.display=id?'flex':'none';for(const name of ['start','pause','mutation','end'])$(name+'-panel').hidden=name!==id;}
function syncPhase(){if(lastPhase===game.phase)return;lastPhase=game.phase;if(game.phase==='playing'){setPanel(null);$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');canvas.focus({preventScroll:true});}else if(game.phase==='paused'){setPanel('pause');$('pause').textContent='▷';$('pause').setAttribute('aria-label','Resume game');$('resume').focus();}else if(game.phase==='mutation'){
 setPanel('mutation');$('choices').replaceChildren();for(const m of game.choices){const btn=document.createElement('button');btn.className='choice';btn.innerHTML=`<span class="glyph">${m.glyph}</span><b>${m.name}</b><p>${m.description}</p><small>${m.tag} ↗</small>`;btn.onclick=()=>{game.mutate(m.id);keys.clear();syncPhase();updateHUD();};$('choices').append(btn);}$('choices').firstElementChild.focus();
 }else if(game.phase==='ready')setPanel('start');}
function updateHUD(){const p=game.player;$('mass').innerHTML=`${Math.max(0,Math.floor(p.mass))}<span> g</span>`;$('massbar').style.width=Math.min(100,p.mass/150*100)+'%';$('nest').innerHTML=`${Math.max(0,Math.ceil(game.nest.hp))}<span> %</span>`;$('nestbar').style.width=Math.max(0,game.nest.hp)+'%';$('nestbar').style.background=game.nest.hp<35?'#e99683':'#b1c9b4';$('wave').innerHTML=`${String(Math.max(1,game.wave)).padStart(2,'0')}<span> / 06</span>`;$('waveinfo').textContent=game.phase==='ready'?'Awaiting emergence':game.intermission>0?`Next phase in ${Math.ceil(game.intermission)}s`:`${game.enemies.length+game.spawnQueue} hostiles remaining`;
 $('level').textContent=`LV. ${String(game.level).padStart(2,'0')}`;$('xpbar').style.width=game.xp/game.xpGoal*100+'%';$('xptext').textContent=`${Math.floor(game.xp)} / ${game.xpGoal} nutrients to mutate`;
 const counts=new Map();for(const id of game.mutations)counts.set(id,(counts.get(id)||0)+1);$('mutations').innerHTML=counts.size?[...counts].map(([id,n])=>`<span class="mutation-tag">${MUTATIONS.find(m=>m.id===id).name}${n>1?' ×'+n:''}</span>`).join(''):'<span class="empty-mutation">No adaptations. Yet.</span>';
 $('timer').textContent=`${String(Math.floor(game.time/60)).padStart(2,'0')}:${String(Math.floor(game.time%60)).padStart(2,'0')}`;
 $('statusline').textContent=p.mass<20?'LOW BIOMASS · FEED TO RECOVER':game.nest.hp<35?'NEST CRITICAL · DEFEND THE CENTER':`${game.allies.length} OFFSPRING · SPECIMEN VIABLE`;
 $('objective').textContent=game.nest.hp<35?'The nest is failing. Defend the center.':game.wave===6?'Kill the broodmother. Finish the invasion.':'Survive six waves. Leave nothing uneaten.';
 const hasShield=game.allies.some(a=>a.kind==='shield');$('dronecost').textContent=hasShield?'Free · detach a shield':'24g · hunts nearby';for(const kind of ['shield','drone','tower'])$(kind).disabled=game.phase!=='playing'||(kind==='drone'&&hasShield?false:!game.canSpend(COSTS[kind])||game.allies.length>=10);$('recall').disabled=game.phase!=='playing'||!game.allies.length;
}
function showEnd(e){setPanel('end');$('end-kicker').textContent=e.won?'CONTAINMENT FAILED. YOU WON.':'SPECIMEN LOST';$('end-title').innerHTML=e.won?'The garden<br>is yours.':'Life finds<br>another way.';$('end-copy').textContent=e.won?'Six waves consumed. One organism became an ecosystem.':e.reason==='nest'?'The mother nest fell. Root defenses around it, then venture out to feed.':'Your body ran out of biomass. Reabsorb offspring or feed before you become too small.';$('end-stats').innerHTML=`<div><b>${game.kills}</b><span>CONSUMED FOES</span></div><div><b>${Math.floor(game.peak)}g</b><span>PEAK MASS</span></div><div><b>${game.level-1}</b><span>MUTATIONS</span></div>`;let best=game.kills;try{best=Math.max(Number(localStorage.getItem('organism-best')||0),game.kills);localStorage.setItem('organism-best',String(best));}catch{}$('best').textContent=`Personal best: ${best} kills · Adaptations reset each run`;$('restart').focus();}
function start(){soundscape.unlock().catch(()=>toast('Audio could not start. Use the sound controls to retry.'));keys.clear();mouse.down=false;game.start();syncPhase();toast('1–4 change living weapons. Feed on the remains.');}
function restart(){game.reset();fleshRenderer.reset();particles=[];lastPhase='';mouse.down=false;keys.clear();touch={x:0,y:0};start();selectWeapon('acid');updateHUD();}
$('start').onclick=start;$('restart').onclick=restart;$('restart-pause').onclick=restart;$('pause').onclick=()=>{game.pause();keys.clear();mouse.down=false;syncPhase();};$('resume').onclick=()=>{game.pause();syncPhase();};
$('sound').onclick=()=>{const panel=$('audio-panel');panel.hidden=!panel.hidden;$('sound').setAttribute('aria-expanded',String(!panel.hidden));soundscape.unlock().catch(()=>toast('Audio is unavailable in this browser.'));};
$('music-volume').oninput=e=>{soundscape.setVolume('music',Number(e.target.value)/100);$('music-value').textContent=e.target.value+'%';};
$('effects-volume').oninput=e=>{soundscape.setVolume('effects',Number(e.target.value)/100);$('effects-value').textContent=e.target.value+'%';};
$('mute-all').onclick=()=>{soundscape.setMuted(!soundscape.muted);$('mute-all').textContent=soundscape.muted?'Enable all audio':'Mute all audio';$('sound').classList.toggle('muted',soundscape.muted);};
function selectWeapon(id){if(!game.setWeapon(id))return;const weapon=WEAPONS.find(w=>w.id===id);$('weapon-description').textContent=weapon.description;for(const b of document.querySelectorAll('[data-weapon]')){const active=b.dataset.weapon===id;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));}soundscape.effect('absorb');}
for(const [i,w] of WEAPONS.entries()){const b=document.createElement('button');b.className='weapon'+(i===0?' selected':'');b.dataset.weapon=w.id;b.setAttribute('aria-pressed',String(i===0));b.title=w.description;b.innerHTML=`<kbd>${i+1}</kbd><span class="weapon-glyph">${w.glyph}</span><span><b>${w.name}</b><small>${w.cost}g / volley</small></span>`;b.onclick=()=>selectWeapon(w.id);$('weapons').append(b);}
$('weapon-description').textContent=WEAPONS[0].description;
function toggleAuto(){auto=!auto;$('autofire').classList.toggle('active',auto);$('autofire').setAttribute('aria-pressed',String(auto));}
$('autofire').onclick=toggleAuto;
for(const button of document.querySelectorAll('[data-action]'))button.onclick=()=>{game.action(button.dataset.action);updateHUD();canvas.focus({preventScroll:true});};
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();if(e.repeat)return;keys.add(key);if(key==='escape'){game.pause();mouse.down=false;keys.clear();syncPhase();}if(game.phase==='playing'){const action={q:'shield',e:'drone',r:'tower',x:'recall'}[key];if(action)game.action(action);if(key==='f')toggleAuto();if(/^[1-4]$/.test(key))selectWeapon(WEAPONS[Number(key)-1].id);}else if(game.phase==='ready'&&key==='enter'){e.preventDefault();start();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();mouse.down=false;touch={x:0,y:0};if(game.phase==='playing')game.pause();syncPhase();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.phase==='playing'){game.pause();keys.clear();mouse.down=false;syncPhase();}});
canvas.addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=e.pointerType==='mouse';});
canvas.addEventListener('pointerdown',e=>{if(game.phase!=='playing')return;mouse.x=e.clientX;mouse.y=e.clientY;mouse.down=true;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointerup',()=>mouse.down=false);canvas.addEventListener('pointercancel',()=>mouse.down=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());
const joystick=$('joystick');let joystickId=null;
function moveStick(e){const r=joystick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,d=Math.max(32,Math.hypot(dx,dy));touch={x:dx/d,y:dy/d};joystick.querySelector('i').style.transform=`translate(${touch.x*27}px,${touch.y*27}px)`;}
joystick.addEventListener('pointerdown',e=>{e.preventDefault();joystickId=e.pointerId;joystick.setPointerCapture(e.pointerId);moveStick(e);});joystick.addEventListener('pointermove',e=>{if(e.pointerId===joystickId)moveStick(e);});function releaseStick(){joystickId=null;touch={x:0,y:0};joystick.querySelector('i').style.transform='';}joystick.addEventListener('pointerup',releaseStick);joystick.addEventListener('pointercancel',releaseStick);
function frame(now){const dt=Math.min(.05,(now-last)/1000||.016);last=now;clock+=dt;accumulator+=dt;while(accumulator>=1/60){if(game.phase==='playing'){game.tick(1/60,{x:(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+touch.x,y:(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+touch.y,fire:mouse.down||keys.has(' '),aim:mouse.active||mouse.down?unscreen(mouse.x,mouse.y):{x:game.player.x+Math.cos(game.player.angle)*200,y:game.player.y+Math.sin(game.player.angle)*200},auto});eventEffects();}accumulator-=1/60;}
 soundscape.update(game);syncPhase();if(clock>toastUntil)$('toast').classList.remove('visible');if(clock>bannerUntil)$('wave-banner').classList.remove('visible');render(dt);hudClock+=dt;if(hudClock>.1){updateHUD();hudClock=0;}requestAnimationFrame(frame);}
updateHUD();syncPhase();requestAnimationFrame(frame);
// Deliberate read-only diagnostics for smoke tests and future tuning tools.
window.organism={snapshot:()=>({phase:game.phase,mass:game.player.mass,nest:game.nest.hp,wave:game.wave,kills:game.kills,allies:game.allies.map(a=>({kind:a.kind,x:a.x,y:a.y})),position:{x:game.player.x,y:game.player.y},enemies:game.enemies.length,food:game.food.length,level:game.level,time:game.time,weapon:game.weapon,projectiles:game.bullets.length,pools:game.pools.length,audio:soundscape.snapshot()})};
