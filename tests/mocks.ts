import { GetAppPath } from "../src/functions/config.ts";
import { CONSTANTS } from "./constants.ts";

export const mocks = {
    readTextFileSync: () => {
        return (path: string | URL): string => {
            const resolvedPath = typeof path === "string" ? path : path.toString();
            if (resolvedPath === GetAppPath("MOTHERFKRS")) {
                return `${CONSTANTS.ENV_PATH}/test-one`; // we give /test-one instead of \\test-one in purpose to ensure paths are parsed before returning them
            } else {
                return Deno.readTextFileSync(path);
            }
        };
    },
};
