/**
 * All possible CLI error codes.
 *
 * @export
 */
export type GLOBAL_ERROR_CODES =
    | "Cleaner__InvalidCleanerIntensity"
    | "Internal__Projects__CantDetermineEnv"
    | "Generic__NonExistingPath"
    | "Internal__NoEnvForConfigPath"
    | "Project__NonFoundProject"
    | "Env__UnparsableMainFile"
    | "Interop__CannotRunJsLike"
    | "Unknown__CleanerTask__Lint"
    | "Unknown__CleanerTask__Pretty"
    | "Unknown__CleanerTask__Update"
    | "Unknown__CleanerTask__Launch"
    | "Commit__Fail__CommitCmd"
    | "Sys__CannotNotify"
    | "Git__IsRepoError"
    | "Internal__UnparsablePath"
    | "Generic__MissingRuntime"
    | "Release__Fail__ReleaseCmd";

/**
 * All possible project validation error codes.
 */
export type PROJECT_ERROR_CODES = "IsDuplicate" | "NoPkgFile" | "NotFound" | "NoName" | "NoVersion" | "CantGetProjectEnv";
