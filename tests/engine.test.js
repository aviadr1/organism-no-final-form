import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, COSTS } from '../dist/engine.js';
function playing(){const g=new Game(()=>.45);g.start();g.food=[];g.spawnQueue=100;g.spawnClock=1000;return g;}
function step(g,seconds,input={}){for(let i=0;i<Math.round(seconds*60);i++)g.tick(1/60,input);}
test('splitting, detaching, and reabsorbing conserve living biomass',()=>{
 const g=playing(),initial=g.player.mass;assert.equal(g.action('shield'),true);assert.equal(g.player.mass,initial-COSTS.shield);assert.equal(g.action('drone'),true);assert.equal(g.allies[0].kind,'drone');assert.equal(g.player.mass+g.allies[0].mass,initial);g.action('recall');assert.equal(g.player.mass,initial);assert.equal(g.allies.length,0);
});
test('damaged offspring return only surviving tissue; destroyed ones return nothing',()=>{
 const g=playing();g.action('shield');g.allies[0].hp/=2;g.action('recall');assert.equal(g.player.mass,65-COSTS.shield/2);g.action('shield');g.allies[0].hp=0;step(g,.1);const mass=g.player.mass;g.action('recall');assert.equal(g.player.mass,mass);
});
test('splitting and shooting preserve the minimum usable body reserve',()=>{
 const g=playing();g.player.mass=12;assert.equal(g.action('drone'),false);step(g,1,{fire:true,aim:{x:900,y:635}});assert.equal(g.player.mass,12);assert.equal(g.bullets.length,0);assert.equal(g.allies.length,0);
});
test('projectile kills leave edible remains which grow the body and unlock mutation',()=>{
 const g=playing();const e=g.spawnEnemy('crawler');e.x=g.player.x+85;e.y=g.player.y;const before=g.player.mass;g.shoot(g.player,e,100);step(g,.25);assert.equal(g.kills,1);assert.equal(g.enemies.length,0);assert.ok(g.food.length>0||g.harvested>0);step(g,1);assert.ok(g.player.mass>before);assert.ok(g.harvested>0);g.xp=g.xpGoal;step(g,.02);assert.equal(g.phase,'mutation');assert.equal(new Set(g.choices.map(m=>m.id)).size,3);const time=g.time;step(g,1);assert.equal(g.time,time);assert.equal(g.mutate('invalid'),false);assert.equal(g.mutate(g.choices[0].id),true);assert.equal(g.level,2);assert.equal(g.phase,'playing');
});
test('a rooted tower holds position and kills an enemy without draining body mass',()=>{
 const g=playing();g.action('tower');const tower=g.allies[0],pos={x:tower.x,y:tower.y},mass=g.player.mass;const e=g.spawnEnemy('crawler');e.x=tower.x+190;e.y=tower.y;step(g,2,{x:1});assert.equal(tower.x,pos.x);assert.equal(tower.y,pos.y);assert.equal(g.kills,1);assert.ok(g.player.mass>=mass);
});
test('pause freezes movement, waves, and health',()=>{const g=playing();g.pause();const before=JSON.stringify(g);step(g,3,{x:1,fire:true,aim:{x:900,y:635},auto:true});assert.equal(JSON.stringify(g),before);g.pause();step(g,.1,{x:1});assert.ok(g.player.x>750);});
test('nest failure ends the run and stops subsequent simulation',()=>{const g=playing();g.nest.hp=1;const e=g.spawnEnemy('brute');e.x=g.nest.x;e.y=g.nest.y;step(g,.02);assert.equal(g.phase,'lost');const t=g.time;step(g,3);assert.equal(g.time,t);});
test('every wave progresses after a clear, and the sixth clear wins',()=>{const g=playing();for(let wave=1;wave<=6;wave++){assert.equal(g.wave,wave);g.spawnQueue=0;g.enemies=[];step(g,7.1);}assert.equal(g.phase,'won');});
test('reset removes old mutations, units, bullets and combat progress',()=>{const g=playing();g.action('shield');g.stats.damage=999;g.mutations=['venom'];g.reset();assert.equal(g.phase,'ready');assert.equal(g.wave,0);assert.equal(g.player.mass,65);assert.equal(g.stats.damage,15);assert.equal(g.allies.length,0);assert.equal(g.mutations.length,0);});
test('diagonal movement is normalized and arena bounds hold',()=>{const a=playing(),b=playing();step(a,1,{x:1});step(b,1,{x:1,y:1});assert.ok(Math.abs(Math.hypot(a.player.x-750,a.player.y-635)-Math.hypot(b.player.x-750,b.player.y-635))<.001);step(a,15,{x:1,y:-1});assert.ok(a.player.x<=1470&&a.player.y>=35);});
