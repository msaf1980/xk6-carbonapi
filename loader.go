package carbonapi

import (
	"bufio"
	"errors"
	hurl "net/url"
	"os"
	"strings"

	"github.com/msaf1980/go-stringutils"
)

var randInterval int64 = (3600*24 - 1) * 10 // (1 day - 1 s) * 10

type State struct {
	pos uint64

	offset   int64 // offset (s) from now() for from
	duration int64 // duration (s) (until - from)
}

// failback to non existing interval (global)
var defaultIntervals = &State{
	offset:   0,
	duration: 3600 * 24, // 1 day
}

type queryParam struct {
	name  string
	value string
}

type tagsQuery struct {
	url    string
	params []queryParam
}

type Queries struct {
	baseURL string

	render_targets [][]string // render targets, must be encoded before put to slice
	render_state   map[string]*State

	find_queries [][]string // find queries
	find_state   *State

	tags_queries []tagsQuery // tags queries
	tags_state   *State
}

func newQueries() *Queries {
	return &Queries{
		render_targets: make([][]string, 0, 256),
		render_state:   make(map[string]*State),
		find_queries:   make([][]string, 0, 64),
		find_state:     &State{},
		tags_queries:   make([]tagsQuery, 0, 64),
		tags_state:     &State{},
	}
}

func loadRenderTargets(targetPath string) error {
	file, err := os.Open(targetPath)
	if err != nil {
		return err
	}

	scanner := bufio.NewScanner(file)
	first := true
	for scanner.Scan() {
		line := scanner.Text()
		if first {
			first = false
			if line == "target" {
				continue
			}
		}
		if strings.HasPrefix(line, "#") {
			continue
		}
		fields := strings.Split(line, "&")
		params := make([]string, 0, len(fields))
		for _, field := range fields {
			if len(field) == 0 {
				continue
			}
			if strings.HasPrefix(field, "target=") {
				target := field[7:]
				if len(target) > 0 {
					t, err := hurl.QueryUnescape(target)
					if err != nil {
						t = target
					}
					params = append(params, t)
				}
			}
		}

		if len(params) > 0 {
			q.render_targets = append(q.render_targets, params)
		}
	}
	return nil
}

func loadFindTargets(findPath string) error {
	if findPath == "" {
		return nil
	}
	file, err := os.Open(findPath)
	if err != nil {
		return err
	}

	scanner := bufio.NewScanner(file)
	first := true
	for scanner.Scan() {
		line := scanner.Text()
		if first {
			first = false
			if line == "query" {
				continue
			}
		}
		if strings.HasPrefix(line, "#") {
			continue
		}
		fields := strings.Split(line, "&")
		params := make([]string, 0, len(fields))
		for _, field := range fields {
			if len(field) == 0 {
				continue
			}
			if strings.HasPrefix(field, "query=") {
				query := field[6:]
				if len(query) > 0 {
					q, err := hurl.QueryUnescape(query)
					if err != nil {
						q = query
					}
					params = append(params, q)
				}
			}
		}
		if len(params) > 0 {
			q.find_queries = append(q.find_queries, params)
		}
	}
	return nil
}

func loadTagsTargets(tagsPath string) error {
	if tagsPath == "" {
		return nil
	}
	file, err := os.Open(tagsPath)
	if err != nil {
		return err
	}

	scanner := bufio.NewScanner(file)
	first := true
	for scanner.Scan() {
		line := scanner.Text()
		if first {
			first = false
			if line == "tags" {
				continue
			}
		}
		if strings.HasPrefix(line, "#") {
			continue
		}
		if len(line) > 0 {
			url, args, n := stringutils.Split2(line, "?")
			if n != 2 {
				return errors.New("cant extract tags url: " + line)
			}
			params := strings.Split(args, "&")
			tParams := make([]queryParam, 0, len(params))
			for _, v := range params {
				name, p, n := stringutils.Split2(v, "=")
				if n != 2 {
					return errors.New("cant extract tags param: " + v)
				}
				param, err := hurl.QueryUnescape(p)
				if err != nil {
					param = p
				}
				tParams = append(tParams, queryParam{name: name, value: param})
			}
			q.tags_queries = append(q.tags_queries, tagsQuery{url: url, params: tParams})
		}
	}
	return nil
}

func carbonapiQuery(targetPath, findPath, tagsPath, baseURL string) error {
	if baseURL == "" {
		return errors.New("base url not set")
	}
	q.baseURL = baseURL

	if err := loadRenderTargets(targetPath); err != nil {
		return err
	}
	if err := loadFindTargets(findPath); err != nil {
		return err
	}
	if err := loadTagsTargets(tagsPath); err != nil {
		return err
	}

	if len(q.render_targets) == 0 {
		return errors.New("empty file: " + targetPath)
	}

	return nil
}
