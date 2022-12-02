package carbonapi

import (
	"errors"
	"fmt"
	"math/rand"
	hurl "net/url"
	"sync"
	"sync/atomic"
	"time"

	"github.com/dop251/goja"
	pb_v3 "github.com/go-graphite/protocol/carbonapi_v3_pb"
	"github.com/msaf1980/go-stringutils"
	"go.k6.io/k6/js/modules"
)

var (
	q              *Queries = newQueries()
	loadTargetPath string
	loadFindPath   string
	loadTagsPath   string
	loadErr        error
	loadLock       sync.Mutex
)

type Carbonapi struct {
	vu modules.VU
}

// Exports returns the exports of the execution module.
func (c *Carbonapi) Exports() modules.Exports {
	return modules.Exports{
		Named: map[string]interface{}{
			"loadQueries":            c.LoadQueries,
			"sizeQueries":            c.SizeQueries,
			"renderAddIntervalGroup": c.RenderAddIntervalGroup,
			"renderNextGet":          c.RenderNextGet,
			"renderNextPb_v3":        c.RenderNextPb_v3,
			"decodeRenderReqPb_v3":   c.DecodeRenderReqPb_v3,
			"findNextGet":            c.FindNextGet,
			"findNextPb_v3":          c.FindNextPb_v3,
			"decodeFindReqPb_v3":     c.DecodeFindReqPb_v3,
			"tagsNextGet":            c.TagsNextGet,
		},
	}
}

// LoadQueries load render queries from file
func (c *Carbonapi) LoadQueries(targetPath, findPath, tagsPath, baseURL string) error {
	loadLock.Lock()
	defer loadLock.Unlock()
	if loadErr == nil {
		// load once
		if loadTargetPath == "" {
			loadTargetPath = targetPath
			loadFindPath = findPath
			loadTagsPath = tagsPath
			loadErr = carbonapiQuery(targetPath, findPath, tagsPath, baseURL)
		} else if loadTargetPath != targetPath || loadFindPath != findPath ||
			loadTagsPath != tagsPath || q.baseURL != baseURL {
			loadErr = errors.New("queries can load once")
		}
	}

	return loadErr
}

func (c *Carbonapi) SizeQueries() (int, int, int) {
	return len(q.render_targets), len(q.find_queries), len(q.tags_queries)
}

// ResetQueries load render queries from file
func (c *Carbonapi) ResetQueries() {
	loadLock.Lock()
	defer loadLock.Unlock()

	loadErr = nil
	loadTargetPath = ""
	loadFindPath = ""
	loadTagsPath = ""
	q = newQueries()
}

// RenderAddIntervalGroup add group (call on startup)
func (c *Carbonapi) RenderAddIntervalGroup(group string, duration, offset int64) error {
	loadLock.Lock()
	defer loadLock.Unlock()
	if g, exist := q.render_state[group]; exist {
		if offset == g.offset && duration == g.duration {
			return nil
		}
		return errors.New("group " + group + "can load once")
	}
	q.render_state[group] = &State{duration: duration, offset: offset}
	return nil
}

func renderName(group, format string, targets []string) string {
	var sb stringutils.Builder
	sb.Grow(512)
	sb.WriteString("render format=")
	sb.WriteString(format)
	for _, target := range targets {
		sb.WriteString(" target=")
		sb.WriteString(target)
	}
	sb.WriteString(" label=")
	sb.WriteString(group)

	return sb.String()
}

func (c *Carbonapi) RenderNextGet(group, format string, offset int64) (url string, name string, err error) {
	s, ok := q.render_state[group]
	if !ok {
		return "", "", fmt.Errorf("group not found: %s in %+v", group, q.render_state)
	}

	until := rand.Int63n(randInterval)/10 + s.offset // random in day range with offset
	from := until + s.duration

	pos := (atomic.AddUint64(&s.pos, 1) + uint64(offset) - 1) % uint64(len(q.render_targets))
	targets := q.render_targets[pos]

	var sb stringutils.Builder
	sb.Grow(512)
	sb.WriteString(q.baseURL)
	sb.WriteString("/render/?format=")
	sb.WriteString(format)
	for _, target := range targets {
		sb.WriteString("&target=")
		sb.WriteString(hurl.QueryEscape(target))
	}
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
	name = renderName(group, format, targets)

	return
}

func req_render_pb_v3(r *goja.Runtime, targets []string, from, until int64) (reqBody *goja.ArrayBuffer, err error) {
	req := pb_v3.MultiFetchRequest{
		Metrics: make([]pb_v3.FetchRequest, 0, len(targets)),
	}
	for _, target := range targets {
		req.Metrics = append(req.Metrics, pb_v3.FetchRequest{
			Name:           target,
			PathExpression: target,
			StartTime:      from,
			StopTime:       until,
		})
	}
	var bytes []byte
	bytes, err = req.Marshal()
	if err == nil {
		b := r.NewArrayBuffer(bytes)
		reqBody = &b
	}
	return
}

var timeNow func() time.Time = time.Now

func (c *Carbonapi) RenderNextPb_v3(group, format string, offset int64) (url string, name string, reqBody *goja.ArrayBuffer, err error) {
	s, ok := q.render_state[group]
	if !ok {
		return "", "", nil, fmt.Errorf("group not found: %s in %+v", group, q.render_state)
	}

	until := timeNow().Unix() - rand.Int63n(randInterval)/10 - s.offset // random in day range with offset
	from := until - s.duration

	pos := (atomic.AddUint64(&s.pos, 1) + uint64(offset) - 1) % uint64(len(q.render_targets))
	targets := q.render_targets[pos]

	var sb stringutils.Builder
	sb.Grow(512)
	sb.WriteString(q.baseURL)
	sb.WriteString("/render/?format=")
	sb.WriteString(format)

	url = sb.String()
	name = renderName(group, format, targets)

	reqBody, err = req_render_pb_v3(c.vu.Runtime(), targets, from, until)

	return
}

func (c *Carbonapi) DecodeRenderReqPb_v3(reqBody *goja.ArrayBuffer) (req *pb_v3.MultiFetchRequest, err error) {
	req = &pb_v3.MultiFetchRequest{}
	if err = req.Unmarshal(reqBody.Bytes()); err != nil {
		return
	}
	return
}

func findName(group, format string, queries []string) string {
	var sb stringutils.Builder
	sb.Grow(512)
	sb.WriteString("metrics/find format=")
	sb.WriteString(format)
	for _, query := range queries {
		sb.WriteString(" query=")
		sb.WriteString(query)
	}
	sb.WriteString(" label=")
	sb.WriteString(group)

	return sb.String()
}

func (c *Carbonapi) FindNextGet(group, format string, offset int64) (url string, name string, err error) {
	pos := (atomic.AddUint64(&q.find_state.pos, 1) + uint64(offset) - 1) % uint64(len(q.find_queries))
	queries := q.find_queries[pos]

	var sb stringutils.Builder
	sb.Grow(512)
	sb.WriteString(q.baseURL)
	sb.WriteString("/metrics/find/?format=")
	sb.WriteString(format)
	for _, query := range queries {
		sb.WriteString("&query=")
		sb.WriteString(hurl.PathEscape(query))
	}

	url = sb.String()
	name = findName(group, format, queries)

	return
}

func req_find_pb_v3(r *goja.Runtime, queries []string) (reqBody *goja.ArrayBuffer, err error) {
	req := pb_v3.MultiGlobRequest{
		Metrics: queries,
	}
	var bytes []byte
	bytes, err = req.Marshal()
	if err == nil {
		b := r.NewArrayBuffer(bytes)
		reqBody = &b
	}
	return
}

func (c *Carbonapi) FindNextPb_v3(group, format string, offset int64) (url string, name string, reqBody *goja.ArrayBuffer, err error) {
	pos := (atomic.AddUint64(&q.find_state.pos, 1) + uint64(offset) - 1) % uint64(len(q.find_queries))
	queries := q.find_queries[pos]

	var sb stringutils.Builder
	sb.Grow(512)
	sb.WriteString(q.baseURL)
	sb.WriteString("/metrics/find/?format=")
	sb.WriteString(format)

	url = sb.String()
	name = findName(group, format, queries)

	reqBody, err = req_find_pb_v3(c.vu.Runtime(), queries)

	return
}

func (c *Carbonapi) DecodeFindReqPb_v3(reqBody *goja.ArrayBuffer) (req *pb_v3.MultiGlobRequest, err error) {
	req = &pb_v3.MultiGlobRequest{}
	if err = req.Unmarshal(reqBody.Bytes()); err != nil {
		return
	}
	return
}

func tagsName(group, format string, query tagsQuery) string {
	var sb stringutils.Builder
	sb.Grow(512)
	// strp /from start
	sb.WriteString(query.url[1:])
	sb.WriteString(" format=")
	sb.WriteString(format)
	for _, param := range query.params {
		sb.WriteString(" ")
		sb.WriteString(param.name)
		sb.WriteString("='")
		sb.WriteString(param.value)
		sb.WriteRune('\'')
	}
	sb.WriteString(" label=")
	sb.WriteString(group)

	return sb.String()
}

func (c *Carbonapi) TagsNextGet(group, format string, offset int64) (url string, name string, err error) {
	pos := (atomic.AddUint64(&q.tags_state.pos, 1) + uint64(offset) - 1) % uint64(len(q.tags_queries))
	query := q.tags_queries[pos]

	var sb stringutils.Builder
	sb.Grow(512)
	sb.WriteString(q.baseURL)
	sb.WriteString(query.url)
	for i, param := range query.params {
		if i == 0 {
			sb.WriteRune('?')
		} else {
			sb.WriteRune('&')
		}
		sb.WriteString(param.name)
		sb.WriteRune('=')
		sb.WriteString(hurl.QueryEscape(param.value))
	}

	url = sb.String()
	name = tagsName(group, format, query)

	return
}
