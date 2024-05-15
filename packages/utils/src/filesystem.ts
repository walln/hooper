import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";

/**
 * This function lists all directories in a given path.
 *
 * @param path The path to the parent directory
 * @returns A list of directory names in the parent directory
 */
export async function listDirectories(path: string): Promise<Dirent[]> {
	return (await readdir(path, { withFileTypes: true })).filter((d) =>
		d.isDirectory(),
	);
}

/**
 * This function lists all files in a given path.
 *
 * @param path The path to the parent directory
 * @returns A list of file names in the parent directory
 */
export async function listFiles(path: string): Promise<Dirent[]> {
	return (await readdir(path, { withFileTypes: true })).filter((d) =>
		d.isFile(),
	);
}
