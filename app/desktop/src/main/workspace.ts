import Store from "electron-store";

interface WorkspaceFile {
  editors: {
    path: string | null;
    cache: string;
  }[];
}

export class Workspace {
  private store = new Store<WorkspaceFile>({
    name: "workspace",
    defaults: { editors: [] },
  });

  constructor() {}
}
