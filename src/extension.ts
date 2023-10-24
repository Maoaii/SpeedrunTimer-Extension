import * as vscode from "vscode";


class TimerDataProvider {
  private timers: TimerTreeItem[];

  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;

  constructor() {
    this.timers = [];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  loadTimers(timers: TimerTreeItem[]) {
    this.timers = timers;
  }

  addTimer(timer: TimerTreeItem) {
    this.timers.push(timer);
  }

  getTimers() {
    return this.timers;
  }

  getTreeItem(
    element: TimerTreeItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: TimerTreeItem | undefined
  ): vscode.ProviderResult<TimerTreeItem[]> {
    if (element === undefined) {
      return this.timers;
    }

    return element.children;
  }
}

class TimerTreeItem extends vscode.TreeItem {
  children: TimerTreeItem[] | undefined;
  constructor(label: string, children?: TimerTreeItem[]) {
    super(
      label,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed
    );

    this.children = children;
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "speedrun-timer" is now active!'
  );

  const treeDataProvider = new TimerDataProvider();
  const treeView = vscode.window.createTreeView("speedrunTimer", {
    treeDataProvider,
  });

  // Get the timers from the global state
  let speedrunLogs = context.globalState.get("speedrun-logs", "");
  if (speedrunLogs) {
    let timers = JSON.parse(speedrunLogs);
    treeDataProvider.loadTimers(timers);
  }
  context.subscriptions.push(treeView);

  let statusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  statusItem.text = `$(watch) Start speedrun`;
  statusItem.command = "speedrun-timer.start-timer";
  statusItem.tooltip = "Click to start the speedrun timer.";
  statusItem.show();

  let disposable = vscode.commands.registerCommand(
    "speedrun-timer.start-timer",
    () => {
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

      // Show a message box to the user
      vscode.window.showInformationMessage(
        "Speedrun timer started. Get to coding!"
      );

      // Stop the timer
      let stopTimer = vscode.commands.registerCommand(
        "speedrun-timer.stop-timer",
        () => {
          let endTime = timer.text;
          clearInterval(intervalTimer);
          timer.hide();
          statusItem.show();

          vscode.window
            .showInformationMessage(
              `Nice work! \nYour time was: ${endTime}.`,
              "Save speedrun?",
              "No thanks"
            )
            .then((value) => {
              // Save speedrun time
              if (value === "Save speedrun?") {
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
                      new TimerTreeItem(`${value}`, [
                        new TimerTreeItem(`Time: ${endTime}`),
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
