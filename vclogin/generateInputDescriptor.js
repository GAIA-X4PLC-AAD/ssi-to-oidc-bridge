const fs = require("fs");
const path = require("path");

const createInputDescriptor = async (policy, filename) => {
  let descr = {
    purpose: "Sign-in",
    constraints: {},
    id: "",
    name: "",
  };

  for (let expectation of policy) {
    for (let pattern of expectation.patterns) {
      descr.id = expectation.credentialId;
      descr.name = "Input descriptor for " + expectation.credentialId;

      if (expectation.patterns.length > 1) {
        descr.group = ["group_" + expectation.credentialId];
      }

      let fields = pattern.claims
        .filter((claim) => claim.required)
        .map((claim) => {
          return { path: [claim.claimPath] };
        });

      if (fields.length > 0) {
        descr.constraints.fields = fields;
      }
    }
  }

  if (JSON.stringify(descr.constraints) === "{}") {
    descr.constraints = {
      fields: [
        {
          path: ["$.type"],
          filter: {
            type: "string",
            pattern: "VerifiableCredential",
          },
        },
      ],
    };
  }

  writeToPath(`./init_config/input_descriptors/${filename}.json`, descr);
};

const writeToPath = async (path, data) => {
  try {
    // Check if file already exists
    const fileExists = await fs.promises
      .access(path)
      .then(() => true)
      .catch(() => false);
    if (fileExists) {
      console.log(`File ${path} already exists. Not overwriting.`);
      return;
    }
    await fs.promises.writeFile(path, JSON.stringify(data, null, 2));
    console.log(`File created and content written to ${path}`);
  } catch (error) {
    console.error(`Error writing to file ${path}: ${error}`);
  }
};

const readPolicies = async () => {
  try {
    const path = "./init_config/policies";
    console.log("Reading policies from:", path);
    const files = await fs.promises.readdir(path);
    console.log("Policies read:", files);
    return files;
  } catch (error) {
    console.error("Error reading policies:", error);
    throw error;
  }
};

const initializeInputDescriptors = async () => {
  const policies = await readPolicies();
  console.log("Policies:", policies);
  for (let policyFile of policies) {
    const policy = await fs.promises.readFile(
      `./init_config/policies/${policyFile}`,
      "utf8",
    );
    const policyObj = JSON.parse(policy);
    createInputDescriptor(policyObj, policyFile.split(".")[0]);
  }
};

initializeInputDescriptors();
