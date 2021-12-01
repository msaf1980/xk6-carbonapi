// This is a PoC/illustrative code to show how to share a single integer that goes up in k6 on a
// single instance

package carbonapi

import (
	"go.k6.io/k6/js/modules"
)

func init() {
	modules.Register("k6/x/carbonapi", New())
}

type Module struct {
	q *CarbonapiQuery
}

func (m *Module) LoadQueries(path, baseURL string) (*CarbonapiQuery, error) {
	var err error

	m.q, err = carbonapiQuery(path, baseURL)

	return m.q, err
}

func New() *Module {
	return &Module{}
}
