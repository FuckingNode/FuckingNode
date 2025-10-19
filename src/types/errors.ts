export const OS_ERRORS = ["Os__NoAppdataNoHome", "Os__NoEntity"] as const;
export const FS_ERRORS = ["Fs__Unreal", "Fs__UnparsablePath", "Fs__DemandsEmptying", "Fs__DemandsDIR"] as const;
export const CFG_ERRORS = ["Cfg__FknYaml__InvalidCmdK", "Cfg__User__FavIDE"] as const;
export const GIT_ERRORS = [
    "Git__GCommittable",
    "Git__CanCommit",
    "Git__Uncommit",
    "Git__ReadCommit",
    "Git__GBranches",
    "Git__Ignore",
    "Git__Commit",
    "Git__Clone",
    "Git__Push",
    "Git__MkTag",
    "Git__GLTag",
    "Git__GStaged",
    "Git__Stage",
    "Git__IsRepo",
    "Git__NoBranchAA",
    "Git__Forbidden",
    "Git__NoBranch",
] as const;
export const ENV_ERRORS = [
    "Env__NotFound",
    "Env__NoPkgFile",
    "Env__MissingMotor",
    "Env__PkgFileUnparsable",
    "Env__CannotDetermine",
    "Env__SchrodingerLockfile",
] as const;
export const TASK_ERRORS = [
    "Task__Release",
    "Task__Commit",
    "Task__Launch",
    "Task__Update",
    "Task__Lint",
    "Task__Pretty",
    "Task__Build",
] as const;
export const PARAM_ERRORS = [
    "Param__WhateverUnprovided",
    "Param__TargetInvalid",
    "Param__CIntensityInvalid",
    "Param__VerInvalid",
    "Param__GitTargetInvalid",
    "Param__GitTargetAliasInvalid",
] as const;
export const INTEROP_ERRORS = [
    "Interop__PublishUnable",
    "Interop__MigrateUnable",
    "Interop__FileRunUnable",
    "Interop__JSRunUnable",
] as const;
export const INTERNAL_ERRORS = [
    "Internal__InvalidEmbedded",
    "Internal__Lazy",
] as const;

type OS_ERROR_CODES = typeof OS_ERRORS[number];
type FS_ERROR_CODES = typeof FS_ERRORS[number];
type CFG_ERROR_CODES = typeof CFG_ERRORS[number];
type GIT_ERROR_CODES = typeof GIT_ERRORS[number];
type ENV_ERROR_CODES = typeof ENV_ERRORS[number];
type TASK_ERROR_CODES = typeof TASK_ERRORS[number];
type PARAM_ERROR_CODES = typeof PARAM_ERRORS[number];
type INTEROP_ERROR_CODES = typeof INTEROP_ERRORS[number];
type INTERNAL_ERROR_CODES = typeof INTERNAL_ERRORS[number];

/**
 * All possible CLI error codes.
 */
export type GLOBAL_ERROR_CODES =
    | OS_ERROR_CODES
    | FS_ERROR_CODES
    | CFG_ERROR_CODES
    | GIT_ERROR_CODES
    | ENV_ERROR_CODES
    | TASK_ERROR_CODES
    | PARAM_ERROR_CODES
    | INTEROP_ERROR_CODES
    | INTERNAL_ERROR_CODES;

/**
 * All possible project validation error codes.
 */
export type PROJECT_ERROR_CODES = "IsDuplicate" | "NoPkgFile" | "NotFound" | "NoName" | "NoVersion" | "CantGetProjectEnv" | "TooManyLockfiles";
