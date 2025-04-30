// src/handlers/handleCreateSpec.ts
import * as path from "path";
import * as fsUtils from "../utils/fsUtils.js";
import { validateArgs } from "../utils/validationUtils.js";
import { CreateSpecArgsSchema, CreateSpecArgs } from "../tools/createSpec.js";

export async function handleCreateSpec(
  args: CreateSpecArgs
): Promise<any> {
  try {
    const { target_project_dir, spec_name, content } = validateArgs(CreateSpecArgsSchema, args);

    const absoluteTargetProjectDir = path.resolve(target_project_dir);
    console.log(
      `Handling create_spec for: ${absoluteTargetProjectDir}, spec: ${spec_name}`,
    );
    const specsDir = fsUtils.joinProjectPath(absoluteTargetProjectDir, "docs", "specs");

    // Ensure directory exists
    fsUtils.createDirectory(specsDir);

    let nextSequenceNumber = 1;
    try {
      const files = fsUtils.listDirectory(specsDir);
      const numberedFiles = files.filter((file: string) =>
        /^\d{4}-.*\.md$/.test(file),
      );
      if (numberedFiles.length > 0) {
        const numbers = numberedFiles.map((file: string) =>
          parseInt(file.substring(0, 4), 10),
        );
        const maxNumber = Math.max(...numbers);
        nextSequenceNumber = maxNumber + 1;
      }
    } catch (e: any) {
      console.warn(
        `Could not read specs directory or no numbered files found, starting sequence from 1: ${e.message}`,
      );
    }

    const sequencePrefix = nextSequenceNumber.toString().padStart(4, "0");

    // Sanitize the provided specName for the filename slug
    const slug = spec_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .substring(0, 50); // Basic slug generation

    const newFilename = `${sequencePrefix}-${slug}.md`;
    const newFilePath = fsUtils.joinProjectPath(specsDir, newFilename);

    // Write the content to the new file
    fsUtils.writeFile(newFilePath, content);

    return {
      status: "success",
      path: newFilePath,
      message: `Created new spec file: ${newFilename}`,
    };
  } catch (e: any) {
    console.error(`Error in handleCreateSpec: ${e.message}`);
    return {
      status: "error",
      message: `Failed to create spec file: ${e.message}`,
    };
  }
}
