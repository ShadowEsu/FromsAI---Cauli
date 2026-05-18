import { spawn } from "node:child_process";
import path from "node:path";

import type { FormData } from "./types";

function runJacBridge(
  python: string,
  script: string,
  stdinPayload: string,
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(python, [script], {
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), "jac"),
      },
    });

    const outChunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      outChunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      errChunks.push(chunk);
    });

    child.once("error", reject);
    child.once("close", (exitCode) => {
      resolve({
        stdout: Buffer.concat(outChunks).toString("utf8"),
        stderr: Buffer.concat(errChunks).toString("utf8"),
        exitCode,
      });
    });

    child.stdin.write(stdinPayload);
    child.stdin.end();
  });
}

/**
 * Parses a Google Form by spawning the **Jac** implementation (`jac/form_parser.jac`)
 * via Python's Jac import hook + `scripts/jac_parse_stdio.py`.
 *
 * Set `CAULIFORM_JAC_PYTHON` to your Jac-capable interpreter (absolute path).
 */
export async function parseGoogleFormJac(url: string): Promise<FormData> {
  const python = process.env.CAULIFORM_JAC_PYTHON?.trim();
  if (!python) {
    throw new Error(
      "CAULIFORM_JAC_PYTHON is not set — point it at your Jac venv interpreter " +
        "(e.g. the absolute path to `.venv-jac/bin/python`).",
    );
  }
  const script = path.join(process.cwd(), "scripts", "jac_parse_stdio.py");

  const { stdout, stderr, exitCode } = await runJacBridge(
    python,
    script,
    JSON.stringify({ url }),
  );

  if (stderr) {
    console.error("[Jac parser stderr]", stderr);
  }

  const parsed = JSON.parse(stdout) as {
    ok: boolean;
    data?: FormData;
    error?: string;
  };

  if (exitCode !== 0 || !parsed.ok || !parsed.data) {
    throw new Error(parsed.error || "Jac parser failed");
  }

  return parsed.data;
}
