import { stat } from "fs";
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "speedrun-timer" is now active!'
  );

  let statusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusItem.text = "Start timer";
  statusItem.command = "speedrun-timer.start-timer";
  statusItem.show();

  let disposable = vscode.commands.registerCommand(
    "speedrun-timer.start-timer",
    () => {
      statusItem.hide();
      // Add a timer to the status bar
      let timer = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      timer.text = "00:00:00";
      timer.command = "speedrun-timer.stop-timer";
      timer.show();

      // Start the timer
      let startTime = new Date().getTime();
      setInterval(() => {
        let currentTime = new Date().getTime();
        let elapsedTime = currentTime - startTime;
        let seconds = Math.floor(elapsedTime / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        seconds = seconds % 60;
        minutes = minutes % 60;
        hours = hours % 60;
        timer.text = `${hours}:${minutes}:${seconds}`;
      }, 1000);

      // Show a message box to the user
      vscode.window.showInformationMessage(
        "Speedrun timer started. Get to coding!"
      );

      // Stop the timer
      let stopTimer = vscode.commands.registerCommand(
        "speedrun-timer.stop-timer",
        () => {
          timer.hide();
          statusItem.text = "Start timer";
          statusItem.show();

          vscode.window.showInformationMessage(
            `Speedrun timer stopped. Good job! Your time was: ${timer.text}`
          );

          stopTimer.dispose();
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
