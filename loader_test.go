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
	assert.Equal(t, [][]string{
		{
			"test.nginx.web*.url1_get.latencyTotal.p50",
		},
		{
			"test.nginx.web1.url2_get.latencyTotal.p50",
			"test.nginx.web2.url2_get.latencyTotal.p95",
		},
		{
			"test.nginx.web1.url3_get.latencyTotal.p50",
			"test.nginx.web2.url3_get.latencyTotal.p99",
		},
	}, q.render_targets)
	// verify find queries
	assert.Equal(t, [][]string{
		{"test.*"},
		{"*.cpu", "*.cpu0"},
	}, q.find_queries)
	// verify tags queries
	assert.Equal(t, []tagsQuery{
		{
			url: "/tags/autoComplete/tags",
			params: []queryParam{
				{name: "tagPrefix", value: "DB"},
			},
		},
		{
			url: "/tags/autoComplete/values",
			params: []queryParam{
				{name: "expr", value: "name=k8s.test-cl1.kube_*_labels"},
				{name: "expr", value: "namespace=web"},
				{name: "tag", value: "pod"},
				{name: "limit", value: "10000"},
			},
		},
	}, q.tags_queries)
}
