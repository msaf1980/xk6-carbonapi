#!/usr/bin/python3

# Extract queries from graphite-clickhouse logs

import argparse
import os
import sys
import re
import json
import time
import dateutil.parser
from datetime import datetime
from datetime import timedelta

if sys.version_info >= (3, 3):
    import urllib.parse as urlparse
    quote = urlparse.quote

    def timestamp(dt):
        return dt.timestamp()
else:
    import urlparse
    import urllib
    quote = urllib.quote

    def timestamp(dt):
        return time.mktime(dt.timetuple())


from_p = re.compile('from=[0-9]+')
until_p = re.compile('until=[0-9]+')
now_p = re.compile('now=[0-9]+')

class URLStat:
    def __init__(self, url, time_from, time_until):
        self.url = url
        self.count = 1
        self.time_from = time_from
        self.time_until = time_until


def diff(x, y):
    if x is None:
        x = 0
    if y is None:
        y = 0
    return x - y


def urlstat_compare(x, y):
    return diff(x.time_until, x.time_from) - diff(y.time_until, y.time_from)


def timestamp_diff_format(t_from, t_until):
    e = int((t_from - t_until) / 60) * 60
    if e == 0:
        return ""
    else:
        return str(e)


def timestamp_tz(param, tz):
    if param is None:
        return None
    t = int(param[0])
    return int(timestamp(datetime.fromtimestamp(t, tz)))


def parse_line(line, render_params, render_cache):
    json_line = json.loads(line)
    if json_line.get('level') is None or json_line['level'] not in ('INFO', 'ERROR'):
        return


    if json_line['logger'] in ('render.pb3parser', 'render.json_target', 'render.target'):
        target = json_line.get('target')
        request_id = json_line.get('request_id')
        if target is None or request_id is None:
            return

        dt = dateutil.parser.parse(json_line['timestamp'])
        json_line['time'] = int(timestamp(dt))

        # can't get status code at this step, so save in cache
        if render_cache.get(request_id) is None:
            render_cache[request_id] = [target]
        else:
            render_cache[request_id].append(target)

        # try:
        #     url = '&target=' + quote_plus(target)

        #     if url not in render_params:
        #         render_params.add(url)
        # except Exception as e:
        #     sys.stderr.write("%s: %s" % (str(e), line))

    elif json_line['logger'] == 'http':
        url = json_line['url']
        if url is None:
            return
        if url.startswith("/render"):
            if json_line['status'] == '400':
                return
            request_id = json_line.get('request_id')
            targets = None
            if not request_id is None:
                targets = render_cache.get(request_id)
            if targets is None:
                return
            del render_cache[request_id]

            try:
                url = ""
                for target in targets:
                    url += '&target=' + quote(target)

                if url not in render_params:
                    render_params.add(url)
            except Exception as e:
                sys.stderr.write("%s: %s" % (str(e), line))


def parse_cmdline():
    parser = argparse.ArgumentParser(description='Set network settings')
    
    #parser.add_argument('pos', action='store', type=str, help='positional parameter')

    parser.add_argument('-l', '--log', dest='log', action='store', type=str, default="-",
                         help='input log file')

    parser.add_argument('-r', '--render', dest='render', action='store', type=str, default="-",
                         help='render queries')

    # parser.add_argument('-f', '--find', dest='find', action='store', type=str, default=None,
    #                      help='metrics find queries')

    # parser.add_argument('-t', '--tags', dest='tags', action='store', type=str, default=None,
    #                      help='metrics find queries')
                    
    return parser.parse_args()


def main():
    args = parse_cmdline()

    render_params = set()
    find_params = None
    # if not args.find is None:
    #     find_params = set()
    tags_params = None
    # if not args.tags is None:
    #     tags_params = set()

    inF = sys.stdin
    if args.log != "-" and  args.log != "":
        inF = open(args.log, 'r')
    
    render_cache = dict()
    for line in inF:
        parse_line(line, render_params, render_cache)

    renderF = sys.stdout
    if args.render != "-" and args.render != "":
        renderF = open(args.render, 'w')
    # PrintCSV header
    renderF.write('#target\n')
    for u in render_params:
        renderF.write("%s\n" % u)
    renderF.close()

    # if not args.find is None:
    #     with open(args.find, 'w') as findF:
    #         findF.write('#query\n')
    #         for u in find_params:
    #             findF.write("%s\n" % u)

    # if not args.tags is None:
    #     with open(args.tags, 'w') as tagsF:
    #         tagsF.write('#tags\n')
    #         for u in tags_params:
    #             tagsF.write("%s\n" % u)


if __name__ == "__main__":
    main()
