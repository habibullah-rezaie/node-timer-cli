#! /usr/bin/env node
const spawn = require("child_process").spawn;
const { stdin, stdout } = require("process");
const readLine = require("readline");

const rl = readLine.createInterface(stdin, stdout);

const args = process.argv.slice(2);
let alarm = "alarm.mp3";
let alarmOptionIndex = args.findIndex(
  (arg) => arg === "-a" || arg === "--alarm"
);

if (alarmOptionIndex !== -1) {
  if (!args[alarmOptionIndex + 1]) {
    console.warn("No alarm sound given.");
  } else {
    alarm = args[alarmOptionIndex + 1]
  }
}

async function timer() {
  const PERIOD = 5 * 60;

  const durationMatch = args[0]?.match(/^([0-9]*h)?([0-9]*m)?([0-9]*s)?$/);

  if (!durationMatch) {
    console.log("Invalid duration given, please follow (3h2m3s) format.");
    process.exit(1);
  }

  const hours = durationMatch[1] ? Number.parseInt(durationMatch[1]) : 0;
  const minutes = durationMatch[2] ? Number.parseInt(durationMatch[2]) : 0;
  const seconds = durationMatch[3] ? Number.parseInt(durationMatch[3]) : 0;

  const duration = hours * 3600 + minutes * 60 + seconds;
  let timePassed = 0;
  let isPaused = false;
  let nextLogSecond = 0;

  rl.on("line", async (line) => {
    if (line === "pause" && !isPaused) {
      isPaused = true;
    } else if (line === "play" && isPaused) {
      isPaused = false;
    }
  });

  while (timePassed !== duration) {
    if (isPaused) {
      await wait(1000);
      continue;
    }

    if (timePassed === nextLogSecond) {
      nextLogSecond += PERIOD;
      const timeRemained = duration - timePassed;
      const secondsRemained = timeRemained % 60;
      const minutesRemained = (timeRemained - secondsRemained) / 60;
      const hoursRemained =
        (timeRemained - minutesRemained * 60 - secondsRemained) / 3600;

      console.log(
        `Remaining Time: ${hoursRemained} hour(s), ${minutesRemained} minute(s), ${secondsRemained} second(s)`
      );
    }

    await wait(1000);
    timePassed++;
  }

  const play = spawn("play", [alarm]);

  play.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  play.stderr.on("data", (data) => {
    console.log(`stderr: ${data}`);
  });

  play.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    process.exit(code);
  });
}

timer();

function wait(time) {
  return new Promise((func) => {
    setTimeout(func, time);
  });
}
