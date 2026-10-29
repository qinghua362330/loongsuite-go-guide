package main

import (
	"fmt"
	"time"
)

func addOne(n int) int { return n + 1 }

// 先手写观察动作，理解自动插桩要代替哪一部分重复劳动。
func observedAddOne(n int) int {
	start := time.Now()
	fmt.Println("observe: start")
	result := addOne(n)
	fmt.Println("observe: end, result =", result, ", elapsed =", time.Since(start))
	return result
}

func main() {
	fmt.Println("plain result =", addOne(2))
	fmt.Println("observed result =", observedAddOne(2))
}
