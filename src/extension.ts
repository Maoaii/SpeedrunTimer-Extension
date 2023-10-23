import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "speedrun-timer" is now active!'
  );

  let statusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusItem.text = "Start timer";
  statusItem.command = "speedrun-timer.start-timer";
  statusItem.tooltip = "Start the speedrun timer";
  statusItem.show();

  let disposable = vscode.commands.registerCommand(
    "speedrun-timer.start-timer",
    () => {
      statusItem.hide();
      // Add a timer to the status bar
      let timer = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
      timer.text = "0hr 0m 0s";
      timer.command = "speedrun-timer.stop-timer";
      timer.tooltip = "Stop the speedrun timer";
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
        timer.text = `${hours}hr ${minutes}m ${seconds}s`;
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
          statusItem.show();

          vscode.window
            .showInformationMessage(
              `Nice work! \nYour time was: ${timer.text}.`,
              "Save speedrun?",
              "No thanks"
            )
            .then((value) => {
              // Save speedrun time
              if (value === "Save speedrun?") {
                vscode.window
                  .showInputBox({
                    prompt: "Save your time to a file",
                    placeHolder: "Enter a file name",
                  })
                  .then((value) => {
                    if (value) {
                      // Save a file with the name of the input
                    }
                  });
              }
            });

          stopTimer.dispose();
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
  vscode.window.showInformationMessage(
    "Thank you for using Speedrun Timer! Come back soon!"
  );
}
