import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { FuseV1, readFuses } from "./fuses.js";

export interface FuseRestoreResult {
  restored: boolean;
  backupPath?: string;
  reason?: string;
}

export function fuseCarrierIdentity(appRoot: string, electronBinary: string): string {
  const relativePath = relative(appRoot, electronBinary);
  const identity = relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath)
    ? relativePath
    : `external:${resolve(electronBinary)}`;
  return identity.replace(/\\/g, "/");
}

export function fuseCarrierBackupPath(
  appRoot: string,
  electronBinary: string,
  backupRoot: string,
): string {
  const identity = fuseCarrierIdentity(appRoot, electronBinary);
  return join(backupRoot, "electron", encodeURIComponent(identity));
}

export function backupFuseCarrier(
  appRoot: string,
  electronBinary: string,
  backupRoot: string,
  legacyBackupPath: string,
): string {
  const backupPath = fuseCarrierBackupPath(appRoot, electronBinary, backupRoot);
  if (existsSync(backupPath)) {
    if (fuseBackupMatchesCurrentCarrier(backupPath, electronBinary, {
      allowLegacyElectronFrameworkName: false,
    })) {
      return backupPath;
    }
    cpSync(electronBinary, backupPath);
    return backupPath;
  }

  mkdirSync(dirname(backupPath), { recursive: true });
  if (
    existsSync(legacyBackupPath) &&
    fuseBackupMatchesCurrentCarrier(legacyBackupPath, electronBinary, {
      allowLegacyElectronFrameworkName: true,
    })
  ) {
    cpSync(legacyBackupPath, backupPath);
  } else {
    cpSync(electronBinary, backupPath);
  }
  return backupPath;
}

export function restoreFuseCarrier(input: {
  appRoot: string;
  electronBinary: string;
  backupRoot: string;
  legacyBackupPath: string;
  installedCarrierIdentity?: string;
  fuseFlipped: boolean;
}): FuseRestoreResult {
  if (!input.fuseFlipped) return { restored: false, reason: "the install did not modify an Electron fuse" };
  if (!existsSync(input.electronBinary)) {
    throw new Error(
      `Cannot safely restore the Electron fuse backup because the current carrier does not exist at:\n` +
        `  ${input.electronBinary}\n\n` +
        `Reinstall Codex from the official app.`,
    );
  }

  const currentIdentity = fuseCarrierIdentity(input.appRoot, input.electronBinary);
  if (
    input.installedCarrierIdentity &&
    !sameCarrierIdentity(input.installedCarrierIdentity, currentIdentity)
  ) {
    return {
      restored: false,
      reason:
        `the installed fuse carrier (${input.installedCarrierIdentity}) does not match ` +
        `the current carrier (${currentIdentity})`,
    };
  }

  const carrierBackup = fuseCarrierBackupPath(
    input.appRoot,
    input.electronBinary,
    input.backupRoot,
  );
  if (existsSync(carrierBackup)) {
    if (
      !fuseBackupMatchesCurrentCarrier(carrierBackup, input.electronBinary, {
        allowLegacyElectronFrameworkName: false,
      })
    ) {
      return {
        restored: false,
        reason:
          `carrier-specific backup does not match the current fuse carrier ` +
          `(${basename(input.electronBinary)})`,
      };
    }
    cpSync(carrierBackup, input.electronBinary);
    return { restored: true, backupPath: carrierBackup };
  }

  if (!existsSync(input.legacyBackupPath)) {
    return { restored: false, reason: "no Electron fuse backup exists" };
  }

  if (
    !fuseBackupMatchesCurrentCarrier(input.legacyBackupPath, input.electronBinary, {
      allowLegacyElectronFrameworkName: true,
    })
  ) {
    return {
      restored: false,
      reason:
        `legacy generic backup does not match the current fuse carrier ` +
        `(${basename(input.electronBinary)})`,
    };
  }

  cpSync(input.legacyBackupPath, input.electronBinary);
  return { restored: true, backupPath: input.legacyBackupPath };
}

function sameCarrierIdentity(left: string, right: string): boolean {
  const normalizedLeft = left.replace(/\\/g, "/");
  const normalizedRight = right.replace(/\\/g, "/");
  return process.platform === "win32"
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}

function fuseBackupMatchesCurrentCarrier(
  backupPath: string,
  electronBinary: string,
  options: { allowLegacyElectronFrameworkName: boolean },
): boolean {
  if (
    options.allowLegacyElectronFrameworkName &&
    basename(electronBinary) === "Electron Framework"
  ) {
    return true;
  }

  try {
    const backupFuses = readFuses(backupPath);
    const currentFuses = readFuses(electronBinary);
    const fuseIndex = FuseV1.EnableEmbeddedAsarIntegrityValidation;
    if (fuseIndex >= backupFuses.count || fuseIndex >= currentFuses.count) return false;
    if (backupFuses.schemaVersion !== currentFuses.schemaVersion) return false;
    if (backupFuses.count !== currentFuses.count || backupFuses.offset !== currentFuses.offset) return false;

    const backup = readFileSync(backupPath);
    const current = readFileSync(electronBinary);
    if (backup.length !== current.length) return false;
    const fuseOffset = backupFuses.offset + fuseIndex;
    return (
      backup.subarray(0, fuseOffset).equals(current.subarray(0, fuseOffset)) &&
      backup.subarray(fuseOffset + 1).equals(current.subarray(fuseOffset + 1))
    );
  } catch {
    return false;
  }
}
