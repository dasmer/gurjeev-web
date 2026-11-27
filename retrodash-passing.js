// Check the live ball position, so a defender can jump a pass before it reaches the aim marker.
export function findPassCatch(ball, receivers, defenders){
  if(ball.y>2.7||Math.abs(ball.z)>=26.65||ball.x>110)return null;
  let catchDistance=1.9;
  let catcher=null;
  for(const player of [...defenders,...receivers]){
    if(Math.abs(player.z)>=26.65||player.x>110)continue;
    const distance=Math.hypot(player.x-ball.x,player.z-ball.z);
    if(distance>=catchDistance)continue;
    catchDistance=distance;
    catcher=player;
  }
  return catcher;
}
