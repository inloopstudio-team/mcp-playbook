// src/handlers/handleInitializeDocsStructure.ts
import * as path from "path";
import {
  InitializeDocsStructureArgs,
  InitializeDocsStructureArgsSchema,
} from "../tools/initializeDocsStructure.js";
import * as fsUtils from "../utils/fsUtils.js";
import { validateArgs } from "../utils/validationUtils.js";

export async function handleInitializeDocsStructure(
  args: InitializeDocsStructureArgs,
): Promise<any> {
  try {
    const { target_project_dir } = validateArgs(
      InitializeDocsStructureArgsSchema,
      args,
    );

    const absoluteTargetProjectDir = path.resolve(target_project_dir);
    console.log(
      `Handling initialize_docs_structure for: ${absoluteTargetProjectDir}`,
    );
    // Use fsUtils to create directories
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(absoluteTargetProjectDir, "docs"),
    );
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(absoluteTargetProjectDir, "docs", "specs"),
    );
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(absoluteTargetProjectDir, "docs", "adr"),
    );
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(absoluteTargetProjectDir, "docs", "changelog"),
    );
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(absoluteTargetProjectDir, ".chat"),
    ); // Also create .chat here

    return {
      status: "success",
      message: "Documentation structure initialized.",
    };
  } catch (e: any) {
    console.error(`Error in handleInitializeDocsStructure: ${e.message}`);
    return {
      status: "error",
      message: `Failed to initialize structure: ${e.message}`,
    };
  }
}
