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

func TestRender_RenderNextGetJSON(t *testing.T) {
	randInterval = 1 // avoid flapping random from/until

	baseURL := "http://127.0.0.1:8080"

	m := New().NewModuleInstance(nil).(*Carbonapi)
	q = &CarbonapiQuery{}
	q.render = newRender(baseURL,
		[][]string{
			{"test1.*"},
			{"test2.*", "test3.*.test4"},
		},
	)

	m.RenderAddIntervalGroup("1 Hour (0)", 3600, 0)
	m.RenderAddIntervalGroup("7 Days (1h)", 3600*24*7, 3600)
	m.RenderAddIntervalGroup("7 Days (2h)", 3600*24*7, 3600*2)

	tests := []struct {
		name     string
		wantURL  string
		wantName string
	}{
		{
			name:     "1 Hour (0)",
			wantURL:  baseURL + "/render/?format=json&target=test1.*&from=-3600s&until=now",
			wantName: "/render/?format=json&target=test1.*",
		},
		{
			name:     "7 Days (1h)",
			wantURL:  baseURL + "/render/?format=json&target=test1.*&from=-608400s&until=-3600s",
			wantName: "/render/?format=json&target=test1.*",
		},
		{
			name:     "1 Hour (0)",
			wantURL:  baseURL + "/render/?format=json&target=test2.*&target=test3.*.test4&from=-3600s&until=now",
			wantName: "/render/?format=json&target=test2.*&target=test3.*.test4",
		},
		{
			name:     "7 Days (2h)",
			wantURL:  baseURL + "/render/?format=json&target=test1.*&from=-612000s&until=-7200s",
			wantName: "/render/?format=json&target=test1.*",
		},
		{
			name:     "7 Days (2h)",
			wantURL:  baseURL + "/render/?format=json&target=test2.*&target=test3.*.test4&from=-612000s&until=-7200s",
			wantName: "/render/?format=json&target=test2.*&target=test3.*.test4",
		},
	}
	for n, tt := range tests {
		t.Run(fmt.Sprintf("[%d] %s", n, tt.name), func(t *testing.T) {
			gotURL, gotName, err := m.RenderNextGet(tt.name, "json", 0)
			if err != nil {
				t.Errorf("Render.RenderNextGet(\"%s\", \"json\") got error '%v'", tt.name, err)
			} else {
				if gotURL != tt.wantURL {
					t.Errorf("Render.RenderNextGet(\"%s\", \"json\").url got\n'%s'\nbut want\n'%s'", tt.name, gotURL, tt.wantURL)
				}
				if gotName != tt.wantName+"&label="+tt.name {
					t.Errorf("Render.RenderNextGet(\"%s\", \"json\").name got\n'%s'\nbut want\n'%s'", tt.name, gotName, tt.wantName+"&label="+tt.name)
				}
			}
		})
	}
}

func TestRender_RenderNext_pb_v3(t *testing.T) {
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
	q = &CarbonapiQuery{}
	q.render = newRender(baseURL,
		[][]string{
			{"test1.*"},
			{"test2.*", "test3.*.test4"},
		},
	)
	m.RenderAddIntervalGroup("1 Hour (0)", 3600, 0)
	m.RenderAddIntervalGroup("7 Days (1h)", 3600*24*7, 3600)
	m.RenderAddIntervalGroup("7 Days (2h)", 3600*24*7, 3600*2)

	tests := []struct {
		name         string
		wantURL      string
		wantName     string
		wantFetchReq pb_v3.MultiFetchRequest
	}{
		{
			name:    "1 Hour (0)",
			wantURL: baseURL + "/render/?format=carbonapi_v3_pb",
			// &target=test1.*&from=-3600s&until=now",
			wantName: "/render/?format=carbonapi_v3_pb&target=test1.*",
			wantFetchReq: pb_v3.MultiFetchRequest{
				Metrics: []pb_v3.FetchRequest{
					{
						Name:           "test1.*",
						StartTime:      1668857316 - 3600,
						StopTime:       1668857316,
						PathExpression: "test1.*",
					},
				},
			},
		},
		{
			name:     "7 Days (1h)",
			wantURL:  baseURL + "/render/?format=carbonapi_v3_pb",
			wantName: "/render/?format=carbonapi_v3_pb&target=test1.*",
			wantFetchReq: pb_v3.MultiFetchRequest{
				Metrics: []pb_v3.FetchRequest{
					{
						Name:           "test1.*",
						StartTime:      1668857316 - 3600*24*7 - 3600,
						StopTime:       1668857316 - 3600,
						PathExpression: "test1.*",
					},
				},
			},
		},
		{
			name:    "1 Hour (0)",
			wantURL: baseURL + "/render/?format=carbonapi_v3_pb",
			// &target=test2.*&target=test3.*.test4&from=-3600s&until=now",
			wantName: "/render/?format=carbonapi_v3_pb&target=test2.*&target=test3.*.test4",
			wantFetchReq: pb_v3.MultiFetchRequest{
				Metrics: []pb_v3.FetchRequest{
					{
						Name:           "test2.*",
						StartTime:      1668857316 - 3600,
						StopTime:       1668857316,
						PathExpression: "test2.*",
					},
					{
						Name:           "test3.*.test4",
						StartTime:      1668857316 - 3600,
						StopTime:       1668857316,
						PathExpression: "test3.*.test4",
					},
				},
			},
		},
		{
			name:     "7 Days (2h)",
			wantURL:  baseURL + "/render/?format=carbonapi_v3_pb",
			wantName: "/render/?format=carbonapi_v3_pb&target=test1.*",
			wantFetchReq: pb_v3.MultiFetchRequest{
				Metrics: []pb_v3.FetchRequest{
					{
						Name:           "test1.*",
						StartTime:      1668857316 - 3600*24*7 - 3600*2,
						StopTime:       1668857316 - 3600*2,
						PathExpression: "test1.*",
					},
				},
			},
		},
		{
			name:     "7 Days (2h)",
			wantURL:  baseURL + "/render/?format=carbonapi_v3_pb",
			wantName: "/render/?format=carbonapi_v3_pb&target=test2.*&target=test3.*.test4",
			wantFetchReq: pb_v3.MultiFetchRequest{
				Metrics: []pb_v3.FetchRequest{
					{
						Name:           "test2.*",
						StartTime:      1668857316 - 3600*24*7 - 3600*2,
						StopTime:       1668857316 - 3600*2,
						PathExpression: "test2.*",
					},
					{
						Name:           "test3.*.test4",
						StartTime:      1668857316 - 3600*24*7 - 3600*2,
						StopTime:       1668857316 - 3600*2,
						PathExpression: "test3.*.test4",
					},
				},
			},
		},
	}
	for n, tt := range tests {
		t.Run(fmt.Sprintf("[%d] %s", n, tt.name), func(t *testing.T) {
			gotURL, gotName, reqBody, err := m.RenderNextPb_v3(tt.name, "carbonapi_v3_pb", 0)
			if err != nil {
				t.Errorf("Render.RenderNextPb_v3(\"%s\") got error '%v'", tt.name, err)
			} else {
				if gotURL != tt.wantURL {
					t.Errorf("Render.RenderNextPb_v3(\"%s\").url got\n'%s'\nbut want\n'%s'", tt.name, gotURL, tt.wantURL)
				}
				if gotName != tt.wantName+"&label="+tt.name {
					t.Errorf("Render.RenderNextPb_v3(\"%s\").name got\n'%s'\nbut want\n'%s'", tt.name, gotName, tt.wantName+"&label="+tt.name)
				}
				if gotFetchReq, err := m.DecodeRenderReqPb_v3(reqBody); err == nil {
					assert.Equal(t, tt.wantFetchReq, *gotFetchReq, "Render.RenderNextPb_v3(\"%s\").reqBody", tt.name)
				} else {
					t.Errorf("Render.RenderNextPb_v3(\"%s\").reqBody error = %v", tt.name, err)
				}

			}
		})
	}
}
