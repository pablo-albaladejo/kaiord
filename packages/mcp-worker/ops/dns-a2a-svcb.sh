#!/usr/bin/env bash
# add-a2a-endpoint task 6.1 (optional): add the _a2a._agents SVCB record as a
# copy of the _mcp._agents one. The owner runs it, only after the /a2a
# production smoke passes. It is a dry run unless --apply is given.
#
#   CF_API_TOKEN=<Zone DNS Edit token, this zone only> CF_ZONE_ID=<zone id> \
#   CF_ZONE_NAME=<the zone apex> \
#     bash packages/mcp-worker/ops/dns-a2a-svcb.sh [--dry-run | --apply]
#
# The dry run only reads the two names and prints the record it would create.
# Revoke the token afterwards.
set -euo pipefail

MODE=dry-run
case "${1:-}" in
  "" | --dry-run) ;;
  --apply) MODE=apply ;;
  *) echo "usage: dns-a2a-svcb.sh [--dry-run | --apply]" >&2; exit 2 ;;
esac
: "${CF_API_TOKEN:?a scoped Zone DNS Edit token}"
: "${CF_ZONE_ID:?the zone id}"
: "${CF_ZONE_NAME:?the zone apex}"

MCP_NAME="_mcp._agents.${CF_ZONE_NAME}"
A2A_NAME="_a2a._agents.${CF_ZONE_NAME}"
API="https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records"

# The token is read by curl from a file descriptor, never from its argv.
cf() {
  curl -fsS -H @<(printf 'Authorization: Bearer %s\n' "$CF_API_TOKEN") \
    -H "content-type: application/json" "$@"
}

EXISTING=$(cf "${API}?type=SVCB&name=${A2A_NAME}")
if [ "$(jq '.result | length' <<<"$EXISTING")" -gt 0 ]; then
  echo "already present: nothing to do"
  jq -c '.result[] | {name, data, ttl}' <<<"$EXISTING"
  exit 0
fi

MCP=$(cf "${API}?type=SVCB&name=${MCP_NAME}")
jq -e --arg apex "${CF_ZONE_NAME}." '
  (.result | length) == 1 and
  .result[0].data.priority == 1 and .result[0].data.target == $apex
' <<<"$MCP" > /dev/null || {
  echo "refusing: expected exactly one ${MCP_NAME} SVCB record, priority 1, target the apex" >&2
  jq -c '.result' <<<"$MCP" >&2
  exit 1
}

BODY=$(jq -c --arg name "$A2A_NAME" '.result[0] | {type, name: $name, data, ttl,
  comment: "A2A endpoint discovery (add-a2a-endpoint 6.1)"}' <<<"$MCP")
echo "record: ${BODY}"
if [ "$MODE" != apply ]; then
  echo "dry run: nothing changed; re-run with --apply"
  exit 0
fi

cf -X POST "$API" --data "$BODY" | jq -c '.result | {name, type, data, ttl}'
echo "created. Check five DoH lookups a minute apart with AD == true, for ${A2A_NAME} and ${MCP_NAME}."
