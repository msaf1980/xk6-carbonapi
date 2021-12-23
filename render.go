// This is a PoC/illustrative code to show how to share a single integer that goes up in k6 on a
// single instance

package carbonapi

import (
	"fmt"
	"math/rand"
	"sync/atomic"

	stringutils "github.com/msaf1980/go-stringutils"
)

var randInterval int64 = (3600*24 - 1) * 10 // (1 day - 1 s) * 10

type RenderState struct {
	pos uint64

	offset   int64 // offset (s) from now() for from
	duration int64 // duration (s) (until - from)
}

// failback to non existing interval (global)
var defaultIntervals = &RenderState{
	offset:   0,
	duration: 3600 * 24, // 1 day
}

type Render struct {
	baseURL string
	targets [][]string // targets, must be encoded before put to slice

	intervals map[string]*RenderState
}

func newRender(baseURL string, targets [][]string) *Render {
	return &Render{baseURL: baseURL, targets: targets, intervals: make(map[string]*RenderState)}
}

func (m *Module) RenderAddIntervalGroup(group string, duration, offset int64) {
	m.q.render.intervals[group] = &RenderState{duration: duration, offset: offset}
}

func (m *Module) RenderNextGetJSON(group string, offset int64) (string, string, error) {
	s, ok := m.q.render.intervals[group]
	if !ok {
		return "", "", fmt.Errorf("group not found: %s in %+v", group, m.q.render.intervals)
	}

	until := rand.Int63n(randInterval)/10 + s.offset // random in day range with offset
	from := until + s.duration

	pos := int64((atomic.AddUint64(&s.pos, 1) + uint64(offset) - 1) % uint64(len(m.q.render.targets)))
	targets := m.q.render.targets[pos]

	var sb stringutils.Builder
	sb.Grow(512)
	sb.WriteString(m.q.render.baseURL)
	start := sb.Len()
	sb.WriteString("/render/?format=json")
	for _, target := range targets {
		sb.WriteString("&target=")
		sb.WriteString(target)
	}
	end := sb.Len()
	sb.WriteString("&from=-")
	sb.WriteInt(from, 10)
	if until > 0 {
		sb.WriteString("s&until=-")
		sb.WriteInt(until, 10)
		sb.WriteString("s")
	} else {
		sb.WriteString("s&until=now")
	}

	url := sb.String()

	return url, url[start:end] + "&label=" + group, nil
}
