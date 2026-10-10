import { PARTS, SPECIES, TOWERS, hash, biomeAt } from './content.js';
const TAU=Math.PI*2;
const PAL={dark:'#190f1c',blood:'#612536',meat:'#9b4358',light:'#d1747e',fat:'#d8ad96',bone:'#ded0ac',acid:'#c0ce76',shadow:'#090e1380'};
export class PixelWorld {
 constructor(canvas,game){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.game=game;this.camera={x:0,y:0};this.time=0;this.shake=0;this.particles=[];this.stains=[];this.lastTrail=0;this.resize();}
 resize(){this.pixelSize=innerWidth<700?2:3;this.w=Math.ceil(innerWidth/this.pixelSize);this.h=Math.ceil(innerHeight/this.pixelSize);this.canvas.width=this.w;this.canvas.height=this.h;this.ctx.imageSmoothingEnabled=false;}
 reset(){this.camera={x:0,y:0};this.particles=[];this.stains=[];}
 worldToPixel(x,y,z=0){return{x:Math.round((x-this.camera.x)*this.zoom+this.w*(innerWidth<900?.5:.57)),y:Math.round((y-this.camera.y)*this.zoom+this.h*.46-z)};}
 screenToWorld(x,y){return{x:(x/this.pixelSize-this.w*(innerWidth<900?.5:.57))/this.zoom+this.camera.x,y:(y/this.pixelSize-this.h*.46)/this.zoom+this.camera.y};}
 rect(x,y,w,h,color){this.ctx.fillStyle=color;this.ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
 line(x,y,xx,yy,color,width=1){const dx=xx-x,dy=yy-y,steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy)))),c=this.ctx,w=Math.max(1,Math.round(width));c.fillStyle=color;for(let i=0;i<=steps;i++){const u=i/steps;c.fillRect(Math.round(x+dx*u-w/2),Math.round(y+dy*u-w/2),w,w);}}
 ellipse(x,y,rx,ry,color){rx=Math.max(1,Math.round(rx));ry=Math.max(1,Math.round(ry));x=Math.round(x);y=Math.round(y);const c=this.ctx;c.fillStyle=color;for(let yy=-ry;yy<=ry;yy++){const xx=Math.round(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));c.fillRect(x-xx,y+yy,xx*2+1,1);}}
 text(text,x,y,color='#a89990',size=4,align='center'){this.ctx.font=`${size}px monospace`;this.ctx.textAlign=align;this.ctx.fillStyle=color;this.ctx.fillText(text,Math.round(x),Math.round(y));}
 flesh(x,y,r,seed=0,palette=null){const c=palette||[PAL.meat,PAL.light,PAL.fat],pulse=1+Math.sin(this.time*3+seed)*.06,rx=r*pulse,ry=r*.78;this.ellipse(x,y+2,rx+2,ry+1,PAL.dark);this.ellipse(x,y,rx,ry,c[0]);this.ellipse(x-2,y-2,rx*.7,ry*.7,c[1]);this.ellipse(x+rx*.25,y+ry*.2,rx*.58,ry*.55,c[0]);this.line(x-r*.55,y-r*.25,x-r*.1,y-r*.52,c[2],1);this.rect(x-r*.35,y-r*.4,2,1,'#f2d3b1');for(let i=0;i<3;i++){const a=i*2.4+seed;this.rect(x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.4,1,2,PAL.blood);}}
 mouth(x,y,r,seed=0){const open=.35+Math.sin(this.time*3+seed)*.08;this.ellipse(x,y,r+1,r*open+2,'#562234');this.ellipse(x,y,r,r*open,'#130e18');for(let i=0;i<6;i++){const dx=(i-2.5)*r*.3;this.rect(x+dx,y-r*open,1,2,PAL.bone);this.rect(x+dx+1,y+r*open-1,1,2,'#ae9885');}this.rect(x+r*.2,y+1,2,2,'#a5526a');}
 eye(x,y,r=2){this.ellipse(x,y,r+1,r,'#612536');this.ellipse(x,y,r,Math.max(1,r*.65),'#e8cea6');this.rect(x,y-1,1,2,'#251623');}
 tentacle(a,b,width=4,seed=0,color=PAL.meat){let prev=a;const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy));for(let i=1;i<=12;i++){const t=i/12,wave=Math.sin(t*6-this.time*3+seed)*Math.sin(t*Math.PI)*d*.16,p={x:a.x+dx*t-dy/d*wave,y:a.y+dy*t+dx/d*wave},w=Math.max(1,width*(1-t*.9));this.line(prev.x,prev.y,p.x,p.y,PAL.dark,w+2);this.line(prev.x,prev.y,p.x,p.y,color,w);if(i<9)this.line(prev.x-1,prev.y-1,p.x-1,p.y-1,'#d0928b',1);prev=p;}}
 // These exact anatomy sprites are used in enemies, corpses and grafts.
 part(kind,x,y,size=1,seed=0){const u=Math.max(.65,size),r=n=>n*u;
  if(kind==='human_head'){this.rect(x-r(5),y-r(7),r(10),r(12),'#593345');this.rect(x-r(4),y-r(7),r(8),r(9),'#c38e80');this.rect(x-r(4),y-r(8),r(9),r(3),'#514046');this.rect(x-r(3),y-r(3),r(2),r(2),'#292431');this.rect(x+r(2),y-r(3),r(2),r(2),'#292431');this.mouth(x,y+r(4),r(5),seed);this.line(x,y+r(8),x+r(3),y+r(13),'#a94c65',r(3));}
  else if(kind==='human_arm'||kind==='dog_leg'){const a=Math.sin(this.time*2+seed)*.3;this.line(x,y,x+r(5),y+r(8),PAL.dark,r(6));this.line(x,y,x+r(5),y+r(8),kind==='human_arm'?'#b88377':'#82675b',r(4));this.line(x+r(5),y+r(8),x+r(7+a*9),y+r(15),'#d0a58e',r(3));for(let i=0;i<3;i++)this.line(x+r(5+i*2),y+r(14),x+r(4+i*3),y+r(18),PAL.bone,1);}
  else if(kind==='dog_jaw'||kind==='deer_skull'){this.ellipse(x,y,r(8),r(5),kind==='dog_jaw'?'#9c7767':'#c5b49a');this.rect(x-r(9),y-r(5),r(5),r(6),'#70534e');this.rect(x+r(4),y-r(3),r(9),r(6),'#bea18a');this.rect(x+r(11),y-r(3),r(3),r(3),'#30202a');this.eye(x+r(1),y-r(3),r(1));this.mouth(x+r(6),y+r(2),r(6),seed);}
  else if(kind==='antler'){this.flesh(x,y,r(6),seed);for(const side of [-1,1]){this.line(x+side*r(2),y,x+side*r(10),y-r(13),PAL.bone,r(2));this.line(x+side*r(7),y-r(8),x+side*r(15),y-r(10),PAL.bone,1);this.line(x+side*r(6),y-r(7),x+side*r(6),y-r(16),PAL.bone,1);this.line(x+side*r(10),y-r(13),x+side*r(13),y-r(19),'#a38b7f',1);}}
  else if(kind==='ribcage'||kind==='human_torso'){this.flesh(x,y,r(11),seed);this.line(x,y-r(10),x,y+r(11),PAL.bone,r(2));for(let i=-2;i<=2;i++){const yy=y+r(i*4);this.line(x-r(8),yy+r(2),x,yy,PAL.bone,1);this.line(x,yy,x+r(8),yy+r(2),PAL.bone,1);}if(kind==='human_torso')this.mouth(x+r(2),y+r(6),r(5),seed);}
  else if(kind==='eye_cluster'){this.flesh(x,y,r(8),seed);for(let i=0;i<4;i++){const a=i*2.4;this.eye(x+Math.cos(a)*r(5),y+Math.sin(a)*r(4),r(2));}}
  else if(kind==='bile_sac'){this.flesh(x,y,r(10),seed,['#667440','#a6b663','#d5d99a']);this.mouth(x,y+r(3),r(4),seed);this.rect(x+r(4),y-r(5),2,2,'#e8e3a6');}
  else if(kind==='tendril'){this.flesh(x,y,r(5),seed);this.tentacle({x,y},{x:x+r(20),y:y+r(Math.sin(this.time+seed)*16)},r(7),seed);}
  else{this.flesh(x,y,r(kind==='core'?15:kind==='maw'?13:9),seed);this.mouth(x,y,r(kind==='core'?8:6),seed);if(kind==='core'){this.eye(x-r(8),y-r(8),2);this.eye(x+r(10),y-r(4),2);}}
 }
 event(e){if(['death','allydeath','colonydeath'].includes(e.type)){this.stains.push({x:e.x,y:e.y,r:(e.r||12)*1.4,seed:this.time,life:80});if(this.stains.length>160)this.stains.shift();}
  if(['death','eat','impact','graft','bud','colony','hurt'].includes(e.type)){const count=e.type==='death'?16:e.type==='graft'?12:5;for(let i=0;i<count;i++)this.particles.push({x:e.x??this.game.player.x,y:e.y??this.game.player.y,vx:(Math.random()-.5)*90,vy:(Math.random()-.5)*90,z:4,vz:Math.random()*30,life:.3+Math.random()*.6,color:e.type==='eat'?'#c8bc8a':e.kind==='acid'?'#a9bf69':'#bd6379'});if(this.particles.length>600)this.particles.splice(0,this.particles.length-600);}
  if(e.type==='hurt'||e.type==='nesthurt')this.shake=2;
 }
 ground(){const c=this.ctx,biome=biomeAt(this.camera.x,this.camera.y),bg=['#172321','#202229','#252029'][biome];this.rect(0,0,this.w,this.h,bg);
  const min=this.screenToWorld(0,0),max=this.screenToWorld(innerWidth,innerHeight),tile=64;
  for(let x=Math.floor(min.x/tile)-1;x<=Math.ceil(max.x/tile)+1;x++)for(let y=Math.floor(min.y/tile)-1;y<=Math.ceil(max.y/tile)+1;y++){
   const xx=x*tile,yy=y*tile,p=this.worldToPixel(xx,yy),z=hash(x,y,10),b=biomeAt(xx,yy),sz=tile*this.zoom;
   this.rect(p.x,p.y,sz+1,sz+1,b===0?(z>.5?'#182623':'#162320'):b===1?(z>.5?'#25272c':'#22252a'):(z>.5?'#29212b':'#251f27'));
   if(b===1){this.line(p.x,p.y,p.x+sz,p.y,'#303038',1);this.line(p.x,p.y,p.x,p.y+sz,'#303038',1);if(z>.87){this.rect(p.x+8,p.y+8,sz-18,sz-18,'#111923');this.line(p.x+8,p.y+8,p.x+sz-10,p.y+8,'#4b494a',2);this.line(p.x+8,p.y+8,p.x+8,p.y+sz-10,'#35383e',2);}}
   for(let i=0;i<9;i++){const dx=hash(x,y,i+20)*sz,dy=hash(x,y,i+40)*sz;this.rect(p.x+dx,p.y+dy,1+hash(x,y,i+60)*2,1,b===2?'#51303d':b===0?'#344135':'#3c3c42');}
   if(z>.76&&b!==1){const bx=p.x+sz*.45,by=p.y+sz*.5,r=(7+z*8)*this.zoom;this.ellipse(bx,by+4,r*.8,r*.35,'#0b1418');this.rect(bx-2,by-r*.5,3,r*.8,'#514238');for(let i=0;i<4;i++){const a=i*2.4;this.ellipse(bx+Math.cos(a)*r*.4,by-r*.7+Math.sin(a)*r*.35,r*.5,r*.48,b===0?'#344033':'#523545');}this.rect(bx-r*.3,by-r,3,2,b===0?'#4b5140':'#7b4a55');}
   if(z<.09){this.line(p.x+sz*.2,p.y+sz*.7,p.x+sz*.55,p.y+sz*.3,'#49303d',3);this.line(p.x+sz*.4,p.y+sz*.5,p.x+sz*.7,p.y+sz*.6,'#704052',1);}
  }
  for(const st of this.stains){const p=this.worldToPixel(st.x,st.y),r=st.r*this.zoom;this.ellipse(p.x,p.y,r,r*.65,'#512537');for(let i=0;i<6;i++){const a=i*2.4+st.seed;this.rect(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.7,3,2,'#702d43');}}
  for(const pool of this.game.pools){const p=this.worldToPixel(pool.x,pool.y),r=pool.r*this.zoom;this.ellipse(p.x,p.y,r,r*.7,'#54643d');this.ellipse(p.x-2,p.y-2,r*.8,r*.52,'#738449');for(let i=0;i<8;i++){const a=i*2.4+this.time*.2;this.rect(p.x+Math.cos(a)*r*.7,p.y+Math.sin(a)*r*.4,2,2,'#c7ce84');}}
 }
 organism(){const g=this.game,u=g.bodyScale()*this.zoom,byId=new Map(g.body.map(n=>[n.id,n]));
  for(const n of g.body){const p=this.worldToPixel(n.x,n.y);this.ellipse(p.x,p.y+6,n.size*u,n.size*u*.65,'#09101990');}
  for(const n of g.body){if(n.parent===null)continue;const parent=byId.get(n.parent),a=this.worldToPixel(parent.x,parent.y,3),b=this.worldToPixel(n.x,n.y,3);this.tentacle(a,b,Math.max(5,n.size*u*.9),n.id,'#813148');}
  for(const n of [...g.body].sort((a,b)=>a.y-b.y)){const p=this.worldToPixel(n.x,n.y,4),r=n.size*u;for(let i=0;i<2;i++){const a=n.angle+i*2.5,end={x:p.x+Math.cos(a)*(r+14),y:p.y+Math.sin(a)*(r+14)};this.tentacle(p,end,Math.max(2,4*u),n.id+i);}
   this.part(n.kind,p.x,p.y,u*(1+(n.level-1)*.05),n.id);
   const colors={acid:'#c7c38a',bone:'#e9d4b1',parasite:'#b999c3',tongue:'#db7f8e',blood:'#ef535e',spore:'#91b77b',scream:'#d2bbc6'};
   this.rect(p.x-2,p.y-r-4,4,2,colors[n.weapon]);
   for(let i=0;i<n.level;i++)this.rect(p.x-n.level*2+i*4,p.y+r+3,2,1,'#d9bd8f');
   if(n.id===g.selectedPartId){const r2=r+4;for(const side of [-1,1]){this.line(p.x+side*r2,p.y-4,p.x+side*r2,p.y+4,'#eee2b1',1);this.line(p.x-4,p.y+side*r2,p.x+4,p.y+side*r2,'#eee2b1',1);}}

   // Every acquired piece can sprout a weapon orifice, not just the original head.
   const angle=n.aim,m={x:p.x+Math.cos(angle)*r*.5,y:p.y+Math.sin(angle)*r*.45};
   if(n.flash>0){this.flesh(m.x,m.y,5*u,n.id,['#ac7380','#e2a1a1','#f3dab3']);this.mouth(m.x,m.y,4*u,n.id);if(n.weapon==='bone')for(let i=-1;i<=1;i++)this.line(m.x,m.y,m.x+Math.cos(angle+i*.3)*12*u,m.y+Math.sin(angle+i*.3)*12*u,PAL.bone,1);}
   else if(n.id%3===0)this.mouth(m.x,m.y,3*u,n.id);
  }
  if(g.player.hit>0){const p=this.worldToPixel(g.player.x,g.player.y);this.rect(p.x-2,p.y-2,4,4,'#ffd4bb');}
 }
 human(e,p,u,corpse=false){const t=this.time,equipped=e.kind==='soldier',coat=equipped?'#536e66':'#9a7464',step=Math.sin(t*8+e.seed)*2*u;
  this.line(p.x-3*u,p.y,p.x-4*u,p.y+10*u+step,'#322f39',3*u);this.line(p.x+3*u,p.y,p.x+4*u,p.y+10*u-step,'#322f39',3*u);
  this.rect(p.x-5*u,p.y-10*u,10*u,13*u,coat);this.rect(p.x-3*u,p.y-9*u,2*u,11*u,'#bd947e');this.line(p.x-5*u,p.y-7*u,p.x-10*u,p.y+1*u+step,'#b98f7b',2*u);this.line(p.x+5*u,p.y-7*u,p.x+10*u,p.y-1*u-step,'#b98f7b',2*u);
  this.part('human_head',p.x,p.y-15*u,.6*u,e.seed);if(equipped){this.rect(p.x-5*u,p.y-21*u,10*u,3*u,'#6c8273');const dx=Math.cos(e.angle)*12*u,dy=Math.sin(e.angle)*12*u;this.line(p.x+4*u,p.y-6*u,p.x+4*u+dx,p.y-6*u+dy,'#29292f',3*u);this.rect(p.x+dx,p.y-6*u+dy,3,1,'#cbb391');}
  else{this.line(p.x-2*u,p.y-8*u,p.x+3*u,p.y+2*u,'#9f475a',2*u);this.rect(p.x-4*u,p.y-4*u,3*u,2*u,'#d6b199');}
 }
 enemy(e){const p=this.worldToPixel(e.x,e.y,3),u=this.zoom,phase=this.time*7+e.seed;this.ellipse(p.x,p.y+7*u,e.r*u*1.1,e.r*u*.45,'#080e1490');
  if(e.kind==='human'||e.kind==='soldier')this.human(e,p,u);
  else if(e.kind==='dog'||e.kind==='deer'){const deer=e.kind==='deer';for(let i=0;i<4;i++){const xx=p.x+(i<2?-7:6)*u,yy=p.y+(i%2?3:-1)*u;this.line(xx,yy,xx+Math.sin(phase+i)*3*u,yy+(deer?14:8)*u,'#8b6c5d',2*u);}this.ellipse(p.x,p.y-2*u,(deer?13:11)*u,6*u,deer?'#8c7967':'#82605b');this.line(p.x-10*u,p.y-2*u,p.x-17*u,p.y-8*u,'#a17768',2*u);this.part(deer?'deer_skull':'dog_jaw',p.x+10*u,p.y-6*u,.7*u,e.seed);if(deer)this.part('antler',p.x+12*u,p.y-12*u,.65*u,e.seed);this.rect(p.x-4*u,p.y-5*u,5*u,3*u,'#a7485d');}
  else{const r=e.r*u,boss=e.kind==='boss';for(let i=0;i<(boss?9:5);i++){const a=i*2.4+e.seed,end={x:p.x+Math.cos(a)*(r+12),y:p.y+Math.sin(a)*(r+12)};this.tentacle(p,end,boss?7*u:3*u,i,'#a6566b');}
   this.flesh(p.x,p.y,r,e.seed);if(boss){for(let i=0;i<6;i++){const a=i*2.4;this.part(i%2?'human_head':'ribcage',p.x+Math.cos(a)*r*.65,p.y+Math.sin(a)*r*.6,.8*u,i);}this.mouth(p.x,p.y,r*.65,e.seed);}
   else this.part(e.kind==='spitter'?'bile_sac':e.kind==='brute'?'ribcage':'human_torso',p.x,p.y,e.kind==='brute'?1.4*u:1*u,e.seed);
  }
  if(e.hit>0)this.rect(p.x-1,p.y-3,3,3,'#f7dfb3');
  if(e.hp<e.maxHp||e.kind==='boss'){const y=p.y-(e.kind==='human'||e.kind==='soldier'?27:e.r+10)*u,w=Math.max(10,e.r*2*u);this.rect(p.x-w/2,y,w,1,'#411f32');this.rect(p.x-w/2,y,w*Math.max(0,e.hp/e.maxHp),1,'#d36e82');if(e.kind==='boss')this.text('THE CONGREGATION',p.x,y-4,'#d79da1',4);}
 }
 colony(c){const p=this.worldToPixel(c.x,c.y),u=this.zoom;for(let i=0;i<10;i++){const a=i*2.4,end={x:p.x+Math.cos(a)*42*u,y:p.y+Math.sin(a)*36*u};this.tentacle(p,end,5*u,i,'#79504f');}this.flesh(p.x,p.y-4,24*u,c.id,['#60333f','#a76168','#cf9e88']);this.part('ribcage',p.x,p.y-4,1.45*u,c.id);this.mouth(p.x,p.y-6,12*u,c.id);this.eye(p.x-16*u,p.y-14*u,3*u);this.eye(p.x+14*u,p.y-9*u,3*u);
  this.text('COLONY '+String(this.game.colonies.indexOf(c)+1).padStart(2,'0'),p.x,p.y+26*u,'#d3c38d',4);this.rect(p.x-16*u,p.y+30*u,32*u,2,'#422a32');this.rect(p.x-16*u,p.y+30*u,32*u*Math.max(0,c.hp/c.maxHp),2,'#afa36c');
 }
 ally(a){const p=this.worldToPixel(a.x,a.y,3),u=this.zoom;if(a.kind==='shield'){const core=this.worldToPixel(this.game.player.x,this.game.player.y);this.tentacle(core,p,3*u,a.id);this.flesh(p.x,p.y,10*u,a.id,['#64683f','#a5ac75','#dfd5a5']);this.part('antler',p.x,p.y,.6*u,a.id);}
  else if(a.kind==='drone'){this.tentacle(p,{x:p.x-18*u,y:p.y+Math.sin(this.time*5+a.id)*9*u},5*u,a.id);this.part('dog_jaw',p.x,p.y,.8*u,a.id);this.eye(p.x-3*u,p.y-4*u,2*u);}
  else{for(let i=0;i<5;i++){const angle=i*2.4;this.tentacle(p,{x:p.x+Math.cos(angle)*21*u,y:p.y+Math.sin(angle)*17*u},4*u,i);}const part={spitter:'bile_sac',harpoon:'ribcage',brood:'eye_cluster',maw:'maw'}[a.tower];this.part(part,p.x,p.y-4*u,1.1*u,a.id);if(a.tower==='harpoon')this.line(p.x,p.y-5*u,p.x,p.y-25*u,PAL.bone,3*u);if(a.tower==='brood')for(let i=0;i<3;i++)this.flesh(p.x+(i-1)*8*u,p.y-15*u,4*u,i);this.text(TOWERS.find(t=>t.id===a.tower).name.toUpperCase(),p.x,p.y+21*u,'#aa9290',3);}
  if(a.hp<a.maxHp){this.rect(p.x-8,p.y+13,16,1,'#422332');this.rect(p.x-8,p.y+13,16*Math.max(0,a.hp/a.maxHp),1,'#bea982');}
 }
 weapons(){for(const b of this.game.bullets){const p=this.worldToPixel(b.x,b.y,4),a=Math.atan2(b.vy,b.vx),u=this.zoom;if(b.kind==='parasite'){this.tentacle(p,{x:p.x-Math.cos(a)*10*u,y:p.y-Math.sin(a)*10*u},3*u,b.life);this.flesh(p.x,p.y,3*u,b.life);this.eye(p.x,p.y,1);}else if(b.kind==='bone'||b.kind==='round'){this.line(p.x,p.y,p.x-Math.cos(a)*7*u,p.y-Math.sin(a)*7*u,b.kind==='round'?'#f0c789':PAL.bone,1);}
   else{this.ellipse(p.x,p.y,(b.kind==='spore'?5:3)*u,3*u,b.friendly?PAL.acid:'#d16c91');this.rect(p.x-1,p.y-1,1,1,'#e9dfae');}}
  for(const l of this.game.lashes){const p=this.worldToPixel(l.x,l.y,4),len=l.length*this.zoom,progress=1-l.life/l.maxLife;if(l.kind==='tongue'){this.tentacle(p,{x:p.x+Math.cos(l.angle)*len*Math.sin(progress*Math.PI),y:p.y+Math.sin(l.angle)*len*Math.sin(progress*Math.PI)},9*this.zoom,progress*8,'#b85572');}
   else if(l.kind==='blood'){this.line(p.x,p.y,p.x+Math.cos(l.angle)*len,p.y+Math.sin(l.angle)*len,'#992d4e',4*this.zoom);this.line(p.x,p.y,p.x+Math.cos(l.angle)*len,p.y+Math.sin(l.angle)*len,'#e08994',1);}
   else{const r=len*progress;for(let i=0;i<40;i++){const a=i/40*TAU;this.rect(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,2,2,'#e3be9a');}}}
 }
 render(dt){this.time+=dt;const g=this.game;this.zoom=(innerWidth<700?.66:.83)*Math.max(.65,1-(g.body.length-5)*.006);this.camera.x+=(g.player.x-this.camera.x)*Math.min(1,dt*8);this.camera.y+=(g.player.y-this.camera.y)*Math.min(1,dt*8);this.ctx.save();if(this.shake>0){this.ctx.translate(Math.round((Math.random()-.5)*this.shake),Math.round((Math.random()-.5)*this.shake));this.shake=Math.max(0,this.shake-dt*8);}this.ground();
  if(g.phase==='playing'&&this.time-this.lastTrail>.5){this.lastTrail=this.time;this.stains.push({x:g.player.x,y:g.player.y,r:6,seed:this.time,life:15});if(this.stains.length>160)this.stains.shift();}
  const visible=e=>{const p=this.worldToPixel(e.x,e.y);return p.x>-80&&p.y>-80&&p.x<this.w+80&&p.y<this.h+80;};
  for(const f of g.food)if(visible(f)){const p=this.worldToPixel(f.x,f.y),u=this.zoom;this.ellipse(p.x,p.y+2,7*u,4*u,'#6b3545');if(f.organ){this.part(f.kind,p.x,p.y-2,.55*u,f.id);if(Math.sin(this.time*3+f.id)>.4)this.rect(p.x+7*u,p.y-9*u,2,2,'#d1c78f');}else{this.flesh(p.x,p.y,3*u,f.id);}}
  const objects=[...g.colonies.filter(visible).map(e=>({y:e.y,draw:()=>this.colony(e)})),...g.enemies.filter(visible).map(e=>({y:e.y,draw:()=>this.enemy(e)})),...g.allies.filter(visible).map(e=>({y:e.y,draw:()=>this.ally(e)})),{y:g.player.y,draw:()=>this.organism()}];objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());this.weapons();
  for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=70*dt;const pos=this.worldToPixel(p.x,p.y,Math.max(0,p.z));this.rect(pos.x,pos.y,p.life>.3?2:1,1,p.color);}this.particles=this.particles.filter(p=>p.life>0);this.ctx.restore();
  // Navigable colony beacons stay visible even while their simulation is dormant far away.
  for(const c of g.colonies.slice(-5)){const p=this.worldToPixel(c.x,c.y);if(p.x<8||p.x>this.w-8||p.y<27||p.y>this.h-68){const x=Math.max(9,Math.min(this.w-9,p.x)),y=Math.max(30,Math.min(this.h-72,p.y));this.rect(x-2,y-2,5,5,'#b8ad70');this.rect(x-1,y-1,3,3,'#453b39');this.text(Math.round(Math.hypot(c.x-g.player.x,c.y-g.player.y))+'m',x,y+8,'#d5c58e',4);}}
 }
}
