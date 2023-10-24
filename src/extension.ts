import * as vscode from "vscode";
import * as Tree from "./Tree";

function startTreeView(context: vscode.ExtensionContext) {
  const treeDataProvider = new Tree.TimerDataProvider();
  const treeView = vscode.window.createTreeView("speedrunTimer", {
    treeDataProvider,
  });

  let speedrunLogs = context.globalState.get("speedrun-logs", "");
  if (speedrunLogs) {
    let timers = JSON.parse(speedrunLogs);
    treeDataProvider.loadTimers(timers);
  }
  context.subscriptions.push(treeView);

  return treeDataProvider;
}

function createStatusItem() {
  const statusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  statusItem.text = `$(watch) Start speedrun`;
  statusItem.command = "speedrun-timer.start-timer";
  statusItem.tooltip = "Click to start the speedrun timer.";
  statusItem.show();

  return statusItem;
}
export function activate(context: vscode.ExtensionContext) {
  // Greet the user
  console.log(
    'Congratulations, your extension "speedrun-timer" is now active!'
  );

  // Create a tree view to display the speedrun logs
  const treeDataProvider = startTreeView(context);

  // Register a command to refresh the speedrun logs
  vscode.commands.registerCommand("speedrun-timer.refresh-timer", () => {
    treeDataProvider.refresh();
  });

  // Register a command to delete a speedrun log
  vscode.commands.registerCommand("speedrun-timer.delete-timer", (node) => {
    treeDataProvider.removeTimer(node);
    let timers = JSON.stringify(treeDataProvider.getTimers());
    context.globalState.update("speedrun-logs", timers);
    treeDataProvider.refresh();
  });

  // Create a status bar item so the user can activate timers
  const statusItem = createStatusItem();

  // Register a command to start a speedrun timer
  context.subscriptions.push(
    vscode.commands.registerCommand("speedrun-timer.start-timer", () => {
      // Set running to true. Used to disable the start timer
      vscode.commands.executeCommand("setContext", "isRunning", true);

      statusItem.hide();
      // Add a timer to the status bar
      let timer = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right
      );
      timer.text = "0hr 0m 0s";
      timer.command = "speedrun-timer.stop-timer";
      timer.tooltip = "Stop the speedrun timer";
      timer.show();

      // Start the timer
      const intervalTimer = createTimer(timer);

      // Show a message box to the user
      vscode.window.showInformationMessage(
        "Speedrun timer started. Get to coding!"
      );

      // Stop the timer
      let stopTimer = vscode.commands.registerCommand(
        "speedrun-timer.stop-timer",
        () => {
          // Set context to false
          vscode.commands.executeCommand("setContext", "isRunning", false);
          let endTime = timer.text;
          clearInterval(intervalTimer);
          timer.hide();
          statusItem.show();

          vscode.window
            .showInformationMessage(
              `Nice work! Your time was: ${endTime}. Would you like to save your speedrun?`,
              "Save",
              "Discard"
            )
            .then((value) => {
              // Save speedrun time
              if (value === "Save") {
                vscode.window
                  .showInputBox({
                    prompt: "Enter a name for your speedrun",
                    placeHolder: "Project Name",
                  })
                  .then((value) => {
                    if (value === undefined) {
                      vscode.window.showInformationMessage(
                        "Speedrun not saved."
                      );
                      return;
                    }

                    // Save to the activity bar log
                    treeDataProvider.addTimer(
                      new Tree.TimerTreeItem(`${value}`, [
                        new Tree.TimerTreeItem(
                          `Date: ${new Date().toDateString()}`
                        ),
                        new Tree.TimerTreeItem(`Time: ${endTime}`),
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
              } else {
                vscode.window.showInformationMessage("Speedrun not saved.");
              }
            });

          stopTimer.dispose();
        }
      );
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  vscode.window.showInformationMessage(
    "Thank you for using Speedrun Timer! Come back soon!"
  );
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