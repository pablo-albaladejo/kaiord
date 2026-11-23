#!/usr/bin/env bash
# add-a2a-endpoint task 3.1: widen the zone's one /mcp rate-limiting rule to
# /mcp and /a2a as ONE shared bucket (design D7). The owner runs it, before
# the deploy that adds the /a2a route. It is a dry run unless --apply is given.
#
#   CF_API_TOKEN=<Zone WAF Edit token, this zone only> CF_ZONE_ID=<zone id> \
#     bash packages/mcp-worker/ops/waf-widen-a2a.sh [--dry-run | --apply]
#
# The dry run only reads the rule, asserts it and prints the new expression.
# --apply patches the rule with only `expression` changed, reads it back and
# fails if anything else changed. The JSON is saved in OUT_DIR (default: a new
# temporary directory). Revoke the token afterwards.
set -euo pipefail

MODE=dry-run
case "${1:-}" in
  "" | --dry-run) ;;
  --apply) MODE=apply ;;
  *) echo "usage: waf-widen-a2a.sh [--dry-run | --apply]" >&2; exit 2 ;;
esac
: "${CF_API_TOKEN:?a scoped Zone WAF Edit token}"
: "${CF_ZONE_ID:?the zone id}"

OLD_CLAUSE='http.request.uri.path eq "/mcp"'
NEW_CLAUSE='http.request.uri.path in {"/mcp" "/a2a"}'
API="https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/rulesets"
OUT="${OUT_DIR:-$(mktemp -d)}"
mkdir -p "$OUT"

# The token is read by curl from a file descriptor, never from its argv.
cf() {
  curl -fsS -H @<(printf 'Authorization: Bearer %s\n' "$CF_API_TOKEN") \
    -H "content-type: application/json" "$@"
}
rules_with() {
  jq -c --arg c "$1" '[(.result.rules // [])[] | select(.expression | contains($c))]' "$2"
}

cf "${API}/phases/http_ratelimit/entrypoint" > "$OUT/before.json"
RULESET_ID=$(jq -r '.result.id' "$OUT/before.json")

if [ "$(rules_with "$NEW_CLAUSE" "$OUT/before.json" | jq length)" = 1 ]; then
  echo "already widened: nothing to do"
  exit 0
fi

# Exactly one rule names /mcp, once, with exactly the budget the docs state.
RULES=$(rules_with "$OLD_CLAUSE" "$OUT/before.json")
jq -e --arg c "$OLD_CLAUSE" '
  length == 1 and (.[0] |
    .action == "block" and .enabled == true and
    (.expression | split($c) | length) == 2 and
    .ratelimit.period == 10 and .ratelimit.requests_per_period == 10 and
    .ratelimit.mitigation_timeout == 10 and
    (.ratelimit.characteristics | sort) == ["cf.colo.id", "ip.src"])
' <<<"$RULES" > /dev/null || {
  echo "refusing: no single /mcp rule with the documented budget; see $OUT/before.json" >&2
  jq . <<<"$RULES" >&2
  exit 1
}

BEFORE=$(jq -c '.[0]' <<<"$RULES")
RULE_ID=$(jq -r '.id' <<<"$BEFORE")
OLD_EXPRESSION=$(jq -r '.expression' <<<"$BEFORE")
NEW_EXPRESSION=$(jq -r --arg o "$OLD_CLAUSE" --arg n "$NEW_CLAUSE" \
  '.expression | split($o) | join($n)' <<<"$BEFORE")
BODY=$(jq -c --arg e "$NEW_EXPRESSION" \
  'del(.id, .version, .last_updated, .categories) | .expression = $e' <<<"$BEFORE")

echo "ruleset ${RULESET_ID} rule ${RULE_ID}"
echo "  before: ${OLD_EXPRESSION}"
echo "  after:  ${NEW_EXPRESSION}"
if [ "$MODE" != apply ]; then
  echo "dry run: nothing changed; re-run with --apply"
  exit 0
fi

cf -X PATCH "${API}/${RULESET_ID}/rules/${RULE_ID}" --data "$BODY" > "$OUT/patch-reply.json"
cf "${API}/phases/http_ratelimit/entrypoint" > "$OUT/after.json"
AFTER=$(jq -c --arg id "$RULE_ID" '.result.rules[] | select(.id == $id)' "$OUT/after.json")
[ "$(jq -r '.expression' <<<"$AFTER")" = "$NEW_EXPRESSION" ] || {
  echo "patched, but the read-back does not show the new expression; see $OUT" >&2
  exit 1
}
# Only the expression and the rule's own bookkeeping may differ.
STRIP='del(.expression, .last_updated, .version)'
if [ "$(jq -S "$STRIP" <<<"$BEFORE")" != "$(jq -S "$STRIP" <<<"$AFTER")" ]; then
  echo "the rule changed beyond its expression; see $OUT" >&2
  exit 1
fi
echo "widened; before and after saved in $OUT. Revoke the token now."
