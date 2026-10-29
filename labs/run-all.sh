#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WITH_OTEL=0
if [ "${1:-}" = "--with-otel" ]; then WITH_OTEL=1; fi

printf '%s\n' '== 00 ordinary function and observation =='
(cd "$ROOT/00-start" && go run .)
printf '%s\n' '== 01 context =='
(TMP01=$(mktemp "${TMPDIR:-/tmp}/loongsuite-context.XXXXXX") && cd "$ROOT/01-context" && go run . >"$TMP01" && sort "$TMP01")
printf '%s\n' '== 02 ast =='
(cd "$ROOT/02-ast" && go run .)
printf '%s\n' '== 03 toolexec =='
(cd "$ROOT/03-toolexec" && mkdir -p .bin && go build -o .bin/toolexec ./wrapper && TOOLEXEC_LOG="$ROOT/03-toolexec/toolexec.log" go build -toolexec="$ROOT/03-toolexec/.bin/toolexec" -o .bin/app . && .bin/app)
printf '%s\n' '== 04 plain custom-hook target =='
(cd "$ROOT/04-custom-hook" && go run .)
printf '%s\n' '== 05 otel context/exporter =='
(cd "$ROOT/05-otel" && go run . >/dev/null && echo 'OTel parent/trace assertions passed')
printf '%s\n' '== 06 propagation matrix =='
(cd "$ROOT/06-propagation" && go run .)

if [ "$WITH_OTEL" -eq 0 ]; then
	printf '%s\n' '== 04 upstream custom-hook: SKIP (pass --with-otel and OTEL_TOOL=/abs/path/otel) =='
	exit 0
fi
if [ -z "${OTEL_TOOL:-}" ] || [ ! -x "$OTEL_TOOL" ]; then
	printf '%s\n' '04 upstream custom-hook: ERROR (OTEL_TOOL is missing or not executable)' >&2
	exit 1
fi

TMP=$(mktemp -d "${TMPDIR:-/tmp}/loongsuite-hooklab.XXXXXX")
mkdir -p "$TMP/rules"
cp "$ROOT/04-custom-hook/main.go" "$ROOT/04-custom-hook/go.mod" "$ROOT/04-custom-hook/go.sum" "$ROOT/04-custom-hook/rule.json" "$TMP/"
cp "$ROOT/04-custom-hook/rules/go.mod" "$ROOT/04-custom-hook/rules/hook.go" "$TMP/rules/"
printf '%s\n' '== 04 upstream custom-hook =='
OUT="$TMP/result.log"
if ! (cd "$TMP" && "$OTEL_TOOL" set -disable= -rule="$TMP/rule.json" && "$OTEL_TOOL" go build -o instrumented . && ./instrumented) >"$OUT" 2>&1; then
	cat "$OUT" >&2
	exit 1
fi
cat "$OUT"
grep -F 'hook-enter method=GET' "$OUT" >/dev/null
grep -F 'hook-exit status=204' "$OUT" >/dev/null
grep -F 'plain-result 42 status 204' "$OUT" >/dev/null
printf '%s\n' "upstream custom-hook passed; generated files are in $TMP"
