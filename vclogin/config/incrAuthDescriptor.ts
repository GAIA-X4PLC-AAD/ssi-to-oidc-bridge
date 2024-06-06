import { InputDescriptor } from "@/types/InputDescriptor";
import { LoginPolicy } from "@/types/LoginPolicy";
import { promises as fs } from "fs";

export const getInputDescriptorPath = (scope: string) => {
  let mainPath = "./init_config/input_descriptors";
  return `${mainPath}/${scope}.json`;
};

export const mergeInputDescriptors = async (scopes: string[]) => {
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

  mergedDescriptor[0].id = scopes.join("_");
  mergedDescriptor[0].name =
    "Input Descriptor for" + scopes.join(", ") + " scopes";
  mergedDescriptor[0].purpose = getPurpose(scopes);

  await Promise.all(
    scopes.map(async (scope) => {
      const descriptor = await readDescriptor(scope);
      const constraints = descriptor[0].constraints.fields;
      mergedDescriptor[0].constraints.fields =
        mergedDescriptor[0].constraints.fields?.concat(constraints);
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
  let purpose = "We require ";
  scopes.map((scope) => {
    switch (scope) {
      case "openid":
        purpose += "Verifiable ID ";
        return;
      case "email":
        purpose += "Email ";
        return;
      case "student":
        purpose += "Enrollment Certificate ";
        return;
    }
  });
  purpose += "credentials for you to authorize.";
  return purpose;
};
