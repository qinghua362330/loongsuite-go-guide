package main

import (
	"fmt"
	"os"
	"os/exec"
)

func main() {
	if len(os.Args) < 2 { fmt.Fprintln(os.Stderr, "missing go tool name"); os.Exit(2) }
	if log := os.Getenv("TOOLEXEC_LOG"); log != "" { f, err := os.OpenFile(log, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644); if err == nil { defer f.Close(); fmt.Fprintln(f, os.Args[1:]) } }
	tool := exec.Command(os.Args[1], os.Args[2:]...)
	tool.Stdin, tool.Stdout, tool.Stderr = os.Stdin, os.Stdout, os.Stderr
	tool.Env = os.Environ()
	if err := tool.Run(); err != nil { if e, ok := err.(*exec.ExitError); ok { os.Exit(e.ExitCode()) }; fmt.Fprintln(os.Stderr, err); os.Exit(1) }
}
