// Tiny structured logger. Always prints server-side, including in production
// (Next hides thrown error messages from the client, but server stdout is yours).
//
// Usage:
//   const log = logger("checkout");
//   log.step("reserving artwork", { artworkId });
//   log.error("reservation failed", err);

type Fields = Record<string, unknown>;

function emit(level: string, scope: string, msg: string, fields?: Fields) {
  const time = new Date().toISOString();
  const base = `[${time}] [${level}] [${scope}] ${msg}`;
  if (fields && Object.keys(fields).length > 0) {
    // Stringify safely; never throw from the logger.
    let extra = "";
    try {
      extra = " " + JSON.stringify(fields);
    } catch {
      extra = " [unserializable fields]";
    }
    // eslint-disable-next-line no-console
    console[level === "error" ? "error" : "log"](base + extra);
  } else {
    // eslint-disable-next-line no-console
    console[level === "error" ? "error" : "log"](base);
  }
}

export function logger(scope: string) {
  return {
    step(msg: string, fields?: Fields) {
      emit("step", scope, msg, fields);
    },
    info(msg: string, fields?: Fields) {
      emit("info", scope, msg, fields);
    },
    warn(msg: string, fields?: Fields) {
      emit("warn", scope, msg, fields);
    },
    error(msg: string, err?: unknown, fields?: Fields) {
      const errInfo =
        err instanceof Error
          ? { error: err.message, stack: err.stack }
          : err
            ? { error: String(err) }
            : {};
      emit("error", scope, msg, { ...errInfo, ...fields });
    },
  };
}

export type Log = ReturnType<typeof logger>;
