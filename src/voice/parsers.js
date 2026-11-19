// Understands what people say or type: dates, step size, time, energy, focus commands, settings.
// Pure functions with no DOM, so they can be tested in Node. English only for now.

var MON_RE='(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)';
var NUMW='(?:(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[ -](?:one|two|three|four|five|six|seven|eight|nine|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|thirtieth)';
var ONES={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
var ORD={first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10,eleventh:11,twelfth:12,thirteenth:13,fourteenth:14,fifteenth:15,sixteenth:16,seventeenth:17,eighteenth:18,nineteenth:19,twentieth:20,thirtieth:30};
var DAYS=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
export var MINUTE_OPTIONS=[20,30,45,60,90,120,180];

function wordNum(w){
  var p=w.toLowerCase().replace('-',' ').split(' ');
  if(p.length===2){ return ONES[p[0]]+((p[1] in ONES)?ONES[p[1]]:ORD[p[1]]); }
  return (p[0] in ONES)?ONES[p[0]]:ORD[p[0]];
}
function isOrd(w){ var p=w.toLowerCase().replace('-',' ').split(' '); return (p[p.length-1] in ORD); }

// turns "march fifth" into "march 5th" and "two hours" into "2 hours", only in date and time spots
export function normNums(s){
  s=s.replace(new RegExp('\\b'+MON_RE+'\\s+(?:the\\s+)?('+NUMW+')\\b','gi'),function(m,mon,n){ return mon+' '+wordNum(n)+(isOrd(n)?'th':''); });
  s=s.replace(new RegExp('\\b('+NUMW+')\\s+(of\\s+)?'+MON_RE+'\\b','gi'),function(m,n,of,mon){ return wordNum(n)+(isOrd(n)?'th':'')+' '+(of||'')+mon; });
  s=s.replace(new RegExp('\\b('+NUMW+')\\s+(minutes?|mins?|hours?|hrs?|days?|weeks?)\\b','gi'),function(m,n,u){ return wordNum(n)+' '+u; });
  return s;
}

function pad(n){ return (n<10?'0':'')+n; }
export function toISO(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function addDays(now,n){ return new Date(now.getFullYear(),now.getMonth(),now.getDate()+n); }
function nextWeekday(now,dow){ var diff=(dow-now.getDay()+7)%7; if(diff===0) diff=7; return addDays(now,diff); }
function monthIdx(s){ return ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(s.toLowerCase().slice(0,3)); }
function fromParts(now,mi,d){
  if(mi<0||d<1||d>31) return null;
  var y=now.getFullYear(), dt=new Date(y,mi,d);
  if(dt.getMonth()!==mi) return null;
  var today=new Date(y,now.getMonth(),now.getDate());
  if(dt<today){ dt=new Date(y+1,mi,d); if(dt.getMonth()!==mi) return null; }
  return dt;
}

// returns { iso, rest } or null
export function parseDateIn(text,now){
  var pre='(?:due |by |on |for |before )?';
  var rules=[
    [new RegExp('\\b'+pre+'day after tomorrow\\b','i'),function(){ return addDays(now,2); }],
    [new RegExp('\\b'+pre+'tomorrow\\b','i'),function(){ return addDays(now,1); }],
    [new RegExp('\\b'+pre+'(?:today|tonight)\\b','i'),function(){ return addDays(now,0); }],
    [/\b(?:due )?in (\d+) (day|days|week|weeks)\b/i,function(m){ return addDays(now,Number(m[1])*(/week/i.test(m[2])?7:1)); }],
    [new RegExp('\\b'+pre+'end of (?:the )?week\\b','i'),function(){ return addDays(now,(5-now.getDay()+7)%7); }],
    [new RegExp('\\b'+pre+'end of (?:the )?month\\b','i'),function(){ return new Date(now.getFullYear(),now.getMonth()+1,0); }],
    [new RegExp('\\b'+pre+'next week\\b','i'),function(){ return addDays(now,7); }],
    [new RegExp('\\b'+pre+'this weekend\\b','i'),function(){ return addDays(now,(6-now.getDay()+7)%7); }],
    [new RegExp('\\b'+pre+'(?:(?:next|this|coming) )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\\b','i'),function(m){ return nextWeekday(now,DAYS.indexOf(m[1].toLowerCase())); }],
    [new RegExp('\\b'+pre+'(?:the )?'+MON_RE+'\\.?\\s+(?:the )?(\\d{1,2})(?:st|nd|rd|th)?\\b','i'),function(m){ return fromParts(now,monthIdx(m[1]),Number(m[2])); }],
    [new RegExp('\\b'+pre+'(?:the )?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?'+MON_RE+'\\b','i'),function(m){ return fromParts(now,monthIdx(m[2]),Number(m[1])); }],
    [new RegExp('\\b'+pre+'(\\d{1,2})/(\\d{1,2})\\b','i'),function(m){ return fromParts(now,Number(m[1])-1,Number(m[2])); }],
    [/\b(?:due |by |on |for )(?:the )?(\d{1,2})(?:st|nd|rd|th)\b/i,function(m){
      var d=Number(m[1]), y=now.getFullYear(), mo=now.getMonth();
      var dt=new Date(y,mo,d);
      if(dt.getMonth()!==mo||d<now.getDate()){ dt=new Date(y,mo+1,d); }
      return dt.getDate()===d?dt:null;
    }]
  ];
  for(var i=0;i<rules.length;i++){
    var m=text.match(rules[i][0]);
    if(m){ var dt=rules[i][1](m); if(dt){ return { iso:toISO(dt), rest:text.replace(m[0],' ') }; } }
  }
  return null;
}

export function parseSize(text,loose){
  var m;
  if((m=text.match(/\b(?:with |in |using |use |make (?:the )?(?:steps |them )?)?(?:really small|very small|tiny|baby)(?: steps?)?\b/i))) return { size:'tiny', rest:text.replace(m[0],' ') };
  if((m=text.match(/\b(?:with |in |using |use |make (?:the )?(?:steps |them )?)?(?:medium|bigger|larger|big)(?:[ -]sized?)? steps?\b/i))) return { size:'medium', rest:text.replace(m[0],' ') };
  if((m=text.match(/\b(?:with |in |using |use |make (?:the )?(?:steps |them )?)?small steps?\b/i))) return { size:'small', rest:text.replace(m[0],' ') };
  if(loose){
    if(/\b(tiny|really small|very small|smallest|baby)\b/i.test(text)) return { size:'tiny', rest:text };
    if(/\b(medium|bigger|larger|big)\b/i.test(text)) return { size:'medium', rest:text };
    if(/\bsmall\b/i.test(text)) return { size:'small', rest:text };
  }
  return null;
}

export function parseEnergy(t){
  if(/\b(low|little|no|not much|barely any)\s+energy\b|\b(tired|exhausted|drained|wiped|burnt out|burned out|sleepy)\b/i.test(t)) return 'low';
  if(/\b(high|good|great|lots of|plenty of|full of)\s+energy\b|\benergetic\b|\bfeeling (good|great|strong)\b|\bwide awake\b/i.test(t)) return 'high';
  if(/\b(okay|ok|medium|fine|so-so|average|normal)\s+energy\b|\bfeeling (okay|ok|fine|alright)\b|\benergy (is |feels )?(okay|ok|fine)\b/i.test(t)) return 'ok';
  if(t.trim().split(/\s+/).length<=4){
    if(/\blow\b/i.test(t)) return 'low';
    if(/\b(high|good|great)\b/i.test(t)) return 'high';
    if(/\b(okay|ok|fine|medium)\b/i.test(t)) return 'ok';
  }
  return null;
}
export function snapMinutes(n){
  var best=MINUTE_OPTIONS[0];
  MINUTE_OPTIONS.forEach(function(o){ if(Math.abs(o-n)<Math.abs(best-n)) best=o; });
  return best;
}
export function parseMinutes(t){
  var m;
  if(/\b(?:an? )?hour and a half\b|\bone and a half hours?\b|\b1\.5 hours?\b/i.test(t)) return 90;
  if(/\bhalf (?:an? )?hour\b/i.test(t)) return 30;
  if(/\b(?:a )?couple (?:of )?hours\b/i.test(t)) return 120;
  if((m=t.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i))) return snapMinutes(Number(m[1])*60);
  if((m=t.match(/(\d+)\s*(?:minutes?|mins?)\b/i))) return snapMinutes(Number(m[1]));
  if(/\b(?:an?|one) hour\b/i.test(t)) return 60;
  return null;
}

function capital(s){ s=s.trim(); return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }

// one sentence for the Add card: task, due date, step size, what makes it hard, and "break it down"
export function parseTask(text,now){
  var t=normNums(String(text||'')).trim();
  var out={ title:'', notes:'', due:null, size:null, run:false };
  var run=t.match(/[\s,.]*(?:and )?(?:now |please )*(break it down|break (?:this|it) down|make (?:me )?a plan|go ahead|do it)[\s.!]*$/i);
  if(run){ out.run=true; t=t.slice(0,run.index); }
  var sz=parseSize(t,false); if(sz){ out.size=sz.size; t=sz.rest; }
  var dt=parseDateIn(t,now||new Date()); if(dt){ out.due=dt.iso; t=dt.rest; }
  var trig=t.search(/\b(because|it'?s hard|it is hard|i can(?:'?t| ?not)|i'?m stuck|i am stuck|i don'?t understand|i do not understand|i only have|i struggle|the instructions?|unclear|confusing)\b/i);
  if(trig>0){ out.notes=capital(t.slice(trig).replace(/^because\s+/i,'').replace(/[\s,;.]+$/,'')); t=t.slice(0,trig); }
  t=t.replace(/\b(?:it'?s|it is|that'?s|that is|which is|is)\s*$/i,'').replace(/\bdue\s*$/i,'');
  t=t.replace(/^[\s,;.\-]+|[\s,;.\-]+$/g,'');
  t=t.replace(/\s+(?:and|but|so|with)\s*$/i,'');
  t=t.replace(/^(?:please\s+)?(?:i (?:need|have|want|got|should|must) to |i'?ve got to |i'?m (?:working on|doing) |my task is |the task is |task[:,]? )/i,'');
  t=t.replace(/\s{2,}/g,' ').replace(/^[\s,;.\-]+|[\s,;.\-]+$/g,'');
  out.title=capital(t);
  return out;
}

export function parseToday(text){
  var t=normNums(String(text||''));
  var out={ minutes:parseMinutes(t), energy:parseEnergy(t), intent:null };
  if(/\b(start|begin|let'?s go|let us go)\b/i.test(t)) out.intent='start';
  else if(/\b(plan|session|go ahead|make it)\b/i.test(t)) out.intent='plan';
  return out;
}

export function parseFocus(text){
  var t=String(text||'').toLowerCase();
  if(/\b(stop|quit|exit|close|end (the )?session|done for now|finished for now|that'?s enough)\b/.test(t)) return 'stop';
  if(/\b(too big|too hard|too much|smaller|make it smaller|break it down|i can'?t|i cannot)\b/.test(t)) return 'smaller';
  if(/\b(more time|five more|5 more|extra time|add time|add five|another five)\b/.test(t)) return 'plus';
  if(/\b(skip|next|later|not now)\b/.test(t)) return 'skip';
  if(/\b(pause|hold on|wait|hang on)\b/.test(t)) return 'pause';
  if(/\b(start|resume|begin|go|continue|play)\b/.test(t)) return 'start';
  if(/\b(done|finished|complete|completed|did it|i did)\b/.test(t)) return 'done';
  return null;
}

export function parseSettings(text){
  var t=String(text||'').toLowerCase(), out=[];
  function add(k,v,label){ out.push({ k:k, v:v, label:label }); }
  if(/\b(dark|night)( mode| colors?| theme)?\b/.test(t) && !/\bnot dark\b/.test(t)) add('theme','dark','dark colors');
  else if(/\blight( mode| colors?| theme)?\b|\bbright\b/.test(t)) add('theme','light','light colors');
  else if(/\b(match my device|automatic|auto)\b/.test(t)) add('theme','auto','colors that match your device');
  if(/\b(larger|bigger|large|increase)( text| font| size)?\b|\btext (larger|bigger)\b/.test(t)) add('size','l','larger text');
  else if(/\b(smaller|small|decrease)( text| font| size)\b|\btext smaller\b/.test(t)) add('size','s','smaller text');
  else if(/\b(normal|regular|medium) (text|size)\b/.test(t)) add('size','m','normal text size');
  if(/\b(easy to read|dyslexi|hyperlegible|readable)\b/.test(t)) add('font','hyper','the easy-to-read font');
  else if(/\b(device|system|default) font\b/.test(t)) add('font','system','your device font');
  if(/\b(calm motion|reduce motion|reduced motion|stop (the )?animations?|no animations?|turn off (the )?animations?|less motion)\b/.test(t)) add('motion','reduced','calm motion on');
  else if(/\b(turn on (the )?animations?|full motion|allow animations?|more motion)\b/.test(t)) add('motion','full','animations on');
  if(/\bhide (the )?(countdown |timer )?(numbers?|time|clock)\b/.test(t)) add('hideTime',true,'countdown numbers hidden');
  else if(/\bshow (the )?(countdown |timer )?(numbers?|time|clock)\b/.test(t)) add('hideTime',false,'countdown numbers shown');
  if(/\b(turn off|no|without|stop using) ai\b/.test(t)) add('useAI',false,'AI help off');
  else if(/\b(turn on|use|enable) ai\b/.test(t)) add('useAI',true,'AI help on');
  return out;
}
