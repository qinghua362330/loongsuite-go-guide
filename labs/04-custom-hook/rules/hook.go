package rules

import (
	"fmt"
	"net/http"
	_ "unsafe"

	"github.com/alibaba/loongsuite-go/pkg/api"
)

//go:linkname guideHttpEnter net/http.guideHttpEnter
func guideHttpEnter(call api.CallContext, t *http.Transport, req *http.Request) {
	fmt.Printf("hook-enter method=%s\n", req.Method)
}

//go:linkname guideHttpExit net/http.guideHttpExit
func guideHttpExit(call api.CallContext, res *http.Response, err error) {
	if err != nil { fmt.Printf("hook-error=%v\n", err); return }
	if res != nil { fmt.Printf("hook-exit status=%d\n", res.StatusCode) }
}
