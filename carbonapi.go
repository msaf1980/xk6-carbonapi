package carbonapi

import (
	"errors"
	"fmt"
	"math/rand"
	"sync"
	"sync/atomic"

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
			// "encode_pb_v3": c.encodePb_V3,
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

func (c *Carbonapi) RenderNextGet(group, format string, offset int64) (string, string, error) {
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
	sb.WriteString("/render/?format=")
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

	url := sb.String()

	return url, url[start:end] + "&label=" + group, nil
}

// // randomBytes returns random data of the given size.
// func (c *Crypto) randomBytes(size int) (*goja.ArrayBuffer, error) {
// 	if size < 1 {
// 		return nil, errors.New("invalid size")
// 	}
// 	bytes := make([]byte, size)
// 	_, err := rand.Read(bytes)
// 	if err != nil {
// 		return nil, err
// 	}
// 	ab := c.vu.Runtime().NewArrayBuffer(bytes)
// 	return &ab, nil
// }

// // md4 returns the MD4 hash of input in the given encoding.
// func (c *Crypto) md4(input interface{}, outputEncoding string) (interface{}, error) {
// 	hasher := c.createHash("md4")
// 	hasher.Update(input)
// 	return hasher.Digest(outputEncoding)
// }
