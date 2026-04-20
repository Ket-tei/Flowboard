export type TreeScreen = {
  id: number;
  name: string;
  publicToken: string;
  displayMode?: "QUICK" | "TEMPLATE";
};

export type TreeFolder = {
  id: number;
  parentId: number | null;
  name: string;
  sortOrder: number;
  screens: TreeScreen[];
  children: TreeFolder[];
};
