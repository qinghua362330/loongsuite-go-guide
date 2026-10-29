package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
	traceapi "go.opentelemetry.io/otel/trace"
)

type result struct {
	Name       string `json:"name"`
	TraceID    string `json:"trace_id"`
	SpanID     string `json:"span_id"`
	ParentSpan string `json:"parent_span_id"`
}

func main() {
	exporter := tracetest.NewInMemoryExporter()
	provider := trace.NewTracerProvider(
		trace.WithSpanProcessor(trace.NewSimpleSpanProcessor(exporter)),
		trace.WithSampler(trace.ParentBased(trace.AlwaysSample())),
	)
	defer provider.Shutdown(context.Background())
	otel.SetTracerProvider(provider)
	otel.SetTextMapPropagator(propagation.TraceContext{})
	tracer := otel.Tracer("guide/05-otel")

	rootCtx, root := tracer.Start(context.Background(), "request")
	childCtx, child := tracer.Start(rootCtx, "child")
	carrier := propagation.MapCarrier{}
	otel.GetTextMapPropagator().Inject(childCtx, carrier)
	remoteCtx := otel.GetTextMapPropagator().Extract(context.Background(), carrier)
	_, remote := tracer.Start(remoteCtx, "remote-child")
	remote.End()
	_, detached := tracer.Start(context.Background(), "detached")
	detached.End()
	unsampled := traceapi.NewSpanContext(traceapi.SpanContextConfig{
		TraceID: child.SpanContext().TraceID(), SpanID: child.SpanContext().SpanID(),
		TraceFlags: 0, Remote: true,
	})
	_, dropped := tracer.Start(traceapi.ContextWithRemoteSpanContext(context.Background(), unsampled), "unsampled-child")
	if !dropped.SpanContext().IsValid() || dropped.IsRecording() || dropped.SpanContext().TraceID() != root.SpanContext().TraceID() {
		fmt.Fprintln(os.Stderr, "unsampled parent assertion failed")
		os.Exit(1)
	}
	dropped.End()
	child.End()
	root.End()

	spans := exporter.GetSpans()
	byName := make(map[string]tracetest.SpanStub, len(spans))
	for _, span := range spans {
		byName[span.Name] = span
	}
	if len(spans) != 4 || !byName["request"].SpanContext.IsValid() || byName["request"].Parent.IsValid() ||
		byName["detached"].Parent.IsValid() || byName["detached"].SpanContext.TraceID() == byName["request"].SpanContext.TraceID() ||
		!byName["remote-child"].Parent.IsRemote() ||
		byName["request"].SpanContext.TraceID() != byName["child"].SpanContext.TraceID() ||
		byName["remote-child"].SpanContext.TraceID() != byName["request"].SpanContext.TraceID() ||
		byName["child"].Parent.SpanID() != byName["request"].SpanContext.SpanID() ||
		byName["remote-child"].Parent.SpanID() != byName["child"].SpanContext.SpanID() {
		fmt.Fprintf(os.Stderr, "parent/trace assertion failed: %#v\n", spans)
		os.Exit(1)
	}

	out := make([]result, 0, len(spans))
	for _, span := range spans {
		parent := span.Parent.SpanID().String()
		out = append(out, result{Name: span.Name, TraceID: span.SpanContext.TraceID().String(), SpanID: span.SpanContext.SpanID().String(), ParentSpan: parent})
	}
	encoded, _ := json.MarshalIndent(out, "", "  ")
	fmt.Println(string(encoded))
	fmt.Println("assertions: same trace, correct parents, remote flag, Background new root, unsampled valid but not exported")
}
