// Yard lines are measured from the opponent's own goal during their possession.
export function startDefensiveDrive(yard, openingCall){
  return {yard, target:Math.min(100,yard+10), down:1, calls:[openingCall], done:false, returnYard:25};
}

export function simulateDefensivePlay(drive, difficulty, random=Math.random, offenseRating=75){
  const {yard,target,down}=drive;
  if(down===4){
    if(yard>=62){
      const made=random()<.62+(yard-62)*.009;
      return {call:made?'The kick is good.':'The kick sails wide.',points:made?3:0,seconds:5,
        done:true,returnYard:made?25:Math.min(99,100-yard+7)};
    }
    return {call:'Fourth down. The offense punts.',points:0,seconds:8,done:true,
      returnYard:Math.max(20,100-yard-40)};
  }

  const roll=random();
  const difficultyBonus=difficulty==='hard'?.06:difficulty==='easy'?-.06:0;
  const adjustment=difficultyBonus+(offenseRating-75)*.0015;
  const seconds=5+Math.floor(random()*7);
  if(roll<.065-adjustment*.4){
    return {call:roll<.03?'Your secondary picks off the pass!':'Your defense recovers a fumble!',
      points:0,seconds,done:true,returnYard:Math.min(99,100-yard)};
  }
  let gain,call;
  if(roll<.18-adjustment){gain=-5;call='The pass rush gets a sack.';}
  else if(roll<.34-adjustment){gain=0;call='Tight coverage forces an incompletion.';}
  else if(roll<.56-adjustment){gain=3;call='A short run gains 3 yards.';}
  else if(roll<.77-adjustment){gain=8;call='A quick pass gains 8 yards.';}
  else if(roll<.93-adjustment){gain=17;call='The receiver breaks free for 17 yards.';}
  else {gain=34;call='A deep completion gains 34 yards.';}

  const nextYard=yard+gain;
  if(nextYard<=0)return {call:'Safety! Your defense scores 2.',points:0,safety:2,seconds,done:true,returnYard:35};
  if(nextYard>=100)return {call:'Touchdown. The extra point is good.',points:7,seconds,done:true,returnYard:25};
  const firstDown=nextYard>=target;
  return {call:firstDown?call+' First down.':call,points:0,seconds,yard:nextYard,
    down:firstDown?1:down+1,target:firstDown?Math.min(100,nextYard+10):target};
}
