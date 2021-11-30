// This is a PoC/illustrative code to show how to share a single integer that goes up in k6 on a
// single instance

package carbonapi

import (
	"go.k6.io/k6/js/modules"
)

func init() {
	modules.Register("k6/x/carbonapi", New())
}

type Module struct{}

// func (m *Module) XRender(max int64) *Increment {
// 	return newIncrement(max)
// }

func New() *Module {
	return &Module{}
}
