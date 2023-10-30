import * as vscode from "vscode";
import * as Tree from "./Tree";

// Constants
const SAVE_SPEEDRUN = "Save";
const DISCARD_SPEEDRUN = "Discard";

function isLetter(str: string) {
  // Regex that matches any letter and apostophes
  return str.length === 1 && str.match(/[a-z']/i);
}

function countWords(str: string) {
  let lastChar = "";
  let wordCount = 0;

  // If str only contains apostrophes or quotes, return 0
  if (!str.match(/[a-z]/i)) {
    return 0;
  }

  for (let i = 0; i < str.length; i++) {
    const currChar = str[i];
    if (
      (!isLetter(currChar) && isLetter(lastChar)) ||
      (i === str.length - 1 && isLetter(currChar))
    ) {
      wordCount++;
    }

    lastChar = currChar;
  }

  return wordCount;
}

export function activate(context: vscode.ExtensionContext) {
  // Create a tree view to display the speedrun logs
  const treeDataProvider = startTreeView(context);

  // Register a command to refresh the speedrun logs
  vscode.commands.registerCommand("speedrun-timer.refresh-timer", () => {
    treeDataProvider.refresh();
  });

  // Register a command to delete a speedrun log
  vscode.commands.registerCommand("speedrun-timer.delete-timer", (node) => {
    treeDataProvider.removeTimer(node);
    const timers = JSON.stringify(treeDataProvider.getTimers());
    context.globalState.update("speedrun-logs", timers);
    treeDataProvider.refresh();
  });

  // Create a status bar item so the user can activate timers
  const startButton = createStatusBarStart();
  let statusTimer: vscode.StatusBarItem;
  let intervalTimer: NodeJS.Timeout;
  let charsWritten: number;
  let wordsWritten: number;
  let lastChar: string;
  let isRunning: boolean = false;

  // Register a command to start a speedrun timer
  context.subscriptions.push(
    vscode.commands.registerCommand("speedrun-timer.start-timer", () => {
      if (isRunning) {
        vscode.commands.executeCommand("speedrun-timer.stop-timer");

        return;
      }

      isRunning = true;
      charsWritten = 0;
      wordsWritten = 0;
      lastChar = "";

      // Keep track of written characters
      vscode.workspace.onDidChangeTextDocument((e) => {
        const change = e.contentChanges[0].text;

        if (change === "") {
          return;
        }

        if (change.length > 1) {
          // Count words in changes
          wordsWritten += countWords(change);
        } else if (!isLetter(change) && isLetter(lastChar)) {
          wordsWritten++;
        }

        if (change !== "\n" && change !== "\t") {
          charsWritten += change.length;
        }

        lastChar = change[change.length - 1];
      });

      startButton.hide();
      // Add a timer to the status bar
      statusTimer = createStatusBarTimer();

      // Start the timer
      intervalTimer = createTimer(statusTimer);

      // Show a message box to the user
      vscode.window.showInformationMessage(
        "Speedrun timer started. Get to coding!"
      );
    })
  );

  // Register command to stop a speedrun timer
  context.subscriptions.push(
    vscode.commands.registerCommand("speedrun-timer.stop-timer", () => {
      isRunning = false;

      // Store end time for further use
      const endTime = statusTimer.text;

      // Remove interval timer from stack
      clearInterval(intervalTimer);

      // Hide status bar timer and show start button so the user can start another speedrun.
      statusTimer.hide();
      startButton.show();

      vscode.window
        .showInformationMessage(
          `Nice work! Your time was: ${endTime}. Would you like to save your speedrun?`,
          SAVE_SPEEDRUN,
          DISCARD_SPEEDRUN
        )
        .then((value) => {
          // Save speedrun time
          if (value === SAVE_SPEEDRUN) {
            saveSpeedrun(
              context,
              treeDataProvider,
              endTime,
              charsWritten,
              wordsWritten
            );
          } else {
            vscode.window.showInformationMessage("Speedrun not saved.");
          }
        });
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  vscode.window.showInformationMessage(
    "Thank you for using Speedrun Timer! Come back soon!"
  );
}

function startTreeView(context: vscode.ExtensionContext) {
  const treeDataProvider = new Tree.TimerDataProvider();
  const treeView = vscode.window.createTreeView("speedrunTimer", {
    treeDataProvider,
  });

  let speedrunLogs = context.globalState.get("speedrun-logs", "");
  if (speedrunLogs) {
    const timers = JSON.parse(speedrunLogs);
    treeDataProvider.loadTimers(timers);
  }
  context.subscriptions.push(treeView);

  return treeDataProvider;
}

function createStatusBarStart() {
  const statusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  statusItem.text = `$(watch) Start speedrun`;
  statusItem.command = "speedrun-timer.start-timer";
  statusItem.tooltip = "Click to start the speedrun timer.";
  statusItem.show();

  return statusItem;
}

function createStatusBarTimer() {
  const timer = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  timer.text = "0hr 0m 0s";
  timer.command = "speedrun-timer.stop-timer";
  timer.tooltip = "Stop the speedrun timer";
  timer.show();

  return timer;
}

function saveSpeedrun(
  context: vscode.ExtensionContext,
  treeDataProvider: Tree.TimerDataProvider,
  endTime: string,
  charsWritten: number,
  wordsWritten: number
) {
  vscode.window
    .showInputBox({
      prompt: "Enter a name for your speedrun",
      placeHolder: "Project Name",
    })
    .then((value) => {
      if (value === undefined) {
        vscode.window.showInformationMessage("Speedrun not saved.");
        return;
      }

      const wordsPerMinute = Math.floor(
        wordsWritten /
          (parseInt(endTime.split(" ")[1]) +
            parseInt(endTime.split(" ")[0]) * 60 +
            parseInt(endTime.split(" ")[2]) / 60)
      );

      // Save to the activity bar log
      treeDataProvider.addTimer(
        new Tree.TimerTreeItem(`${value}`, [
          new Tree.TimerTreeItem(`Date: ${new Date().toDateString()}`),
          new Tree.TimerTreeItem(`Time: ${endTime}`),
          new Tree.TimerTreeItem(`Characters: ${charsWritten}`),
          new Tree.TimerTreeItem(`Words: ${wordsWritten}`),
          new Tree.TimerTreeItem(
            `Words per Minute: ${!wordsPerMinute ? "N/A" : wordsPerMinute}`
          ),
        ])
      );
      treeDataProvider.refresh();
      vscode.window.showInformationMessage(
        "Speedrun saved to activity bar log."
      );

      // Update global state with a json string of the timers
      let timers = JSON.stringify(treeDataProvider.getTimers());
      context.globalState.update("speedrun-logs", timers);
    });
}

function createTimer(timer: vscode.StatusBarItem) {
  let startTime = new Date().getTime();
  let intervalTimer = setInterval(() => {
    let currentTime = new Date().getTime();
    let elapsedTime = currentTime - startTime;
    let seconds = Math.floor(elapsedTime / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    seconds = seconds % 60;
    minutes = minutes % 60;
    hours = hours % 60;
    timer.text = `${hours}hr ${minutes}m ${seconds}s`;
  }, 1000);

  return intervalTimer;
}