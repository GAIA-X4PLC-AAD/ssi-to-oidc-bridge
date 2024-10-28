/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

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

export type InputDescriptors = InputDescriptor[];
