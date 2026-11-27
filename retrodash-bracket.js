import {playoffBracket,seasonStatus} from './retrodash-season.js';

export function renderPlayoffBracket(container,status,season,logoPath,teamName){
  container.replaceChildren();
  const bracket=playoffBracket(season);
  if(!bracket){
    status.textContent='Start a season to see your playoff path.';
    return;
  }
  const progress=seasonStatus(season);
  status.textContent=progress.ending||
    (bracket.nextIndex>=0?'Next game: '+progress.next.title:
      'Finish with a winning record to earn your playoff spot.');

  function addMatch(game,column,row,label,active=false){
    const card=document.createElement('section');
    card.className='bracket-match';
    card.dataset.column=column;
    card.classList.toggle('bracket-next',active);
    card.style.gridColumn=column;
    card.style.gridRow=row;
    card.setAttribute('aria-label',label);
    if(column===3){
      const title=document.createElement('h3');
      title.textContent='SUPER BOWL';
      card.append(title);
    }

    for(const [code,score] of [[game.team,game.home],[game.opponent,game.away]]){
      const line=document.createElement('div');
      line.className='bracket-team';
      if(code&&code===season.team)line.classList.add('bracket-your-team');
      if(code&&code===game.winner)line.classList.add('bracket-winner');
      if(code){
        const logo=document.createElement('img');
        logo.src=logoPath(code);
        logo.alt='';
        line.append(logo);
      }
      const club=document.createElement('b');
      club.textContent=code??'TBD';
      if(code)club.title=teamName(code);
      const points=document.createElement('span');
      points.textContent=score??'–';
      line.append(club,points);
      card.append(line);
    }
    container.append(card);
  }

  for(const [text,column] of [['AFC',1],['NFC',5]]){
    const title=document.createElement('h3');
    title.className='bracket-conference';
    title.textContent=text;
    title.style.gridColumn=column;
    container.append(title);
  }
  for(const [conference,outer,inner] of [['AFC',1,2],['NFC',5,4]]){
    const [first,second,final]=bracket[conference];
    const own=conference===bracket.conference;
    const branch=document.createElement('div');
    branch.className='bracket-branch bracket-branch-'+conference.toLowerCase();
    branch.style.gridColumn=outer;
    branch.setAttribute('aria-hidden','true');
    container.append(branch);
    addMatch(first,outer,2,conference+' divisional game 1',own&&bracket.nextIndex===0);
    addMatch(second,outer,4,conference+' divisional game 2');
    addMatch(final,inner,'2 / 5',conference+' championship',own&&bracket.nextIndex===1);
  }
  addMatch(bracket.championship,3,'2 / 5','Super Bowl',bracket.nextIndex===2);
}
