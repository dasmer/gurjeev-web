const divisions={
  'AFC East':['BUF','MIA','NE','NYJ'],
  'AFC North':['BAL','CIN','CLE','PIT'],
  'AFC South':['HOU','IND','JAX','TEN'],
  'AFC West':['DEN','KC','LV','LAC'],
  'NFC East':['DAL','NYG','PHI','WAS','GDT'],
  'NFC North':['CHI','DET','GB','MIN'],
  'NFC South':['ATL','CAR','NO','TB'],
  'NFC West':['ARI','LAR','SF','SEA'],
};

export function makeSeason(team){
  const division=Object.keys(divisions).find(name=>divisions[name].includes(team));
  const conference=division.slice(0,3);
  const rivals=divisions[division].filter(code=>code!==team&&(code!=='GDT'||team==='GDT'));
  const regular=rivals.concat(rivals);
  const conferenceOpponents=Object.entries(divisions)
    .filter(([name])=>name!==division&&name.startsWith(conference))
    .map(([,clubs])=>clubs[0]);
  const opposite=conference==='AFC'?'NFC':'AFC';
  const finalist=Object.entries(divisions).find(([name])=>name.startsWith(opposite))[1][0];
  const schedule=regular.map((opponent,index)=>({title:'Week '+(index+1),opponent}));
  schedule.push(
    {title:'Divisional playoff',opponent:conferenceOpponents[0]},
    {title:conference+' Championship',opponent:conferenceOpponents[1]},
    {title:'Super Bowl',opponent:finalist},
  );
  return {team,division,regularGames:regular.length,schedule,game:0,results:[]};
}

export function seasonStatus(season){
  const regularResults=season.results.slice(0,season.regularGames);
  const wins=regularResults.filter(result=>result.home>result.away).length;
  const losses=regularResults.length-wins;
  const playoffLoss=season.results.slice(season.regularGames)
    .some(result=>result.home<result.away);
  let ending='';
  if(regularResults.length===season.regularGames&&wins<=losses)ending='Season over · missed the playoffs';
  else if(playoffLoss)ending='Season over · eliminated';
  else if(season.results.length===season.schedule.length)ending='Super Bowl champions';
  return {record:wins+'–'+losses,ending,next:ending?null:season.schedule[season.results.length]};
}

const standingsTeams=Object.values(divisions).flat().filter(code=>code!=='GDT');

function shuffled(list){
  const result=[...list];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}

function simulateBotGame(team,opponent,ratings,round){
  const score=(off,def)=>{
    const chance=ratings[off].offense/(ratings[off].offense+ratings[def].defense);
    let points=0;
    for(let drive=0;drive<8;drive++){
      const roll=Math.random();
      if(roll<chance*.63)points+=7;
      else if(roll<chance*.95)points+=3;
    }
    return points;
  };
  let home=score(team,opponent),away=score(opponent,team);
  if(home===away){
    if(Math.random()<.5)home+=3;
    else away+=3;
  }
  return {round,team,opponent,home,away,winner:home>away?team:opponent};
}

// Simulate the games outside the player's path once, then keep them in the save.
export function preparePlayoffs(season){
  if(season.playoffs||season.results.length!==season.regularGames)return;
  if(seasonStatus(season).ending)return;
  const conference=season.division.slice(0,3);
  const peerGroups=Object.entries(divisions).filter(([name])=>name.startsWith(conference));
  const otherGroups=Object.entries(divisions).filter(([name])=>!name.startsWith(conference));
  const pick=([,clubs])=>shuffled(clubs.filter(code=>code!==season.team&&code!=='GDT'))[0];
  const peers=shuffled(peerGroups.filter(([name])=>name!==season.division).map(pick));
  const rivals=shuffled(otherGroups.map(pick));
  const ratings=Object.fromEntries(standingsTeams.map(code=>[code,{
    offense:55+Math.floor(Math.random()*41),defense:55+Math.floor(Math.random()*41),
  }]));
  const peerGame=simulateBotGame(peers[1],peers[2],ratings,'Divisional playoff');
  const opposite=conference==='AFC'?'NFC':'AFC';
  const first=simulateBotGame(rivals[0],rivals[1],ratings,'Divisional playoff');
  const second=simulateBotGame(rivals[2],rivals[3],ratings,'Divisional playoff');
  const final=simulateBotGame(first.winner,second.winner,ratings,opposite+' Championship');
  const start=season.regularGames;
  season.schedule[start].opponent=peers[0];
  season.schedule[start+1].opponent=peerGame.winner;
  season.schedule[start+2].opponent=final.winner;
  season.playoffs={ratings,games:[peerGame,first,second,final]};
}

export function gameVenue(game,index,regularGames){
  if(game?.title==='Super Bowl')return 'neutral';
  return index<regularGames&&index>=regularGames/2?'away':'home';
}

// Each conference has two divisional games feeding one championship game.
export function playoffBracket(season){
  if(!season)return null;
  const start=season.regularGames;
  const conference=season.division.slice(0,3);
  const results=season.results.slice(start);
  const [peer,first,second,final]=season.playoffs?.games??[];
  const scheduled=season.playoffs||results.length;
  const playerWon=index=>results[index]?.home>results[index]?.away;
  const match=(team,opponent,result)=>({
    team,opponent,home:result?.home,away:result?.away,
    winner:result?(result.home>result.away?team:opponent):null,
  });
  const playerSide=[
    match(scheduled?season.team:null,scheduled?season.schedule[start].opponent:null,results[0]),
    peer??match(null,null),
    match(playerWon(0)?season.team:results[0]?season.schedule[start].opponent:null,
      peer?.winner??(scheduled?season.schedule[start+1].opponent:null),results[1]),
  ];
  const otherSide=[first??match(null,null),second??match(null,null),final??match(null,null)];
  const otherChampion=final?.winner??(results.length>1?season.schedule[start+2].opponent:null);
  const playerChampion=playerWon(1)?season.team:null;
  const championship=match(playerChampion,otherChampion,results[2]);
  return {
    AFC:conference==='AFC'?playerSide:otherSide,
    NFC:conference==='NFC'?playerSide:otherSide,
    championship,
    nextIndex:seasonStatus(season).ending||season.results.length<start?-1:results.length,
    conference,
  };
}
