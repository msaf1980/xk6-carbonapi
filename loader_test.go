package carbonapi

import (
	"path"
	"runtime"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestModule_carbonapiQuery(t *testing.T) {
	baseURL := "http://127.0.0.1:8080"

	_, filename, _, _ := runtime.Caller(0)
	testFile := path.Join(path.Dir(filename), "tests", "carbonapi.txt")

	q, err := carbonapiQuery(testFile, baseURL)
	require.NoError(t, err)

	render := q.Render()

	assert.Equal(t, render.baseURL, baseURL)

	// verify render targets
	assert.Equal(t, render.targets, [][]string{
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
}
