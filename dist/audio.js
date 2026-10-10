// Original procedural score: a slow minor-key ostinato, detuned choir, bowed drone,
// breathing noise and a heartbeat that accelerates as the nest is threatened.
export class Soundscape {
 constructor(){this.context=null;this.musicVolume=.42;this.effectsVolume=.65;this.muted=false;this.nextBeat=0;this.beat=0;this.nextChord=0;this.events=0;this.activeVoices=0;this.lastFx=new Map();this.phase='ready';}
 async unlock(){
  if(!this.context){
   const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;
   this.context=new Context();const c=this.context;
   this.master=c.createGain();this.master.gain.value=.72;
   this.compressor=c.createDynamicsCompressor();this.compressor.threshold.value=-16;this.compressor.ratio.value=5;
   this.music=c.createGain();this.fx=c.createGain();this.music.connect(this.master);this.fx.connect(this.master);this.master.connect(this.compressor).connect(c.destination);
   this.analyser=c.createAnalyser();this.analyser.fftSize=256;this.compressor.connect(this.analyser);
   this.reverb=c.createConvolver();const impulse=c.createBuffer(2,c.sampleRate*2.6,c.sampleRate);
   for(let channel=0;channel<2;channel++){const data=impulse.getChannelData(channel);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3)*.6;}
   this.reverb.buffer=impulse;const wet=c.createGain();wet.gain.value=.3;this.reverb.connect(wet).connect(this.music);
   this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const data=this.noise.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+.035*(Math.random()*2-1))/1.035;data[i]=brown*6;}
   this.nextBeat=c.currentTime+.05;this.nextChord=c.currentTime+.05;
  }
  await this.context.resume();this.applyLevels();return true;
 }
 applyLevels(){if(!this.context)return;const t=this.context.currentTime;for(const [node,value] of [[this.master,this.muted?0:.72],[this.music,this.musicVolume*(this.phase==='playing'?1:.3)],[this.fx,this.effectsVolume]]){node.gain.cancelScheduledValues(t);node.gain.setValueAtTime(node.gain.value,t);node.gain.linearRampToValueAtTime(value,t+.12);}}
 setVolume(bus,value){this[bus==='music'?'musicVolume':'effectsVolume']=Math.max(0,Math.min(1,value));this.applyLevels();}
 setMuted(value){this.muted=value;this.applyLevels();}
 voice(freq,duration,volume,{type='sine',slide=1,at,pan=0,music=false,cutoff=1200,attack=.01,detune=0}={}){
  if(!this.context||this.context.state!=='running'||this.activeVoices>=90)return;
  const c=this.context,t=at??c.currentTime,osc=c.createOscillator(),filter=c.createBiquadFilter(),gain=c.createGain(),stereo=c.createStereoPanner();
  osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(15,freq*slide),t+duration);osc.detune.value=detune;
  filter.type='lowpass';filter.frequency.value=cutoff;stereo.pan.value=pan;
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+attack);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(filter).connect(gain).connect(stereo);stereo.connect(music?this.music:this.fx);if(music)gain.connect(this.reverb);
  this.activeVoices++;osc.onended=()=>{osc.disconnect();filter.disconnect();gain.disconnect();stereo.disconnect();this.activeVoices--;};osc.start(t);osc.stop(t+duration+.04);
 }
 breath(duration,volume,{at,frequency=500,end=120,music=false,pan=0,q=2}={}){
  if(!this.context||this.context.state!=='running'||this.activeVoices>=90)return;
  const c=this.context,t=at??c.currentTime,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),stereo=c.createStereoPanner();source.buffer=this.noise;source.loop=true;
  filter.type='bandpass';filter.Q.value=q;filter.frequency.setValueAtTime(frequency,t);filter.frequency.exponentialRampToValueAtTime(end,t+duration);stereo.pan.value=pan;
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+Math.min(.04,duration/3));gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  source.connect(filter).connect(gain).connect(stereo).connect(music?this.music:this.fx);if(music)gain.connect(this.reverb);
  this.activeVoices++;source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();stereo.disconnect();this.activeVoices--;};source.start(t,Math.random());source.stop(t+duration+.02);
 }
 update(game){
  if(!this.context||this.context.state!=='running')return;
  if(this.phase!==game.phase){this.phase=game.phase;this.applyLevels();}
  const t=this.context.currentTime;
  if(this.muted||this.musicVolume===0||document.hidden){this.nextBeat=t+.1;this.nextChord=t+.1;return;}
  const threat=Math.min(1,(game.wave-1)/8+(1-game.nest.hp/100)*.6),seconds=.61-threat*.14;
  // Schedule against the audio clock, only a short lookahead; never pile up after tab suspension.
  if(this.nextBeat<t-.3)this.nextBeat=t+.02;
  if(this.nextBeat<t+.1){
   const at=this.nextBeat,pattern=[0,7,12,3,0,10,7,1],note=pattern[this.beat%pattern.length],base=55*Math.pow(2,note/12);
   this.voice(base,.85,.08,{at,music:true,type:'triangle',cutoff:480,pan:Math.sin(this.beat)*.25,attack:.05});
   if(this.beat%2===0){this.voice(63,.22,.22,{at,music:true,slide:.42,cutoff:180});this.voice(48,.16,.12,{at:at+.17,music:true,slide:.55,cutoff:130});}
   if(this.beat%4===2)this.voice(base*4,2.5,.022,{at,music:true,type:'sine',pan:-.55,attack:.1,detune:-13});
   if(this.beat%4===0)this.breath(1.5,.085,{at,music:true,frequency:330+threat*260,end:85,pan:Math.sin(this.beat)*.5,q:1});
   this.beat++;this.nextBeat+=seconds;
  }
  if(this.nextChord<t+.1){
   const chord=Math.floor(this.beat/16)%4,root=[55,51.913,43.654,46.249][chord];
   for(const [i,interval] of [0,7,12,13].entries())this.voice(root*Math.pow(2,interval/12),6.8,i===3?.022:.055,{at:this.nextChord,music:true,type:'sawtooth',cutoff:360+i*130,attack:1.7,detune:i%2?8:-9,pan:(i-1.5)*.35});
   this.nextChord=t+5.4;
  }
 }
 effect(name,{weapon='acid',x=750}={}){
  if(!this.context||this.muted||this.effectsVolume===0)return;
  const t=this.context.currentTime,limit=name==='eat'?.075:name==='impact'?.045:name==='death'?.06:0;
  if(t-(this.lastFx.get(name)??-10)<limit)return;this.lastFx.set(name,t);this.events++;const pan=Math.max(-.65,Math.min(.65,(x-750)/900)),v=(f,d,vol,options={})=>this.voice(f,d,vol,{pan,...options}),n=(d,vol,options={})=>this.breath(d,vol,{pan,...options});
  if(name==='shot'){
   if(weapon==='bone'){n(.18,.45,{frequency:2200,end:220,q:.6});v(110,.13,.2,{slide:.25,type:'sawtooth',cutoff:800});}
   else if(weapon==='parasite'){n(.3,.3,{frequency:900,end:180});v(260,.2,.16,{slide:.2});v(130,.25,.08,{at:t+.07,slide:1.9});}
   else if(weapon==='tongue'){n(.3,.42,{frequency:170,end:1600,q:.8});v(75,.17,.24,{slide:.35});}
   else{v(240,.13,.18,{slide:.2});n(.16,.24,{frequency:850,end:140,q:4});}
  }else if(name==='eat'){v(140+Math.random()*100,.16,.14,{slide:2.4});n(.12,.19,{frequency:320,end:700,q:5});}
  else if(name==='death'||name==='allydeath'){n(.45,.5,{frequency:1100,end:90,q:.7});v(95,.25,.26,{slide:.2});v(210,.15,.1,{at:t+.06,slide:.3});}
  else if(name==='impact'){n(.12,.2,{frequency:1800,end:250,q:1});v(120,.09,.08,{slide:.4});}
  else if(name==='bud'||name==='absorb'||name==='detach'){n(.6,.35,{frequency:name==='detach'?1400:180,end:name==='detach'?150:1000,q:2});v(65,.4,.18,{slide:2.3});}
  else if(name==='hurt'||name==='nesthurt'){v(65,.35,.3,{slide:.28,type:'sawtooth',cutoff:450});n(.4,.25,{frequency:550,end:90,q:.8});}
  else if(name==='wave'){v(46,.95,.22,{type:'sawtooth',cutoff:280,attack:.1});v(49,1.6,.1,{type:'sawtooth',cutoff:380,attack:.2});n(1.4,.15,{frequency:160,end:600});}
  else if(name==='mutation'||name==='clear'){for(let i=0;i<4;i++)v(110*Math.pow(2,[0,3,7,13][i]/12),1.7,.09,{at:t+i*.15,attack:.08,slide:1.01});n(.8,.15,{frequency:140,end:1200});}
 }
 snapshot(){const samples=new Uint8Array(128);this.analyser?.getByteTimeDomainData(samples);return{state:this.context?.state||'locked',muted:this.muted,musicVolume:this.musicVolume,effectsVolume:this.effectsVolume,beat:this.beat,events:this.events,activeVoices:this.activeVoices,signal:this.analyser?Math.max(...samples)-Math.min(...samples):0};}
}
