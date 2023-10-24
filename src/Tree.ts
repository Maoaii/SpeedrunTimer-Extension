import * as vscode from "vscode";

export class TimerDataProvider {
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

  removeTimer(timer: TimerTreeItem) {
    this.timers = this.timers.filter((element) => element !== timer);
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

export class TimerTreeItem extends vscode.TreeItem {
  children: TimerTreeItem[] | undefined;
  constructor(label: string, children?: TimerTreeItem[]) {
    super(
      label,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed
    );

    this.children = children;
    if (this.children) {
      this.contextValue = "timer";
    }
  }
}
