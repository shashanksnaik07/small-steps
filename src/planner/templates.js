// Step templates for the built-in planner (works offline, no AI).
// Each step: [text, minutes, effort, isBreak]
export const BRK=['Take a real break. Water, stretch, anything that is not a screen.',5,'low',true];
export const TEMPLATES={
  writing:[
    ['Open a blank document and type the title: {t}',2,'low'],
    ['Write what the assignment is asking, in your own words (two or three sentences)',5,'low'],
    ['List everything you already know or think about it. Messy is fine.',8,'low'],
    ['Pick the three or four main points you will make',8,'med'],
    ['Make a rough outline with one heading for each point',10,'med'],
    BRK,
    ['Write the middle section, one point at a time. Do not edit yet.',20,'high'],
    ['Write the beginning and the end',15,'med'],
    BRK,
    ['Read it through once and fix only what jumps out',10,'med'],
    ['Check the requirements and formatting, then save or submit',5,'low']
  ],
  exam:[
    ['Gather your notes, slides and practice questions in one place',5,'low'],
    ['Write the list of topics the exam covers',5,'low'],
    ['Mark each topic: confident, shaky, or lost',5,'low'],
    ['Study your shakiest topic for one short round',15,'high'],
    ['Close your notes and write down everything you remember about it',8,'med'],
    ['Check what you missed and fill those gaps',10,'med'],
    BRK,
    ['Do a few practice questions on that topic',15,'high'],
    ['Move to the next topic and repeat one short round',15,'high'],
    BRK,
    ['Do one mixed practice round without notes',20,'high'],
    ['Make a one page summary sheet for tomorrow',10,'low']
  ],
  coding:[
    ['Open the project and run it once to see where things stand',5,'low'],
    ['Write what the finished version needs to do, as a short list',5,'low'],
    ['Pick the smallest piece that can work on its own',5,'low'],
    ['Build just that piece. Ignore everything else.',20,'high'],
    ['Run it and note what breaks',5,'low'],
    ['Fix one thing at a time',15,'high'],
    ['Save a copy or commit so your progress is safe',2,'low'],
    BRK,
    ['Build the next piece',20,'high'],
    ['Test it the way a stranger would use it',10,'med'],
    ['Write a few lines on how it works, then submit',10,'low']
  ],
  reading:[
    ['Look at the headings and the first line of each section',5,'low'],
    ['Write one question you want this reading to answer',3,'low'],
    ['Read the first section and stop at the end of it',12,'med'],
    ['Write two sentences about what it said',4,'low'],
    BRK,
    ['Read the next section',12,'med'],
    ['Jot down anything confusing to ask about later',3,'low'],
    ['Write a three sentence summary of the whole thing',8,'med']
  ],
  presentation:[
    ['Write the one sentence you want people to remember',5,'low'],
    ['List the three points that support it',8,'med'],
    ['Make one slide per point with just a title',10,'low'],
    ['Add one image or number to each slide',15,'med'],
    BRK,
    ['Write a short opening slide and closing slide',8,'low'],
    ['Say it out loud once, slowly, with the slides',10,'med'],
    ['Cut anything that made you stumble',8,'low'],
    ['Run it once more with a timer',10,'med']
  ],
  problems:[
    ['Gather the problem set, your notes and any worked examples',3,'low'],
    ['Read all the questions and mark the easiest ones',5,'low'],
    ['Do the easiest question to get moving',10,'low'],
    ['Do the next one. If you are stuck for five minutes, mark it and move on.',15,'med'],
    BRK,
    ['Come back to a marked question and try one',15,'high'],
    ['Look at an example or your notes for the one that is still stuck',10,'med'],
    ['Check your answers and write your final copy neatly',10,'low']
  ],
  message:[
    ['Open a blank message and write who it is for and what you need, in one line',3,'low'],
    ['List the two or three things you need to say. Short is fine.',4,'low'],
    ['Write a rough first version. It does not need to sound perfect.',8,'med'],
    ['Read it out loud once and cut anything that is not needed',4,'low'],
    ['Check the name, the date and anything you are asking for',3,'low'],
    ['Send it, or save it as a draft and set a time to send it',2,'low']
  ],
  shopping:[
    ['Open your notes or a blank page and write "this week" at the top',2,'low'],
    ['Write down the meals or things you want to have this week',6,'low'],
    ['Check what you already have in the fridge and cupboards',5,'low'],
    BRK,
    ['Write the list of what is missing, sorted by section of the store',8,'med'],
    ['Cross off anything you can skip this week',3,'low'],
    ['Choose when you will go, or set up the order online',3,'low'],
    ['Go or place the order, then put everything away',20,'med']
  ],
  chores:[
    ['Put on music or a podcast, and stand where the mess is',1,'low'],
    ['Pick up everything that is trash and put it in a bag',5,'low'],
    ['Gather the things that belong somewhere else into one pile',5,'low'],
    BRK,
    ['Put away one pile at a time. Stop when the timer ends.',10,'med'],
    ['Wipe or clear one surface',5,'low'],
    ['Do one last look and put away anything you see in plain sight',3,'low']
  ],
  interview:[
    ['Open the job post and write down the three skills it asks for most',5,'low'],
    ['Write one short story from your own work for each of those skills',15,'med'],
    ['Write your answer to "Tell me about yourself" in four sentences',8,'med'],
    BRK,
    ['Say your answers out loud once, slowly',10,'med'],
    ['Write two questions you want to ask them',5,'low'],
    ['Set out what you need for the day: where, when, what to wear, what to bring',5,'low']
  ],
  application:[
    ['Open the posting and the form, and note the deadline',3,'low'],
    ['List what they ask for: documents, questions, links',5,'low'],
    ['Gather what you already have, like a resume or old answers',8,'low'],
    ['Write a rough answer for the first question. Do not polish yet.',12,'med'],
    BRK,
    ['Fill in the rest of the form',15,'med'],
    ['Read everything once for typos and missing parts',8,'med'],
    ['Submit it, or save it and note when you will submit',3,'low']
  ],
  generic:[
    ['Write one sentence about what "finished" looks like for: {t}',3,'low'],
    ['List the three to five parts it is made of',5,'low'],
    ['Pick the easiest part and start with only that',10,'low'],
    BRK,
    ['Do the next part on your list',15,'med'],
    ['Do the part you have been putting off, for ten minutes only',10,'high'],
    ['Look it over, fix one thing, and decide if it is done enough',10,'low']
  ]
};
