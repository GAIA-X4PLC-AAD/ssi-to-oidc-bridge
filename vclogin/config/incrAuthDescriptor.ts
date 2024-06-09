import { InputDescriptor } from "@/types/InputDescriptor";
import { promises as fs } from "fs";

export const getInputDescriptorPath = (scope: string) => {
  let mainPath = "./init_config/input_descriptors";
  return `${mainPath}/${scope}.json`;
};

export const mergeInputDescriptors = async (scopes: string[]) => {
  //ideally we have only one input descriptor and only merge constraints fields of other descriptors
  let mergedDescriptor: InputDescriptor[] = [
    {
      id: "",
      name: "",
      purpose: "",
      constraints: {
        fields: [],
      },
    },
  ];

  if (scopes.length === 1 && scopes[0] === "openid")
    return await readDescriptor(scopes[0]);

  mergedDescriptor[0].name =
    "Input Descriptor for " + scopes.join(", ") + " scopes";
  mergedDescriptor[0].purpose = getPurpose(scopes);

  await Promise.all(
    scopes.map(async (scope) => {
      const descriptor = await readDescriptor(scope);
      for (const d of descriptor) {
        if (mergedDescriptor[0].id === d.id) {
          continue;
        }
        mergedDescriptor[0].id = d.id; // set id here so that we can skip the same descriptor
        const constraints = d.constraints.fields;
        mergedDescriptor[0].constraints.fields =
          mergedDescriptor[0].constraints.fields?.concat(constraints);
      }
    }),
  );
  return mergedDescriptor;
};

const readDescriptor = async (scope: string) => {
  try {
    const path = getInputDescriptorPath(scope);
    const file = await fs?.readFile(path, "utf8");
    return JSON.parse(file);
  } catch (error) {
    console.error("Error reading policy:", error);
    throw error;
  }
};

const getPurpose = (scopes: string[]) => {
  // map scopes to human readable credential types, e.g. "openid" -> "Verifiable ID"
  let vcTypesArr: string[] = [];
  scopes.map((scope) => {
    switch (scope) {
      case "openid":
        vcTypesArr.push("Verifiable ID");
        return;
      case "email":
        vcTypesArr.push("Email");
        return;
      case "student":
        vcTypesArr.push("Enrollment Certificate");
        return;
    }
  });

  return `We require ${vcTypesArr.join(", ")} for authentication.`;
};
