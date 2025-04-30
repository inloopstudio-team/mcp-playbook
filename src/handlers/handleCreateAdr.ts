// src/handlers/handleCreateAdr.ts
import * as path from "path";
import { CreateAdrArgs, CreateAdrArgsSchema } from "../tools/createAdr.js";
import * as fsUtils from "../utils/fsUtils.js";
import { validateArgs } from "../utils/validationUtils.js";

export async function handleCreateAdr(args: CreateAdrArgs): Promise<any> {
  try {
    const { target_project_dir, adr_name, content } = validateArgs(
      CreateAdrArgsSchema,
      args,
    );

    const absoluteTargetProjectDir = path.resolve(target_project_dir);
    console.log(
      `Handling create_adr for: ${absoluteTargetProjectDir}, adr: ${adr_name}`,
    );
    const adrDir = fsUtils.joinProjectPath(
      absoluteTargetProjectDir,
      "docs",
      "adr",
    );

    // Ensure directory exists
    fsUtils.createDirectory(adrDir);

    let nextSequenceNumber = 1;
    try {
      const files = fsUtils.listDirectory(adrDir);
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
        `Could not read adr directory or no numbered files found, starting sequence from 1: ${e.message}`,
      );
    }

    const sequencePrefix = nextSequenceNumber.toString().padStart(4, "0");

    // Sanitize the provided adrName for the filename slug
    const slug = adr_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .substring(0, 50); // Basic slug generation

    const newFilename = `${sequencePrefix}-${slug}.md`;
    const newFilePath = fsUtils.joinProjectPath(adrDir, newFilename);

    // Write the content to the new file
    fsUtils.writeFile(newFilePath, content);

    return {
      status: "success",
      path: newFilePath,
      message: `Created new ADR file: ${newFilename}`,
    };
  } catch (e: any) {
    console.error(`Error in handleCreateAdr: ${e.message}`);
    return {
      status: "error",
      message: `Failed to create ADR file: ${e.message}`,
    };
  }
}
