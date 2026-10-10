import { WEAPONS, FIRE_LEVELS, TOWERS, SPECIES, PARTS, COSTS, MUTATIONS, hash, biomeAt } from './content.js';
export { WEAPONS, FIRE_LEVELS, TOWERS, SPECIES, PARTS, COSTS, MUTATIONS } from './content.js';
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
export class Game {
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){
  this.phase='ready';this.time=0;this.wave=1;this.kills=0;this.harvested=0;this.peak=100;this.level=1;this.xp=0;this.xpGoal=38;this.nextId=0;
  this.player={x:0,y:0,mass:100,angle:0,aim:0,hit:0,fire:0};
  this.stats={speed:95,vacuum:45,damage:1,armor:1,shotCost:1,interval:1,allyDamage:1,regen:0,huntRange:550,droneSpeed:115,digestion:1,reach:1,poolLife:1,poolDamage:1,buildCost:1,thorns:0,allyRegen:0,range:1};
  this.weapon='acid';this.fireLevel=1;this.towerType='spitter';this.body=[];this.absorbed={};this.colonies=[];this.allies=[];this.enemies=[];this.food=[];this.bullets=[];this.pools=[];this.lashes=[];this.events=[];this.mutations=[];this.choices=[];this.explored=new Set();this.spawnClock=2;this.worldClock=0;this.mouthCursor=0;
  this.body.push({id:this.nextId++,parent:null,kind:'core',species:'origin',angle:0,reach:0,x:0,y:0,size:14,flash:0});
  for(let i=0;i<4;i++)this.graft('flesh','origin');
  this.addColony(0,100);this.events=[];
  // Identifiable discarded body parts make the assimilation mechanic discoverable immediately.
  const starter=[['human_head','human'],['dog_jaw','dog'],['antler','deer']];
  for(let i=0;i<3;i++){const a=i*TAU/3;this.food.push({id:this.nextId++,x:Math.cos(a)*65,y:Math.sin(a)*65,mass:8,xp:4,kind:starter[i][0],species:starter[i][1],organ:true,age:0});}
 }
 get nest(){return this.colonies[0]||{hp:0,maxHp:180,x:0,y:0};}
 event(type,data={}){this.events.push({type,...data});}
 message(text){this.event('message',{text});return false;}
 start(){if(this.phase!=='ready')return;this.phase='playing';this.event('wave',{wave:1});}
 pause(){if(this.phase==='playing'){this.phase='paused';return true;}if(this.phase==='paused'){this.phase='playing';return true;}return false;}
 canSpend(cost){return this.player.mass-cost>=12;}
 radius(){return 14+Math.sqrt(this.player.mass)*.45;}
 bodyScale(){return clamp(.7+Math.sqrt(this.player.mass)/22,.8,2.5);}
 activeColonies(){return this.colonies.filter(c=>distance(c,this.player)<1000);}
 graft(kind,species){
  if(!PARTS[kind])return null;
  this.absorbed[species]=(this.absorbed[species]||0)+1;
  // Bound drawing/targeting cost: excess organs fuse into an existing branch, retaining provenance counts.
  if(this.body.length>=49){const same=this.body.find(n=>n.kind===kind)||this.body[1];same.size=Math.min(25,same.size+.3);return same;}
  const n=this.body.length,ring=Math.floor((n-1)/6),angle=(n-1)*2.399963;
  const parent=ring===0?this.body[0]:this.body[1+((n-7)%Math.min(n-1,12))];
  const reach=19+hash(n,3)*13;
  const part={id:this.nextId++,parent:parent.id,kind,species,angle,reach,x:parent.x+Math.cos(angle)*reach,y:parent.y+Math.sin(angle)*reach,size:PARTS[kind].size,flash:0};
  this.body.push(part);this.event('graft',{kind,species,x:part.x,y:part.y});return part;
 }
 updateBody(dt){
  const scale=this.bodyScale(),byId=new Map(this.body.map(n=>[n.id,n]));
  for(const n of this.body){n.flash=Math.max(0,n.flash-dt);if(n.parent===null){n.x=this.player.x;n.y=this.player.y;continue;}
   const parent=byId.get(n.parent),a=n.angle+Math.sin(this.time*.7+n.id)*.18,r=n.reach*scale*this.stats.reach;
   const factor=Math.min(1,dt*12);n.x+=(parent.x+Math.cos(a)*r-n.x)*factor;n.y+=(parent.y+Math.sin(a)*r-n.y)*factor;
  }
 }
 setWeapon(id){if(!WEAPONS.some(w=>w.id===id))return false;this.weapon=id;return true;}
 setFireLevel(level){if(!Number.isInteger(level)||level<0||level>2)return false;this.fireLevel=level;return true;}
 setTower(id){if(!TOWERS.some(t=>t.id===id))return false;this.towerType=id;return true;}
 firePlan(){const weapon=WEAPONS.find(w=>w.id===this.weapon),mode=FIRE_LEVELS[this.fireLevel],count=Math.min(this.body.length,mode.mouths);return {weapon,mode,count,cost:weapon.cost*mode.cost*this.stats.shotCost*count};}
 nearest(origin,range){let best=null,d=range;for(const e of this.enemies){if(e.hp<=0)continue;const nd=distance(origin,e);if(nd<d){best=e;d=nd;}}return best;}
 fireWeapon(target=null,auto=false){
  const p=this.player,{weapon:w,mode,count,cost}=this.firePlan();
  if(this.phase!=='playing'||p.fire>0||!this.canSpend(cost))return false;
  const mouths=[];for(let i=0;i<count;i++){const n=this.body[(this.mouthCursor+i*Math.max(1,Math.floor(this.body.length/count)))%this.body.length],prey=auto?this.nearest(n,w.range*this.stats.range):target;if(prey)mouths.push({n,prey});}
  if(!mouths.length)return false;
  const actualCost=cost*mouths.length/count;p.mass-=actualCost;p.fire=w.interval*mode.cadence*this.stats.interval;this.mouthCursor=(this.mouthCursor+1)%this.body.length;
  for(const {n,prey} of mouths){n.flash=.25;this.emitWeapon(n,prey,w.id,w.damage*mode.damage*this.stats.damage,w.range*this.stats.range);}
  p.aim=Math.atan2(mouths[0].prey.y-p.y,mouths[0].prey.x-p.x);this.event('shot',{weapon:w.id,x:p.x,y:p.y,mouths:mouths.length,cost:actualCost});return true;
 }
 emitWeapon(origin,target,kind,damage,range=260){
  const angle=Math.atan2(target.y-origin.y,target.x-origin.x);
  if(kind==='tongue'||kind==='blood'||kind==='scream'){
   this.lashes.push({x:origin.x,y:origin.y,angle,kind,length:range,life:.26,maxLife:.26});
   for(const e of this.enemies){if(e.hp<=0)continue;const d=distance(origin,e),a=Math.atan2(e.y-origin.y,e.x-origin.x),forward=Math.cos(a-angle),side=Math.abs(Math.sin(a-angle)*d);
    const hit=kind==='scream'?d<range+e.r:kind==='blood'?d<range&&forward>0&&side<e.r+5:d<range+e.r&&forward>.6;
    if(hit){e.hp-=damage;e.hit=.15;e.slow=kind==='blood'?e.slow:.7;if(kind==='scream'&&d>0){e.x+=(e.x-origin.x)/d*14;e.y+=(e.y-origin.y)/d*14;}this.event('impact',{x:e.x,y:e.y,kind});}
   }return;
  }
  const count=kind==='bone'?5:kind==='parasite'?2:1;
  for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*(kind==='bone'?.15:.16),speed=kind==='bone'?370:kind==='parasite'?135:kind==='spore'?145:210;
   this.bullets.push({x:origin.x,y:origin.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,kind,damage,life:range/speed,friendly:true,source:origin.id});
  }
 }
 addColony(x,y){const c={id:this.nextId++,x,y,hp:180,maxHp:180,hit:0,pulse:5};this.colonies.push(c);return c;}
 buildCost(kind){if(kind==='tower')return TOWERS.find(t=>t.id===this.towerType).cost*this.stats.buildCost;if(kind==='colony')return COSTS.colony*this.stats.buildCost;return COSTS[kind];}
 action(kind){
  if(this.phase!=='playing')return false;const p=this.player;
  if(kind==='recall'){
   const near=this.allies.filter(a=>a.kind!=='tower'&&distance(a,p)<700);
   if(!near.length)return this.message('No mobile offspring within recall range.');
   for(const a of near){p.mass+=a.mass*Math.max(0,a.hp)/a.maxHp;this.event('absorb',{x:a.x,y:a.y});}this.allies=this.allies.filter(a=>!near.includes(a));return true;
  }
  if(kind==='colony'&&this.colonies.some(c=>distance(c,p)<220))return this.message('Spread farther: colonies need 220m of separation.');
  if(kind==='tower'&&this.allies.some(a=>a.kind==='tower'&&distance(a,p)<28))return this.message('This root bed is occupied. Move a little farther.');
  if(['shield','drone'].includes(kind)&&this.allies.filter(a=>a.kind!=='tower').length>=18)return this.message('Your brood is full. Reabsorb some offspring with X.');
  const cost=this.buildCost(kind);if(cost===undefined)return false;if(!this.canSpend(cost))return this.message(`Need ${Math.ceil(cost+12)}g to bud safely. Eat the remains.`);
  p.mass-=cost;
  if(kind==='colony'){this.addColony(p.x,p.y);this.event('colony',{x:p.x,y:p.y});this.message('A new colony takes root. Its pulses repair and feed you nearby.');return true;}
  const type=kind==='tower'?TOWERS.find(t=>t.id===this.towerType):null,hp=type?.hp||(kind==='shield'?75:65);
  this.allies.push({id:this.nextId++,kind,tower:type?.id,x:p.x,y:p.y,hp,maxHp:hp,mass:cost,fire:0,angle:this.random()*TAU,hit:0,target:null});this.event('bud',{x:p.x,y:p.y});return true;
 }
 spawnEnemy(kind,x,y){
  const type=SPECIES[kind];if(!type)throw Error('Unknown species '+kind);
  const a=this.random()*TAU,d=330+this.random()*150,scale=1+Math.max(0,this.wave-1)*.09;
  const e={id:this.nextId++,kind,x:x??this.player.x+Math.cos(a)*d,y:y??this.player.y+Math.sin(a)*d,...type,hp:type.hp*scale,maxHp:type.hp*scale,attack:0,slow:0,hit:0,angle:a,seed:this.random()*10};this.enemies.push(e);return e;
 }
 kill(e){
  this.kills++;this.event('death',{x:e.x,y:e.y,r:e.r,species:e.kind});
  const type=SPECIES[e.kind],count=e.kind==='boss'?8:3,part=type.parts[Math.floor(this.random()*type.parts.length)];
  for(let i=0;i<count;i++){const a=this.random()*TAU,r=this.random()*e.r;this.food.push({id:this.nextId++,x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r,mass:e.mass/count,xp:e.mass/count,kind:i===0?part:'flesh',species:e.kind,organ:i===0,age:0});}
 }
 consume(f){this.player.mass+=f.mass*this.stats.digestion;this.harvested+=f.mass;this.xp+=f.xp;if(f.organ)this.graft(f.kind,f.species);this.event('eat',{x:f.x,y:f.y,mass:f.mass});}
 mutate(id){if(this.phase!=='mutation'||!this.choices.some(m=>m.id===id))return false;const m=MUTATIONS.find(m=>m.id===id);m.apply(this);this.mutations.push(id);this.level++;this.phase='playing';this.message(m.name+' assimilated.');return true;}
 hurtPlayer(amount){this.player.mass-=amount*this.stats.armor;this.player.hit=.2;this.event('hurt',{x:this.player.x});}
 discover(){
  const cx=Math.floor(this.player.x/240),cy=Math.floor(this.player.y/240);
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const x=cx+dx,y=cy+dy,key=x+','+y;if(this.explored.has(key))continue;this.explored.add(key);
   if(Math.abs(x)+Math.abs(y)<2)continue;
   const bx=x*240+40+hash(x,y,2)*160,by=y*240+40+hash(x,y,3)*160,kind=['human','dog','deer','crawler'][Math.floor(hash(x,y,7)*4)];
   if(this.enemies.length<100)this.spawnEnemy(kind,bx,by);
   this.food.push({id:this.nextId++,x:bx+35,y:by-15,mass:6,xp:3,kind:SPECIES[kind].parts[0],species:kind,organ:true,age:0});
  }
 }
 tick(dt,input={}){
  if(this.phase!=='playing')return;dt=clamp(dt,0,.05);this.time+=dt;const p=this.player;
  const nextWave=1+Math.floor(this.time/45);if(nextWave>this.wave){this.wave=nextWave;this.event('wave',{wave:this.wave});if(this.wave%4===0&&this.enemies.length<110)this.spawnEnemy('boss');}
  p.hit=Math.max(0,p.hit-dt);p.fire=Math.max(0,p.fire-dt);const mx=input.x||0,my=input.y||0,len=Math.hypot(mx,my);
  if(len){p.x+=mx/Math.max(1,len)*this.stats.speed*dt;p.y+=my/Math.max(1,len)*this.stats.speed*dt;p.angle=Math.atan2(my,mx);}
  this.updateBody(dt);
  if(input.fire&&input.aim)this.fireWeapon(input.aim);else if(input.auto)this.fireWeapon(null,true);
  this.worldClock-=dt;if(this.worldClock<=0){this.discover();this.worldClock=.7;}
  this.spawnClock-=dt;if(this.spawnClock<=0){if(this.enemies.length<105){let pool=this.wave<2?['human','dog','crawler','deer']:this.wave<4?['human','dog','soldier','spitter','deer','crawler']:['soldier','dog','spitter','brute','crawler','deer'];const kind=pool[Math.floor(this.random()*pool.length)];const colonies=this.activeColonies();if(colonies.length&&this.random()<.25){const c=colonies[Math.floor(this.random()*colonies.length)],a=this.random()*TAU;this.spawnEnemy(kind,c.x+Math.cos(a)*350,c.y+Math.sin(a)*350);}else this.spawnEnemy(kind);}this.spawnClock=Math.max(.38,2.6-this.wave*.16);}
  for(const c of this.colonies){c.hit=Math.max(0,c.hit-dt);if(distance(c,p)>1000)continue;c.hp=Math.min(c.maxHp,c.hp+this.stats.regen*dt);c.pulse-=dt;if(c.pulse<=0){c.pulse=6;if(distance(c,p)<95){p.mass+=2;this.event('pulse',{x:c.x,y:c.y});}for(const a of this.allies)if(distance(c,a)<140)a.hp=Math.min(a.maxHp,a.hp+5);}}
  for(const a of this.allies){
   a.hit=Math.max(0,a.hit-dt);a.fire-=dt;if(a.kind!=='tower')a.hp=Math.min(a.maxHp,a.hp+this.stats.allyRegen*dt);
   if(a.kind==='shield'){a.angle+=dt*1.7;const r=60+this.bodyScale()*12;a.x=p.x+Math.cos(a.angle)*r;a.y=p.y+Math.sin(a.angle)*r;for(const e of this.enemies)if(e.hp>0&&distance(a,e)<e.r+12){e.hp-=35*this.stats.allyDamage*dt;a.hp-=8*dt;e.hit=.1;}continue;}
   if(a.kind==='tower'&&distance(a,p)>1000)continue;
   const tower=a.kind==='tower'?TOWERS.find(t=>t.id===a.tower):null;
   const target=this.nearest(a,tower?.range||this.stats.huntRange);a.target=target?.id??null;
   if(a.kind==='drone'){
    // Independent hunters choose prey around themselves and pursue beyond the player's firing range.
    const home=target||p,d=distance(a,home),stop=target?85:80;if(d>stop){const move=Math.min(d-stop,this.stats.droneSpeed*dt);a.x+=(home.x-a.x)/Math.max(1,d)*move;a.y+=(home.y-a.y)/Math.max(1,d)*move;}
   }
   if(target&&a.fire<=0&&distance(a,target)<(tower?.range||190)){this.emitWeapon(a,target,tower?.weapon||'parasite',(tower?.damage||13)*this.stats.allyDamage,tower?.range||230);a.fire=tower?.interval||.95;this.event('allyshot',{x:a.x,y:a.y});}
  }
  this.lashes=this.lashes.filter(l=>{l.life-=dt;return l.life>0;});
  this.pools=this.pools.filter(pool=>{pool.life-=dt;for(const e of this.enemies)if(e.hp>0&&distance(pool,e)<pool.r+e.r){e.hp-=pool.damage*dt;e.slow=.35;}return pool.life>0;});
  for(const e of this.enemies){
   if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);e.slow=Math.max(0,e.slow-dt);e.attack-=dt;
   let target=p,min=distance(e,p),bodyHit=true;for(const n of this.body){const d=distance(e,n);if(d<min){target=n;min=d;}}
   for(const c of this.colonies){const d=distance(e,c);if(d<min&&distance(c,p)<1000){target=c;min=d;bodyHit=false;}}
   for(const a of this.allies){const d=distance(e,a);if(a.hp>0&&d<min){target=a;min=d;bodyHit=false;}}
   e.angle=Math.atan2(target.y-e.y,target.x-e.x);const ranged=e.kind==='soldier'||e.kind==='spitter',reach=ranged?160:e.r+(bodyHit?10:18);
   if(min>reach){const move=e.speed*(e.slow>0?.5:1)*dt;e.x+=Math.cos(e.angle)*move;e.y+=Math.sin(e.angle)*move;}
   else if(e.attack<=0){e.attack=ranged?2:1.1;if(ranged){this.bullets.push({x:e.x,y:e.y,vx:Math.cos(e.angle)*150,vy:Math.sin(e.angle)*150,kind:e.kind==='soldier'?'round':'enemy',friendly:false,damage:e.damage,life:2});}
    else if(bodyHit)this.hurtPlayer(e.damage);else{target.hp-=e.damage;target.hit=.2;if(this.colonies.includes(target))this.event('nesthurt',{x:target.x});}}
   if(bodyHit&&min<e.r+15&&this.stats.thorns)e.hp-=this.stats.thorns*dt;
  }
  for(const b of this.bullets){
   if(b.kind==='parasite'){const e=this.nearest(b,220);if(e){const a=Math.atan2(e.y-b.y,e.x-b.x),turn=Math.min(1,dt*5);b.vx+=(Math.cos(a)*175-b.vx)*turn;b.vy+=(Math.sin(a)*175-b.vy)*turn;}}
   const ox=b.x,oy=b.y;b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
   const hits=(e,r)=>{const dx=b.x-ox,dy=b.y-oy,l=dx*dx+dy*dy,t=l?clamp(((e.x-ox)*dx+(e.y-oy)*dy)/l,0,1):0;return Math.hypot(e.x-ox-dx*t,e.y-oy-dy*t)<r+2;};
   let impact=false;
   if(b.friendly){for(const e of this.enemies)if(e.hp>0&&hits(e,e.r)){e.hp-=b.damage;e.hit=.15;impact=true;break;}}
   else{const ally=this.allies.find(a=>a.hp>0&&hits(a,12)),colony=this.colonies.find(c=>c.hp>0&&hits(c,24)),node=this.body.find(n=>hits(n,n.size*this.bodyScale()*.65));if(ally){ally.hp-=b.damage;ally.hit=.2;impact=true;}else if(node){this.hurtPlayer(b.damage);impact=true;}else if(colony){colony.hp-=b.damage;colony.hit=.2;impact=true;}}
   if(impact||(b.kind==='spore'&&b.life<=0)){b.life=0;this.event('impact',{x:b.x,y:b.y,kind:b.kind});if(b.kind==='acid'||b.kind==='spore'){const r=b.kind==='spore'?58:28;if(b.kind==='spore')for(const e of this.enemies)if(distance(b,e)<r+e.r)e.hp-=b.damage;this.pools.push({x:b.x,y:b.y,r,life:2.4*this.stats.poolLife,maxLife:2.4*this.stats.poolLife,damage:b.damage*.22*this.stats.poolDamage});if(this.pools.length>70)this.pools.shift();}}
  }
  this.bullets=this.bullets.filter(b=>b.life>0);
  for(const e of this.enemies)if(e.hp<=0)this.kill(e);
  const active=this.activeColonies();this.enemies=this.enemies.filter(e=>e.hp>0&&(distance(e,p)<1100||active.some(c=>distance(e,c)<500)));
  for(const a of this.allies)if(a.hp<=0)this.event('allydeath',{x:a.x,y:a.y});this.allies=this.allies.filter(a=>a.hp>0);
  for(const c of this.colonies)if(c.hp<=0)this.event('colonydeath',{x:c.x,y:c.y});this.colonies=this.colonies.filter(c=>c.hp>0);
  this.food=this.food.filter(f=>{f.age+=dt;let mouth=p,d=distance(p,f);for(const n of this.body){const nd=distance(n,f);if(nd<d){mouth=n;d=nd;}}if(d<15*this.bodyScale()){this.consume(f);return false;}if(d<this.stats.vacuum){const move=Math.min(d,150*dt);f.x+=(mouth.x-f.x)/Math.max(1,d)*move;f.y+=(mouth.y-f.y)/Math.max(1,d)*move;}return f.age<150&&distance(f,p)<1400;});
  this.peak=Math.max(this.peak,p.mass);
  if(p.mass<6){this.phase='lost';this.event('end');return;}
  if(this.xp>=this.xpGoal){this.xp-=this.xpGoal;this.xpGoal=Math.round(this.xpGoal*1.32);this.phase='mutation';const pool=[...MUTATIONS];for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}this.choices=pool.slice(0,3);this.event('mutation');}
 }
}
