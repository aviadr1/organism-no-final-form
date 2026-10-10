// Pure simulation: no browser or rendering dependencies. World units are independent of pixels.
export const ARENA = { width: 1500, height: 1000 };
export const COSTS = { shield: 18, drone: 24, tower: 28 };
export const MUTATIONS = [
 {id:'venom',name:'Venom sacs',glyph:'✺',description:'Your projectiles deal 35% more damage.',tag:'OFFENSE',apply:g=>g.stats.damage*=1.35},
 {id:'cilia',name:'Hungry cilia',glyph:'≋',description:'Move 15% faster. Draw in remains from farther away.',tag:'FORAGING',apply:g=>{g.stats.speed*=1.15;g.stats.vacuum+=35;}},
 {id:'carapace',name:'Chitin skin',glyph:'⬡',description:'Your body and nest take 20% less damage.',tag:'DEFENSE',apply:g=>g.stats.armor*=.8},
 {id:'synapse',name:'Hive synapse',glyph:'✣',description:'Drones and rooted towers deal 40% more damage.',tag:'COLONY',apply:g=>g.stats.allyDamage*=1.4},
 {id:'metabolism',name:'Closed metabolism',glyph:'◉',description:'Firing consumes 30% less biomass.',tag:'EFFICIENCY',apply:g=>g.stats.shotCost*=.7},
 {id:'growth',name:'Hyperplasia',glyph:'❋',description:'Gain 25 biomass now. Grow a longer, heavier body.',tag:'GROWTH',apply:g=>{g.player.mass+=25;g.stats.segments+=3;}},
 {id:'heart',name:'Second heart',glyph:'♡',description:'Restore 35 nest integrity. Slowly regenerate the nest.',tag:'REGENERATION',apply:g=>{g.nest.hp=Math.min(100,g.nest.hp+35);g.stats.regen+=.35;}},
 {id:'brood',name:'Resilient brood',glyph:'◎',description:'All offspring gain 50% maximum health and heal fully.',tag:'COLONY',apply:g=>{g.stats.allyHealth*=1.5;for(const a of g.allies){a.maxHp*=1.5;a.hp=a.maxHp;}}},
 {id:'glands',name:'Split glands',glyph:'⋔',description:'Fire 25% faster. Each shot still consumes biomass.',tag:'OFFENSE',apply:g=>g.stats.interval*=.8}
];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Game {
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){
  this.phase='ready';this.previousPhase='playing';this.time=0;this.wave=0;this.kills=0;this.harvested=0;this.peak=65;this.level=1;this.xp=0;this.xpGoal=30;
  this.player={x:750,y:635,mass:65,angle:-Math.PI/2,hit:0,fire:0};this.nest={x:750,y:490,hp:100,hit:0};
  this.stats={speed:210,vacuum:65,damage:15,armor:1,shotCost:.32,interval:.24,allyDamage:1,allyHealth:1,regen:0,segments:0};
  this.enemies=[];this.allies=[];this.bullets=[];this.food=[];this.events=[];this.trail=[];this.mutations=[];this.choices=[];this.spawnQueue=0;this.spawnClock=0;this.intermission=0;this.nextId=0;this.bossSpawned=false;
  for(let i=0;i<45;i++)this.trail.push({x:750+Math.sin(i*.2)*10,y:635+i*6});
  // A few edible remnants teach the feeding mechanic before combat reaches the nest.
  for(let i=0;i<9;i++){const a=i*2.4;this.food.push({x:750+Math.cos(a)*115,y:635+Math.sin(a)*100,mass:2,xp:1,hue:i%3,age:0});}
 }
 event(type,data={}){this.events.push({type,...data});}
 start(){if(this.phase!=='ready')return;this.phase='playing';this.startWave();}
 startWave(){this.wave++;this.spawnQueue=7+this.wave*4;this.spawnClock=1.5;this.intermission=0;this.bossSpawned=false;this.event('wave',{wave:this.wave});}
 pause(){if(this.phase==='playing'){this.phase='paused';return true;}if(this.phase==='paused'){this.phase='playing';return true;}return false;}
 radius(){return 13+Math.sqrt(this.player.mass)*1.4;}
 canSpend(cost){return this.player.mass-cost>=12;}
 action(kind){
  if(this.phase!=='playing')return false;
  if(kind==='recall'){
   if(!this.allies.length){this.event('message',{text:'No living offspring to reabsorb.'});return false;}
   let returned=0;for(const a of this.allies){returned+=a.mass*a.hp/a.maxHp;this.event('absorb',{x:a.x,y:a.y});}
   this.player.mass+=returned;this.allies=[];this.event('message',{text:`Reabsorbed ${Math.round(returned)}g of living tissue.`});return true;
  }
  if(kind==='drone'){
   const attached=this.allies.find(a=>a.kind==='shield');
   if(attached){attached.kind='drone';this.event('message',{text:'Tether severed. Your offspring hunts alone.'});return true;}
  }
  const cost=COSTS[kind];if(cost===undefined)return false;
  if(this.allies.length>=10){this.event('message',{text:'Colony limit reached. Reabsorb with X.'});return false;}
  if(!this.canSpend(cost)){this.event('message',{text:`Need ${cost+12}g total to split safely. Feed on glowing remains.`});return false;}
  this.player.mass-=cost;
  const hp=(kind==='tower'?110:kind==='shield'?80:60)*this.stats.allyHealth;
  this.allies.push({id:this.nextId++,kind,x:this.player.x,y:this.player.y,mass:cost,hp,maxHp:hp,angle:this.random()*Math.PI*2,fire:0,hit:0});
  this.event('bud',{x:this.player.x,y:this.player.y});
  this.event('message',{text:kind==='shield'?'Shield grown. Press E to detach it as a drone.':kind==='tower'?'Tower rooted. It will defend this ground.':'Drone released. It hunts nearby hostiles.'});return true;
 }
 shoot(origin,target,damage,friendly=true,speed=550){
  const angle=Math.atan2(target.y-origin.y,target.x-origin.x);
  this.bullets.push({x:origin.x,y:origin.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.8,damage,friendly});
 }
 nearest(origin,range){let best=null,d=range;for(const e of this.enemies){if(e.hp<=0)continue;const nd=dist(origin,e);if(nd<d){best=e;d=nd;}}return best;}
 spawnEnemy(kind){
  const a=this.random()*Math.PI*2;
  const types={crawler:{hp:25,speed:39,r:13,damage:6,mass:9},runner:{hp:18,speed:70,r:10,damage:5,mass:7},spitter:{hp:39,speed:30,r:17,damage:6,mass:12},brute:{hp:100,speed:24,r:25,damage:12,mass:22},boss:{hp:650,speed:15,r:49,damage:22,mass:75}};
  const t=types[kind];const scale=1+(this.wave-1)*.13;
  const e={id:this.nextId++,kind,x:clamp(this.nest.x+Math.cos(a)*760,25,1475),y:clamp(this.nest.y+Math.sin(a)*560,25,975),...t,hp:t.hp*scale,maxHp:t.hp*scale,attack:0,hit:0,angle:a+Math.PI,seed:this.random()*10};
  this.enemies.push(e);return e;
 }
 kill(e){
  this.kills++;this.event('death',{x:e.x,y:e.y,r:e.r});
  const n=e.kind==='boss'?15:e.kind==='brute'?6:3;
  for(let i=0;i<n;i++){const a=this.random()*Math.PI*2,r=this.random()*e.r*1.5;this.food.push({x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r,mass:e.mass/n,xp:e.mass/n,hue:e.kind==='spitter'?1:e.kind==='brute'?2:0,age:0});}
 }
 hurtPlayer(amount){this.player.mass-=amount*this.stats.armor;this.player.hit=.3;this.event('hurt');}
 mutate(id){
  if(this.phase!=='mutation'||!this.choices.some(m=>m.id===id))return false;
  const mutation=MUTATIONS.find(m=>m.id===id);mutation.apply(this);this.mutations.push(id);this.level++;this.phase='playing';this.event('message',{text:`${mutation.name} integrated.`});return true;
 }
 tick(dt,input={}){
  if(this.phase!=='playing')return;
  dt=clamp(dt,0,.05);this.time+=dt;const p=this.player;
  p.hit=Math.max(0,p.hit-dt);p.fire=Math.max(0,p.fire-dt);this.nest.hit=Math.max(0,this.nest.hit-dt);
  this.nest.hp=Math.min(100,this.nest.hp+this.stats.regen*dt);
  const mx=input.x||0,my=input.y||0,len=Math.hypot(mx,my);
  if(len>0){p.x=clamp(p.x+mx/Math.max(1,len)*this.stats.speed*dt,30,1470);p.y=clamp(p.y+my/Math.max(1,len)*this.stats.speed*dt,35,965);p.angle=Math.atan2(my,mx);}
  const head=this.trail[0];if(dist(p,head)>4){this.trail.unshift({x:p.x,y:p.y});if(this.trail.length>240)this.trail.pop();}
  const target=input.fire?input.aim:input.auto?this.nearest(p,480):null;
  if(target&&p.fire<=0&&this.canSpend(this.stats.shotCost)){this.shoot(p,target,this.stats.damage);p.mass-=this.stats.shotCost;p.fire=this.stats.interval;this.event('shot');}
  if(this.spawnQueue>0){this.spawnClock-=dt;if(this.spawnClock<=0){
   let kind='crawler';const n=this.random();if(this.wave>=2&&n<.3)kind='runner';if(this.wave>=3&&n>.68)kind='spitter';if(this.wave>=4&&n>.84)kind='brute';
   if(this.wave===6&&!this.bossSpawned){kind='boss';this.bossSpawned=true;}
   this.spawnEnemy(kind);this.spawnQueue--;this.spawnClock=Math.max(.38,1.8-this.wave*.17);
  }}
  for(const a of this.allies){
   a.hit=Math.max(0,a.hit-dt);a.fire-=dt;
   if(a.kind==='shield'){a.angle+=dt*1.5;const orbit=this.radius()+58;a.x=p.x+Math.cos(a.angle)*orbit;a.y=p.y+Math.sin(a.angle)*orbit;}
   const enemy=this.nearest(a,a.kind==='tower'?420:360);
   if(a.kind==='drone'){
    let tx,ty;if(enemy){const d=dist(a,enemy);tx=enemy.x+(a.x-enemy.x)/Math.max(1,d)*125;ty=enemy.y+(a.y-enemy.y)/Math.max(1,d)*125;}else{a.angle+=dt*.5;tx=p.x+Math.cos(a.angle)*120;ty=p.y+Math.sin(a.angle)*120;}
    const d=Math.hypot(tx-a.x,ty-a.y);if(d>5){a.x+=(tx-a.x)/d*Math.min(d,145*dt);a.y+=(ty-a.y)/d*Math.min(d,145*dt);}
   }
   if(enemy&&a.kind!=='shield'&&a.fire<=0){this.shoot(a,enemy,(a.kind==='tower'?21:12)*this.stats.allyDamage);a.fire=a.kind==='tower'?.62:.8;}
   if(a.kind==='shield')for(const e of this.enemies){if(e.hp>0&&dist(a,e)<e.r+17){e.hp-=42*this.stats.allyDamage*dt;a.hp-=10*dt;e.hit=.12;const d=Math.max(1,dist(a,e));e.x+=(e.x-a.x)/d*75*dt;e.y+=(e.y-a.y)/d*75*dt;}}
  }
  for(const e of this.enemies){
   if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);e.attack-=dt;
   let target=this.nest;let nearest=dist(e,this.nest);
   if(dist(e,p)<165&&dist(e,p)<nearest){target=p;nearest=dist(e,p);}
   for(const a of this.allies){const d=dist(e,a);if(a.hp>0&&d<115&&d<nearest){target=a;nearest=d;}}
   e.angle=Math.atan2(target.y-e.y,target.x-e.x);
   const targetR=target===this.nest?43:target===p?this.radius():17;
   const ranged=e.kind==='spitter';
   if(nearest>e.r+targetR+(ranged?180:0)){e.x+=Math.cos(e.angle)*e.speed*dt;e.y+=Math.sin(e.angle)*e.speed*dt;}
   else if(e.attack<=0){
    e.attack=ranged?2.2:1.1;
    if(ranged)this.shoot(e,target,e.damage,false,180);
    else if(target===p)this.hurtPlayer(e.damage);
    else {target.hp-=e.damage*(target===this.nest?this.stats.armor:1);target.hit=.3;if(target===this.nest)this.event('nesthurt');}
   }
  }
  for(const b of this.bullets){
   b.life-=dt;const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
   // Swept segment collision prevents fast projectiles tunnelling through small enemies.
   const hits=(entity,r)=>{const dx=b.x-ox,dy=b.y-oy,l=dx*dx+dy*dy;const t=l?clamp(((entity.x-ox)*dx+(entity.y-oy)*dy)/l,0,1):0;return Math.hypot(entity.x-ox-dx*t,entity.y-oy-dy*t)<r+3;};
   if(b.friendly){for(const e of this.enemies){if(e.hp>0&&hits(e,e.r)){e.hp-=b.damage;e.hit=.13;b.life=0;this.event('impact',{x:b.x,y:b.y});break;}}}
   else {
    const ally=this.allies.find(a=>a.hp>0&&hits(a,18));
    if(ally){ally.hp-=b.damage;ally.hit=.2;b.life=0;}
    else if(hits(p,this.radius())){this.hurtPlayer(b.damage);b.life=0;}
    else if(hits(this.nest,43)){this.nest.hp-=b.damage*this.stats.armor;this.nest.hit=.3;b.life=0;this.event('nesthurt');}
   }
  }
  this.bullets=this.bullets.filter(b=>b.life>0);
  for(const e of this.enemies)if(e.hp<=0)this.kill(e);
  this.enemies=this.enemies.filter(e=>e.hp>0);
  for(const a of this.allies)if(a.hp<=0)this.event('allydeath',{x:a.x,y:a.y});
  this.allies=this.allies.filter(a=>a.hp>0);
  this.food=this.food.filter(f=>{
   f.age+=dt;const d=dist(p,f);if(d<this.stats.vacuum+this.radius()){const force=240+400*(1-d/(this.stats.vacuum+this.radius()));f.x+=(p.x-f.x)/Math.max(1,d)*force*dt;f.y+=(p.y-f.y)/Math.max(1,d)*force*dt;}
   if(dist(p,f)<this.radius()+7){p.mass+=f.mass;this.xp+=f.xp;this.harvested+=f.mass;this.event('eat',{x:f.x,y:f.y,mass:f.mass});return false;}return f.age<100;
  });
  this.peak=Math.max(this.peak,p.mass);
  if(p.mass<6||this.nest.hp<=0){this.phase='lost';this.event('end',{won:false,reason:this.nest.hp<=0?'nest':'body'});return;}
  if(this.spawnQueue===0&&this.enemies.length===0){
   if(this.intermission===0){this.intermission=7;this.nest.hp=Math.min(100,this.nest.hp+8);this.event('clear',{wave:this.wave});}
   this.intermission-=dt;
   if(this.intermission<=0){if(this.wave===6){this.phase='won';this.event('end',{won:true});return;}this.startWave();}
  }
  if(this.xp>=this.xpGoal){this.xp-=this.xpGoal;this.xpGoal=Math.round(this.xpGoal*1.45);this.phase='mutation';const pool=[...MUTATIONS];for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}this.choices=pool.slice(0,3);this.event('mutation');}
 }
}
