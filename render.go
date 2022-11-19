// This is a PoC/illustrative code to show how to share a single integer that goes up in k6 on a
// single instance

package carbonapi

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
