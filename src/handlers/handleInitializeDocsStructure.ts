// src/handlers/handleInitializeDocsStructure.ts
import * as path from "path";
import * as fsUtils from "../utils/fsUtils.js"; // Updated import path

export async function handleInitializeDocsStructure(
  targetProjectDir: string,
): Promise<any> {
  const absoluteTargetProjectDir = path.resolve(targetProjectDir); // Add this line
  console.log(`Handling initialize_docs_structure for: ${absoluteTargetProjectDir}`);
  try {
    // Use fsUtils to create directories
    fsUtils.createDirectory(fsUtils.joinProjectPath(absoluteTargetProjectDir, "docs"));
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(absoluteTargetProjectDir, "docs", "specs"),
    );
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(absoluteTargetProjectDir, "docs", "adr"),
    );
    fsUtils.createDirectory(
      fsUtils.joinProjectPath(absoluteTargetProjectDir, "docs", "changelog"),
    );
    fsUtils.createDirectory(fsUtils.joinProjectPath(absoluteTargetProjectDir, ".chat")); // Also create .chat here

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
