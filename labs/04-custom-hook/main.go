package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/sdk/trace"
)

func target(value int) int { return value + 1 }
func main() {
	provider := trace.NewTracerProvider()
	otel.SetTracerProvider(provider)
	defer provider.Shutdown(context.Background())
	_, root := otel.Tracer("guide").Start(context.Background(), "root")
	defer root.End()
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	defer s.Close()
	res, err := http.Get(s.URL)
	if err != nil { panic(err) }
	defer res.Body.Close()
	fmt.Println("plain-result", target(41), "status", res.StatusCode)
}
