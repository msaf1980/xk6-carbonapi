package carbonapi

import (
	"bufio"
	"errors"
	"os"
	"strings"
)

type CarbonapiQuery struct {
	render *Render
}

func (b *CarbonapiQuery) Render() *Render {
	if len(b.render.targets) == 0 {
		panic(errors.New("render targets is empty"))
	}
	return b.render
}

func carbonapiQuery(path string, baseURL string) (*CarbonapiQuery, error) {
	if baseURL == "" {
		return nil, errors.New("base url not set")
	}
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	q := &CarbonapiQuery{render: newRender(baseURL, nil)}

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
		var typ string
		params := make([]string, 0, 1)
		for _, field := range fields {
			if len(field) == 0 {
				continue
			}
			if strings.HasPrefix(field, "target=") {
				if typ == "" {
					typ = "target"
				}
				target := field[7:]
				if len(target) > 0 {
					params = append(params, target)
				}
			}
		}

		if len(params) > 0 {
			switch typ {
			case "target":
				q.render.targets = append(q.render.targets, params)
			}
		}
	}

	if len(q.render.targets) == 0 {
		return nil, errors.New("empty file: " + path)
	}

	return q, nil
}
