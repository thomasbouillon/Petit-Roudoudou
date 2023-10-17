type Base = {
  name: string;
  image: { url: string };
  groupIds: string[];
};

export type Fabric = Base & {
  _id: string;
};

export type NewFabric = Base;
