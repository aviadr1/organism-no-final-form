import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, WEAPONS } from '../dist/engine.js';
function arena(){const g=new Game(()=>.5);g.start();g.food=[];g.spawnClock=1000;return g;}
function enemy(g,x,y){const e=g.spawnEnemy('brute');e.x=x;e.y=y;e.speed=0;e.hp=e.maxHp=1000;return e;}
for(const w of WEAPONS)test(`${w.name} consumes one volley cost and respects minimum biomass`,()=>{const g=arena();g.setWeapon(w.id);const start=g.player.mass;assert.ok(g.fireWeapon({x:900,y:635}));assert.ok(Math.abs(g.player.mass-(start-w.cost))<1e-8);g.player.fire=0;g.player.mass=12;assert.equal(g.fireWeapon({x:900,y:635}),false);assert.equal(g.player.mass,12);});
test('bone spray creates a spread and cannot bypass cooldown by switching',()=>{const g=arena();g.setWeapon('bone');g.fireWeapon({x:900,y:635});assert.equal(g.bullets.length,5);assert.ok(new Set(g.bullets.map(b=>b.vy)).size>1);g.setWeapon('acid');assert.equal(g.fireWeapon({x:900,y:635}),false);});
test('acid impact leaves a pool which damages and slows hostiles',()=>{const g=arena();const e=enemy(g,810,635);g.fireWeapon(e);for(let i=0;i<20;i++)g.tick(1/60);assert.ok(g.pools.length>0);const hp=e.hp;g.tick(.05);assert.ok(e.hp<hp);assert.ok(e.slow>0);});
test('parasites turn toward a nearby enemy after launch',()=>{const g=arena();g.setWeapon('parasite');g.fireWeapon({x:1100,y:635});const b=g.bullets[0],vy=b.vy;enemy(g,850,735);g.tick(.05);assert.ok(b.vy>vy);});
test('tongue hits several enemies in its forward cone but not behind or far away',()=>{const g=arena();g.setWeapon('tongue');const a=enemy(g,840,635),b=enemy(g,860,660),behind=enemy(g,670,635),far=enemy(g,1100,635);g.fireWeapon({x:1000,y:635});assert.ok(a.hp<1000&&b.hp<1000);assert.equal(behind.hp,1000);assert.equal(far.hp,1000);assert.equal(g.lashes.length,1);});
test('reset clears lingering acid, tongues and selected weapon',()=>{const g=arena();g.setWeapon('tongue');g.fireWeapon({x:900,y:635});g.pools.push({life:1});g.reset();assert.equal(g.weapon,'acid');assert.equal(g.lashes.length,0);assert.equal(g.pools.length,0);});
