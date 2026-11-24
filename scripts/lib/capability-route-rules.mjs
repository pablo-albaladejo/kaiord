/**
 * R-CapabilityRouteLiteral: a Capability's route, or the path of a settings
 * section it owns (`/settings/<key>`), is spelled only in the catalogue;
 * anything else links through `capabilityHome(id)`.
 */

const spellsPath = (literal, path) =>
  literal === path || /^[/?#]/.test(literal.slice(path.length))
    ? literal.startsWith(path)
    : false;

const ownedPaths = (catalogue, vocab) =>
  catalogue.flatMap((c) => [
    ...c.routes.map((route) => [c.id, route]),
    ...c.settings.map((key) => [c.id, `${vocab.SETTINGS_PATH}/${key}`]),
  ]);

export function checkRoutes(files, catalogue, vocab) {
  const paths = ownedPaths(catalogue, vocab);
  return files
    .filter((file) => file.path !== vocab.CATALOGUE)
    .flatMap((file) =>
      file.literals.flatMap((literal) =>
        paths
          .filter(([, path]) => spellsPath(literal, path))
          .map(([id, path]) => ({
            rule: "R-CapabilityRouteLiteral",
            file: file.path,
            detail: `spells "${path}" of Capability "${id}": link with capabilityHome("${id}")`,
          }))
      )
    );
}
