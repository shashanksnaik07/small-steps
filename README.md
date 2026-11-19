# Small Steps

[![CI](https://github.com/shashanksnaik07/small-steps/actions/workflows/ci.yml/badge.svg)](https://github.com/shashanksnaik07/small-steps/actions/workflows/ci.yml)

**Live demo:** [small-steps-autism.vercel.app](https://small-steps-autism.vercel.app/)

A calm planner that turns one big task into small, concrete steps and shows them one at a time. I built it with autistic, ADHD and other neurodivergent students in mind, after taking part in the North America AI Challenge, a hackathon focused on building for those students.

## What it does

- **Say it, or type it.** Dates, step size, time, energy, focus commands and settings can all be spoken. A "Talk it through" button fills the whole form from one sentence.
- **Break it down.** Type a task. Get 6 to 15 small steps, each with a time estimate. The first step is tiny, so starting is easy.
- **Pick the step size.** Tiny (5 minutes or less), small, or medium.
- **Plan a session.** Say how much time and energy you have. It picks steps that fit, in order.
- **Focus mode.** One step at a time, with an optional gentle timer. If a step feels too big, one button makes it smaller. Skipping and stopping are always allowed.
- **Comfort settings.** Light or dark, text size, an easy-to-read font, calm motion, and the option to hide the countdown numbers.

## Design choices

- No red, no overdue warnings, no streaks, no scores. A date that has passed just says "That is okay."
- The timer is a soft progress bar. The numbers can be hidden, because ticking clocks cause stress for many people.
- Steps are single actions that start with a verb. Breaks are built into the plan.
- One thing on screen at a time during focus mode.
- Works with a keyboard and screen reader, and respects the "reduce motion" setting on the device.

## How the planner works

There are two planners.

1. **Built-in planner (default, works offline).** Rule-based. It recognises the kind of task (essay, exam, coding project, reading, presentation, problem set) and uses a step template for it. It adapts to the notes box and the step size. No data leaves the browser.
2. **AI planner (optional).** A small serverless function, `api/breakdown.js`, sends the task text to a language model and asks for steps in strict JSON. The result is validated before the app uses it. If the function is missing, has no key, or fails, the app falls back to the built-in planner without showing an error.

Tasks and settings are stored in the browser's local storage. Nothing is saved on a server.

## Voice input

Almost everything can be done by voice, for people who find typing hard. It uses the browser's built-in speech recognition, so there is nothing to install and no extra server.

- **Talk it through.** One button for the whole form. Say the task, when it is due, how small the steps should be, and anything that makes it hard. End with "break it down" and it goes straight to the steps. For example: "Write my history paper, due next Friday, tiny steps, I cannot get started, break it down."
- **Dates.** "Tomorrow", "next Friday", "March 5th", "in two weeks", "end of the week", "the 20th of November" and similar. There is also a "Say the date" button.
- **Selections.** "Say the size" for tiny, small or medium. In the Today card, "Say it" for time and energy: "I have an hour and low energy. Plan my session." Saying "start" plans the session and opens focus mode.
- **Focus mode.** "Say a command": done, pause, start, too big, skip, five more minutes, stop.
- **Settings.** "Say a setting": dark mode, larger text, calm motion, hide the numbers, and so on.
- **Text boxes.** A microphone in the task box, the notes box and every "add a step" box types what you say.

How it behaves:

- It stops by itself after a short pause, so nobody has to tap again.
- Spoken words are shown or filled in first. Nothing is saved or deleted by voice without being visible on screen.
- If the microphone is blocked, missing, or nothing is heard, it says so in plain words and points to the keyboard.
- It works in Chrome, Edge and Safari. In other browsers the voice buttons stay hidden and typing works as normal.
- Some browsers send the audio to the browser maker's service to turn it into text. This app does not record or keep audio, and the page footer says so.
- The understanding of dates, sizes, times and commands is English only for now. Dictating into the text boxes works in any language the browser supports.
- Not done by voice yet: ticking off a step in the task list, deleting a task, and editing a step's text. Those are done by tapping or typing.

## Project structure

```
small-steps/
  index.html            the page
  styles/main.css       all styling (light, dark, text sizes, calm motion)
  src/
    main.js             entry point, connects everything
    state.js            app state and browser storage
    model.js            pure task logic: ordering, progress, today's plan
    util.js             small helpers
    planner/
      templates.js      step templates for the built-in planner
      local.js          the built-in, offline planner
      ai.js             calls the optional AI planner and checks what comes back
    ui/                 add form, task list, today card, focus mode, settings
    voice/
      parsers.js        understands dates, sizes, time, energy and commands
      listen.js         browser speech recognition wrapper
      wiring.js         which button says what
  api/breakdown.js      optional serverless function (Vercel) that calls the model
  tests/                unit tests (node:test, no dependencies)
  scripts/              syntax check used by CI
  .github/workflows/    CI: runs the checks and tests on every push
  vercel.json           headers for deployment
```

## Run it locally

The app uses ES modules, so it needs a local web server (opening `index.html` straight from disk will not work in most browsers).

```bash
git clone https://github.com/shashanksnaik07/small-steps.git
cd small-steps
npm run dev          # serves http://localhost:3000
```

It works as is, using the built-in planner. To try the AI planner locally, install the Vercel CLI, copy `.env.example` to `.env.local`, add your key, and run `vercel dev` instead.

## Tests

```bash
npm test             # 35 unit tests, no install needed (Node 20 or newer)
npm run check        # syntax check of every JavaScript file
```

The tests cover the date, size, time and command parsing, the built-in planner, the AI-response checks, the plan builder, saved-state loading and the API function. CI runs them on every push.

## Deploy on Vercel

1. Push this repository to GitHub.
2. On vercel.com choose Add New, Project, and import the repository. No build settings are needed.
3. To turn on the AI planner, open Settings, Environment Variables, and add `ANTHROPIC_API_KEY` with your key. Redeploy.
4. Optional: set `ANTHROPIC_MODEL` to change the model. The default is `claude-haiku-5-5`, which is fast and cheap for this job.

If you skip step 3, the app still works with the built-in planner. Every push to `main` then deploys automatically.

## Limits and honest notes

- The AI planner has a simple per-visitor limit (20 requests an hour). The counter resets when the function restarts, so it is best-effort. For a busy public site, add a real rate limiter and a monthly spend cap on your API key.
- It is a study aid, not a medical or therapy tool.
- I designed it around common accessibility guidance and what I learned at the hackathon, but it has not been tested with a group of neurodivergent students yet. The most valuable next step is to watch a few of them use it and change whatever gets in their way.

## Ideas for next

- Voice input that works in every browser and in more languages, by sending short clips to a Whisper model through a serverless function.
- Voice for the task list: "mark the outline step done", "delete the history paper".
- Let a person tell the planner what usually derails them, and learn from it.
- Calendar export for the planned session.
- A "body doubling" mode with a quiet shared timer.
- A printable version of today's steps.
