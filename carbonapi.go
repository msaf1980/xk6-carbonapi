package carbonapi

import (
	"errors"
	"fmt"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"

	"github.com/dop251/goja"
	pb_v3 "github.com/go-graphite/protocol/carbonapi_v3_pb"
	"github.com/msaf1980/go-stringutils"
	"go.k6.io/k6/js/modules"
)

var (
	q           *CarbonapiQuery
	loadPath    string
	loadBaseUrl string
	loadErr     error
	loadLock    sync.Mutex
)

type Carbonapi struct {
	vu modules.VU
}

// Exports returns the exports of the execution module.
func (c *Carbonapi) Exports() modules.Exports {
	return modules.Exports{
		Named: map[string]interface{}{
			"loadQueries":            c.LoadQueries,
			"renderAddIntervalGroup": c.RenderAddIntervalGroup,
			"renderNextGet":          c.RenderNextGet,
			"renderNextPb_v3":        c.RenderNextPb_v3,
			"decodeRenderReqPb_v3":   c.DecodeRenderReqPb_v3,
		},
	}
}

// LoadQueries load render queries from file
func (c *Carbonapi) LoadQueries(path, baseURL string) error {
	loadLock.Lock()
	defer loadLock.Unlock()
	if loadErr == nil {
		// load once
		if loadPath == "" {
			loadPath = path
			loadBaseUrl = baseURL
			q, loadErr = carbonapiQuery(path, baseURL)
		} else if loadPath != path || loadBaseUrl != baseURL {
			loadErr = errors.New("queries can load once")
		}
	}

	return loadErr
}

// RenderAddIntervalGroup add group (call on startup)
func (c *Carbonapi) RenderAddIntervalGroup(group string, duration, offset int64) error {
	loadLock.Lock()
	defer loadLock.Unlock()
	if g, exist := q.render.intervals[group]; exist {
		if offset == g.offset && duration == g.duration {
			return nil
		}
		return errors.New("group " + group + "can load once")
	}
	q.render.intervals[group] = &RenderState{duration: duration, offset: offset}
	return nil
}

func (c *Carbonapi) RenderNextGet(group, format string, offset int64) (url string, label string, err error) {
	s, ok := q.render.intervals[group]
	if !ok {
		return "", "", fmt.Errorf("group not found: %s in %+v", group, q.render.intervals)
	}

	until := rand.Int63n(randInterval)/10 + s.offset // random in day range with offset
	from := until + s.duration

	pos := int64((atomic.AddUint64(&s.pos, 1) + uint64(offset) - 1) % uint64(len(q.render.targets)))
	targets := q.render.targets[pos]

	var sb stringutils.Builder
	sb.Grow(512)
	sb.WriteString(q.render.baseURL)
	start := sb.Len()
	sb.WriteString("/render/")
	sb.WriteString("?format=")
	sb.WriteString(format)
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

	url = sb.String()
	label = url[start:end] + "&label=" + group

	return
}

func req_pb_v3(r *goja.Runtime, targets []string, from, until int64) (reqBody *goja.ArrayBuffer, err error) {
	multiFetchRequest := pb_v3.MultiFetchRequest{
		Metrics: make([]pb_v3.FetchRequest, 0, len(targets)),
	}
	for _, target := range targets {
		multiFetchRequest.Metrics = append(multiFetchRequest.Metrics, pb_v3.FetchRequest{
			Name:           target,
			PathExpression: target,
			StartTime:      from,
			StopTime:       until,
		})
	}
	var bytes []byte
	bytes, err = multiFetchRequest.Marshal()
	if err == nil {
		b := r.NewArrayBuffer(bytes)
		reqBody = &b
	}
	return
}

var timeNow func() time.Time = time.Now

func (c *Carbonapi) RenderNextPb_v3(group, format string, offset int64) (url string, name string, reqBody *goja.ArrayBuffer, err error) {
	s, ok := q.render.intervals[group]
	if !ok {
		return "", "", nil, fmt.Errorf("group not found: %s in %+v", group, q.render.intervals)
	}

	until := timeNow().Unix() - rand.Int63n(randInterval)/10 - s.offset // random in day range with offset
	from := until - s.duration

	pos := int64((atomic.AddUint64(&s.pos, 1) + uint64(offset) - 1) % uint64(len(q.render.targets)))
	targets := q.render.targets[pos]

	var sb stringutils.Builder
	sb.Grow(512)
	sb.WriteString(q.render.baseURL)
	start := sb.Len()
	sb.WriteString("/render/")
	sb.WriteString("?format=")
	sb.WriteString(format)
	qEnd := sb.Len()
	for _, target := range targets {
		sb.WriteString("&target=")
		sb.WriteString(target)
	}
	sb.WriteString("&label=")
	sb.WriteString(group)

	q := sb.String()
	url = q[:qEnd]
	name = q[start:]

	reqBody, err = req_pb_v3(c.vu.Runtime(), targets, from, until)

	return
}

func (c *Carbonapi) DecodeRenderReqPb_v3(reqBody *goja.ArrayBuffer) (req *pb_v3.MultiFetchRequest, err error) {
	req = &pb_v3.MultiFetchRequest{}
	if err = req.Unmarshal(reqBody.Bytes()); err != nil {
		return
	}
	return
}
