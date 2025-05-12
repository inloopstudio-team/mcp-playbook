// src/handlers/parser/cursorChatParser.ts

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises'; // Use promises version for async operations
import * as fsSync from 'fs'; // Use sync version for existsSync for simplicity
import pkg from 'sqlite3';
import type { Database as SqliteDatabaseType } from 'sqlite3'; // Explicitly import the type with an alias
const { Database, OPEN_READONLY } = pkg; // Import Database and OPEN_READONLY

// Define a type for the conversation history structure we will return
interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ConversationHistory {
    editor: 'cursor';
    projectPath: string;
    workspaceName?: string; // Optional human-readable workspace name
    messages: ConversationMessage[];
}

// Helper function to open a SQLite database with Promises
// Use the imported type alias
function openDb(dbPath: string, mode = OPEN_READONLY): Promise<SqliteDatabaseType> {
    return new Promise((resolve, reject) => {
        // Note: The 'Database' constructor itself is used here, which is a value
        const db = new Database(dbPath, mode, (err: Error | null) => { // Explicitly type err
            if (err) {
                console.error(`Error opening database at ${dbPath}: ${err.message}`);
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

// Helper function to run a single query and get one row
// Use the imported type alias
function getDbRow(db: SqliteDatabaseType, sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err: Error | null, row: any) => { // Explicitly type err and row
            if (err) {
                console.error(`Error running query "${sql}": ${err.message}`);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Helper function to run a query and get all rows
// Use the imported type alias
function getAllDbRows(db: SqliteDatabaseType, sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err: Error | null, rows: any[]) => { // Explicitly type err and rows
            if (err) {
                console.error(`Error running query "${sql}": ${err.message}`);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Helper function to close a database connection
// Use the imported type alias
function closeDb(db: SqliteDatabaseType): Promise<void> {
    return new Promise((resolve, reject) => {
        db.close((err: Error | null) => { // Explicitly type err
            if (err) {
                console.error(`Error closing database: ${err.message}`);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Helper to infer project path from history entries
function inferProjectPathFromHistory(historyEntries: any[]): string | null {
    const paths: string[] = [];
    if (Array.isArray(historyEntries)) {
        for (const entry of historyEntries) {
            // Look for the 'resource' field within 'editor' objects
            if (entry && typeof entry === 'object' && entry.editor && typeof entry.editor === 'object' && entry.editor.resource && typeof entry.editor.resource === 'string') {
                try {
                    // Attempt to parse as a URL (expecting file:// URLs)
                    const url = new URL(entry.editor.resource);
                    if (url.protocol === 'file:') {
                        let pathname = url.pathname;
                        // Handle Windows paths from file:// URLs: remove leading slash, replace slashes
                        if (process.platform === 'win32') {
                            if (pathname.startsWith('/')) {
                                pathname = pathname.substring(1);
                            }
                             pathname = pathname.replace(/\//g, '\\');
                        }
                        paths.push(pathname);
                    }
                } catch (urlError) {
                    // If URL parsing fails, treat it as a raw path string
                    console.warn(`Could not parse resource URL: ${entry.editor.resource}`, urlError);
                    paths.push(entry.editor.resource);
                }
            }
        }
    }

    if (paths.length === 0) {
        return null;
    }

    // Simple heuristic: Find the longest common path prefix
    let commonPrefix = paths[0];

     for (let i = 1; i < paths.length; i++) {
         while (!paths[i].startsWith(commonPrefix) && commonPrefix.length > 0) {
             commonPrefix = commonPrefix.substring(0, commonPrefix.lastIndexOf(path.sep));
         }
         if (commonPrefix.length === 0) break;
     }

     // Ensure the common prefix is a directory path
     // If the common prefix is a file path, go up one level
      try {
           if (fsSync.existsSync(commonPrefix) && fsSync.statSync(commonPrefix).isFile()) {
                commonPrefix = path.dirname(commonPrefix);
           }
      } catch (e: any) { // Explicitly type e as any
           console.warn("Could not stat common prefix to check if it's a file:", e.message); // Access message property
           // If stat fails, assume it's a directory or the best guess we have
      }


    return commonPrefix.length > 0 ? commonPrefix : null;
}


// Helper function to read and parse the state.vscdb (copied as .sqlite)
async function readStateDb(dbPath: string): Promise<string | null> {
    let db: SqliteDatabaseType | null = null; // Use the imported type alias
    try {
        db = await openDb(dbPath);
        const row = await getDbRow(db, "SELECT value FROM ItemTable WHERE key = 'history.entries'");

        if (row && row.value) {
            try {
                const historyEntries = JSON.parse(row.value);
                const inferredProjectPath = inferProjectPathFromHistory(historyEntries);
                return inferredProjectPath;
            } catch (parseError: any) { // Explicitly type parseError as any
                console.error(`Error parsing history.entries JSON: ${parseError.message}`); // Access message property
                return null;
            }
        } else {
            console.warn("history.entries key not found or has no value in state database.");
            return null;
        }
    } catch (error: any) { // Explicitly type error as any
        console.error(`Error reading state database at ${dbPath}: ${error.message}`); // Access message property
        return null;
    } finally {
        if (db) {
            await closeDb(db);
        }
    }
}

// Helper function to read and parse the global session database
async function readSessionDb(dbPath: string): Promise<ConversationMessage[] | null> {
    let db: SqliteDatabaseType | null = null; // Use the imported type alias
    try {
        db = await openDb(dbPath);
        // Query cursorDiskKV for bubbleId keys, ordered by rowid
        const rows = await getAllDbRows(db, "SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%' ORDER BY rowid");

        const messages: ConversationMessage[] = [];
        for (const row of rows) {
            try {
                const bubbleData = JSON.parse(row.value);
                if (bubbleData.text) {
                    const role = bubbleData.type === 1 ? 'user' : 'assistant'; // Type 1 is typically user
                    messages.push({ role, content: bubbleData.text });
                }
            } catch (parseError: any) { // Explicitly type parseError as any
                console.error(`Error parsing bubbleId value JSON for key ${row.key}: ${parseError.message}`); // Access message property
            }
        }
        return messages;

    } catch (error: any) { // Explicitly type error as any
        console.error(`Error reading session database at ${dbPath}: ${error.message}`); // Access message property
        return null;
    } finally {
        if (db) {
            await closeDb(db);
        }
    }
}


export async function getCursorConversationHistory(targetProjectDir: string): Promise<ConversationHistory | null> {
    console.log(`Attempting to parse Cursor chat history for target project directory: ${targetProjectDir}`);

    let tempStateDbSqlitePath: string | null = null; // Variable to hold the path of the temporary state db file

    try {
        // 1. Determine OS and locate Cursor data directories
        const platform = os.platform();
        let userDataPath: string;

        switch (platform) {
            case 'darwin': // macOS
                userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User');
                break;
            case 'win32': // Windows
                userDataPath = path.join(process.env.APPDATA!, 'Cursor', 'User');
                break;
            case 'linux': // Linux
                userDataPath = path.join(os.homedir(), '.config', 'Cursor', 'User');
                break;
            default:
                console.error(`Unsupported operating system: ${platform}`);
                return null;
        }

        const workspaceStoragePath = path.join(userDataPath, 'workspaceStorage');
        const globalStoragePath = path.join(userDataPath, 'globalStorage');
        const cursorGlobalStoragePath = path.join(globalStoragePath, 'cursor.cursor'); // Assuming this is the extension ID

        console.log(`User Data Path: ${userDataPath}`);
        console.log(`Workspace Storage Path: ${workspaceStoragePath}`);
        console.log(`Cursor Global Storage Path: ${cursorGlobalStoragePath}`);

        // Check if workspaceStoragePath exists
        if (!fsSync.existsSync(workspaceStoragePath)) {
            console.error(`Workspace storage directory not found: ${workspaceStoragePath}`);
            return null;
        }

        const workspaceDirs = (await fs.readdir(workspaceStoragePath, { withFileTypes: true }))
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        if (workspaceDirs.length === 0) {
            console.log('No workspace directories found.');
            return null;
        }

        // 2. Find the workspace directory with the latest modification time by checking state.vscdb
        let latestWorkspaceDirName: string | null = null;
        let latestMtime = 0;

        for (const dirName of workspaceDirs) {
            const stateVscdbPath = path.join(workspaceStoragePath, dirName, 'state.vscdb');

            try {
                const stats = await fs.stat(stateVscdbPath);
                if (stats.size > 0) {
                    const mtime = stats.mtimeMs; // Modification time in milliseconds

                    if (mtime > latestMtime) {
                        latestMtime = mtime;
                        latestWorkspaceDirName = dirName;
                    }
                }
            } catch (error: any) { // Explicitly type error as any
                 if (error.code !== 'ENOENT') {
                     console.warn(`Error stat-ing state.vscdb in ${dirName}: ${error.message}`); // Access message property
                 }
                // Ignore if state.vscdb doesn't exist in a workspace dir
            }
        }

        if (!latestWorkspaceDirName) {
            console.log('No workspace directory with a valid state.vscdb file found.');
            return null;
        }

        const latestWorkspaceDirPath = path.join(workspaceStoragePath, latestWorkspaceDirName);
        const latestStateVscdbPath = path.join(latestWorkspaceDirPath, 'state.vscdb');
        console.log(`Found latest workspace directory: ${latestWorkspaceDirPath}`);
        console.log(`Latest state.vscdb path: ${latestStateVscdbPath}`);


        // 3. Copy state.vscdb to a temporary .sqlite file and infer project path
        tempStateDbSqlitePath = `${latestStateVscdbPath}.sqlite`; // Append .sqlite for clarity

        console.log(`Copying ${latestStateVscdbPath} to temporary file ${tempStateDbSqlitePath}`);
        try {
             await fs.copyFile(latestStateVscdbPath, tempStateDbSqlitePath);
             console.log('Copy successful.');
        } catch (copyError: any) { // Explicitly type copyError as any
             console.error(`Error copying state.vscdb to temporary file: ${copyError.message}`); // Access message property
             return null;
        }

        // Read project path from the copied state database
        const inferredProjectPath = await readStateDb(tempStateDbSqlitePath);

        // Clean up the temporary state database file immediately after reading
        if (tempStateDbSqlitePath && fsSync.existsSync(tempStateDbSqlitePath)) {
             try {
                 await fs.unlink(tempStateDbSqlitePath);
                 console.log(`Cleaned up temporary state DB file: ${tempStateDbSqlitePath}`);
             } catch (unlinkError: any) { // Explicitly type unlinkError as any
                 console.error(`Error cleaning up temporary state DB file ${tempStateDbSqlitePath}: ${unlinkError.message}`); // Access message property
                 // Log error but continue
             }
        }


        if (!inferredProjectPath) {
            console.error("Could not infer project path from state.vscdb.");
            return null;
        }
        console.log(`Inferred project path from state.vscdb: ${inferredProjectPath}`);


        // 4. Locate and read the global session database
        let cursorSessionDbPath: string | null = null;

        // Check if cursor global storage path exists
         if (!fsSync.existsSync(cursorGlobalStoragePath)) {
             console.error(`Cursor global storage directory not found: ${cursorGlobalStoragePath}`);
             return null; // Cannot find session DB
         }

        const cursorGlobalStorageList = (await fs.readdir(cursorGlobalStoragePath, { withFileTypes: true }))
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name);


        // Find the session database file (e.g., state.sqlite or *.db)
        const sessionDbFilename = cursorGlobalStorageList
            .find(filename => filename.endsWith('.sqlite') || filename.endsWith('.db')); // Using find for the first match


        if (sessionDbFilename) {
            cursorSessionDbPath = path.join(cursorGlobalStoragePath, sessionDbFilename);
            console.log(`Found Cursor session database: ${cursorSessionDbPath}`);
        } else {
            console.error('Cursor session database file (.sqlite or .db) not found.');
            return null; // Cannot find session DB
        }

        // Read messages from the session database
        const messages = await readSessionDb(cursorSessionDbPath);

        if (!messages) {
             console.error("Could not read messages from session database.");
             return null;
        }
        console.log(`Extracted ${messages.length} messages from session database.`);


        // 5. Optional: Read workspace.json for a human-readable name
        let workspaceName: string | undefined = undefined;
        const workspaceJsonPath = path.join(latestWorkspaceDirPath, 'workspace.json');

        try {
            const workspaceJsonContent = await fs.readFile(workspaceJsonPath, 'utf-8');
            const wsConfig = JSON.parse(workspaceJsonContent);
             // Look for a 'folder' property which often contains the project path or config
             if (wsConfig.folder && typeof wsConfig.folder === 'string') {
                 // Heuristic: Use the base name of the folder path as the workspace name
                workspaceName = path.basename(wsConfig.folder);
             } else if (wsConfig.folders && Array.isArray(wsConfig.folders) && wsConfig.folders.length > 0 && wsConfig.folders[0].path && typeof wsConfig.folders[0].path === 'string') {
                 // Handle multi-root workspaces, use the base name of the first folder path
                 workspaceName = path.basename(wsConfig.folders[0].path);
             }
        } catch (error: any) { // Explicitly type error as any
            if (error.code !== 'ENOENT') {
                 console.warn(`Could not read or parse workspace.json at ${workspaceJsonPath}: ${error.message}`); // Access message property
            } // Ignore if workspace.json doesn't exist
        }


        // 6. Combine and return the history
        return {
            editor: 'cursor',
            projectPath: inferredProjectPath,
            workspaceName: workspaceName,
            messages: messages
        } as ConversationHistory;


    } catch (error: any) { // Explicitly type error as any
        console.error('An unexpected error occurred during Cursor chat parsing:', error); // Access message property
         // Attempt to clean up temp file if it exists on unexpected errors
         if (tempStateDbSqlitePath && fsSync.existsSync(tempStateDbSqlitePath)) {
              try { await fs.unlink(tempStateDbSqlitePath); } catch (e: any) { console.error("Cleanup error:", e.message); } // Explicitly type e as any
          }
        return null;
    }
}

// Helper to format the conversation history into a markdown string
export function formatConversationHistory(history: any): string {
    let markdown = `# Conversation History

`;

    markdown += `**Editor:** ${history.editor ? history.editor.charAt(0).toUpperCase() + history.editor.slice(1) : 'Unknown'}
`; // Capitalize editor name
    markdown += `**Project Path:** ${history.projectPath || 'Unknown'}
`;
    if (history.workspaceName) {
        markdown += `**Workspace Name:** ${history.workspaceName}
`;
    }
    markdown += `
`;

    if (Array.isArray(history.messages)) {
        history.messages.forEach((message: any) => {
            markdown += `**${message.role === 'user' ? 'User' : 'Assistant'}:**
`;
            markdown += `${message.content || ''}

`;
        });
    } else {
         markdown += '_No messages found._\n\n';
    }


    return markdown;
}

// Note: This implementation relies on the 'sqlite3' Node.js library
// being added to package.json dependencies and installed (`npm install`).
// The logic for inferring the project path from history.entries is a heuristic
// and might need refinement depending on how Cursor/VS Code stores resource paths.
// Robust error handling and temporary file cleanup are included.
