// This is a PoC/illustrative code to show how to share a single integer that goes up in k6 on a
// single instance

package carbonapi

import (
	"fmt"
	"testing"
)

func TestRender_TagsNextGet(t *testing.T) {
	randInterval = 1 // avoid flapping random from/until

	baseURL := "http://127.0.0.1:8080"

	m := New().NewModuleInstance(nil).(*Carbonapi)
	m.ResetQueries()
	q.baseURL = baseURL
	q.tags_queries = []tagsQuery{
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
	}

	tests := []struct {
		wantURL  string
		wantName string
	}{
		{
			wantURL:  baseURL + "/tags/autoComplete/tags?tagPrefix=DB",
			wantName: `tags/autoComplete/tags format=json tagPrefix='DB'`,
		},
		{
			wantURL:  baseURL + "/tags/autoComplete/values?expr=name%3Dk8s.test-cl1.kube_%2A_labels&expr=namespace%3Dweb&tag=pod&limit=10000",
			wantName: `tags/autoComplete/values format=json expr='name=k8s.test-cl1.kube_*_labels' expr='namespace=web' tag='pod' limit='10000'`,
		},
		{
			wantURL:  baseURL + "/tags/autoComplete/tags?tagPrefix=DB",
			wantName: `tags/autoComplete/tags format=json tagPrefix='DB'`,
		},
	}
	for n, tt := range tests {
		t.Run(fmt.Sprintf("[%d]", n), func(t *testing.T) {
			gotURL, gotName, err := m.TagsNextGet("tags", "json", 0)
			if err != nil {
				t.Errorf("Carbonapi.TagsNextGet(\"%s\", \"json\") got error '%v'", "find", err)
			} else {
				if gotURL != tt.wantURL {
					t.Errorf("Carbonapi.TagsNextGet(\"%s\", \"json\").url got\n'%s'\nbut want\n'%s'", "tags", gotURL, tt.wantURL)
				}
				// wantName := tt.wantName + " label=tags"
				if gotName != tt.wantName {
					t.Errorf("Carbonapi.TagsNextGet(\"%s\", \"json\").name got\n'%s'\nbut want\n'%s'", "tags", gotName, tt.wantName)
				}
			}
		})
	}
}
