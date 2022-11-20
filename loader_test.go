package carbonapi

import (
	"path"
	"runtime"
	"testing"

	"github.com/dop251/goja"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.k6.io/k6/js/modulestest"
)

func TestModule_carbonapiQuery(t *testing.T) {
	var err error
	baseURL := "http://127.0.0.1:8080"

	_, filename, _, _ := runtime.Caller(0)
	testRenderFile := path.Join(path.Dir(filename), "tests", "render.txt")
	testFindFile := path.Join(path.Dir(filename), "tests", "find.txt")
	testTagsFile := path.Join(path.Dir(filename), "tests", "tags.txt")

	vu := modulestest.VU{
		RuntimeField: goja.New(),
	}
	m := New().NewModuleInstance(&vu).(*Carbonapi)
	m.ResetQueries()

	err = m.LoadQueries(testRenderFile, testFindFile, testTagsFile, baseURL)
	require.NoError(t, err)

	assert.Equal(t, q.baseURL, baseURL)

	// verify render targets
	assert.Equal(t, q.render_targets, [][]string{
		{
			"test.nginx.web1.url1_get.latencyTotal.p50",
		},
		{
			"test.nginx.web1.url2_get.latencyTotal.p50",
			"test.nginx.web2.url2_get.latencyTotal.p95",
		},
		{
			"test.nginx.web1.url3_get.latencyTotal.p50",
			"test.nginx.web2.url3_get.latencyTotal.p99",
		},
	})
	// verify find queries
	assert.Equal(t, q.find_queries, [][]string{
		{"test.%2A"},
		{"%2A.cpu", "%2A.cpu0"},
	})
	// verify tags queries
	assert.Equal(t, q.tags_queries, []string{
		"/tags/autoComplete/tags?tagPrefix=DB",
		"/tags/autoComplete/values?expr=name%3Dk8s.test-cl1.kube_%2A_labels&expr=namespace%3Dweb&tag=pod&limit=10000",
	})
}
