package main

import (
	"fmt"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"os"
)

// This small rewrite uses go/ast from the standard library. A production
// LoongSuite rule uses dave/dst when it must preserve comments and exact syntax.
func main() {
	src := `package demo
func Handle() error { return nil }
`
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, "demo.go", src, parser.ParseComments)
	if err != nil { panic(err) }
	for _, decl := range f.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Name.Name != "Handle" { continue }
		fn.Body.List = append([]ast.Stmt{&ast.DeferStmt{Call: &ast.CallExpr{Fun: ast.NewIdent("observe")}}}, fn.Body.List...)
	}
	if err := format.Node(os.Stdout, fset, f); err != nil { panic(err) }
	fmt.Println("// inserted by AST transform; a regex would break on formatting/comments")
}
