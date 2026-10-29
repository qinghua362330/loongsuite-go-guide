package main

import (
	"context"
	"fmt"
	"sync"
)

type traceKey struct{}

func traceID(ctx context.Context) string {
	if v, ok := ctx.Value(traceKey{}).(string); ok {
		return v
	}
	return "<root>"
}

func workerPool(jobs <-chan context.Context, out chan<- string, wg *sync.WaitGroup) {
	defer wg.Done()
	for ctx := range jobs {
		out <- traceID(ctx)
	}
}

func main() {
	request := context.WithValue(context.Background(), traceKey{}, "trace-request")
	var wg sync.WaitGroup
	var sendWg sync.WaitGroup
	results := make(chan string, 3)
	jobs := make(chan context.Context, 2)
	wg.Add(1)
	go workerPool(jobs, results, &wg) // worker exists before a task arrives.
	sendWg.Add(2)
	go func() { defer sendWg.Done(); results <- traceID(request) }()              // explicit context handoff.
	go func() { defer sendWg.Done(); results <- traceID(context.Background()) }() // no handoff.
	jobs <- request
	close(jobs)
	wg.Wait()
	sendWg.Wait()
	close(results)
	for id := range results {
		fmt.Println(id)
	}
}
