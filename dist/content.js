// Shared gameplay definitions used by simulation, renderer, controls and tests.
export const FIRE_LEVELS = [
 {id:0,name:'SIP',label:'Conserve',cost:.65,damage:.8,cadence:1.25},
 {id:1,name:'FEAST',label:'Balanced',cost:1,damage:1,cadence:1},
 {id:2,name:'RUPTURE',label:'All flesh',cost:1.35,damage:1.3,cadence:.78}
];
export const WEAPONS = [
 {id:'acid',name:'Bile glands',glyph:'●',cost:.28,interval:.5,range:255,damage:15,description:'Corrosive mucus. Leaves slowing pools.'},
 {id:'bone',name:'Ribshot',glyph:'⋔',cost:.6,interval:.7,range:220,damage:8,description:'Five ribs expelled from every active mouth.'},
 {id:'parasite',name:'Larval brood',glyph:'∞',cost:.7,interval:1,range:330,damage:25,description:'Living grubs hunt down nearby prey.'},
 {id:'tongue',name:'Tongue lash',glyph:'≋',cost:.4,interval:.7,range:120,damage:34,description:'Muscular tongues tear through a wide cone.'},
 {id:'blood',name:'Blood lance',glyph:'╱',cost:.65,interval:.8,range:300,damage:30,description:'A pressurized blood jet pierces a line of bodies.'},
 {id:'spore',name:'Rupture cyst',glyph:'✹',cost:.85,interval:1.2,range:250,damage:32,description:'Explosive tumors burst into a caustic cloud.'},
 {id:'scream',name:'Choir of teeth',glyph:'◌',cost:1.1,interval:1.5,range:135,damage:25,description:'Every mouth screams. Radial damage and knockback.'}
];
export const TOWERS = [
 {id:'spitter',name:'Bile spire',cost:26,range:260,hp:100,interval:.8,weapon:'acid',damage:20,description:'Spits corrosive pools into approaching packs.'},
 {id:'harpoon',name:'Rib harpoon',cost:36,range:350,hp:100,interval:1.4,weapon:'blood',damage:48,description:'Long-range piercing attacks through multiple enemies.'},
 {id:'brood',name:'Brood hive',cost:44,range:390,hp:130,interval:1.8,weapon:'parasite',damage:34,description:'Launches homing larvae at distant prey.'},
 {id:'maw',name:'Rooted maw',cost:32,range:100,hp:160,interval:1.1,weapon:'scream',damage:40,description:'Bites everything nearby and pushes enemies back.'}
];
export const SPECIES = {
 human:{name:'Lost worker',group:'Human',hp:30,speed:30,r:8,mass:16,damage:5,parts:['human_head','human_arm','human_torso'],color:'#b69782'},
 soldier:{name:'Containment officer',group:'Human',hp:50,speed:23,r:9,mass:22,damage:6,parts:['human_arm','human_torso','human_head'],color:'#799184'},
 dog:{name:'Infected hound',group:'Animal',hp:24,speed:52,r:8,mass:13,damage:4,parts:['dog_jaw','dog_leg'],color:'#b98971'},
 deer:{name:'Hollow stag',group:'Animal',hp:58,speed:33,r:12,mass:26,damage:8,parts:['antler','deer_skull'],color:'#b3a38a'},
 crawler:{name:'Split torso',group:'Monstrosity',hp:38,speed:33,r:10,mass:19,damage:6,parts:['tendril','human_torso'],color:'#c36b7b'},
 spitter:{name:'Bile carrier',group:'Monstrosity',hp:50,speed:22,r:13,mass:25,damage:7,parts:['bile_sac','eye_cluster'],color:'#aab57d'},
 brute:{name:'Rib cathedral',group:'Monstrosity',hp:130,speed:16,r:19,mass:45,damage:13,parts:['ribcage','maw'],color:'#a46773'},
 boss:{name:'The Congregation',group:'Monstrosity',hp:800,speed:11,r:32,mass:140,damage:23,parts:['maw','eye_cluster','ribcage'],color:'#ac5570'}
};
export const PARTS = {
 core:{weapon:'acid',name:'Original tissue',role:'Flesh',size:14},flesh:{weapon:'parasite',name:'Flesh knot',role:'Mouth',size:10},
 human_head:{weapon:'scream',name:'Human face',role:'Mouth',size:10},human_arm:{weapon:'blood',name:'Human arm',role:'Grasping limb',size:8},human_torso:{weapon:'spore',name:'Human torso',role:'Ribbed gland',size:14},
 dog_jaw:{weapon:'tongue',name:'Hound jaw',role:'Mouth',size:10},dog_leg:{weapon:'parasite',name:'Hound leg',role:'Grasping limb',size:8},
 antler:{weapon:'bone',name:'Stag antlers',role:'Bone gland',size:12},deer_skull:{weapon:'bone',name:'Stag skull',role:'Mouth',size:11},
 tendril:{weapon:'tongue',name:'Severed tendril',role:'Grasping limb',size:9},bile_sac:{weapon:'acid',name:'Bile sac',role:'Acid gland',size:13},
 eye_cluster:{weapon:'blood',name:'Stolen eyes',role:'Sensory gland',size:11},ribcage:{weapon:'bone',name:'Exposed ribs',role:'Bone gland',size:15},maw:{weapon:'scream',name:'Secondary maw',role:'Mouth',size:16}
};
export const COSTS = {shield:18,drone:28,colony:65};
export const MUTATIONS = [
 {id:'venom',name:'Virulent bile',glyph:'●',description:'All living weapons deal 25% more damage.',tag:'PREDATION',apply:g=>g.stats.damage*=1.25},
 {id:'cilia',name:'Scavenger cilia',glyph:'≋',description:'Move 15% faster. Draw corpses in from farther away.',tag:'HUNGER',apply:g=>{g.stats.speed*=1.15;g.stats.vacuum+=25;}},
 {id:'carapace',name:'Borrowed skin',glyph:'⬡',description:'Take 20% less damage across your entire body.',tag:'SURVIVAL',apply:g=>g.stats.armor*=.8},
 {id:'synapse',name:'Colonial mind',glyph:'✣',description:'Drones and towers deal 35% more damage.',tag:'COLONY',apply:g=>g.stats.allyDamage*=1.35},
 {id:'metabolism',name:'Closed metabolism',glyph:'◉',description:'Every firing orifice spends 25% less biomass.',tag:'EFFICIENCY',apply:g=>g.stats.shotCost*=.75},
 {id:'growth',name:'Uncontrolled mitosis',glyph:'❋',description:'Gain 35g and grow two branching tissue mouths.',tag:'ANATOMY',apply:g=>{g.player.mass+=35;g.graft('flesh','mutation');g.graft('flesh','mutation');}},
 {id:'heart',name:'Satellite hearts',glyph:'♡',description:'Repair all colonies by 45. Colonies slowly regenerate.',tag:'COLONY',apply:g=>{for(const c of g.colonies)c.hp=Math.min(c.maxHp,c.hp+45);g.stats.regen+=.5;}},
 {id:'brood',name:'Feral offspring',glyph:'∞',description:'Drones hunt 40% farther away and move 20% faster.',tag:'HUNTERS',apply:g=>{g.stats.huntRange*=1.4;g.stats.droneSpeed*=1.2;}},
 {id:'glands',name:'Reflex ganglia',glyph:'⋔',description:'All body weapons fire 20% faster.',tag:'ORIFICES',apply:g=>g.stats.interval*=.8},
 {id:'leech',name:'Vampiric digestion',glyph:'╱',description:'Eating yields 30% more usable biomass.',tag:'DIGESTION',apply:g=>g.stats.digestion*=1.3},
 {id:'branch',name:'Impossible anatomy',glyph:'Ψ',description:'Grow three stolen organs and extend your branching reach.',tag:'ANATOMY',apply:g=>{g.stats.reach+=.08;for(const k of ['human_head','antler','eye_cluster'])g.graft(k,'mutation');}},
 {id:'necrosis',name:'Necrotic secretion',glyph:'✹',description:'Acid pools last 60% longer and deal 30% more damage.',tag:'DECAY',apply:g=>{g.stats.poolLife*=1.6;g.stats.poolDamage*=1.3;}},
 {id:'colony',name:'Spreading infection',glyph:'✚',description:'New colonies and towers cost 20% less biomass.',tag:'TERRITORY',apply:g=>g.stats.buildCost*=.8},
 {id:'spines',name:'Defensive antlers',glyph:'Y',description:'Touching your body deals 15 damage per second to enemies.',tag:'RETALIATION',apply:g=>g.stats.thorns+=15},
 {id:'sinew',name:'Regenerative sinew',glyph:'↶',description:'Living drones and shields regenerate health.',tag:'OFFSPRING',apply:g=>g.stats.allyRegen+=2},
 {id:'senses',name:'A thousand eyes',glyph:'◌',description:'All body weapons gain 25% targeting range. Grow an eye cluster.',tag:'SENSES',apply:g=>{g.stats.range*=1.25;g.graft('eye_cluster','mutation');}}
];
export const BIOMES = ['QUARANTINE WOODS','ABANDONED WORKS','THE MEAT MARSH'];
export function hash(x,y,seed=0){let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(seed|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
export function biomeAt(x,y){return Math.floor(hash(Math.floor(x/700),Math.floor(y/700),41)*3);}
