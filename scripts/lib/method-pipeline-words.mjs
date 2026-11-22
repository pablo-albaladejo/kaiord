// A command split into pipeline stages of words the way sh would split it,
// with single quotes as the only quoting. Any character outside quotes that
// sh would read as code (`;`, `&`, `>`, `$`, a backtick, a double quote, a
// backslash, a glob, a line break) is refused: nothing is ever expanded.
// `deniedWord` names the first option on a stage that is refused by name.

const BARE = /^[A-Za-z0-9._/=%:+,-]$/;

export const pipelineWords = (command) => {
  const stages = [[]];
  let word = null;
  const end = () => {
    if (word !== null) stages.at(-1).push(word);
    word = null;
  };
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (ch === "'") {
      const close = command.indexOf("'", i + 1);
      if (close === -1) return { error: "an unclosed quote" };
      const quoted = command.slice(i + 1, close);
      if (quoted.includes("\n")) return { error: "a line break" };
      word = (word ?? "") + quoted;
      i = close;
    } else if (ch === " ") end();
    else if (ch === "|") {
      end();
      stages.push([]);
    } else if (BARE.test(ch)) word = (word ?? "") + ch;
    else return { error: `${JSON.stringify(ch)} outside quotes` };
  }
  end();
  return stages.some((s) => s.length === 0)
    ? { error: "an empty pipeline stage" }
    : { stages };
};

// Refused by name before the allowlists run, so the reason reads plainly.
const DENIED = {
  git: [
    ...["-c", "-C", "-o", "--output", "--exec", "--upload-pack", "--git-dir"],
    ...["--work-tree", "--config-env", "--receive-pack", "--exec-path"],
    ...["--namespace", "--ext-diff", "--textconv"],
  ],
  grep: ["-f", "--file", "-r", "-R", "--recursive", "--include", "-d"],
  wc: ["--files0-from"],
};

export const deniedWord = ([name, ...args]) =>
  args.find(
    (a) =>
      a.includes("ext::") ||
      (DENIED[name] ?? []).some((d) => a === d || a.startsWith(`${d}=`))
  );
