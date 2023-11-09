type Base = {
  name: string;
  image: { url: string; uid: string; placeholderDataUrl?: string };
  groupIds: string[];
  size: [number, number];
  tags: string[];
};

export type Fabric = Base & {
  _id: string;
};

export type NewFabric = Base;
