import { Game } from '../dist/engine.js';
export function playing(){const g=new Game(()=>.45);g.start();g.food=[];g.spawnClock=10000;g.worldClock=10000;return g;}
export function step(g,seconds,input={}){for(let i=0;i<Math.round(seconds*60);i++)g.tick(1/60,input);}
export function target(g,x=140,y=0,kind='brute'){const e=g.spawnEnemy(kind,x,y);e.hp=e.maxHp=10000;e.speed=0;return e;}
