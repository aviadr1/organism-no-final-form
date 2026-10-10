import { Game, ARENA, COSTS, MUTATIONS } from './engine.js';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
const game=new Game();
const keys=new Set();let auto=true,muted=true,audio=null,mouse={x:0,y:0,down:false,active:false},touch={x:0,y:0},W=0,H=0,DPR=1,scale=1,origin={x:0,y:0},clock=0,last=0,accumulator=0,particles=[],floats=[],toastUntil=0,bannerUntil=0,lastEat=0,lastShot=0,shake=0,lastPhase='',hudClock=0;
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
function tone(frequency,duration=.07,type='sine',volume=.025,slide=.5){if(muted||!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(20,frequency*slide),audio.currentTime+duration);gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');toastUntil=clock+3.8;}
function banner(kicker,text){$('banner-kicker').textContent=kicker;$('banner-text').textContent=text;$('wave-banner').classList.add('visible');bannerUntil=clock+3;}
function eventEffects(){for(const e of game.events){switch(e.type){case 'message':toast(e.text);break;case 'wave':banner(e.wave===6?'THE BROODMOTHER APPROACHES':'HOSTILES DETECTED',`Wave ${String(e.wave).padStart(2,'0')}`);tone(100,.5,'sine',.06,2);break;case 'clear':banner('AREA PURGED',e.wave===6?'The garden is yours.':'Feed. Recover. Prepare.');tone(300,.3,'sine',.03,1.5);break;case 'death':addParticles(e.x,e.y,'#bd795e',16,100);addParticles(e.x,e.y,'#d5e68a',7,70);tone(70,.1,'triangle',.04,.35);break;case 'impact':addParticles(e.x,e.y,'#e5d6a2',3,35);break;case 'eat':addParticles(e.x,e.y,'#c8ed95',3,30);if(clock-lastEat>.1){tone(rand(480,750),.08,'sine',.023,1.6);lastEat=clock;}break;case 'shot':if(clock-lastShot>.12){tone(190,.06,'triangle',.012,.4);lastShot=clock;}break;case 'bud':addParticles(e.x,e.y,'#c8ed95',24,90);tone(120,.25,'sine',.055,2);break;case 'absorb':addParticles(e.x,e.y,'#c8ed95',14,50);break;case 'hurt':shake=4;tone(70,.15,'sawtooth',.025,.3);break;case 'nesthurt':shake=3;break;case 'allydeath':addParticles(e.x,e.y,'#85a78e',15,70);break;case 'mutation':tone(440,.5,'sine',.04,2);break;case 'end':showEnd(e);break;}}
 game.events=[];
}
function terrain(){
 const bg=ctx.createRadialGradient(W*.59,H*.52,30,W*.59,H*.52,Math.max(W,H)*.7);bg.addColorStop(0,'#142722');bg.addColorStop(.6,'#0e1b1a');bg.addColorStop(1,'#0a1315');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 // A shallow, oblique petri-dish floor. All entities still move on a flat plane.
 worldCircle(750,500,665,'#1b2b211c','#9cbb7b13');worldCircle(750,500,650,null,'#9cbb7b0b');
 ctx.save();ctx.globalAlpha=.35;
 for(let y=0;y<=1000;y+=70)for(let x=0;x<=1500;x+=80){const xx=x+(Math.round(y/70)%2)*40;if(Math.hypot((xx-750)/1.1,y-500)<655){const p=screen(xx,y);path([{x:p.x-2,y:p.y},{x:p.x+2,y:p.y}],'#75907033',.6);path([{x:p.x,y:p.y-2},{x:p.x,y:p.y+2}],'#75907033',.6);}}
 ctx.restore();
 const corners=[[0,0,1,1],[1500,0,-1,1],[0,1000,1,-1],[1500,1000,-1,-1]];
 for(const [x,y,dx,dy] of corners)path([screen(x+dx*35,y),screen(x,y),screen(x,y+dy*35)],'#69875c66',1);
 for(const s of scenery){const p=screen(s.x,s.y);ellipse(p.x,p.y,s.r*scale,s.r*.6*scale,'#66805713');if(s.r>4){ctx.globalAlpha=.25+Math.sin(clock*.5+s.seed)*.12;ellipse(p.x+Math.sin(clock*.25+s.seed)*8,p.y-8,1,1,'#d9eb9c');ctx.globalAlpha=1;}}
 for(const s of plants){worldCircle(s.x,s.y,s.r*1.7,'#00000015');for(let i=0;i<4;i++){const a=s.seed+i*1.8;const end={x:s.x+Math.cos(a)*s.r*1.4,y:s.y+Math.sin(a)*s.r*1.4};tendril(s,end,2,'#355d433b',.35);blob(end.x,end.y,4,['#476443','#263a2c','#1a2824'],i,3,.4);}blob(s.x,s.y,s.r,['#3b5238','#24372a','#15251f'],s.seed,0,.3);}
}
function nest(){const n=game.nest,beat=1+Math.sin(clock*2)*.025;glow(n.x,n.y,160,'#a6c8750e');worldCircle(n.x,n.y,68,'#020a0766');worldCircle(n.x,n.y,105,null,'#c8ed951a');
 for(let i=0;i<12;i++){const a=i/12*TAU,from={x:n.x+Math.cos(a)*27,y:n.y+Math.sin(a)*27},end={x:n.x+Math.cos(a)*randStable(i,76,105),y:n.y+Math.sin(a)*randStable(i,76,105)};tendril(from,end,7,'#314932',Math.sin(clock*.5+i)*.12);tendril(from,end,2,'#7e95613c',Math.sin(clock*.5+i)*.12);}
 for(let i=0;i<7;i++){const a=i/7*TAU;blob(n.x+Math.cos(a)*28,n.y+Math.sin(a)*28,25*beat,n.hit>0?['#e5ad96','#a36c58','#413b2a']:['#819066','#455b3f','#202e25'],i,5,.4);}
 blob(n.x,n.y,35*beat,['#d4dab0','#9ba57b','#3d5237'],3,14,.8);blob(n.x,n.y,18*beat,['#d9e9a4','#a6ba76','#5a7845'],2,24,1.2);
 const p=screen(n.x,n.y+95);ctx.font=`${Math.max(8,11*scale)}px 'DM Sans',sans-serif`;ctx.textAlign='center';ctx.fillStyle='#a6b68b';ctx.fillText('MOTHER NEST',p.x,p.y);const width=60*scale;ctx.fillStyle='#293329';ctx.fillRect(p.x-width/2,p.y+7,width,2);ctx.fillStyle=n.hp<35?'#e99683':'#bacd8c';ctx.fillRect(p.x-width/2,p.y+7,width*Math.max(0,n.hp)/100,2);
}
function randStable(seed,min,max){return min+(Math.sin(seed*78.21)*.5+.5)*(max-min);}
function organism(){const p=game.player,r=game.radius(),count=Math.min(31,7+Math.floor(p.mass/10)+game.stats.segments),spacing=4;const centers=[];
 for(let i=0;i<count;i++){const pt=game.trail[Math.min(game.trail.length-1,i*spacing)];centers.push({x:pt.x,y:pt.y,r:r*(1-i/(count+2))*.84+3});}
 for(let i=centers.length-1;i>=0;i--){const b=centers[i];worldCircle(b.x,b.y+7,b.r*1.22,'#00000024');}
 for(let i=centers.length-1;i>=0;i--){const b=centers[i];const prev=centers[Math.max(0,i-1)],angle=i===0?p.angle:Math.atan2(prev.y-b.y,prev.x-b.x);
  for(const side of [-1,1]){const a=angle+Math.PI/2*side+Math.sin(clock*2-i*.8)*.3,end={x:b.x+Math.cos(a)*(b.r+15+Math.sin(clock*2+i)*8),y:b.y+Math.sin(a)*(b.r+15+Math.sin(clock*2+i)*8)};tendril(b,end,3.5,'#829f62',Math.sin(clock*3+i)*.24);tendril(b,end,1,'#d1e5a670',Math.sin(clock*3+i)*.24);}
  if(i<centers.length-1)tendril(b,centers[i+1],b.r*1.5,'#566e45',0);
  blob(b.x,b.y,b.r,p.hit>0?['#edd2bb','#ac8c71','#61513f']:['#c8d799','#8da66a','#3f5b3e'],i*.7,9,1.3);
  const cell=screen(b.x,b.y,13);ellipse(cell.x,cell.y,b.r*scale*.23,b.r*scale*.17,'#3c603c90','#b7d08c33');
 }
 for(let i=0;i<5;i++){const a=p.angle+(i-2)*.37;const end={x:p.x+Math.cos(a)*(r+30+Math.sin(clock*3+i)*9),y:p.y+Math.sin(a)*(r+30+Math.sin(clock*3+i)*9)};tendril(p,end,4,'#a8bc7d',Math.sin(clock*3+i)*.15);}
 blob(p.x,p.y,r,p.hit>0?['#f2d6bd','#b98e69','#65533e']:['#d8eab2','#a1bb7a','#496a46'],0,13,1.5);
 const aim=(mouse.active&&mouse.down)?Math.atan2(unscreen(mouse.x,mouse.y).y-p.y,unscreen(mouse.x,mouse.y).x-p.x):p.angle;
 for(const side of [-1,1]){const a=aim+.48*side,x=p.x+Math.cos(a)*r*.53,y=p.y+Math.sin(a)*r*.53,s=screen(x,y,19);ellipse(s.x,s.y,5.4*scale,4.6*scale,'#223c2d','#cde2a999');ellipse(s.x+scale,s.y-scale,1.6*scale,1.6*scale,'#eaffc3');}
 if(game.phase==='ready'){const s=screen(p.x,p.y-65);ctx.textAlign='center';ctx.font='9px "DM Sans", sans-serif';ctx.letterSpacing='2px';ctx.fillStyle='#c9daaa';ctx.fillText('SPECIMEN 001',s.x,s.y);ctx.letterSpacing='0px';}
}
function ally(a){const shield=a.kind==='shield',tower=a.kind==='tower',r=tower?22:shield?17:15;worldCircle(a.x,a.y+5,r*1.2,'#00000030');if(shield){tendril(game.player,a,5,'#69865488',Math.sin(clock+a.id)*.2);tendril(game.player,a,1.5,'#b5d08955',Math.sin(clock+a.id)*.2);worldCircle(a.x,a.y,r+7,null,'#c8ed9544',1);}
 if(tower){for(let i=0;i<6;i++){const angle=i/6*TAU,end={x:a.x+Math.cos(angle)*38,y:a.y+Math.sin(angle)*38};tendril(a,end,5,'#608b7566',.2);}if(mouse.active){const mp=unscreen(mouse.x,mouse.y);if(Math.hypot(mp.x-a.x,mp.y-a.y)<50)worldCircle(a.x,a.y,420,null,'#a1dacb33');}}
 else for(let i=0;i<4;i++){const angle=clock*.7+i*Math.PI/2,end={x:a.x+Math.cos(angle)*(r+12),y:a.y+Math.sin(angle)*(r+12)};tendril(a,end,2,'#aad9b999',.3);}
 blob(a.x,a.y,r,a.hit>0?['#f2cdbb','#ac7f67','#4d4631']:tower?['#afd5c1','#598f7c','#264e42']:['#d7e8af','#93b578','#385d43'],a.id,9,2);
 blob(a.x,a.y,r*.4,tower?['#ccfff0','#7bc9b6','#448b7c']:['#edfad0','#bfd69a','#73935e'],a.id,14,2);
 if(a.hp<a.maxHp){const s=screen(a.x,a.y+30);ctx.fillStyle='#28362c';ctx.fillRect(s.x-12,s.y,24,2);ctx.fillStyle='#bbd68e';ctx.fillRect(s.x-12,s.y,24*Math.max(0,a.hp/a.maxHp),2);}
}
function enemy(e){worldCircle(e.x,e.y+7,e.r*1.15,'#00000036');const boss=e.kind==='boss',brute=e.kind==='brute',spitter=e.kind==='spitter';const cols=e.hit>0?['#f5e0b9','#d0bb8f','#746345']:spitter?['#c4a5d0','#886b94','#453c53']:['#dba88a','#9b6a55','#473b31'];const limbs=boss?12:brute?8:6;
 for(let i=0;i<limbs;i++){const a=i/limbs*TAU+e.angle,b={x:e.x+Math.cos(a)*(e.r+12+Math.sin(clock*6+i+e.seed)*5),y:e.y+Math.sin(a)*(e.r+12+Math.sin(clock*6+i+e.seed)*5)};tendril(e,b,boss?5:2,cols[1],Math.sin(clock*5+i)*.18);}
 blob(e.x,e.y,e.r,cols,e.seed,8,boss?.7:2);const center=screen(e.x,e.y,12);ellipse(center.x,center.y,e.r*.4*scale,e.r*.26*scale,spitter?'#e1bada':'#47382b',cols[0]+'66');for(let i=0;i<(boss?5:2);i++){const a=e.angle+(i-(boss?2:.5))*.45,s=screen(e.x+Math.cos(a)*e.r*.55,e.y+Math.sin(a)*e.r*.55,15);ellipse(s.x,s.y,2.5*scale,2.5*scale,'#ffe1a2');}
 if(e.hp<e.maxHp||boss){const s=screen(e.x,e.y-e.r-20),w=Math.max(20,e.r*1.5*scale);ctx.fillStyle='#372e29';ctx.fillRect(s.x-w/2,s.y,w,3);ctx.fillStyle=boss?'#e9a796':'#b38c73';ctx.fillRect(s.x-w/2,s.y,w*Math.max(0,e.hp/e.maxHp),3);if(boss){ctx.font='9px "DM Sans",sans-serif';ctx.textAlign='center';ctx.fillStyle='#daa794';ctx.fillText('BROODMOTHER',s.x,s.y-9);}}
}
function render(dt){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.save();if(shake>0){ctx.translate(rand(-shake,shake),rand(-shake,shake));shake=Math.max(0,shake-dt*16);}terrain();
 for(const f of game.food){const color=foodColors[f.hue];glow(f.x,f.y,24,color+'17');const p=screen(f.x,f.y,3+Math.sin(clock*2+f.x)*2);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(clock*.4+f.x);const r=(3+Math.sqrt(f.mass))*scale;path([{x:0,y:-r},{x:r*.8,y:0},{x:0,y:r},{x:-r*.8,y:0}],color+'88',.6,color);ctx.restore();}
 nest();
 const entities=[...game.enemies.map(e=>({y:e.y,draw:()=>enemy(e)})),...game.allies.map(a=>({y:a.y,draw:()=>ally(a)})),{y:game.player.y,draw:organism}];entities.sort((a,b)=>a.y-b.y);entities.forEach(e=>e.draw());
 for(const b of game.bullets){const p=screen(b.x,b.y,11),tail=screen(b.x-b.vx*.024,b.y-b.vy*.024,11);path([tail,p],b.friendly?'#d7f5a0':'#dfa2d9',Math.max(1.5,4*scale));ellipse(p.x,p.y,2.5*scale,2.5*scale,b.friendly?'#f0ffd3':'#ffe1f9');}
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
function start(){keys.clear();mouse.down=false;game.start();syncPhase();tone(120,.4,'sine',.04,3);toast('Feed on glowing remains. Q grows a shield; E sets it free.');}
function restart(){game.reset();particles=[];lastPhase='';mouse.down=false;keys.clear();touch={x:0,y:0};start();updateHUD();}
$('start').onclick=start;$('restart').onclick=restart;$('restart-pause').onclick=restart;$('pause').onclick=()=>{game.pause();keys.clear();mouse.down=false;syncPhase();};$('resume').onclick=()=>{game.pause();syncPhase();};
$('sound').onclick=()=>{muted=!muted;if(!audio){const AudioContext=window.AudioContext||window.webkitAudioContext;if(AudioContext)audio=new AudioContext();}audio?.resume();$('sound').innerHTML=muted?'♫<span class="soundoff">/</span>':'♫';$('sound').setAttribute('aria-label',muted?'Enable sound':'Mute sound');tone(330,.15,'sine',.04,1.5);};
function toggleAuto(){auto=!auto;$('autofire').classList.toggle('active',auto);$('autofire').setAttribute('aria-pressed',String(auto));}
$('autofire').onclick=toggleAuto;
for(const button of document.querySelectorAll('[data-action]'))button.onclick=()=>{game.action(button.dataset.action);updateHUD();canvas.focus({preventScroll:true});};
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();if(e.repeat)return;keys.add(key);if(key==='escape'){game.pause();mouse.down=false;keys.clear();syncPhase();}if(game.phase==='playing'){const action={q:'shield',e:'drone',r:'tower',x:'recall'}[key];if(action)game.action(action);if(key==='f')toggleAuto();}else if(game.phase==='ready'&&key==='enter'){e.preventDefault();start();}});
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
 syncPhase();if(clock>toastUntil)$('toast').classList.remove('visible');if(clock>bannerUntil)$('wave-banner').classList.remove('visible');render(dt);hudClock+=dt;if(hudClock>.1){updateHUD();hudClock=0;}requestAnimationFrame(frame);}
updateHUD();syncPhase();requestAnimationFrame(frame);
// Deliberate read-only diagnostics for smoke tests and future tuning tools.
window.organism={snapshot:()=>({phase:game.phase,mass:game.player.mass,nest:game.nest.hp,wave:game.wave,kills:game.kills,allies:game.allies.map(a=>({kind:a.kind,x:a.x,y:a.y})),position:{x:game.player.x,y:game.player.y},enemies:game.enemies.length,food:game.food.length,level:game.level,time:game.time})};
