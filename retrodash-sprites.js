import * as THREE from './vendor/three.module.js';

const frames=['pass','run','catch','block'];
const palettes=new Map();
let source;
let runCycle;
let idleFrame;
const strideCenters=[.55,.43,.54,.47];
// The forearm shifts slightly between sprint frames.
const strideBallAnchors=[
  {x:.4,y:1.63},{x:.5,y:1.66},{x:.37,y:1.69},{x:.47,y:1.62},
];
const defaultBallAnchor={x:.43,y:1.65};
// Advance the animation by field distance, without changing player movement.
const yardsPerRunFrame=.84;

function extractFrames(image,poses=frames){
  const canvas=document.createElement('canvas');
  canvas.width=image.width;
  canvas.height=image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,image.width,image.height).data;
  return poses.map((pose,index)=>{
    const gridSize=poses.length===1?1:2;
    const halfWidth=Math.floor(image.width/gridSize);
    const halfHeight=Math.floor(image.height/gridSize);
    const x0=index%2*halfWidth,y0=Math.floor(index/2)*halfHeight;
    let left=x0+halfWidth,top=y0+halfHeight,right=x0,bottom=y0;
    for(let y=y0;y<y0+halfHeight;y++){
      for(let x=x0;x<x0+halfWidth;x++){
        if(pixels[(y*image.width+x)*4+3]<90)continue;
        left=Math.min(left,x);
        right=Math.max(right,x);
        top=Math.min(top,y);
        bottom=Math.max(bottom,y);
      }
    }
    if(right<=left||bottom<=top)throw new Error('Empty football sprite: '+pose);
    const crop=document.createElement('canvas');
    crop.height=34;
    crop.width=Math.max(1,Math.round(crop.height*(right-left+1)/(bottom-top+1)));
    const cropCtx=crop.getContext('2d');
    cropCtx.drawImage(canvas,left,top,right-left+1,bottom-top+1,0,0,crop.width,crop.height);
    return cropCtx.getImageData(0,0,crop.width,crop.height);
  });
}

export function loadPlayerSprites(){
  for(const [file,save,poses] of [
    ['retrodash-players.png',frames=>{source=frames;}],
    ['retrodash-run-cycle.png',frames=>{runCycle=frames;}],
    ['retrodash-idle.png',([frame])=>{idleFrame=frame;},['idle']],
  ]){
    const image=new Image();
    image.onload=()=>{
      try{save(extractFrames(image,poses));}
      catch(error){console.warn(error);}
    };
    image.src=new URL('./assets/'+file,import.meta.url).href;
  }
}

function playerTexture(frame,colors){
  const [jersey,helmet,pants,skin]=colors.map(color=>{
    const hex=new THREE.Color(color).getHex();
    return [hex>>16,(hex>>8)&255,hex&255];
  });
  const canvas=document.createElement('canvas');
  canvas.width=frame.width;
  canvas.height=frame.height;
  const ctx=canvas.getContext('2d');
  const image=ctx.createImageData(frame.width,frame.height);
  image.data.set(frame.data);
  const d=image.data;
  for(let i=0;i<d.length;i+=4){
    if(d[i+3]<115){d[i+3]=0;continue;}
    d[i+3]=255;
    const [r,g,b]=[d[i],d[i+1],d[i+2]];
    let color,light;
    const row=Math.floor(i/4/frame.width)/frame.height;
    if(b>r+28&&b>g+17){
      color=row<.24?helmet:jersey;
      light=Math.max(.42,Math.min(1.25,b/185));
    }else if(row>.49&&row<.81&&r>132&&Math.max(r,g,b)-Math.min(r,g,b)<36){
      color=pants;
      light=Math.min(1.12,b/226);
    }else if(r>105&&r>g+12&&g>b+14){
      color=skin;
      light=Math.min(1.27,r/208);
    }
    if(color)for(let c=0;c<3;c++)d[i+c]=Math.min(255,Math.round(color[c]*light));
  }
  ctx.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=texture.magFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;
  return texture;
}

export function attachPlayerSprite(root){
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
    transparent:true,alphaTest:.5,toneMapped:false,depthWrite:false,
  }));
  sprite.center.set(.5,.12);
  sprite.position.y=.42;
  sprite.visible=false;
  root.add(sprite);
  return sprite;
}

export function showPlayerSprite(player,pose,striding,viewSign){
  if(!source)return;
  const {sprite,spriteColors:colors}=player;
  const facing=Math.cos(player.root.rotation.y)*viewSign<0;
  const runFrame=striding&&runCycle
    ? Math.floor((player.strideDistance??0)/yardsPerRunFrame)%runCycle.length
    : -1;
  const frame=runFrame>=0?runCycle[runFrame]:pose==='idle'?idleFrame??source[1]:source[frames.indexOf(pose)];
  const frameKey=runFrame<0?(pose==='idle'&&!idleFrame?'idle-fallback':pose):'stride-'+runFrame;
  const key=colors.join('/')+'/'+frameKey+'/'+facing;
  if(sprite.userData.key!==key){
    if(!palettes.has(key)){
      const texture=playerTexture(frame,colors);
      if(facing){texture.repeat.x=-1;texture.offset.x=1;}
      palettes.set(key,texture);
    }
    const texture=palettes.get(key);
    const height=pose==='block'?2.15:3.55;
    if(!sprite.material.map)sprite.material.needsUpdate=true;
    sprite.material.map=texture;
    sprite.scale.set(height*texture.image.width/texture.image.height,height,1);
    const center=runFrame<0?.5:strideCenters[runFrame];
    sprite.center.x=facing?1-center:center;
    sprite.userData.ballAnchor=strideBallAnchors[runFrame]??defaultBallAnchor;
    sprite.userData.key=key;
  }
  player.body.visible=false;
  sprite.visible=true;
}
