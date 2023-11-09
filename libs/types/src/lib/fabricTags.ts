export type FabricTag = {
  _id: string;
  name: string;
  namePermutations?: string[];
};

export type NewFabricTag = Omit<Omit<FabricTag, '_id'>, 'namePermutations'>;
