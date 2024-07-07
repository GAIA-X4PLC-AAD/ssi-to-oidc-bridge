type Fields = {
  path: string[];
  filter?: {
    type: string;
    pattern: string;
  };
};

type Constraints = {
  fields?: Fields[];
};

export type InputDescriptor = {
  id: string;
  purpose: string;
  name: string;
  group?: string[];
  constraints: Constraints;
};
