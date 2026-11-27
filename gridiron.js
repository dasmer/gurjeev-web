import {renderPlayoffBracket} from './retrodash-bracket.js';
import {findPassCatch} from './retrodash-passing.js';
import {loadPlayerSprites,attachPlayerSprite,showPlayerSprite} from './retrodash-sprites.js';
import * as THREE from './vendor/three.module.js';
import {makeSeason,seasonStatus,preparePlayoffs,gameVenue} from './retrodash-season.js';
import {startDefensiveDrive,simulateDefensivePlay} from './retrodash-defense.js';
const $=id=>document.getElementById(id);
loadPlayerSprites();
// Team name, abbreviation, jersey, helmet, trim, pants. Keep the order for saved matches.
const teams=[
  ['Arizona Cardinals', 'ARI', '#97233f', '#f4f4f4', '#97233f', '#f4f4f4'],
  ['Atlanta Falcons', 'ATL', '#171717', '#171717', '#a71930', '#f4f4f4'],
  ['Baltimore Ravens', 'BAL', '#492773', '#171717', '#9e7c38', '#f4f4f4'],
  ['Buffalo Bills', 'BUF', '#1459bc', '#f4f4f4', '#c8102e', '#f4f4f4'],
  ['Carolina Panthers', 'CAR', '#171717', '#a5acaf', '#0085ca', '#bfc6ca'],
  ['Chicago Bears', 'CHI', '#17263d', '#17263d', '#dd4814', '#f4f4f4'],
  ['Cincinnati Bengals', 'CIN', '#171717', '#fb4f14', '#fb4f14', '#f4f4f4'],
  ['Cleveland Browns', 'CLE', '#542b18', '#ff541a', '#ff541a', '#f4f4f4'],
  ['Dallas Cowboys', 'DAL', '#17396b', '#b0b7bc', '#2464bf', '#b0b7bc'],
  ['Denver Broncos', 'DEN', '#fb4f14', '#15263c', '#15263c', '#f4f4f4'],
  ['Detroit Lions', 'DET', '#1885c8', '#a2aaad', '#a2aaad', '#bbc3c6'],
  ['Green Bay Packers', 'GB', '#203d31', '#ffba19', '#ffba19', '#ffba19'],
  ['Houston Texans', 'HOU', '#142438', '#142438', '#c8102e', '#f4f4f4'],
  ['Indianapolis Colts', 'IND', '#164a92', '#f4f4f4', '#164a92', '#f4f4f4'],
  ['Jacksonville Jaguars', 'JAX', '#00828a', '#171717', '#d7a943', '#f4f4f4'],
  ['Kansas City Chiefs', 'KC', '#e31837', '#e31837', '#ffba19', '#f4f4f4'],
  ['Las Vegas Raiders', 'LV', '#171717', '#a5acaf', '#a5acaf', '#a5acaf'],
  ['Los Angeles Chargers', 'LAC', '#138ec4', '#f4f4f4', '#ffc920', '#ffc920'],
  ['Los Angeles Rams', 'LAR', '#1651cf', '#164cbc', '#ffd526', '#ffd526'],
  ['Miami Dolphins', 'MIA', '#008e97', '#f4f4f4', '#fc6423', '#f4f4f4'],
  ['Minnesota Vikings', 'MIN', '#603394', '#603394', '#ffc62f', '#f4f4f4'],
  ['New England Patriots', 'NE', '#183655', '#b0b7bc', '#c8102e', '#b0b7bc'],
  ['New Orleans Saints', 'NO', '#171717', '#c5ac76', '#c5ac76', '#c5ac76'],
  ['New York Giants', 'NYG', '#1854b8', '#153d8a', '#d31d37', '#f4f4f4'],
  ['New York Jets', 'NYJ', '#125740', '#125740', '#f4f4f4', '#f4f4f4'],
  ['Philadelphia Eagles', 'PHI', '#12545b', '#12545b', '#a5acaf', '#f4f4f4'],
  ['Pittsburgh Steelers', 'PIT', '#171717', '#171717', '#ffb612', '#ffb612'],
  ['San Francisco 49ers', 'SF', '#b82028', '#c7a56a', '#c7a56a', '#c7a56a'],
  ['Seattle Seahawks', 'SEA', '#172b45', '#172b45', '#69be28', '#8c98a7'],
  ['Tampa Bay Buccaneers', 'TB', '#d50a0a', '#6c635e', '#ff7900', '#6c635e'],
  ['Tennessee Titans', 'TEN', '#4b92c1', '#142d4d', '#c8102e', '#f4f4f4'],
  ['Washington Commanders', 'WAS', '#822433', '#822433', '#ffba19', '#ffba19'],
  ["Gurjeev's dream team", 'GDT', '#125ddb', '#125ddb', '#f5f5e7', '#f5f5e7'],
];
for(const id of ['homeTeam','awayTeam'])teams.forEach((t,i)=>$(id).add(new Option(t[0],i)));$('homeTeam').value=23;$('awayTeam').value=8;
// Keys identify the formation slots from the original arcade lineup.
const dreamRoster={
  12:['QB',15,'Patrick Mahomes'],
  11:['WR',18,'Justin Jefferson'],
  18:['WR',80,'Jerry Rice'],
  87:['TE',87,'Rob Gronkowski'],
  22:['RB',20,'Barry Sanders'],
  60:['LT',73,'Joe Thomas'],
  61:['LG',63,'Gene Upshaw'],
  62:['C',52,'Mike Webster'],
  63:['RG',73,'Larry Allen'],
  64:['RT',78,'Anthony Muñoz'],
  d90:['DL',92,'Reggie White'],
  d91:['DL',99,'Aaron Donald'],
  d92:['DL',75,'Mean Joe Greene'],
  d93:['DL',78,'Bruce Smith'],
  d20:['CB',21,'Deion Sanders'],
  d21:['CB',24,'Darrelle Revis'],
  d22:['CB',26,'Rod Woodson'],
  d23:['CB',24,'Champ Bailey'],
  d31:['S',20,'Ed Reed'],
  d32:['S',43,'Troy Polamalu'],
};
const rosterGroups=[
  ['Offense',[12,11,18,87,22,60,61,62,63,64]],
  ['Defense',['d90','d91','d92','d93','d20','d21','d22','d23','d31','d32']],
];
for(const [side,slots] of rosterGroups){
  const heading=document.createElement('h3');
  heading.textContent=side;
  const list=document.createElement('ul');
  for(const slot of slots){
    const [position,number,name]=dreamRoster[slot];
    const item=document.createElement('li');
    item.textContent=position+' · #'+number+' '+name;
    list.append(item);
  }
  $('dreamRoster').append(heading,list);
}
let renderer;try{renderer=new THREE.WebGLRenderer({canvas:$('game'),antialias:false,powerPreference:'high-performance'});}catch(e){$('start').disabled=true;$('start').textContent='WebGL is unavailable in this browser';throw e;}
renderer.setPixelRatio(.9);renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;
const scene=new THREE.Scene();scene.background=new THREE.Color('#8faeb9');scene.fog=new THREE.Fog('#8faeb9',115,250);const camera=new THREE.OrthographicCamera(-50,50,32,-32,.1,350);scene.add(new THREE.HemisphereLight('#e5f5ff','#39523c',2.2));const sun=new THREE.DirectionalLight('#ffedd3',3.2);sun.position.set(-25,65,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-80,right:80,top:60,bottom:-60,far:160});sun.shadow.bias=-.0005;scene.add(sun);
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.75});const white=mat('#f5f5e7'),metal=mat('#d0dae0');const boxGeo=new THREE.BoxGeometry(1,1,1);function box(w,h,d,x,y,z,m,parent=scene){const o=new THREE.Mesh(boxGeo,m);o.scale.set(w,h,d);o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o;}
box(360,1,130,50,-.65,0,mat('#385552'));box(120,.2,53.3,50,-.1,0,mat('#307746'));
for(let x=0;x<100;x+=5)box(5,.025,53.3,x+2.5,.012,0,mat(x%10?'#3d6e30':'#437638'));
const endZones=[-5,105].map(x=>box(10,.06,53.3,x,.02,0,uniformMaterial('#153d60')));
for(const z of [-26.65,26.65])box(120,.05,.25,50,.06,z,white);
for(let x=0;x<=100;x+=5){box(.14,.04,53.3,x,.06,0,white);if(x%10)continue;for(const z of [-19,19])label(String(x>50?100-x:x),x,z,7,4);}
for(let x=1;x<100;x++)for(const z of [-3,3,-25,25])box(.1,.03,.65,x,.06,z,white);
function label(text,x,z,w,h,color='#f2f5e8'){const c=document.createElement('canvas');c.width=/^\d+$/.test(text)?192:512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 85px Arial';ctx.fillText(text,c.width/2,64);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));p.rotation.x=-Math.PI/2;p.position.set(x,.1,z);scene.add(p);return p;}
// Shield asset from the NFL's teams page. Keep the game branding in the end zones.
// Seating behind the end zones keeps wide landscape views inside the stadium.
for(const side of [-1,1]){
  for(let row=0;row<5;row++){
    const x=50+side*(65+row*3.2);
    box(3.2,1+row*.45,64,x,.5+row*.2,0,mat(row%2?'#314957':'#263e4b'));
  }
}
const shieldTexture=new THREE.TextureLoader().load('./assets/nfl-shield.png');
shieldTexture.colorSpace=THREE.SRGBColorSpace;
shieldTexture.magFilter=THREE.NearestFilter;
const midfieldShield=new THREE.Mesh(
  new THREE.PlaneGeometry(14,14),
  new THREE.MeshBasicMaterial({map:shieldTexture,transparent:true,depthWrite:false,toneMapped:false})
);
midfieldShield.rotation.x=-Math.PI/2;
midfieldShield.position.set(50,.1,0);
scene.add(midfieldShield);
const endZoneNames=[-5,105].map(x=>{
  const mark=label('RETRODASH',x,0,32,6);
  mark.rotation.z=Math.PI/2;
  return mark;
});
const teamRail=uniformMaterial('#122c40');
const logoPaths=code=>code==='GDT'?'./assets/team-logos/GDT.png':'./assets/team-logos/'+code+'.svg';
const logoTextures=new Map();
const stadiumLoader=new THREE.TextureLoader();
function stadiumLogo(code){
  if(!logoTextures.has(code)){
    const texture=stadiumLoader.load(logoPaths(code));
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.magFilter=THREE.NearestFilter;
    logoTextures.set(code,texture);
  }
  return logoTextures.get(code);
}

function paintEndZone(mesh,text){
  const texture=mesh.material.map;
  const canvas=texture.image;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font='900 82px Arial';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.strokeStyle='#101a2b';
  ctx.lineWidth=9;
  ctx.strokeText(text,256,64,490);
  ctx.fillStyle='#ffffff';
  ctx.fillText(text,256,64,490);
  texture.needsUpdate=true;
}

function applyStadium(){
  const playerTeam=teams[Number($('homeTeam').value)];
  const opponent=teams[Number($('awayTeam').value)];
  const stadiumTeam=venue==='away'?opponent:playerTeam;
  const neutral=venue==='neutral';
  midfieldShield.material.map=neutral?shieldTexture:stadiumLogo(stadiumTeam[1]);
  midfieldShield.scale.setScalar(neutral?1:1.32);
  teamRail.color.set(neutral?'#17253f':stadiumTeam[2]);
  endZones.forEach((zone,index)=>{
    const club=neutral?[playerTeam,opponent][index]:stadiumTeam;
    zone.material.color.set(club[2]);
    paintEndZone(endZoneNames[index],club[1]==='GDT'?'SINGH':club[0]);
  });
  const colors=['#f5eede','#172d44',stadiumTeam[2],stadiumTeam[2],stadiumTeam[4]].map(color=>new THREE.Color(color));
  for(let index=0;index<crowd.count;index++)crowd.setColorAt(index,colors[(index*7+Math.floor(index/195)*3)%colors.length]);
  crowd.instanceColor.needsUpdate=true;
  for(const [id,club] of [['homeLogo',playerTeam],['awayLogo',opponent]]){
    $(id).src=logoPaths(club[1]);
  }
  $('venueHud').textContent=neutral?'NEUTRAL SITE':venue==='away'?'AWAY AT '+stadiumTeam[1]:stadiumTeam[1]+' HOME';
}
for(const x of [-11,111]){box(.4,7,.4,x,3.5,0,mat('#ffd651'));box(.3,.3,6,x,7,0,mat('#ffd651'));for(const z of [-3,3])box(.25,7,.25,x,10.5,z,mat('#ffd651'));}
// Tiered stands and instanced crowd keep the stadium affordable on mobile.
const crowdGeo=new THREE.BoxGeometry(.65,.8,.65),crowdMat=mat('#ffffff');const crowd=new THREE.InstancedMesh(crowdGeo,crowdMat,3200);const dummy=new THREE.Object3D();let ci=0;const palette=['#16364c','#e4dcc8','#cc6345','#5e93b3','#85a3a8'];
for(const side of [-1,1])for(let row=0;row<8;row++){box(138,1.3,2.6,50,1+row*1.1,side*(33+row*2.1),mat(row%2?'#314957':'#263e4b'));for(let seat=0;seat<195;seat++){dummy.position.set(-17+seat*.69,2+row*1.1,side*(33+row*2.1));dummy.updateMatrix();crowd.setMatrixAt(ci,dummy.matrix);crowd.setColorAt(ci,new THREE.Color(palette[(seat*7+row*3)%palette.length]));ci++;}}crowd.count=ci;scene.add(crowd);
for(const x of [-12,112])for(const z of [-34,34]){box(.5,23,.5,x,11,z,metal);box(9,2,1,x,23,z,metal);box(8,1.2,.2,x,23,z-Math.sign(z)*.6,new THREE.MeshBasicMaterial({color:'#fff8cf'}));}
for(const z of [-29,29]){box(124,1,.4,50,.6,z,teamRail);for(let x=0;x<110;x+=18)label('RD',x,z,6,1.4,'#dcff7c');}
const los=box(.16,.07,53,25,.12,0,mat('#58caff'));const first=box(.22,.07,53,35,.13,0,mat('#f4d957'));
const playerGroup=new THREE.Group();scene.add(playerGroup);const helmetGeo=new THREE.SphereGeometry(.5,8,5),padGeo=new THREE.SphereGeometry(.5,6,4);let players=[],qb,carrier,receivers=[],defenders=[],blockers=[];
const cleats=uniformMaterial('#1b2630');

// Flat jersey colors retain their contrast under the stadium lights.
function uniformMaterial(color){return new THREE.MeshBasicMaterial({color,toneMapped:false});}
const markerMaterial=color=>new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,toneMapped:false});
const offenseMarker=markerMaterial('#73e5ff');
const defenseMarker=markerMaterial('#ffad60');
const qbMarker=markerMaterial('#ffe65c');
const catchMarker=markerMaterial('#d9ff79');
const markerOutline=markerMaterial('#11251b');
const markerMaterials=new Set([offenseMarker,defenseMarker,qbMarker,catchMarker,markerOutline]);
const markerGeometry=new THREE.RingGeometry(.8,1.03,8);
const markerOutlineGeometry=new THREE.RingGeometry(.7,1.12,8);

function jerseyColor(home,away,isHome){
  if(isHome)return home[2];
  // Compare displayed jersey colors so similar jerseys remain readable at pixel scale.
  const a=new THREE.Color(home[2]);
  const b=new THREE.Color(away[2]);
  a.convertLinearToSRGB();
  b.convertLinearToSRGB();
  const distance=Math.hypot(a.r-b.r,a.g-b.g,a.b-b.b);
  return distance<.49?'#f5f5e7':away[2];
}


function player(x,z,off,number,role){
  const root=new THREE.Group();
  const body=new THREE.Group();
  root.add(body);
  body.scale.setScalar(1.2);
  root.position.set(x,0,z);
  playerGroup.add(root);

  const home=teams[Number($('homeTeam').value)];
  const away=teams[Number($('awayTeam').value)];
  const [, , primary, helmetColor, trimColor, pantsColor]=off?home:away;
  const rosterEntry=(off?home:away)[1]==='GDT'?dreamRoster[off?number:'d'+number]:null;
  const shirtColor=venue==='away'?jerseyColor(away,home,!off):jerseyColor(home,away,off);
  const jersey=uniformMaterial(shirtColor);
  const jerseyShade=uniformMaterial(new THREE.Color(shirtColor).lerp(new THREE.Color('#14202a'),.28));
  const helmet=uniformMaterial(helmetColor);
  const pants=uniformMaterial(pantsColor);
  const stripe=uniformMaterial(shirtColor!==primary?primary:trimColor===primary?'#f5f5e7':trimColor);
  const skinColors=['#e0aa7a','#a16646','#734632','#c48a61'];
  const skin=uniformMaterial(skinColors[number%skinColors.length]);
  const glove=uniformMaterial('#e3e9ea');

  // The figures face +X. Helmet and shoulders lean forward into an athletic stance.
  root.rotation.y=off?0:Math.PI;
  box(.75,.62,.83,-.07,1.56,0,jerseyShade,body);
  box(.82,.52,1.21,.01,1.93,0,jersey,body);
  box(.63,.36,.84,-.09,1.15,0,pants,body);
  const head=new THREE.Mesh(helmetGeo,helmet);
  head.scale.set(1.08,1.12,1);
  head.position.set(.26,2.56,0);
  body.add(head);
  box(.55,.055,.12,.19,3.071,0,stripe,body);
  box(.2,.3,.52,.65,2.49,0,skin,body);
  box(.13,.1,.58,.76,2.39,0,glove,body);
  for(const side of [-1,1]){
    box(.25,.1,.12,.67,2.48,side*.25,cleats,body);
  }

  const limbs=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();
    leg.position.set(-.1,1.13,side*.26);
    leg.rotation.z=side*.15;
    body.add(leg);
    box(.39,.52,.38,.08,-.23,0,pants,leg);
    box(.26,.43,.29,-.04,-.62,0,jerseyShade,leg);
    box(.55,.16,.34,.11,-.99,0,cleats,leg);
    box(.28,.065,.34,.21,-.92,0,glove,leg);
    limbs.push(leg);

    const arm=new THREE.Group();
    arm.position.set(.03,2,side*.63);
    arm.rotation.z=-.35;
    body.add(arm);
    const pad=new THREE.Mesh(padGeo,jersey);
    pad.scale.set(.66,.53,.59);
    arm.add(pad);
    box(.35,.13,.45,.02,-.17,0,stripe,arm);
    box(.28,.37,.26,.03,-.36,0,skin,arm);
    box(.47,.22,.23,.17,-.57,0,skin,arm);
    box(.22,.25,.24,.41,-.56,0,glove,arm);
    limbs.push(arm);
  }

  const outline=new THREE.Mesh(markerOutlineGeometry,markerOutline);
  outline.rotation.x=-Math.PI/2;
  outline.position.y=.18;
  root.add(outline);
  const ring=new THREE.Mesh(markerGeometry,role==='QB'?qbMarker:off?offenseMarker:defenseMarker);
  ring.rotation.x=-Math.PI/2;
  ring.position.y=.2;
  root.add(ring);
  const p={root,body,limbs,ring,off,role,x,z,startX:x,startZ:z,
    sprite:attachPlayerSprite(root),spriteColors:[shirtColor,helmetColor,pantsColor,skinColors[number%skinColors.length]],number:rosterEntry?.[1]??number,name:rosterEntry?.[2]};
  players.push(p);
  return p;
}
const ball=new THREE.Mesh(new THREE.SphereGeometry(.32,12,8),mat('#773a20'));ball.scale.set(1.65,1,1);ball.castShadow=true;scene.add(ball);const seam=new THREE.Mesh(new THREE.BoxGeometry(.5,.025,.07),white);seam.position.y=.3;ball.add(seam);
// A separate pixel football sits over the runner's front arm in the billboard view.
const carryArt=document.createElement('canvas');
carryArt.width=11;
carryArt.height=7;
const carryContext=carryArt.getContext('2d');
const carryColors={'#':'#3b2017','b':'#a85e33','d':'#763b21','w':'#fff2cb'};
const carryPixels=[
  '....####...',
  '..##bbbb#..',
  '.#bbbwwbd#.',
  '#bbwwwbdd#.',
  '#bbbbddd#..',
  '.#dddd##...',
  '..####.....',
];
carryPixels.forEach((row,y)=>{
  [...row].forEach((pixel,x)=>{
    if(!carryColors[pixel])return;
    carryContext.fillStyle=carryColors[pixel];
    carryContext.fillRect(x,y,1,1);
  });
});
const carryTexture=new THREE.CanvasTexture(carryArt);
carryTexture.colorSpace=THREE.SRGBColorSpace;
carryTexture.minFilter=carryTexture.magFilter=THREE.NearestFilter;
const carriedBall=new THREE.Sprite(new THREE.SpriteMaterial({
  map:carryTexture,transparent:true,alphaTest:.5,depthWrite:false,toneMapped:false,
}));
carriedBall.scale.set(1.0,.64,1);
carriedBall.visible=false;
scene.add(carriedBall);
const carryUp=new THREE.Vector3();
const carryForward=new THREE.Vector3();

function drawCarriedBall(){
  const running=state==='run'||state==='return';
  carriedBall.visible=running&&carrier.sprite.visible;
  if(!carriedBall.visible){
    if(running)ball.position.set(carrier.x+(state==='return'?-.33:.33),2.25,carrier.z+.42);
    return;
  }
  const sprite=carrier.sprite;
  const direction=Math.cos(carrier.root.rotation.y)<0?-1:1;
  const tuck=carrier.sprite.userData.ballAnchor;
  carryUp.setFromMatrixColumn(camera.matrixWorld,1);
  carryForward.setFromMatrixColumn(camera.matrixWorld,2);
  carriedBall.position.copy(carrier.root.position).add(sprite.position);
  carriedBall.position.x+=direction*tuck.x;
  carriedBall.position.addScaledVector(carryUp,tuck.y);
  // Draw just in front of the chest without shifting its screen position.
  carriedBall.position.addScaledVector(carryForward,1.3);
  carriedBall.material.rotation=direction*.45;
  ball.visible=false;
}
const dots=[];for(let i=0;i<24;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.12,6,4),new THREE.MeshBasicMaterial({color:'#efffa8'}));scene.add(d);d.visible=false;dots.push(d);}const targetRing=new THREE.Mesh(new THREE.RingGeometry(1.1,1.3,32),new THREE.MeshBasicMaterial({color:'#dcff72',side:THREE.DoubleSide}));targetRing.rotation.x=-Math.PI/2;scene.add(targetRing);targetRing.visible=false;
let state='menu',paused=false,spot=25,lineToGain=35,down=1,homeScore=0,awayScore=0,quarter=1,time=90,playTime=0,route=0,flight=null,aim=null,drag=null,steer=0,diveTime=0,diveUsed=false,toastTime=0,sound=false,audioCtx,matchStats={passes:0,completions:0,yards:0},overtime=false;
const routeNames=['CROSSERS','VERTICALS','OUT ROUTES'];function beep(freq=440,duration=.12){if(!sound)return;audioCtx??=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.frequency.value=freq;g.gain.setValueAtTime(.06,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.start();o.stop(audioCtx.currentTime+duration);}
let cheerTime=0;
let crowdNoise;
function cheerCrowd(touchdown){
  const duration=touchdown?2.2:1.2;
  $('crowdCheer').textContent=touchdown?'CROWD ROARS · TOUCHDOWN':'CROWD CHEERS · BIG CATCH';
  $('crowdCheer').hidden=false;
  cheerTime=duration;
  if(!sound||!audioCtx||audioCtx.state!=='running')return;

  if(!crowdNoise){
    crowdNoise=audioCtx.createBuffer(1,audioCtx.sampleRate*3,audioCtx.sampleRate);
    const samples=crowdNoise.getChannelData(0);
    let previous=0;
    for(let i=0;i<samples.length;i++){
      previous=.82*previous+.18*(Math.random()*2-1);
      samples[i]=previous;
    }
  }
  const source=audioCtx.createBufferSource();
  const filter=audioCtx.createBiquadFilter();
  const volume=audioCtx.createGain();
  source.buffer=crowdNoise;
  filter.type='bandpass';
  filter.frequency.value=touchdown?720:950;
  filter.Q.value=.65;
  source.connect(filter).connect(volume).connect(audioCtx.destination);
  const now=audioCtx.currentTime;
  volume.gain.setValueAtTime(0,now);
  volume.gain.linearRampToValueAtTime(touchdown?.48:.3,now+.18);
  volume.gain.exponentialRampToValueAtTime(.001,now+duration);
  source.start(now);
  source.stop(now+duration);
}
function toast(s){$('toast').textContent=s;toastTime=2.4;}
function formation(){for(const p of players){
  const materials=new Set();
  p.root.traverse(o=>{
    if(o.material&&o.material!==metal&&o.material!==cleats&&!markerMaterials.has(o.material))materials.add(o.material);
  });
  for(const material of materials)material.dispose();
  playerGroup.remove(p.root);
}players=[];receivers=[];defenders=[];blockers=[];qb=player(spot-5,0,true,12,'QB');carrier=qb;for(let i=0;i<5;i++)blockers.push(player(spot-.7,(i-2)*2,true,60+i,'OL'));receivers.push(player(spot-1,-19,true,11,'WR'),player(spot-1,19,true,18,'WR'),player(spot-1,8,true,87,'TE'),player(spot-6,-5,true,22,'RB'));for(let i=0;i<4;i++)defenders.push(player(spot+2,(i-1.5)*3,false,90+i,'DL'));for(let i=0;i<4;i++)defenders.push(player(spot+7,[-19,19,8,-6][i],false,20+i,'DB'));defenders.push(player(Math.min(97,spot+18),-8,false,31,'S'),player(Math.min(98,spot+23),10,false,32,'S'));playTime=0;flight=null;aim=null;drag=null;steer=0;diveUsed=false;diveTime=0;los.position.x=spot;first.position.x=lineToGain;dots.forEach(d=>d.visible=false);targetRing.visible=false;state='ready';drawPlayArt();updateUI();}
const fullScreenButton=$('fullscreen');
const standalone=matchMedia('(display-mode: standalone)');
const fullscreenMode=matchMedia('(display-mode: fullscreen)');
function launchedAsApp(){
  return !document.fullscreenElement&&(navigator.standalone||standalone.matches||fullscreenMode.matches);
}
function refreshFullscreenButton(){
  fullScreenButton.hidden=launchedAsApp();
  const label=document.fullscreenElement?'Exit fullscreen':'Enter fullscreen';
  fullScreenButton.setAttribute('aria-label',label);
  fullScreenButton.title=label;
}
function showFullscreenHelp(){
  // Keep the match paused while the player reads the install instructions.
  if(!paused&&state!=='menu'&&state!=='over')pause();
  $('fullscreenHelp').showModal();
}
refreshFullscreenButton();
fullScreenButton.addEventListener('click',async()=>{
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else if(document.fullscreenEnabled&&document.documentElement.requestFullscreen){
      await document.documentElement.requestFullscreen();
    }else showFullscreenHelp();
  }catch{
    showFullscreenHelp();
  }
});
document.addEventListener('fullscreenchange',refreshFullscreenButton);
standalone.addEventListener('change',refreshFullscreenButton);
fullscreenMode.addEventListener('change',refreshFullscreenButton);
function formatGameClock(seconds){
  const wholeSeconds=Math.max(0,Math.ceil(seconds));
  return Math.floor(wholeSeconds/60)+':'+String(wholeSeconds%60).padStart(2,'0');
}
function updateClock(){
  const clock=$('clock');
  const label=(overtime?'OT':'Q'+quarter)+' · '+formatGameClock(time);
  if(clock.textContent!==label)clock.textContent=label;
}
function updateUI(){
  updateClock();
  $('controls').hidden=!document.body.classList.contains('playing')||['defense','return','over'].includes(state);
  $('yard').hidden=['defense','return'].includes(state);
$('homeName').textContent=teams[+$('homeTeam').value][1];$('awayName').textContent=teams[+$('awayTeam').value][1];$('homeDot').style.background=teams[+$('homeTeam').value][2];$('awayDot').style.background=teams[+$('awayTeam').value][2];$('homeScore').textContent=homeScore;$('awayScore').textContent=awayScore;$('down').textContent=['defense','return'].includes(state)?'OPP BALL':`${['','1ST','2ND','3RD','4TH'][down]} & ${lineToGain===100?'GOAL':Math.max(1,Math.ceil(lineToGain-spot))}`;$('yard').textContent=spot<=50?`OWN ${Math.round(spot)}`:`OPP ${Math.round(100-spot)}`;$('phase').textContent={ready:'PRE-SNAP',live:'FIND YOUR RECEIVER',flight:'BALL IN THE AIR',run:'GO. GO. GO.',dead:'PLAY COMPLETE',menu:'EXHIBITION',defense:'ON DEFENSE',return:'INTERCEPTION RETURN'}[state]||'FINAL';$('snap').hidden=state!=='ready'&&state!=='dead'&&state!=='return';$('snap').textContent=state==='dead'?'NEXT PLAY':'SNAP BALL';$('route').hidden=state!=='ready';$('route').textContent='ROUTE: '+routeNames[route];$('kick').hidden=state!=='ready'||spot<55;$('punt').hidden=state!=='ready';$('run').hidden=state!=='ready'&&state!=='live';$('handoff').hidden=state!=='ready'&&state!=='live';$('dive').hidden=state!=='run';$('hint').textContent=state==='run'?'↑ / ↓ or swipe to steer · SPACE to dive':state==='flight'?'Receiver tracking the ball':state==='dead'?'Choose NEXT PLAY to return to the huddle':'Drag the QB toward a receiver · release to pass';}
function snap(){if(state!=='ready')return;saveMatch();state='live';beep(280);updateUI();}
function run(rb=false){if(paused||!['ready','live'].includes(state))return;if(state==='ready')snap();carrier=rb?receivers[3]:qb;state='run';drag=null;aim=null;dots.forEach(d=>d.visible=false);targetRing.visible=false;toast(carrier.name?(rb?'Handoff to ':'QB keeper · ')+carrier.name:rb?'Handoff':'Quarterback keeper');updateUI();}
function dive(){if(state==='run'&&!diveUsed&&!paused){diveTime=.6;diveUsed=true;beep(180);}}
function newDrive(){spot=25;down=1;lineToGain=35;}
let defensiveDrive=null;
const defensePacing={opening:.65,play:.5,result:1.15,fastMultiplier:4};
let defenseDelay=0;
let fastDefense=false;
$('defenseSpeed').onclick=()=>{
  if(state!=='defense'||paused)return;
  fastDefense=!fastDefense;
  $('defenseSpeed').setAttribute('aria-pressed',fastDefense);
  $('defenseSpeed').firstChild.textContent=fastDefense?'NORMAL SPEED ':'FAST FORWARD ';
};

function showDefense(){
  const away=teams[Number($('awayTeam').value)][1];
  const home=teams[Number($('homeTeam').value)][1];
  $('defenseView').hidden=false;
  $('defenseMatchup').textContent=home+' DEFENSE · '+away+' POSSESSION';
  const d=defensiveDrive;
  const fieldPosition=d.yard<=50?away+' '+d.yard:home+' '+(100-d.yard);
  $('defenseSituation').textContent=d.done?'DRIVE COMPLETE':
    ['','1ST','2ND','3RD','4TH'][d.down]+' & '+(d.target===100?'GOAL':d.target-d.yard)+' · '+fieldPosition+(d.yard>=80?' · RED ZONE':'');
  const caption=$('defenseCall');
  caption.textContent=d.calls.at(-1);
  caption.dataset.outcome=d.outcome??'live';
}

function beginDefense(yard,openingCall){
  defensiveDrive=startDefensiveDrive(yard,openingCall);
  state='defense';
  defenseDelay=defensePacing.opening;
  showDefense();
  updateUI();
  saveMatch('defense');
}

function tickDefense(dt){
  defenseDelay-=dt*(fastDefense?defensePacing.fastMultiplier:1);
  if(defenseDelay>0)return;
  const drive=defensiveDrive;
  if(drive.done){
    spot=drive.returnYard;
    down=1;
    lineToGain=Math.min(100,spot+10);
    defensiveDrive=null;
    $('defenseView').hidden=true;
    if((overtime&&homeScore!==awayScore)||clockBoundary()){
      if(state!=='over')finish();
      return;
    }
    formation();
    toast('YOUR BALL');
    saveMatch();
    return;
  }

  const opponentCode=teams[Number($('awayTeam').value)][1];
  const rating=season?.game>=season?.regularGames?season.playoffs?.ratings[opponentCode]:null;
  const play=simulateDefensivePlay(drive,$('difficulty').value,Math.random,rating?.offense);
  time=Math.max(0,time-play.seconds);
  awayScore+=play.points;
  homeScore+=play.safety??0;
  drive.calls.push(play.call);
  drive.calls=drive.calls.slice(-3);

  if(play.done){
    drive.outcome=play.points?'score':'stop';
    drive.done=true;
    drive.returnYard=play.returnYard;
  }else{
    Object.assign(drive,{yard:play.yard,down:play.down,target:play.target});
    if(time===0){
      if(quarter===1||quarter===3){
        quarter++;
        time=90;
        drive.calls.push('The drive continues in the next quarter.');
      }else{
        drive.calls.push(quarter===2?'Halftime.':'The clock runs out.');
        drive.done=true;
      }
    }
  }
  defenseDelay=drive.done?defensePacing.result:defensePacing.play;
  showDefense();
  updateUI();
  saveMatch('defense');
}

function clockBoundary(){if(time>0)return false;if(quarter<4){quarter++;time=90;toast('Quarter '+quarter);return false;}if(homeScore===awayScore){overtime=true;time=90;toast('Sudden-death overtime');return false;}finish();return true;}
function finish(){
  if(season&&season.results.length===season.game){
    season.results.push({home:homeScore,away:awayScore});
  }
  if(season)preparePlayoffs(season);
  recordResult();
  const progress=season?seasonStatus(season):null;
  state='over';saveMatch('over');paused=true;$('overlay').hidden=false;$('overlayTitle').textContent=homeScore>awayScore?'VICTORY':'FINAL WHISTLE';$('overlayText').textContent=`${homeScore} – ${awayScore} · ${matchStats.completions}/${matchStats.passes} passing · ${matchStats.yards} yards`;if(progress){
    const game=season.schedule[season.game];
    $('overlayTitle').textContent=progress.ending||game.title+' final';
    $('overlayText').textContent+=' · Division record '+progress.record;
    if(progress.next)$('overlayText').textContent+=' · Next: '+progress.next.title+' vs '+teamByCode(progress.next.opponent)[0];
  }
  $('nextGame').hidden=!progress?.next;
  $('resultBracket').hidden=!season;
  $('resume').hidden=true;try{const best=+(localStorage.getItem('gridironBest')||0);localStorage.setItem('gridironBest',Math.max(best,homeScore));}catch{}updateUI();}
function endPlay(kind){
  if(!['live','run','flight','ready'].includes(state))return;
  const oldSpot=spot;
  let message=kind;
  let opponentYard=null;
  if(kind==='TOUCHDOWN'){
    homeScore+=7;
    message='Touchdown +7. The opponent takes the kickoff.';
    opponentYard=25;
    beep(660,.35);
    cheerCrowd(true);
  }else if(kind==='FIELD GOAL'){
    homeScore+=3;
    message='Field goal +3. The opponent takes the kickoff.';
    opponentYard=25;
  }else if(kind==='PUNT'){
    message='Punt. Your defense takes the field.';
    opponentYard=Math.max(20,100-spot-40);
  }else if(kind==='MISSED KICK'){
    opponentYard=Math.min(99,100-spot+7);
    message='The kick missed. Your defense takes the field.';
  }else{
    if(kind!=='INCOMPLETE')spot=Math.max(0,Math.min(100,carrier.x));
    if(spot<=0){
      awayScore+=2;
      message='Safety. The opponent takes over after the free kick.';
      opponentYard=30;
    }else{
      const gain=Math.round(spot-oldSpot);
      matchStats.yards+=gain;
      const yardage=(gain>0?'+':'')+gain+' YDS';
      if(spot>=lineToGain){
        down=1;
        lineToGain=Math.min(100,spot+10);
        message='FIRST DOWN · '+yardage;
      }else{
        down++;
        if(down>4){
          opponentYard=100-spot;
          message='Turnover on downs. Your defense takes the field.';
        }else if(kind!=='INCOMPLETE')message=kind+' · '+yardage;
      }
    }
  }

  state='dead';
  drag=null;
  aim=null;
  flight=null;
  dots.forEach(d=>d.visible=false);
  targetRing.visible=false;
  if(overtime&&homeScore!==awayScore){finish();return;}
  const halfExpired=time===0&&quarter>=2&&quarter!==3;
  if(clockBoundary())return;
  if(opponentYard!==null&&!halfExpired){
    $('toast').textContent='';
    beginDefense(Math.round(opponentYard),message);
    return;
  }
  if(opponentYard!==null||halfExpired)newDrive();
  if(!halfExpired)toast(message);
  saveMatch();
  updateUI();
}

const saveKey='retrodash.match.v1';
const teamByCode=code=>teams.find(team=>team[1]===code);
let season=null;
let venue='home';
let matchId;
const recordsKey='retrodash.records.v1';
let records=[];
try{
  const stored=JSON.parse(localStorage.getItem(recordsKey));
  if(Array.isArray(stored))records=stored;
}catch{}

function recordResult(){
  if(records.some(entry=>entry.id===matchId))return;
  const game=season?.schedule[season.game];
  records.unshift({
    id:matchId,team:teams[Number($('homeTeam').value)][1],opponent:teams[Number($('awayTeam').value)][1],
    points:homeScore,allowed:awayScore,stage:game?.title??'Exhibition',venue,
    completions:matchStats.completions,passes:matchStats.passes,yards:matchStats.yards,
  });
  try{localStorage.setItem(recordsKey,JSON.stringify(records));}
  catch{storageAvailable=false;}
}

function renderRecords(){
  const team=teams[Number($('recordsTeam').value)];
  const entries=records.filter(entry=>entry.team===team[1]);
  const wins=entries.filter(entry=>entry.points>entry.allowed).length;
  const titles=entries.filter(entry=>entry.stage==='Super Bowl'&&entry.points>entry.allowed).length;
  $('recordsSummary').textContent=entries.length
    ? wins+' wins · '+(entries.length-wins)+' losses · '+titles+' Super Bowl titles'
    : 'No finished games for this team yet.';
  $('recordsList').replaceChildren(...entries.map(entry=>{
    const item=document.createElement('li');
    const venueLabel=entry.venue==='neutral'?'vs':entry.venue==='away'?'at':'vs';
    item.textContent=entry.stage+' · '+(entry.points>entry.allowed?'W':'L')+' '+entry.points+'–'+entry.allowed+
      ' '+venueLabel+' '+(teamByCode(entry.opponent)?.[0]??entry.opponent)+
      ' · '+entry.completions+'/'+entry.passes+' passing · '+entry.yards+' yards';
    return item;
  }));
}
let savedMatch=readSave();
let storageAvailable=true;

function readSave(){
  try{
    const data=JSON.parse(localStorage.getItem(saveKey));
    if(!data||!['ready','defense','over'].includes(data.stage))return null;
    if(data.stage==='defense'&&(!data.defense||!Array.isArray(data.defense.calls)||
        ![data.defense.yard,data.defense.target,data.defense.down,data.defense.returnYard].every(Number.isFinite)))return null;
    if(!teams[data.home]||!teams[data.away]||![0,1,2].includes(data.route))return null;
    if(!['easy','normal','hard'].includes(data.difficulty))return null;
    if(![data.spot,data.lineToGain,data.down,data.homeScore,data.awayScore,data.quarter,data.time,
        data.stats?.passes,data.stats?.completions,data.stats?.yards].every(Number.isFinite))return null;
    return data;
  }catch{return null;}
}

function saveMatch(stage='ready'){
  savedMatch={
    stage,home:+$('homeTeam').value,away:+$('awayTeam').value,
    difficulty:$('difficulty').value,route,spot,lineToGain,down,homeScore,awayScore,
    quarter,time,overtime,stats:{...matchStats},season,venue,matchId,
    defense:stage==='defense'?defensiveDrive:null
  };
  try{localStorage.setItem(saveKey,JSON.stringify(savedMatch));}
  catch{storageAvailable=false;}
}

function checkpointOnExit(){
  if(state==='ready'||state==='dead')saveMatch();
  if(state==='defense')saveMatch('defense');
  // An unfinished live play keeps the checkpoint written at its snap.
}

window.addEventListener('pagehide',checkpointOnExit);

function refreshSaveMenu(){
  const savedSeason=savedMatch?.season;
  const progress=savedSeason?seasonStatus(savedSeason):null;
  const seasonMode=$('gameMode').value==='season';
  $('continueGame').hidden=!savedMatch;
  $('continueGame').textContent=savedSeason
    ? (progress.ending?'VIEW SEASON RESULT':'CONTINUE SEASON')
    : (savedMatch?.stage==='over'?'VIEW LAST RESULT':'CONTINUE MATCH');
  $('opponentChoice').hidden=seasonMode;
  $('startLabel').textContent=seasonMode?'START NEW SEASON':'PLAY EXHIBITION';
  const selected=teams[Number($('homeTeam').value)];
  const preview=makeSeason(selected[1]);
  $('venueChoice').hidden=seasonMode;
  $('recordsTeam').value=String(teams.indexOf(selected));
  renderRecords();
  $('divisionInfo').textContent=seasonMode
    ? preview.division+' · '+preview.regularGames+' games · '+(Math.floor(preview.regularGames/2)+1)+' wins to qualify'
    : '';

  const matchup=savedMatch
    ? teams[savedMatch.home][1]+' '+savedMatch.homeScore+' – '+savedMatch.awayScore+' '+teams[savedMatch.away][1]
    : '';
  $('saveStatus').textContent=storageAvailable
    ? (savedSeason?teamByCode(savedSeason.team)[0]+' · '+savedSeason.division+' · '+progress.record+
        (progress.ending?' · '+progress.ending:' · '+progress.next.title)
      : savedMatch?matchup+' · '+(savedMatch.stage==='over'?'Final':savedMatch.overtime?'OT':'Q'+savedMatch.quarter)
      :'Autosaves between plays. Continue here after closing the game.')
    : 'Browser storage is unavailable. Progress lasts until you close or refresh this tab.';

  $('seasonSchedule').hidden=!savedSeason;
  $('seasonGames').replaceChildren();
  if(!savedSeason)return;
  savedSeason.schedule.forEach((game,index)=>{
    const result=savedSeason.results[index];
    const item=document.createElement('li');
    const locked=index>=savedSeason.regularGames&&!result&&game!==progress.next;
    const location=gameVenue(game,index,savedSeason.regularGames);
    item.textContent=game.title+' · '+(locked?'Qualify to unlock':
      (location==='neutral'?'Neutral · ':location==='away'?'Away at ':'Home vs ')+teamByCode(game.opponent)[0]);
    if(result)item.textContent+=' · '+(result.home>result.away?'W':'L')+' '+result.home+'–'+result.away;
    $('seasonGames').append(item);
  });
}

function enterMatch(){
  paused=false;
  $('menu').hidden=true;
  $('overlay').hidden=true;
  $('resume').hidden=false;
  $('nextGame').hidden=true;
  $('resultBracket').hidden=true;
  $('defenseView').hidden=true;
  $('crowdCheer').hidden=true;
  cheerTime=0;
  defensiveDrive=null;
  applyStadium();
  $('seasonHud').hidden=!season;
  $('seasonHud').textContent=season?season.schedule[season.game].title:'';
  for(const id of ['scoreboard','playInfo','controls'])$(id).hidden=false;
  document.body.classList.add('playing');
  formation();
}
function start(){
  const activeSave=savedMatch&&(savedMatch.stage!=='over'||
    (savedMatch.season&&!seasonStatus(savedMatch.season).ending));
  if(activeSave&&!window.confirm('Replace your current RetroDash save?'))return;
  season=$('gameMode').value==='season'?makeSeason(teams[Number($('homeTeam').value)][1]):null;
  if(!season&&$('homeTeam').value===$('awayTeam').value){
    $('awayTeam').value=(+$('homeTeam').value+1)%teams.length;
  }
  startGame();
}
function startGame(){
  matchId=globalThis.crypto?.randomUUID?.()??Date.now()+'-'+Math.random().toString(36).slice(2);
  venue=$('exhibitionVenue').value;
  if(season){
    const game=season.schedule[season.game];
    venue=gameVenue(game,season.game,season.regularGames);
    const opponent=game.opponent;
    $('homeTeam').value=teams.indexOf(teamByCode(season.team));
    $('awayTeam').value=teams.indexOf(teamByCode(opponent));
  }
  homeScore=awayScore=0;
  quarter=1;
  time=90;
  overtime=false;
  matchStats={passes:0,completions:0,yards:0};
  route=+$('playbook').value;
  newDrive();
  enterMatch();
  saveMatch();
}
function continueMatch(){
  if(!savedMatch)return;
  const data=savedMatch;
  season=data.season??null;
  matchId=data.matchId??['legacy',data.home,data.away,season?.game??'exhibition',data.homeScore,data.awayScore].join(':');
  venue=data.venue??(season?.schedule[season.game]?.title==='Super Bowl'?'neutral':'home');
  $('homeTeam').value=data.home;
  $('awayTeam').value=data.away;
  $('difficulty').value=data.difficulty;
  $('playbook').value=data.route;
  ({route,spot,lineToGain,down,homeScore,awayScore,quarter,time,overtime}=data);
  matchStats={...data.stats};
  enterMatch();
  if(data.stage==='over')finish();
  if(data.stage==='defense'){
    defensiveDrive=data.defense;
    state='defense';
    defenseDelay=defensePacing.opening;
    showDefense();
    updateUI();
  }
}
function openBracket(currentSeason){
  renderPlayoffBracket($('bracketGrid'),$('bracketStatus'),currentSeason,logoPaths,
    code=>teamByCode(code)?.[0]??code);
  $('bracketDialog').showModal();
}
$('showBracket').onclick=()=>openBracket(savedMatch?.season);
$('resultBracket').onclick=()=>openBracket(season);
$('continueGame').onclick=continueMatch;
$('gameMode').onchange=refreshSaveMenu;
$('homeTeam').onchange=refreshSaveMenu;
$('nextGame').onclick=()=>{
  if(state!=='over'||!season||!seasonStatus(season).next)return;
  season.game=season.results.length;
  $('playbook').value=route;
  startGame();
};
teams.forEach((team,index)=>$('recordsTeam').add(new Option(team[0],index)));
$('recordsTeam').onchange=renderRecords;
refreshSaveMenu();
function pause(){if(state==='menu'||state==='over')return;paused=!paused;drag=null;aim=null;dots.forEach(d=>d.visible=false);targetRing.visible=false;$('overlay').hidden=!paused;$('overlayTitle').textContent='TIME OUT';$('overlayText').textContent='Take a breath. Your next big play is waiting.';$('resume').hidden=false;}
$('start').onclick=start;$('snap').onclick=()=>{if(paused)return;if(state==='dead')formation();else snap();};$('run').onclick=()=>run();$('handoff').onclick=()=>run(true);$('dive').onclick=dive;$('pause').onclick=pause;$('resume').onclick=pause;$('restart').onclick=()=>{checkpointOnExit();paused=false;state='menu';$('defenseView').hidden=true;$('crowdCheer').hidden=true;cheerTime=0;$('overlay').hidden=true;$('menu').hidden=false;for(const id of ['scoreboard','playInfo','controls'])$(id).hidden=true;document.body.classList.remove('playing');$('toast').textContent='';refreshSaveMenu();};$('route').onclick=()=>{if(state==='ready'&&!paused){route=(route+1)%3;drawPlayArt();saveMatch();updateUI();}};$('kick').onclick=()=>{if(state==='ready'&&!paused)endPlay(Math.random()<Math.max(.25,.95-(100-spot)/100)?'FIELD GOAL':'MISSED KICK');};$('punt').onclick=()=>{if(state==='ready'&&!paused)endPlay('PUNT');};$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'SOUND ON':'SOUND OFF';beep();};
const ray=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);function groundPoint(x,y){const rect=$('game').getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),camera);return ray.ray.intersectPlane(ground,new THREE.Vector3());}
function passDuration(p){return .65+Math.hypot(p.x-qb.x,p.z-qb.z)/38;}
function screenPoint(p){
  const v=new THREE.Vector3(p.x,1.5,p.z).project(camera);
  return {
    x:fieldBounds.left+(v.x+1)*fieldBounds.width/2,
    y:fieldBounds.top+(1-v.y)*fieldBounds.height/2,
  };
}
function aimAt(e){const b=groundPoint(e.clientX,e.clientY);if(!b)return;const delta=b.sub(new THREE.Vector3(qb.x,0,qb.z));if(delta.length()>48)delta.setLength(48);aim=new THREE.Vector3(qb.x+delta.x,0,THREE.MathUtils.clamp(qb.z+delta.z,-29,29));
// A receiver under the finger gets a modest lead assist; free-field aiming still works.
let selected=null;
let best=e.pointerType==='touch'?36:28;
for(const player of [...defenders,...receivers]){
  const point=screenPoint(player);
  const distance=Math.hypot(point.x-e.clientX,point.y-e.clientY);
  if(distance>=best)continue;
  best=distance;
  selected=player;
}
// A defender under the pointer must not pull the aim toward a nearby receiver.
if(selected&&!selected.off&&aim.x>=qb.x){
  aim.set(selected.x,0,selected.z);
}
if(selected?.off&&aim.x>=qb.x){
  let duration=passDuration(selected);
  for(let i=0;i<3;i++){
    const lead=routePosition(receivers.indexOf(selected),playTime+duration);
    aim.set(lead.x,0,lead.z);
    duration=passDuration(aim);
  }
}
$('hint').textContent=aim.x<qb.x?'Release to tuck and run':selected?.off?'Receiver targeted · release to pass':selected?'Defender in the throwing lane':'Drag onto a receiver · release to pass';targetRing.position.set(aim.x,.15,aim.z);targetRing.visible=true;targetRing.material.color.set(aim.x<qb.x?'#ffb164':'#dcff72');for(let i=0;i<dots.length;i++){const t=(i+1)/dots.length;dots[i].visible=true;dots[i].position.set(THREE.MathUtils.lerp(qb.x,aim.x,t),1.8*(1-t)+Math.sin(t*Math.PI)*6,THREE.MathUtils.lerp(qb.z,aim.z,t));}return selected;}
$('game').addEventListener('pointerdown',e=>{if(paused||drag||e.button!==0)return;if(state==='run'){drag={id:e.pointerId,x:e.clientX,y:e.clientY,run:true};$('game').setPointerCapture(e.pointerId);return;}if(!['ready','live'].includes(state))return;const p=screenPoint(qb);if(Math.hypot(p.x-e.clientX,p.y-e.clientY)>(e.pointerType==='touch'?42:32))return;if(state==='ready')snap();drag={id:e.pointerId,x:e.clientX,y:e.clientY};$('game').setPointerCapture(e.pointerId);aimAt(e);});
$('game').addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||paused)return;if(drag.run)steer=THREE.MathUtils.clamp((e.clientY-drag.y)/65,-1,1);else aimAt(e);});
$('game').addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;if(drag.run){steer=0;drag=null;return;}const distance=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);const intended=distance>=10?aimAt(e):null;drag=null;if(state!=='live'||paused)return;if(!aim||distance<10){aim=null;dots.forEach(d=>d.visible=false);targetRing.visible=false;return;}if(aim.x<qb.x){run();return;}flight=createPass(aim,intended);state='flight';matchStats.passes++;aim=null;dots.forEach(d=>d.visible=false);beep(520);updateUI();});
$('game').addEventListener('pointercancel',()=>{drag=null;aim=null;steer=0;dots.forEach(d=>d.visible=false);targetRing.visible=false;});
const keys=new Set();window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(['ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(e.repeat)return;keys.add(e.code);if(e.code==='Escape')pause();if(paused)return;if(e.code==='Space'){if(state==='ready')snap();else if(state==='dead')formation();else dive();}if(e.code==='KeyR')run();if(e.code==='KeyH')run(true);});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();if(!paused&&state!=='menu'&&state!=='over')pause();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)return;
  checkpointOnExit();
  if(!paused&&state!=='menu'&&state!=='over')pause();});
function distanceToCatch(player, point){
  return Math.hypot(player.x-point.x,player.z-point.z);
}

function closestToCatch(players, point){
  return players.reduce((closest,player)=>
    distanceToCatch(player,point)<distanceToCatch(closest,point)?player:closest);
}

function createPass(to,intended){
  const duration=passDuration(to);
  const receiver=intended?.off?intended:closestToCatch(receivers,to);
  const coverage=defenders.slice(4)
    .sort((a,b)=>distanceToCatch(a,to)-distanceToCatch(b,to))
    .slice(0,2);
  return {
    from:new THREE.Vector3(qb.x,1.9,qb.z),
    to:to.clone(),
    t:0,
    duration,
    receiver,
    coverage,
    aimedDefender:intended&&!intended.off?intended:null,
  };
}

function advancePass(dt){
  flight.t=Math.min(1,flight.t+dt/flight.duration);
  const t=flight.t;
  ball.position.lerpVectors(flight.from,flight.to,t);
  ball.position.y=1.9*(1-t)+Math.sin(t*Math.PI)*6;
  ball.rotation.z+=dt*14;
  if(t<.5)return;
  const catcher=findPassCatch(ball.position,receivers,defenders);
  if(!catcher){
    if(t===1)endPlay('INCOMPLETE');
    return;
  }

  targetRing.visible=false;
  carrier=catcher;
  flight=null;
  if(!catcher.off){
    beginInterceptionReturn();
    return;
  }
  const bigCatch=catcher.x-spot>=8||distanceToCatch(closestToCatch(defenders,catcher),catcher)<3;
  state='run';
  matchStats.completions++;
  if(bigCatch)cheerCrowd(false);
  toast(catcher.name?'CAUGHT · '+catcher.name:'CAUGHT · TAKE IT HOME');
  beep(740);
  updateUI();
}

let returnLane=0;
let returnElapsed=0;
function beginInterceptionReturn(){
  state='return';
  returnElapsed=0;
  // Look for an open lane ahead before the pursuit closes in.
  const ahead=Math.max(0,carrier.x-8);
  const pursuers=[qb,...blockers,...receivers];
  const lanes=[carrier.z,carrier.z-7,carrier.z+7]
    .map(z=>THREE.MathUtils.clamp(z,-24.5,24.5));
  const room=z=>Math.min(...pursuers.map(p=>distanceToCatch(p,{x:ahead,z})));
  returnLane=lanes.reduce((best,lane)=>room(lane)>room(best)?lane:best);
  toast('INTERCEPTED!');
  beep(210,.2);
  updateUI();
}

function finishInterceptionReturn(scored){
  state='dead';
  if(scored){
    awayScore+=7;
    toast('PICK SIX · OPPONENT +7');
    beep(165,.3);
    newDrive();
    if((overtime&&homeScore!==awayScore)||clockBoundary()){
      if(state!=='over')finish();
      return;
    }
    saveMatch();
    updateUI();
    return;
  }

  const touchback=carrier.x>=100;
  const yard=touchback?20:THREE.MathUtils.clamp(Math.round(100-carrier.x),1,99);
  const halfExpired=time===0&&(quarter===2||quarter===4);
  if(clockBoundary())return;
  if(halfExpired){
    newDrive();
    saveMatch();
    updateUI();
    return;
  }
  beginDefense(yard,touchback?'Interception in the end zone. Touchback.':'Interception return stopped. Your defense takes the field.');
}

function simulateInterceptionReturn(dt){
  returnElapsed+=dt;
  time=Math.max(0,time-dt);
  const returnSpeed=$('difficulty').value==='hard'?8.2:7.35;
  move(carrier,-1,returnLane,returnSpeed,dt);
  if(carrier.x<=0){finishInterceptionReturn(true);return;}
  if(Math.abs(carrier.z)>=26.65){finishInterceptionReturn(false);return;}

  const pursuitTarget={x:carrier.x-1,z:carrier.z};
  for(const player of [qb,...blockers,...receivers]){
    const speed=player.role==='OL'?6.2:8.45;
    move(player,pursuitTarget.x,pursuitTarget.z,speed,dt);
    if(returnElapsed>.24&&distanceToCatch(player,carrier)<1.05){
      finishInterceptionReturn(false);
      return;
    }
  }
}

function recordStride(player,distance){
  player.strideDistance=(player.strideDistance??0)+distance;
  player.isMoving=distance>.001;
}

function move(p,x,z,speed,dt){const dx=x-p.x,dz=z-p.z,l=Math.hypot(dx,dz);if(l>.05){const distance=Math.min(l,speed*dt);recordStride(p,distance);const f=distance/l;p.x+=dx*f;p.z+=dz*f;p.root.rotation.y=-Math.atan2(dz,dx);p.limbs.forEach((leg,i)=>leg.rotation.z=Math.sign(Math.sin(playTime*8+(i===1||i===2?Math.PI:0)))*.31-(i%2?.35:0));p.body.position.y=0;}p.root.position.set(p.x,0,p.z);}
function routePosition(index, seconds){
  const p=receivers[index];
  const distance=seconds*6.5;
  const stem=[9,14,6,4][index];
  let dx=distance,dz=0;
  if(route!==1&&distance>stem){
    const breakDistance=distance-stem;
    if(route===0){
      dx=stem+breakDistance*.78;
      dz=breakDistance*.625*(index%2?-1:1);
    }else{
      dx=stem+breakDistance*.28;
      dz=breakDistance*.96*Math.sign(p.startZ);
    }
  }
  return {x:Math.min(103,p.startX+dx),z:THREE.MathUtils.clamp(p.startZ+dz,-25,25)};
}

const routeInk=new THREE.MeshBasicMaterial({color:'#d9ff79',toneMapped:false});
const routeOutline=new THREE.MeshBasicMaterial({color:'#244022',toneMapped:false});
const arrowGeometry=new THREE.ConeGeometry(.75,1.45,3);
const playArt=new THREE.Group();
scene.add(playArt);
function drawPlayArt(){
  playArt.clear();
  receivers.forEach((p,index)=>{
    const endTime=route===1?3.8:3.2;
    let last=routePosition(index,0);
    for(let t=.2;t<=endTime+.01;t+=.2){
      const next=routePosition(index,t);
      const dx=next.x-last.x,dz=next.z-last.z,length=Math.hypot(dx,dz);
      if(length<.05)break;
      const x=(last.x+next.x)/2,z=(last.z+next.z)/2;
      const angle=-Math.atan2(dz,dx);
      box(length+.18,.02,.7,x,.125,z,routeOutline,playArt).rotation.y=angle;
      box(length+.08,.02,.36,x,.15,z,routeInk,playArt).rotation.y=angle;
      if(t+.19>endTime||next.x===103){
        const arrow=new THREE.Mesh(arrowGeometry,routeInk);
        arrow.position.set(next.x,.17,next.z);
        arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx,0,dz).normalize());
        playArt.add(arrow);
        break;
      }
      last=next;
    }
  });
}
function simulate(dt){
  playTime+=dt;
  time=Math.max(0,time-dt);
  const baseSpeed=$('difficulty').value==='easy'?3.9:$('difficulty').value==='hard'?6.4:5.1;
  const opponentCode=teams[Number($('awayTeam').value)][1];
  const playoffRating=season?.game>=season?.regularGames?season.playoffs?.ratings[opponentCode]:null;
  const speed=baseSpeed+(playoffRating?(playoffRating.defense-75)*.018:0);
  receivers.forEach((p,index)=>{
    if(p===carrier&&state==='run')return;
    if(state==='flight'&&p===flight.receiver){
      move(p,flight.to.x,THREE.MathUtils.clamp(flight.to.z,-26,26),8.6,dt);
      return;
    }
    const destination=routePosition(index,playTime);
    move(p,destination.x,destination.z,6.5,dt);
  });
for(let i=0;i<blockers.length;i++){const p=blockers[i];move(p,spot+.2,p.startZ,1,dt);}
if(state==='run'){let steering=steer;if(keys.has('ArrowUp')||keys.has('KeyW'))steering=-1;if(keys.has('ArrowDown')||keys.has('KeyS'))steering=1;const forward=(diveTime>0?11:carrier===qb?5.8:7.2)*dt;const lateral=steering*8*dt;carrier.x+=forward;carrier.z+=lateral;recordStride(carrier,Math.hypot(forward,lateral));carrier.root.position.set(carrier.x,0,carrier.z);carrier.root.rotation.y=-Math.atan2(steering,1);carrier.limbs.forEach((l,i)=>l.rotation.z=Math.sign(Math.sin(playTime*8+(i===1||i===2?Math.PI:0)))*.38-(i%2?.35:0));carrier.body.rotation.z=diveTime>0?-.95:0;diveTime=Math.max(0,diveTime-dt);if(carrier.x>=100){endPlay('TOUCHDOWN');return;}if(Math.abs(carrier.z)>26){endPlay('OUT OF BOUNDS');return;}}
for(let i=0;i<defenders.length;i++){const p=defenders[i];let target=carrier,s=speed;if(state!=='run'&&i>=4){target=receivers[(i-4)%4];s=speed*.85;if(state==='flight'&&(flight.aimedDefender===p||
    (flight.coverage.includes(p)&&flight.t*flight.duration>.3))){
  target=flight.to;
  s=speed;
}}if(state==='flight'&&flight.aimedDefender===p){target=flight.to;s=speed;}else if(i<4&&playTime<2.6){target={x:spot+1,z:p.startZ};s=1;}else if(i<4&&state!=='run')s=speed*.75;move(p,target.x,target.z,s,dt);if((state==='run'||state==='live')&&Math.hypot(p.x-carrier.x,p.z-carrier.z)<1.1&&playTime>.8){endPlay(state==='live'?'SACK':'TACKLED');return;}}
if(state==='flight')advancePass(dt);
if(playTime>16&&state==='live')endPlay('SACK');}
const fieldTags=['QB','WR 1','WR 2','TE','RB'].map(position=>{
  const tag=document.createElement('span');
  tag.className=position==='QB'?'field-tag field-tag-qb':'field-tag';
  tag.dataset.position=position;
  tag.hidden=true;
  document.body.append(tag);
  return tag;
});

let fieldBounds;
const shortLandscape=matchMedia('(orientation: landscape) and (max-height: 560px)');
function resize(){
  fieldBounds=$('game').getBoundingClientRect();
  const {width,height}=fieldBounds;
  if(!width||!height)return;
  renderer.setSize(width,height,false);
  const ratio=width/height;
  const halfHeight=Math.max(shortLandscape.matches?27:29,22/ratio);
  camera.left=-halfHeight*ratio;
  camera.right=halfHeight*ratio;
  camera.top=halfHeight;
  camera.bottom=-halfHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);
new ResizeObserver(resize).observe($('game'));
resize();
formation();
state='menu';
let last=performance.now(),cameraFocus=47;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-last)/1000);
  last=now;
  if(!paused&&state==='defense')tickDefense(dt);
  if(!paused&&['live','run','flight','return'].includes(state)){
    for(const player of players)player.isMoving=false;
    if(state==='return')simulateInterceptionReturn(dt);
    else simulate(dt);
    updateClock();
  }
  if(!paused&&cheerTime>0){
    cheerTime-=dt;
    if(cheerTime<=0)$('crowdCheer').hidden=true;
  }
  if(!paused&&toastTime>0){
    toastTime-=dt;
    if(toastTime<=0)$('toast').textContent='';
  }
  if(state!=='flight'){
    ball.position.set(carrier.x+(state==='return'?-.55:.55),1.5,carrier.z+.3);
    ball.rotation.z=.4;
  }

  // Keep the view fixed during a pass. Scroll only when the runner nears the edge.
  if(state==='menu')cameraFocus=47;
  if(state==='ready'){
    const focus=qb.x+(fieldBounds.width<fieldBounds.height?10:15);
    const edge=Math.min(camera.right,60);
    cameraFocus=THREE.MathUtils.clamp(focus,-10+edge,110-edge);
  }
  if(state==='run')cameraFocus=Math.max(cameraFocus,carrier.x-camera.right*.55);
  if(state==='return')cameraFocus=THREE.MathUtils.lerp(cameraFocus,carrier.x,1-Math.exp(-dt*6));
  const onDefense=state==='defense';
  if(onDefense){
    // Opponents move left in world coordinates, toward our goal line.
    const focus=THREE.MathUtils.clamp(100-defensiveDrive.yard-7,8,92);
    cameraFocus=THREE.MathUtils.lerp(cameraFocus,focus,1-Math.exp(-dt*8));
  }
  if(state!=='menu'){
    const edge=Math.min(camera.right,60);
    cameraFocus=THREE.MathUtils.clamp(cameraFocus,-10+edge,110-edge);
  }
  playerGroup.visible=!onDefense;
  ball.visible=!onDefense;
  los.visible=!onDefense;
  first.visible=!onDefense;
  camera.position.set(cameraFocus,90,47);
  camera.lookAt(cameraFocus,0,0);
  camera.updateMatrixWorld();
  playArt.visible=state==='ready';
  for(const receiver of receivers){
    const tracking=state==='flight'&&receiver===flight.receiver;
    receiver.ring.material=tracking?catchMarker:offenseMarker;
  }
  for(const player of players){
    const catching=state==='flight'&&player===flight.receiver&&flight.t>.62;
    const beforeSnap=state==='menu'||state==='ready';
    const blocking=(player.role==='OL'||(player.role==='DL'&&playTime<2.6))&&state!=='dead'&&state!=='return';
    const moving=player.isMoving&&['live','flight','run','return'].includes(state);
    const pose=catching?'catch':player===qb&&(beforeSnap||state==='live')?'pass':
      blocking?'block':moving?'run':'idle';
    showPlayerSprite(player,pose,pose==='run');
  }
  const promptOpen=!$('overlay').hidden;
  fieldTags.forEach((tag,index)=>{
    const player=index===0?qb:receivers[index-1];
    const show=index===0
      ? ['ready','live'].includes(state)
      : state==='ready'||(state==='flight'&&player===flight.receiver);
    tag.hidden=promptOpen||!show;
    if(tag.hidden)return;
    const lastName=player.name?.split(' ').at(-1);
    const label=lastName?(shortLandscape.matches?lastName:'#'+player.number+' '+lastName):tag.dataset.position;
    if(tag.textContent!==label)tag.textContent=label;
    const position=screenPoint(player);
    if(position.x<fieldBounds.left||position.x>fieldBounds.right||
        position.y<fieldBounds.top||position.y>fieldBounds.bottom){
      tag.hidden=true;
      return;
    }
    tag.style.left=position.x+'px';
    const headHeight=player.sprite.visible?player.sprite.scale.y:2.6;
    const headOffset=headHeight*fieldBounds.height/(camera.top-camera.bottom);
    const lift=Math.max(12,headOffset-4);
    const captionTop=fieldBounds.top+lift+18;
    tag.style.top=Math.max(position.y,captionTop)+'px';
    tag.style.setProperty('--tag-lift',lift+'px');
  });
  drawCarriedBall();
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
