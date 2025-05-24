/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { InputDescriptor } from "./InputDescriptor";

export type PresentationDefinition = {
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
