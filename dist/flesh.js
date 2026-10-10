// A shared procedural tissue renderer. The silhouettes, mouths and appendages animate
// continuously; weapon anatomy is driven by the same weapon ID as the simulation.
export function createFleshRenderer(h){
 const {ctx,screen,ellipse,blob,worldCircle,glow,path,game}=h,TAU=Math.PI*2;
 const flesh=['#dbc1a0','#927463','#38292d'],pink=['#d6aa9e','#9c565d','#38202c'],sick=['#d1d7a1','#88966b','#303b30'];
 let stains=[],mucus=[],lastTrail=0;
 const t=()=>h.time(),s=()=>h.scale(),point=(p,a,d)=>({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d});
 function tentacle(from,to,width,seed=0,color='#926e69',curl=.4){
  const time=t(),a=screen(from.x,from.y,8),b=screen(to.x,to.y,6),dx=b.x-a.x,dy=b.y-a.y,len=Math.max(1,Math.hypot(dx,dy)),nx=-dy/len,ny=dx/len,points=[];
  for(let i=0;i<=14;i++){const u=i/14,wave=Math.sin(u*TAU*1.15-time*2.5+seed)*Math.sin(u*Math.PI)*len*curl;points.push({x:a.x+dx*u+nx*wave,y:a.y+dy*u+ny*wave-10*s()*Math.sin(u*Math.PI)});}
  const left=[],right=[];
  for(let i=0;i<points.length;i++){const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next.x-prev.x,dy=next.y-prev.y,d=Math.max(.01,Math.hypot(dx,dy)),w=width*s()*Math.pow(1-i/15,1.2)*.5;left.push({x:points[i].x-dy/d*w,y:points[i].y+dx/d*w});right.push({x:points[i].x+dy/d*w,y:points[i].y-dx/d*w});}
  path([...left,...right.reverse()],'#33212b88',Math.max(.5,s()),color);
  path(points.map(p=>({x:p.x-s()*.6,y:p.y-s()*.8})),'#ead5b259',Math.max(.45,width*s()*.11));
  if(width>7)for(const i of [4,8]){const w=width*s()*(1-i/16);ellipse(points[i].x+nx*w*.2,points[i].y+ny*w*.2,w*.22,w*.15,'#4c2835','#e3aa9760',.6);}

 }
 function tissue(x,y,r,seed=0,palette=flesh,z=10){
  blob(x,y,r,palette,seed,z,1.4);const p=screen(x,y,z),R=r*s();
  // Subsurface veins, asymmetric folds, and tight specular highlights make the mass wet.
  for(let i=0;i<3;i++){const a=seed+i*2.3,from={x:p.x+Math.cos(a)*R*.2,y:p.y+Math.sin(a)*R*.14},to={x:p.x+Math.cos(a+.8)*R*.8,y:p.y+Math.sin(a+.8)*R*.5};ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.quadraticCurveTo(p.x+Math.sin(a)*R*.7,p.y+Math.cos(a)*R*.25,to.x,to.y);ctx.strokeStyle='#44203455';ctx.lineWidth=Math.max(.5,R*.025);ctx.stroke();}
  ctx.beginPath();ctx.ellipse(p.x-R*.15,p.y-R*.25,R*.64,R*.36,-.2,3.5,5.9);ctx.strokeStyle='#fff1cb66';ctx.lineWidth=Math.max(.7,R*.05);ctx.stroke();ellipse(p.x-R*.3,p.y-R*.42,R*.075,R*.035,'#fff9dfbb');
 }
 function eye(x,y,r,seed=0){const p=screen(x,y,19),R=r*s(),blink=Math.max(.12,Math.min(1,Math.abs(Math.sin(t()*.47+seed))*4));ellipse(p.x,p.y,R*1.25,R*.8*blink,'#321e29','#b38e7b',Math.max(.5,s()));ellipse(p.x,p.y,R,R*.58*blink,'#bcb48f');ellipse(p.x+Math.sin(t()*.7+seed)*R*.2,p.y,R*.3,R*.52*blink,'#211d20');ellipse(p.x-R*.3,p.y-R*.25*blink,R*.15,R*.1,'#e4d8b4');}
 function mouth(x,y,r,seed=0,angle=0){
  const p=screen(x,y,17),R=r*s(),open=.43+Math.sin(t()*2.4+seed)*.16;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
  const edge=[];for(let i=0;i<32;i++){const a=i/32*TAU,w=1+Math.sin(a*5+seed)*.13+Math.sin(a*9+t())*.045;edge.push({x:Math.cos(a)*R*w,y:Math.sin(a)*R*open*w});}
  path(edge.map(p=>({x:p.x*1.15,y:p.y*1.25})),'#d2a29480',Math.max(.5,s()),'#77414e');path(edge,null,0,'#170f19');
  for(let i=0;i<19;i++){const a=i/19*TAU,len=R*(.19+Math.sin(i*3.7+seed)*.11),px=Math.cos(a)*R,py=Math.sin(a)*R*open;path([{x:px-Math.sin(a)*R*.035,y:py+Math.cos(a)*R*.035},{x:px-Math.cos(a)*len+R*.055,y:py-Math.sin(a)*len},{x:px+Math.sin(a)*R*.035,y:py-Math.cos(a)*R*.035}],null,0,'#c6b599');}
  for(let i=0;i<3;i++){const u=(i-1)*R*.32;ctx.beginPath();ctx.moveTo(u,-R*open*.75);ctx.bezierCurveTo(u+R*.13,R*.1,u-R*.1,R*.1,u+R*.14,R*open*.7);ctx.strokeStyle='#c895a04a';ctx.lineWidth=Math.max(.5,R*.023);ctx.stroke();}
  ellipse(R*.15,R*.07,R*.16,R*.11,'#592133');ctx.restore();
 }
 function event(e){if(e.type==='death'||e.type==='allydeath'){stains.push({x:e.x,y:e.y,r:(e.r||20)*1.8,seed:Math.random()*6,life:45});if(stains.length>65)stains.shift();}}
 function ground(dt){
  if(game.phase==='playing'&&t()-lastTrail>.16){const p=game.player;mucus.push({x:p.x,y:p.y,r:game.radius()*.85,seed:t(),life:8});lastTrail=t();if(mucus.length>60)mucus.shift();}
  for(const a of [...stains,...mucus]){if(game.phase==='playing')a.life-=dt;ctx.globalAlpha=Math.min(1,a.life/5);const blood=stains.includes(a);blob(a.x,a.y,a.r,blood?['#6f3a4380','#45262f70','#291d2850']:['#a6ac6935','#69774924','#405c4120'],a.seed,0,.15);ctx.globalAlpha=1;}
  stains=stains.filter(a=>a.life>0);mucus=mucus.filter(a=>a.life>0);
  for(const pool of game.pools){ctx.globalAlpha=Math.min(1,pool.life);worldCircle(pool.x,pool.y,pool.r,'#9eb94b40','#d5e77d44');for(let i=0;i<5;i++){const a=i*2.4+t(),r=pool.r*(.3+i*.1),p=point(pool,a,r);worldCircle(p.x,p.y,3+Math.sin(t()*4+i)*2,'#ddeda866','#dbedaa66');}ctx.globalAlpha=1;}
 }
 function organism(){
  const p=game.player,r=game.radius()*1.25,time=t(),count=Math.min(25,7+Math.floor(p.mass/12)+game.stats.segments),body=[];
  for(let i=0;i<count;i++){const pt=game.trail[Math.min(game.trail.length-1,i*4)],w=(1-i/(count+1));body.push({x:pt.x+Math.sin(i*1.8+time*.9)*r*.32*w,y:pt.y+Math.cos(i*1.2+time)*r*.23*w,r:(r*w*.76+4)*(1+Math.sin(i*3.4)*.18)});}
  for(const b of body)worldCircle(b.x,b.y+9,b.r*1.25,'#04030955');
  // Long, unequal branches interrupt the regular snake outline.
  for(let i=body.length-1;i>=0;i-=2){const b=body[i],prev=body[Math.max(0,i-1)],a=i?Math.atan2(b.y-prev.y,b.x-prev.x):p.angle;
   for(const side of [-1,1]){const angle=a+side*(1.1+Math.sin(i*.4)*.4),len=(b.r+35+(i%3)*19)*(1+Math.sin(time+i)*.12),end=point(b,angle,len);tentacle(b,end,Math.max(4,b.r*.35),i+side,p.hit>0?'#b1746a':'#9b8274',.28);
    if(i%4===0){const membrane=body[Math.min(body.length-1,i+2)];path([screen(b.x,b.y,9),screen(end.x,end.y,5),screen(membrane.x,membrane.y,9)],'#e2c2a329',.6,'#c0a18d18');const branch=point(b,angle+.4*side,len*.72);tentacle(branch,point(branch,angle+.9*side,29),4,i,'#b6a287',.4);}
   }
  }
  for(let i=body.length-1;i>=0;i--){const b=body[i];if(i<body.length-1)tentacle(b,body[i+1],b.r*1.2,i,'#796455',.08);tissue(b.x,b.y,b.r,i,p.hit>0?pink:i%3===0?sick:flesh,8);
   if(i%3===1){const sac=point(b,i*1.4,b.r*.65);tissue(sac.x,sac.y,b.r*.65,i+.8,pink,11);mouth(sac.x,sac.y,b.r*.25,i,i*.9);}
   if(i%4===0)eye(b.x-b.r*.32,b.y-b.r*.25,Math.max(3,b.r*.16),i);
  }
  tissue(p.x,p.y,r,4,p.hit>0?pink:flesh,14);tissue(p.x-r*.45,p.y+r*.27,r*.62,2,sick,17);
  mouth(p.x+r*.15,p.y+r*.13,r*.54,0,p.aim??p.angle);eye(p.x-r*.35,p.y-r*.45,r*.18,1);eye(p.x+r*.48,p.y-r*.24,r*.12,3);eye(p.x-r*.53,p.y+r*.22,r*.1,5);
  const aim=p.aim??p.angle,tip=point(p,aim,r+28),recoil=Math.max(0,p.fire)*12;
  if(game.weapon==='acid'){tentacle(p,tip,r*.48,2,'#809268',.12);tissue(tip.x,tip.y,12+recoil,3,sick,13);mouth(tip.x,tip.y,7,0,aim);}
  if(game.weapon==='bone'){for(let i=-1;i<=1;i++){const a=aim+i*.22,end=point(p,a,r+22-recoil);tentacle(p,end,10,i,'#986c69',.1);mouth(end.x,end.y,7,i,a);const f=point(end,a,15);path([screen(end.x,end.y,17),screen(f.x,f.y,17)],'#dbd1ae',3*s());}}
  if(game.weapon==='parasite'){for(let i=0;i<3;i++){const b=point(p,aim+1.7+i*.65,r*.85);tissue(b.x,b.y,14+Math.sin(time*3+i)*2,i,pink,20);eye(b.x,b.y,5,i);}}
  if(game.weapon==='tongue'){tentacle(p,point(p,aim,r+60+Math.sin(time*2)*15),12,1,'#b87680',.5);}
 }
 function ally(a){const shield=a.kind==='shield',tower=a.kind==='tower',r=tower?24:19,time=t();worldCircle(a.x,a.y+6,r*1.3,'#05030866');
  if(shield){tentacle(game.player,a,10,a.id,'#9a8176',.27);worldCircle(a.x,a.y,r+9,null,'#cadca844');}
  for(let i=0;i<(tower?7:4);i++){const angle=i*TAU/(tower?7:4)+a.id,end=point(a,angle,r+25+Math.sin(time*2+i)*9);tentacle(a,end,tower?8:5,i,tower?'#876873':'#81947b',.3);}
  tissue(a.x,a.y,r,a.id,shield?sick:pink,10);if(shield){for(let i=0;i<4;i++){const p=point(a,i*1.6,r*.6);eye(p.x,p.y,5,i);}}else{const neck={x:a.x+Math.sin(time+a.id)*7,y:a.y-5};tentacle(a,neck,18,0,'#b88c88',0);mouth(neck.x,neck.y,13,0,time*.1);if(tower){const p=screen(a.x,a.y,20);ctx.beginPath();ctx.ellipse(p.x,p.y,18*s(),10*s(),0,3.4,6);ctx.strokeStyle='#eedbb29a';ctx.lineWidth=2*s();ctx.stroke();}}
  if(a.hp<a.maxHp){const p=screen(a.x,a.y+35);ctx.fillStyle='#3c2832';ctx.fillRect(p.x-12,p.y,24,2);ctx.fillStyle='#d0b18c';ctx.fillRect(p.x-12,p.y,24*Math.max(0,a.hp/a.maxHp),2);}
 }
 function enemy(e){const time=t(),boss=e.kind==='boss',brute=e.kind==='brute',spitter=e.kind==='spitter',runner=e.kind==='runner',r=e.r*1.17,palette=e.hit>0?['#f4d8ae','#bc9b7e','#68554b']:spitter?sick:pink;worldCircle(e.x,e.y+8,r*1.25,'#03010766');
  if(runner){for(let i=4;i>=1;i--){const b=point(e,e.angle+Math.PI+Math.sin(time*6-i)*.3,i*8);tissue(b.x,b.y,r*(1-i*.13),i,flesh,8);}tentacle(e,point(e,e.angle+Math.PI,70),8,e.seed,'#ba8a8b',.6);}
  const limbs=boss?10:brute?6:4;
  for(let i=0;i<limbs;i++){const a=i/limbs*TAU+e.angle,reach=r*(boss?2.3:brute?1.7:2)+Math.sin(time*4+i+e.seed)*7;tentacle(e,point(e,a,reach),boss?14:brute?8:5,i+e.seed,boss?'#995668':'#ad7d79',boss?.4:.2);}
  if(boss){for(let i=0;i<6;i++){const b=point(e,i*TAU/6,r*.7);tissue(b.x,b.y,r*.65,i,pink,10);mouth(b.x,b.y,r*.25,i,i);}}
  tissue(e.x,e.y,r,e.seed,palette,12);
  if(spitter){for(let i=0;i<3;i++){const b=point(e,e.angle+1.6+i*.7,r*.68);tissue(b.x,b.y,r*.56,i,sick,18);const p=screen(b.x,b.y,21);ellipse(p.x,p.y,r*.2*s(),r*.18*s(),'#c5de8366');}mouth(e.x,e.y,r*.38,0,e.angle);}
  else mouth(e.x,e.y,r*(boss?.65:.6),e.seed,runner?e.angle:Math.sin(time)*.1);
  if(brute){for(let i=0;i<5;i++){const p=screen(e.x,e.y+(i-2)*r*.24,18);ctx.beginPath();ctx.ellipse(p.x,p.y,r*.87*s(),r*.3*s(),0,3.3,6.1);ctx.strokeStyle='#dbc2a2';ctx.lineWidth=2.5*s();ctx.stroke();}}
  const eyes=boss?7:spitter?1:3;for(let i=0;i<eyes;i++){const a=i*2.4+e.seed,b=point(e,a,r*.72);eye(b.x,b.y,boss?6:3.4,i+e.seed);}
  if(e.slow>0)worldCircle(e.x,e.y,r+6,null,'#bcd87655');
  if(e.hp<e.maxHp||boss){const p=screen(e.x,e.y-r-28),w=Math.max(20,r*1.7*s());ctx.fillStyle='#38232c';ctx.fillRect(p.x-w/2,p.y,w,3);ctx.fillStyle='#cd8e99';ctx.fillRect(p.x-w/2,p.y,w*Math.max(0,e.hp/e.maxHp),3);if(boss){ctx.font='9px "DM Sans",sans-serif';ctx.textAlign='center';ctx.fillStyle='#e4acb5';ctx.fillText('THE MANY-MOUTHED MOTHER',p.x,p.y-10);}}
 }
 function nest(){const n=game.nest,r=42,time=t();glow(n.x,n.y,150,'#c3977911');worldCircle(n.x,n.y,70,'#10070f88');
  for(let i=0;i<9;i++)tentacle(n,point(n,i/9*TAU,110+Math.sin(i*3)*15),13,i,'#70545d',.3);
  for(let i=0;i<6;i++){const p=point(n,i*TAU/6,28);tissue(p.x,p.y,30+Math.sin(time*2+i)*2,i,n.hit>0?pink:flesh,10);}
  tissue(n.x,n.y,r,0,pink,17);mouth(n.x,n.y,25,2,time*.04);for(let i=0;i<3;i++){const p=point(n,i*2.2,37);eye(p.x,p.y,7,i);}
  const p=screen(n.x,n.y+110);ctx.font=`${Math.max(8,11*s())}px 'DM Sans',sans-serif`;ctx.textAlign='center';ctx.fillStyle='#c7b7a5';ctx.fillText('MOTHER NEST',p.x,p.y);ctx.fillStyle='#3c2930';ctx.fillRect(p.x-30*s(),p.y+7,60*s(),2);ctx.fillStyle=n.hp<35?'#e99683':'#c9b58c';ctx.fillRect(p.x-30*s(),p.y+7,60*s()*Math.max(0,n.hp)/100,2);
 }
 function weapons(){
  for(const b of game.bullets){const angle=Math.atan2(b.vy,b.vx),p=screen(b.x,b.y,13);
   if(b.kind==='bone'){const tip=screen(b.x+b.vx*.018,b.y+b.vy*.018,13),tail=screen(b.x-b.vx*.014,b.y-b.vy*.014,13);path([tail,tip],'#ded5b4',3*s());path([p,{x:p.x-Math.sin(angle)*5*s(),y:p.y+Math.cos(angle)*5*s()}],'#bba27e',2*s());}
   else if(b.kind==='parasite'){const tail=point(b,angle+Math.PI,30);tentacle(b,tail,6,b.life*4,'#b9838c',.4);tissue(b.x,b.y,8,1,pink,13);eye(b.x,b.y,3,0);}
   else{const tail=screen(b.x-b.vx*.025,b.y-b.vy*.025,13);path([tail,p],b.friendly?'#b4c88366':'#c285a366',8*s());blob(b.x,b.y,b.kind==='acid'?7:5,b.friendly?sick:pink,b.life,13,4);ellipse(p.x-2*s(),p.y-2*s(),2*s(),s(),'#fff4c9bb');}
  }
  for(const l of game.lashes){const progress=1-l.life/l.maxLife,reach=l.length*Math.sin(Math.PI*progress);const end=point(l,l.angle,reach);tentacle(game.player,end,20,progress*8,'#c4828e',.16);mouth(end.x,end.y,9,0,l.angle);}
 }
 function food(f){const r=4+Math.sqrt(f.mass),palette=f.hue===1?sick:f.hue===2?flesh:pink;glow(f.x,f.y,27,'#d4ba791c');tissue(f.x,f.y,r,f.x,palette,3+Math.sin(t()*2+f.x)*2);if(f.mass>4)eye(f.x,f.y,2,f.x);}
 return{organism,ally,enemy,nest,weapons,food,ground,event,reset(){stains=[];mucus=[];}};
}
