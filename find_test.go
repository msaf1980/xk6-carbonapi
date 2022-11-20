// This is a PoC/illustrative code to show how to share a single integer that goes up in k6 on a
// single instance

package carbonapi

import (
	"fmt"
	"testing"
	"time"

	"github.com/dop251/goja"
	pb_v3 "github.com/go-graphite/protocol/carbonapi_v3_pb"
	"github.com/stretchr/testify/assert"
	"go.k6.io/k6/js/modulestest"
)

func TestRender_FindNextGetJSON(t *testing.T) {
	randInterval = 1 // avoid flapping random from/until

	baseURL := "http://127.0.0.1:8080"

	m := New().NewModuleInstance(nil).(*Carbonapi)
	m.ResetQueries()
	q.baseURL = baseURL
	q.find_queries = [][]string{
		{"test1.*"},
		{"test2.*", "test3.*.test4"},
	}

	tests := []struct {
		wantURL  string
		wantName string
	}{
		{
			wantURL:  baseURL + "/metrics/find?format=json&query=test1.*",
			wantName: "/metrics/find?format=json&query=test1.*",
		},
		{
			wantURL:  baseURL + "/metrics/find?format=json&query=test2.*&query=test3.*.test4",
			wantName: "/metrics/find?format=json&query=test2.*&query=test3.*.test4",
		},
		{
			wantURL:  baseURL + "/metrics/find?format=json&query=test1.*",
			wantName: "/metrics/find?format=json&query=test1.*",
		},
	}
	for n, tt := range tests {
		t.Run(fmt.Sprintf("[%d]", n), func(t *testing.T) {
			gotURL, gotName, err := m.FindNextGet("find", "json", 0)
			if err != nil {
				t.Errorf("Carbonapi.FindNextGet(\"%s\", \"json\") got error '%v'", "find", err)
			} else {
				if gotURL != tt.wantURL {
					t.Errorf("Carbonapi.FindNextGet(\"%s\", \"json\").url got\n'%s'\nbut want\n'%s'", "find", gotURL, tt.wantURL)
				}
				if gotName != tt.wantName+"&label=find" {
					t.Errorf("Carbonapi.FindNextGet(\"%s\", \"json\").name got\n'%s'\nbut want\n'%s'", "find", gotName, tt.wantName+"&label=find")
				}
			}
		})
	}
}

func TestRender_FindNext_pb_v3(t *testing.T) {
	vu := modulestest.VU{
		RuntimeField: goja.New(),
	}
	randInterval = 1 // avoid flapping random from/until
	timeNow = func() time.Time {
		return time.Unix(1668857316, 0)
	}
	defer func() {
		timeNow = time.Now
	}()

	baseURL := "http://127.0.0.1:8080"

	m := New().NewModuleInstance(&vu).(*Carbonapi)
	m.ResetQueries()
	q.baseURL = baseURL
	q.find_queries = [][]string{
		{"test1.*"},
		{"test2.*", "test3.*.test4"},
	}

	tests := []struct {
		wantURL     string
		wantName    string
		wantGlobReq pb_v3.MultiGlobRequest
	}{
		{
			wantURL:  baseURL + "/metrics/find?format=carbonapi_v3_pb",
			wantName: "/metrics/find?format=carbonapi_v3_pb&query=test1.*",
			wantGlobReq: pb_v3.MultiGlobRequest{
				Metrics: []string{"test1.*"},
			},
		},
		{
			wantURL:  baseURL + "/metrics/find?format=carbonapi_v3_pb",
			wantName: "/metrics/find?format=carbonapi_v3_pb&query=test2.*&query=test3.*.test4",
			wantGlobReq: pb_v3.MultiGlobRequest{
				Metrics: []string{"test2.*", "test3.*.test4"},
			},
		},
		{
			wantURL:  baseURL + "/metrics/find?format=carbonapi_v3_pb",
			wantName: "/metrics/find?format=carbonapi_v3_pb&query=test1.*",
			wantGlobReq: pb_v3.MultiGlobRequest{
				Metrics: []string{"test1.*"},
			},
		},
	}
	for n, tt := range tests {
		t.Run(fmt.Sprintf("[%d]", n), func(t *testing.T) {
			gotURL, gotName, reqBody, err := m.FindNextPb_v3("find", "carbonapi_v3_pb", 0)
			if err != nil {
				t.Errorf("Carbonapi.FindNextPb_v3(\"%s\") got error '%v'", "find", err)
			} else {
				if gotURL != tt.wantURL {
					t.Errorf("Carbonapi.FindNextPb_v3(\"%s\").url got\n'%s'\nbut want\n'%s'", "find", gotURL, tt.wantURL)
				}
				if gotName != tt.wantName+"&label=find" {
					t.Errorf("Carbonapi.RenderNextPb_v3(\"%s\").name got\n'%s'\nbut want\n'%s'", "find", gotName, tt.wantName+"&label=find")
				}
				if gotFetchReq, err := m.DecodeFindReqPb_v3(reqBody); err == nil {
					assert.Equal(t, tt.wantGlobReq, *gotFetchReq, "Carbonapi.RenderNextPb_v3(\"%s\").reqBody", "find")
				} else {
					t.Errorf("Carbonapi.RenderNextPb_v3(\"%s\").reqBody error = %v", "find", err)
				}

			}
		})
	}
}
