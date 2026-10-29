package main

import (
	"context"
	"fmt"
	"os"
	"sort"
	"strings"

	"go.opentelemetry.io/contrib/propagators/b3"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

type carrier map[string]string

func (c carrier) Get(key string) string { return c[key] }
func (c carrier) Set(key, value string) { c[key] = value }
func (c carrier) Keys() []string {
	keys := make([]string, 0, len(c))
	for key := range c {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

type row struct {
	Name   string
	Trace  trace.SpanContext
	Want   trace.SpanContext
	Result string
}

var (
	// These are fixed, valid IDs so the experiment is deterministic and does not
	// depend on a gateway or an SDK exporter.
	w3cCtx = fixedContext("11111111111111111111111111111111", "1111111111111111")
	b3Ctx  = fixedContext("22222222222222222222222222222222", "2222222222222222")
	outCtx = fixedContext("11111111111111111111111111111111", "3333333333333333")
)

func fixedContext(traceID, spanID string) trace.SpanContext {
	tid, err := trace.TraceIDFromHex(traceID)
	if err != nil {
		panic(err)
	}
	sid, err := trace.SpanIDFromHex(spanID)
	if err != nil {
		panic(err)
	}
	return trace.NewSpanContext(trace.SpanContextConfig{TraceID: tid, SpanID: sid, TraceFlags: trace.FlagsSampled, Remote: true})
}

func inject(p propagation.TextMapPropagator, ctx trace.SpanContext, c carrier) {
	p.Inject(trace.ContextWithRemoteSpanContext(context.Background(), ctx), c)
}

func extract(p propagation.TextMapPropagator, c carrier) trace.SpanContext {
	ctx := p.Extract(context.Background(), c)
	return trace.SpanContextFromContext(ctx)
}

func b3Multi() propagation.TextMapPropagator {
	return b3.New(b3.WithInjectEncoding(b3.B3MultipleHeader))
}

func b3Single() propagation.TextMapPropagator { return b3.New() }

func composite() propagation.TextMapPropagator {
	// Order is intentional: B3 is last, so a valid B3 context wins over W3C.
	return propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{}, propagation.Baggage{}, b3Multi(),
	)
}

func clearB3(c carrier) {
	for key := range c {
		if key == "b3" || strings.HasPrefix(strings.ToLower(key), "x-b3-") {
			delete(c, key)
		}
	}
}

func main() {
	rows := []row{}
	rows = append(rows, row{"W3C only", extract(propagation.TraceContext{}, func() carrier { c := carrier{}; inject(propagation.TraceContext{}, w3cCtx, c); return c }()), w3cCtx, "pass"})
	rows = append(rows, row{"B3 multi only", extract(b3Multi(), func() carrier { c := carrier{}; inject(b3Multi(), b3Ctx, c); return c }()), b3Ctx, "pass"})
	rows = append(rows, row{"B3 single only", extract(b3Single(), func() carrier { c := carrier{}; inject(b3Single(), b3Ctx, c); return c }()), b3Ctx, "pass"})

	conflict := carrier{}
	inject(propagation.TraceContext{}, w3cCtx, conflict)
	inject(b3Multi(), b3Ctx, conflict)
	got := extract(composite(), conflict)
	assertContext("B3 must win over W3C", got, b3Ctx)
	rows = append(rows, row{"W3C + B3 multi (B3 last)", got, b3Ctx, "pass"})

	singleAndMulti := carrier{}
	inject(b3Multi(), w3cCtx, singleAndMulti)
	inject(b3Single(), b3Ctx, singleAndMulti)
	got = extract(b3Multi(), singleAndMulti)
	assertContext("single B3 must win over multi B3", got, b3Ctx)
	rows = append(rows, row{"B3 single + multi", got, b3Ctx, "pass"})

	old := carrier{"b3": "11111111111111111111111111111111-1111111111111111-1"}
	inject(b3Multi(), outCtx, old)
	if old["b3"] == "" || old["x-b3-traceid"] == "" {
		fail("multi inject unexpectedly removed old single header")
	}
	oldGot := extract(composite(), old)
	assertContext("old b3 remains effective until cleared", oldGot, w3cCtx)
	rows = append(rows, row{"inject multi keeps old b3", oldGot, w3cCtx, "pass"})

	clean := carrier{"b3": "11111111111111111111111111111111-1111111111111111-1"}
	clearB3(clean)
	inject(b3Multi(), outCtx, clean)
	got = extract(composite(), clean)
	if got.TraceID() != outCtx.TraceID() || got.SpanID() != outCtx.SpanID() {
		fail("cleaned carrier did not adopt outgoing B3 context")
	}
	rows = append(rows, row{"clear old B3 then inject", got, outCtx, "pass"})

	fmt.Println("case\ttrace_id\tparent_span_id\texpected_parent\tresult")
	for _, r := range rows {
		assertContext(r.Name, r.Trace, r.Want)
		fmt.Printf("%s\t%s\t%s\t%s\t%s\n", r.Name, short(r.Trace), r.Trace.SpanID(), r.Want.SpanID(), r.Result)
	}
	fmt.Println("\nPropagation assertions passed (carrier model; no real gateway was contacted).")
}

func short(v any) string {
	switch x := v.(type) {
	case trace.SpanContext:
		if !x.IsValid() {
			return "<invalid>"
		}
		return x.TraceID().String()[:4] + "…"
	default:
		return fmt.Sprint(v)
	}
}

func fail(message string) { fmt.Fprintln(os.Stderr, message); os.Exit(1) }

func assertContext(label string, got, want trace.SpanContext) {
	if !got.IsValid() || got.TraceID() != want.TraceID() || got.SpanID() != want.SpanID() || !got.IsRemote() {
		fail(label)
	}
}
