type Base = {
  name: string;
  image: { url: string; id: string };
  groupIds: string[];
  size: [number, number];
};

export type Fabric = Base & {
  _id: string;
};

export type NewFabric = Base;
