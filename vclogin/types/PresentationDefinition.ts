import { InputDescriptor } from "./InputDescriptor";

export type PresentationDefinition = {
  format: {
    ldp_vc: {
      proof_type: string[];
    };
    ldp_vp: {
      proof_type: string[];
    };
  };
  id: string;
  name: string;
  purpose: string;
  input_descriptors: InputDescriptor[];
  submission_requirements?: {
    rule: string;
    count: number;
    from: string;
  }[];
};
