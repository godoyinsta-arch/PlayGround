(()=>{'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),toastEl=document.querySelector('#toast');
const W=1280,H=720,G=572;
let screen='menu',mode='versus',selected=[0,1],pickSide=0,keys={},pressed={},fighters=[],particles=[],shots=[],round=1,timer=99,wins=[0,0],winner=-1,roundState='intro',intro=1.5,paused=false,shake=0,flash=0,clock=0,arcade=[],arcadeAt=0,survival=0,combos=[0,0],comboT=[0,0];
const C=[
{name:'THEUSIN',title:'THE SOLDIER',color:'#d2a65c',dark:'#303d32',skin:'#9b6248',hair:'#171617',special:'AIR STRIKE',ult:'WAR MACHINE',bio:'A missão termina quando ele diz.'},
{name:'RENAN',title:'THE FOOTBALL LEGEND',color:'#53c9a5',dark:'#174c45',skin:'#f0c5a1',hair:'#dfc089',special:'FREE KICK',ult:'GOLDEN GOAL',bio:'O campo inteiro é área de jogo.'},
{name:'GUSTAVO',title:'THE HUNTER',color:'#70a9ed',dark:'#253752',skin:'#b77e61',hair:'#16181e',special:'RAIN OF ARROWS',ult:'PERFECT HUNT',bio:'Um alvo. Uma chance. Um acerto.'},
{name:'JOÃO',title:'THE BIKE WARRIOR',color:'#ee815d',dark:'#47313b',skin:'#9e6045',hair:'#171519',special:'BIKE SMASH',ult:'FULL THROTTLE',bio:'Não pergunta de quem é a moto.'},
{name:'JULIO',title:'THE CYBER OCTOPUS',color:'#c48be8',dark:'#343148',skin:'#f1d8cb',hair:'#332a35',special:'OCTOPUS GRAB',ult:'SYSTEM OVERLOAD',bio:'O sistema já calculou sua derrota.'}];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a);
function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=W*d;canvas.height=H*d;ctx.setTransform(d,0,0,d,0,0)}addEventListener('resize',resize);resize();
function text(s,x,y,size,color='#fff',align='left',font='Barlow Condensed',weight=700){ctx.font=`${weight} ${size}px '${font}',sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y)}
function box(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function line(x,y,x2,y2,c,w=1){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke()}
function notify(s){toastEl.textContent=s;toastEl.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>toastEl.classList.remove('show'),1900)}
function hitboxPoint(mx,x,y){return mx>=x-250&&mx<=x+250&&y>=300&&y<=620}
function bg(){
 let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#17192e');g.addColorStop(.52,'#493149');g.addColorStop(1,'#171821');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 let glow=ctx.createRadialGradient(644,254,15,644,254,430);glow.addColorStop(0,'#ffb36b55');glow.addColorStop(1,'#ff8b4c00');ctx.fillStyle=glow;ctx.fillRect(170,0,920,520);ctx.fillStyle='#ffcb8b';ctx.globalAlpha=.72;ctx.beginPath();ctx.arc(645,253,82,0,7);ctx.fill();ctx.globalAlpha=1;
 for(let l=0;l<3;l++){let y=[340,380,422][l];ctx.globalAlpha=[.38,.58,.9][l];for(let i=0;i<17;i++){let x=i*86-24+(l*27)%61,h=65+((i*37+l*51)%140);ctx.fillStyle=['#28243b','#252337','#171a29'][l];ctx.fillRect(x,y-h,58,h+85);ctx.fillStyle=['#e59e6740','#89dbca36','#f6c87538'][l];for(let wy=y-h+14;wy<y+22;wy+=20)for(let wx=x+10;wx<x+50;wx+=18)if((i+Math.floor(wy/20))%3)ctx.fillRect(wx,wy,5,8)}}ctx.globalAlpha=1;
 box(475,82,330,56,8,'#131724aa','#d9b8a344');text('LUTA DE RUA',640,105,24,'#f8d7a3','center');text('SÃO PAULO • NOITE DE FINAIS',640,126,9,'#bca9a2','center','DM Sans',700);
 for(let i=0;i<55;i++){let x=i*25-8,y=489+Math.sin(i*2.7)*6;ctx.fillStyle=i%2?'#111522':'#191625';ctx.beginPath();ctx.arc(x,y-20-Math.sin(i*12+clock*2)*2,8,0,7);ctx.fill();ctx.fillRect(x-9,y-12,18,42)}
 let floor=ctx.createLinearGradient(0,505,0,720);floor.addColorStop(0,'#34303a');floor.addColorStop(1,'#10151e');ctx.fillStyle=floor;ctx.fillRect(0,510,W,210);ctx.fillStyle='#f7a166';ctx.globalAlpha=.5;ctx.fillRect(0,511,W,2);ctx.globalAlpha=1;
 for(let i=0;i<12;i++)line(640,515,i*116-20,720,'#c7a17916');for(let i=0;i<5;i++)line(0,545+i*i*7,W,545+i*i*7,'#c9a47b12');
 for(let x of [68,1212]){ctx.fillStyle='#141725';ctx.fillRect(x-14,352,28,160);ctx.fillStyle='#ff9870';ctx.globalAlpha=.5+.3*Math.sin(clock*3+x);ctx.fillRect(x-5,365,10,75);ctx.globalAlpha=1;ctx.beginPath();ctx.arc(x,375,45,0,7);ctx.fillStyle='#e8815330';ctx.fill()}}
function vignette(){let g=ctx.createRadialGradient(640,350,240,640,350,780);g.addColorStop(.55,'#0000');g.addColorStop(1,'#050611b8');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function art(x,y,s,c,o={}){
 let face=o.facing||1,pose=o.pose||'idle',atk=pose==='attack',guard=pose==='guard',hit=pose==='hit';ctx.save();ctx.translate(x,y);ctx.scale(s*face,s);
 ctx.fillStyle='#08091455';ctx.beginPath();ctx.ellipse(0,0,45,9,0,0,7);ctx.fill();
 const limb=(p,col,w)=>{ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)ctx.lineTo(p[i],p[i+1]);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#10121b';ctx.lineWidth=w+4;ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke();ctx.fillStyle=col;for(let i=2;i<p.length;i+=2){ctx.beginPath();ctx.arc(p[i],p[i+1],w*.37,0,7);ctx.fill()}};
 limb([-10,-54,-20,-34,atk?7:-27,-12],c.dark,19);limb([12,-54,23,-32,atk?34:27,-12],c.dark,18);box(-42,-15,28,12,4,'#141622','#ffffff24');box(13,-15,29,12,4,'#141622','#ffffff24');
 ctx.save();ctx.translate(atk?16:hit?-12:0,-90);ctx.rotate(atk?.1:hit?-.12:0);ctx.fillStyle=c.color;
 ctx.beginPath();ctx.moveTo(-18,-45);ctx.lineTo(14,-46);ctx.quadraticCurveTo(28,-21,22,5);ctx.lineTo(-21,5);ctx.quadraticCurveTo(-25,-20,-18,-45);ctx.fill();ctx.fillStyle=c.dark;ctx.fillRect(-22,-8,44,14);
 limb([-19,-37,-31,guard?-32:-29,atk?50:guard?15:-18,guard?-40:-26],c.skin,12);limb([17,-38,30,-32,atk?48:guard?20:32,-42],c.skin,12);
 ctx.fillStyle=c.skin;box(-8,-57,16,19,5,c.skin,'#11131c');ctx.beginPath();ctx.ellipse(0,-72,20,24,0,0,7);ctx.fill();ctx.strokeStyle='#17151a';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle=c.hair;
 if(c.name==='RENAN'){ctx.beginPath();ctx.moveTo(-19,-75);ctx.quadraticCurveTo(-24,-103,1,-101);ctx.quadraticCurveTo(25,-98,20,-72);ctx.lineTo(13,-77);ctx.lineTo(5,-91);ctx.lineTo(-3,-78);ctx.lineTo(-11,-89);ctx.lineTo(-15,-73);ctx.closePath();ctx.fill()}
 else if(c.name==='GUSTAVO'){for(let i=-2;i<4;i++){ctx.beginPath();ctx.arc(i*8,-92+(i%2)*3,7,0,7);ctx.fill()}ctx.fillRect(-18,-89,36,14)}
 else if(c.name==='JULIO'){ctx.beginPath();ctx.moveTo(-19,-76);ctx.quadraticCurveTo(-27,-103,0,-99);ctx.quadraticCurveTo(27,-103,19,-75);ctx.lineTo(14,-66);ctx.quadraticCurveTo(12,-87,0,-84);ctx.quadraticCurveTo(-14,-87,-14,-65);ctx.closePath();ctx.fill();ctx.fillRect(-2,-95,4,26)}
 else{ctx.beginPath();ctx.ellipse(0,-89,21,11,0,Math.PI,7);ctx.fill();ctx.fillRect(-20,-90,8,18);ctx.fillRect(12,-90,8,18)}
 ctx.fillStyle='#211b20';ctx.fillRect(-10,-74,5,2);ctx.fillRect(6,-74,5,2);line(-3,-63,7,-64,'#7f443e',1.5);ctx.restore();ctx.restore();}
function portrait(i,x,y,w,h,selectedFlag=false){let c=C[i];box(x,y,w,h,14,'#171727',selectedFlag?c.color:'#ffffff18');let g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,c.dark);g.addColorStop(1,'#171727');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x+5,y+5,w-10,h-10,10);ctx.fill();art(x+w/2,y+h-18,.72,c,{facing:1});text(c.name,x+w/2,y+h-42,20,c.color,'center');text(c.title,x+w/2,y+h-24,8,'#ddd8df','center','DM Sans',700)}
function button(x,y,w,h,label,accent=false){box(x,y,w,h,8,accent?'#f1b85e':'#1b1b2c',accent?'#ffe5a0':'#ffffff20');text(label,x+w/2,y+h/2,14,accent?'#17131a':'#eeeaf0','center','DM Sans',700)}
function contains(mx,my,x,y,w,h){return mx>=x&&mx<=x+w&&my>=y&&my<=y+h}
function menu(){
 ctx.fillStyle='#10101b';ctx.fillRect(0,0,W,H);bg();box(58,58,450,560,18,'#10101bd9','#ffffff18');text('RUA',105,120,86,'#fff','left');text('DE LENDAS',105,190,56,'#ffbe62','left');text('FRIENDS EDITION',108,225,13,'#d9d3cc','left','DM Sans',800);
 text('ESCOLHA SUA MODALIDADE',105,300,12,'#9c99a8','left','DM Sans',800);
 const items=[['ARCADE','Derrote uma sequência de lutadores'],['VERSUS','Luta local com dois jogadores'],['TREINAMENTO','Treine golpes sem pressão'],['SOBREVIVÊNCIA','Enfrente ondas infinitas']];
 items.forEach((a,i)=>{let y=330+i*64,active=(i===0&&mode==='arcade')||(i===1&&mode==='versus')||(i===2&&mode==='training')||(i===3&&mode==='survival');box(105,y,350,48,8,active?'#edb75d':'#222235',active?'#ffe3a2':'#ffffff12');text(a[0],128,y+18,20,active?'#17151d':'#f3eff4','left');text(a[1],128,y+35,9,'#aaa6b1','left','DM Sans',600)});
 text('SELECIONE UM MODO E CONFIRME',105,586,10,'#777785','left','DM Sans',700);button(105,610,350,42,'COMEÇAR',true);
 art(930,610,2.15,C[selected[0]],{facing:-1});art(1120,610,1.65,C[selected[1]],{facing:-1});text('5 LUTADORES • 4 MODOS • 1 RUÍDA',640,692,10,'#b7b1ba','center','DM Sans',800);vignette();}
function modesHit(mx,my){const ys=[330,394,458,522];for(let i=0;i<4;i++)if(mx>=105&&mx<=455&&my>=ys[i]&&my<=ys[i]+48){mode=['arcade','versus','training','survival'][i];notify(['ARCADE','VERSUS LOCAL','TREINAMENTO','SOBREVIVÊNCIA'][i]+' selecionado');}}
function select(){ctx.fillStyle='#11121d';ctx.fillRect(0,0,W,H);bg();box(70,40,1140,640,18,'#10101bce','#ffffff18');text(pickSide===0?'JOGADOR 1':'JOGADOR 2',640,84,14,pickSide===0?'#65d8db':'#ffb768','center','DM Sans',800);text('ESCOLHA SEU LUTADOR',640,120,38,'#fff','center');
 C.forEach((c,i)=>portrait(i,115+i*218,180,180,310,i===selected[pickSide]));text(pickSide===0?'P1: WASD + J/K/I/L/U':'P2: SETAS + 1/2/3/4/5',640,526,11,'#b7b2bc','center','DM Sans',700);text(C[selected[pickSide]].bio,640,563,12,'#ddd7cd','center','DM Sans',600);button(520,590,240,48,'CONFIRMAR LUTADOR',true);vignette();}
function makeFighter(i,x,side){return{id:i,x,y:G,vx:0,vy:0,hp:100,energy:0,guard:false,attack:0,hit:0,dead:false,side,facing:side===0?1:-1,ultReady:false}}
function arcadeStart(){return (selected[0]+1)%C.length}
function startFight(){fighters=[makeFighter(selected[0],250,0),makeFighter(selected[1],1030,1)];shots=[];particles=[];wins=[0,0];round=1;timer=99;roundState='intro';intro=1.8;winner=-1;combos=[0,0];comboT=[0,0];survival=mode==='survival'?1:0;if(mode==='arcade')arcade=[(selected[0]+1)%5,(selected[0]+2)%5,(selected[0]+3)%5];screen='fight';notify('ROUND '+round)}
function startRound(){fighters.forEach((f,i)=>{f.x=i===0?250:1030;f.y=G;f.vx=0;f.vy=0;f.hp=100;f.guard=false;f.attack=0;f.hit=0;f.dead=false});shots=[];timer=99;roundState='intro';intro=1.8;winner=-1}
function attack(f,i,type){
 if(roundState!== 'fight'||f.hit>0||f.attack>0)return;
 if(type==='ult'&&f.energy<100)return;
 f.attack=type==='ult'?28:type==='special'?18:12;
 if(type==='ult'){f.energy=0;f.ultReady=true;flash=18;shake=14;
  let other=fighters[1-i];if(Math.abs(other.x-f.x)<240)damage(f,i,26,14);spawnHit(f.x+f.facing*95,f.y-115,C[f.id].ult,'#fff4a5');
 }else if(type==='special'){f.energy=Math.min(100,f.energy+10);spawnShot(f,i,type);
 }else f.energy=Math.min(100,f.energy+5);
}
function special(f,i,type){if(type==='ult')attack(f,i,'ult');else attack(f,i,'special')}
function damage(a,d,amount,force=0){let b=fighters[1-d],blocked=b.guard&&b.facing!==a.facing;if(b.hp<=0)return;let dmg=blocked?Math.ceil(amount*.18):amount;b.hp=clamp(b.hp-dmg,0,100);b.hit=blocked?5:13;a.energy=clamp(a.energy+(blocked?4:9),0,100);b.vx=(b.x>a.x?-1:1)*force*(blocked?.3:1);b.y=G;comboT[d]=1.2;combos[d]++;if(dmg>0)spawnHit((b.x+a.x)/2,b.y-65,dmg,b.guard? '#77dbe2':'#ffcf70');shake=blocked?3:8;flash=5}
function spawnHit(x,y,n,c){particles.push({x,y,vx:rand(-2,2),vy:rand(-4,-1),life:18,text:n+'!',c})}
function shotsCollision(){for(let s of shots){let owner=s.owner,target=1-owner,f=fighters[target];if(Math.abs(s.x-f.x)<48&&f.y>500){damage(fighters[owner],target,s.dmg,s.force);s.life=0}}shots=shots.filter(s=>s.life>0)}
function physics(dt){if(paused||roundState==='over'||roundState==='result')return;
 if(roundState==='intro'){intro-=dt;if(intro<=0){roundState='fight';notify('FIGHT')}}if(roundState==='fight')timer=clamp(timer-dt*.025,0,99);
 fighters.forEach((f,i)=>{f.facing=fighters[1-i].x<f.x?-1:1;if(f.attack>0)f.attack--;if(f.hit>0)f.hit--;f.guard=false;
  if(i===0){let left=keys.KeyA,right=keys.KeyD,guard=keys.KeyS; if(left){f.vx=-5}else if(right){f.vx=5}else f.vx*=.72;if(keys.KeyW&&f.y>=G-1)f.vy=-11;f.guard=guard&&!f.attack;if(pressed.KeyJ)attack(f,i,'light');if(pressed.KeyK)attack(f,i,'special');if(pressed.KeyI)attack(f,i,'ult');}
  else if(mode==='versus'){let left=keys.ArrowLeft,right=keys.ArrowRight,guard=keys.ArrowDown;if(left)f.vx=-5;else if(right)f.vx=5;else f.vx*=.72;if(keys.ArrowUp&&f.y>=G-1)f.vy=-11;f.guard=guard&&!f.attack;if(pressed.Digit1)attack(f,i,'light');if(pressed.Digit2)attack(f,i,'special');if(pressed.Digit3)attack(f,i,'ult')}
  else if(mode==='training'){f.guard=false;if(f.hit<=0){if(Math.random()<.006)attack(f,i,'light')}}
  else{let opponent=fighters[1-i],dist=opponent.x-f.x;if(Math.abs(dist)>75){f.vx=Math.sign(dist)*(Math.random()<.012?4:3)}else f.vx*=.75;if(Math.random()<.012&&Math.abs(dist)<110)attack(f,i,'light');if(Math.random()<.004)attack(f,i,'special');f.guard=Math.abs(dist)<75&&Math.random()<.02}
  f.vy+=.6;f.x=clamp(f.x+f.vx,55,1225);f.y=clamp(f.y+f.vy,220,G);if(f.y>=G)f.vy=0;
  if(f.attack===10||f.attack===16){let dist=Math.abs(f.x-fighters[1-i].x);if(dist<80&&!fighters[1-i].guard)damage(f,i,f.attack===16?18:8,5);else if(dist<80)damage(f,i,f.attack===16?4:2,2)}});
 if(fighters[0].hp<=0||fighters[1].hp<=0||timer<=0)finish();
 shots.forEach(s=>{s.x+=s.vx;s.life--});shotsCollision();shots=shots.filter(s=>s.life>0);
 comboT.forEach((v,i)=>{comboT[i]-=dt;if(comboT[i]<=0)combos[i]=0});particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life--});particles=particles.filter(p=>p.life>0);Object.keys(pressed).forEach(k=>delete pressed[k]);}
function spawnShot(f,i,type){shots.push({x:f.x+f.facing*55,y:f.y-62,vx:f.facing*(type==='ult'?9:6),life:90,owner:i,dmg:type==='ult'?24:13,force:8,c:C[f.id].color})}
// O dano principal é definido pela função anterior; este alias não é necessário.
function finish(){
 if(roundState==='over'||roundState==='result')return;
 let a=fighters[0].hp,b=fighters[1].hp,w=a>b?0:(b>a?1:-1);
 if(a===b)w=-1;
 if(w>=0)wins[w]++;winner=w;roundState='over';
 setTimeout(()=>{
  if(mode==='arcade'&&w===0&&arcade.length){let id=arcade.shift();selected[1]=id;fighters[1]=makeFighter(id,1030,1);round++;startRound();notify('NOVO DESAFIO: '+C[id].name)}
  else if(mode==='survival'&&w===0){survival++;let id=(selected[1]+survival)%5;selected[1]=id;fighters[1]=makeFighter(id,1030,1);fighters[1].hp=Math.max(55,100-survival*5);round++;wins=[0,0];startRound();notify('ONDA '+survival+' • '+C[id].name)}
  else if(wins[w]>=2||mode==='training'||(mode==='survival'&&w===1)||(mode==='arcade'&&w===1)){roundState='result'}
  else{round++;startRound()}
 },2200)
}
function hud(){for(let i=0;i<2;i++){let f=fighters[i],x=i===0?55:725,w=500;box(x,45,w,22,11,'#171823','#fff3');let fill=w*f.hp/100;box(i===0?x:x+w-fill,45,fill,22,11,i===0?'#e98e72':'#67d3ca');text(C[f.id].name,i===0?x:x+w,84,24,'#fff',i===0?'left':'right');for(let n=0;n<2;n++)box(i===0?x+n*18:x+w-(n+1)*18,105,12,12,6,n<wins[i]?C[f.id].color:'#353544');box(i===0?x:x+w-500,130,500,8,4,'#1a1b29');box(i===0?x:x+w-500*f.energy/100,130,500*f.energy/100,8,4,i===0?'#d8b45d':'#61cbd1');}
box(594,48,92,55,10,'#12131fee','#ffffff20');text(String(Math.max(0,Math.ceil(timer))).padStart(2,'0'),640,76,34,'#fff','center');text('ROUND '+round,640,116,9,'#a9a7b2','center','DM Sans',700)}
function fight(){ctx.save();let sx=rand(-shake,shake),sy=rand(-shake,shake);shake*=.82;ctx.translate(sx,sy);bg();fighters.forEach(f=>art(f.x,f.y,1,C[f.id],{facing:f.facing,pose:f.hit?'hit':f.guard?'guard':f.attack?'attack':'idle'}));for(let s of shots){ctx.fillStyle=s.c;ctx.beginPath();ctx.arc(s.x,s.y,14,0,7);ctx.fill();ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(s.x-s.vx*3,s.y,24,0,7);ctx.fill();ctx.globalAlpha=1}particles.forEach(p=>text(p.text,p.x,p.y,18,p.c,'center'));vignette();hud();if(roundState==='intro'){ctx.fillStyle='#09091299';ctx.fillRect(0,0,W,H);text('ROUND '+round,640,300,64,'#fff','center');text(intro>0?'':'FIGHT',640,380,88, '#ffca68','center')}
if(roundState==='over'){box(440,270,400,120,12,'#11121dea','#ffca6855');text(winner===-1?'EMPATE':C[fighters[winner].id].name+' VENCE',640,320,42,'#ffcf72','center');text('ROUND '+round,640,358,12,'#fff','center','DM Sans',800)}
if(roundState==='result'){box(390,230,500,220,16,'#11121feF','#ffca6877');text(winner>=0?C[fighters[winner].id].name+' VENCE!':'EMPATE',640,300,48,'#ffcf72','center');text('PRESSIONE ESC PARA VOLTAR',640,360,12,'#ddd','center','DM Sans',700);button(515,390,250,42,'MENU PRINCIPAL',true)}ctx.restore();if(paused){ctx.fillStyle='#090912cc';ctx.fillRect(0,0,W,H);text('PAUSADO',640,340,54,'#fff','center');text('ESC - continuar',640,390,12,'#ccc','center','DM Sans',700)}}
function draw(){ctx.clearRect(0,0,W,H);if(screen==='menu')menu();else if(screen==='select')select();else fight()}
function loop(t){let dt=Math.min(.033,(t-(loop.last||t))/1000||0);loop.last=t;clock+=dt;physics(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function canvasPoint(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
canvas.addEventListener('pointerdown',e=>{let p=canvasPoint(e),mx=p.x,my=p.y;if(screen==='menu'){modesHit(mx,my);if(mx>=105&&mx<=455&&my>=610&&my<=652){screen='select';pickSide=0}}else if(screen==='select'){for(let i=0;i<5;i++)if(mx>=115+i*218&&mx<=295+i*218&&my>=180&&my<=490){selected[pickSide]=i;notify(C[i].name+' selecionado')}if(mx>=520&&mx<=760&&my>=590&&my<=638){if(pickSide===0&&mode!=='arcade'){pickSide=1}else{if(mode==='arcade')selected[1]=arcadeStart();startFight()}}}else if(screen==='fight'&&roundState==='result'&&mx>=515&&mx<=765&&my>=390&&my<=432){screen='menu'}});
addEventListener('keydown',e=>{
 if(!keys[e.code])pressed[e.code]=true;keys[e.code]=true;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){
  if(screen==='fight'){if(roundState==='result')screen='menu';else paused=!paused}
  else if(screen==='select')screen='menu';
 }
});
addEventListener('keyup',e=>{keys[e.code]=false});

function mobileButtons(){
 if(screen!=='fight'||innerWidth>900)return;
 ctx.save();ctx.globalAlpha=.82;
 const actions=[['◀',50,620,'KeyA'],['▶',130,620,'KeyD'],['▲',90,560,'KeyW'],['S',90,620,'KeyS'],['J',1120,620,'KeyJ'],['K',1190,620,'KeyK'],['I',1190,550,'KeyI']];
 actions.forEach(([label,x,y,code])=>{box(x-34,y-34,68,68,34,keys[code]?'#f1b85eaa':'#141522aa','#ffffff55');text(label,x,y,24,keys[code]?'#17131a':'#fff','center')});ctx.restore();
}
canvas.addEventListener('pointerdown',e=>{if(screen==='fight'&&innerWidth<=900){let p=canvasPoint(e);const b=[[50,620,'KeyA'],[130,620,'KeyD'],[90,560,'KeyW'],[90,620,'KeyS'],[1120,620,'KeyJ'],[1190,620,'KeyK'],[1190,550,'KeyI']];for(let [x,y,code] of b)if(Math.hypot(p.x-x,p.y-y)<75){keys[code]=true;pressed[code]=true}}});
canvas.addEventListener('pointerup',()=>{['KeyA','KeyD','KeyW','KeyS','KeyJ','KeyK','KeyI'].forEach(k=>keys[k]=false)});

const drawOriginal=draw;
draw=function(){drawOriginal();mobileButtons()};
notify('ESCOLHA SEU LUTADOR');
})();