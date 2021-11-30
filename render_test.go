// This is a PoC/illustrative code to show how to share a single integer that goes up in k6 on a
// single instance

package carbonapi

import (
	"fmt"
	"testing"
)

func TestRender_NextGetJSON(t *testing.T) {
	randInterval = 1 // avoid flapping random from/until

	baseURL := "http://127.0.0.1:8080"

	r := newRender(baseURL,
		[][]string{
			{"test1.*"},
			{"test2.*", "test3.*.test4"},
		},
	)

	r.AddIntervalGroup("1 Hour (0)", 3600, 0)
	r.AddIntervalGroup("1 Hour (7d)", 3600, 3600*24*7)
	r.AddIntervalGroup("2 Hours (7d)", 3600*2, 3600*24*7)

	tests := []struct {
		name string
		want string
	}{
		{name: "1 Hour (0)", want: baseURL + "/render/?format=json&from=-3600s&until=now&target=test1.*"},
		{name: "1 Hour (7d)", want: baseURL + "/render/?format=json&from=-608400s&until=-604800s&target=test1.*"},
		{name: "1 Hour (0)", want: baseURL + "/render/?format=json&from=-3600s&until=now&target=test2.*&target=test3.*.test4"},
		{name: "2 Hours (7d)", want: baseURL + "/render/?format=json&from=-612000s&until=-604800s&target=test1.*"},
		{name: "2 Hours (7d)", want: baseURL + "/render/?format=json&from=-612000s&until=-604800s&target=test2.*&target=test3.*.test4"},
	}
	for n, tt := range tests {
		t.Run(fmt.Sprintf("(%d) %s", n, tt.name), func(t *testing.T) {
			got, err := r.NextGetJSON(tt.name)
			if err != nil {
				t.Errorf("Render.NextGetJSON(\"%s\") got error '%v'", tt.name, err)
			} else if got != tt.want {
				t.Errorf("Render.NextGetJSON(\"%s\") got\n'%s'\nbut want\n'%s'", tt.name, got, tt.want)
			}

		})
	}
}
