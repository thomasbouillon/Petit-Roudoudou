export type FabricGroup = {
  _id: string;
  name: string;
  fabricIds: string[];
  namePermutations?: string[];
};

export type NewFabricGroup = Omit<Omit<FabricGroup, '_id'>, 'namePermutations'>;
