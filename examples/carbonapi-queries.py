#!/usr/bin/python3

# Extract queries from carbonapi logs

# Logs format examples

# Render
#  {
#    "level":"INFO","timestamp":"2022-08-10T00:15:29.494+0300","logger":"access","message":"request served",
#    "data":{
#      "handler":"render","carbonapi_uuid":"5eeb6781-ad27-4bbe-9749-ac5540d9840d",
#      "url":"/render","peer_ip":"127.0.0.1","host":"localhost:8888","format":"json","use_cache":true,
#      "targets":["groupByNode(metric.*.*.name, 3, 'max')"],
#      "cache_timeout":10800,"runtime":0.00128572,"http_code":200,"carbonapi_response_size_bytes":5324,
#      "from":1660068900,"until":1660079700,"from_raw":"-3h","until_raw":"now","uri":"/render","from_cache":true,"used_backend_cache":false,
#      "request_headers":{"X-Dashboard-Id":"12","X-Forwarded-User":"user","X-Grafana-Org-Id":"1","X-Panel-Id":"25"}
#    }
#  }

# Metrics find with arguments
#  {
#    "level":"INFO","timestamp":"2022-08-08T17:53:15.885+0300","logger":"access","message":"request served",
#    "data":{
#      "handler":"find","carbonapi_uuid":"939066ad-a8d1-4ee6-9c74-20357169a3dc","username":"user",
#      "url":"/metrics/find?query=DB.k2.*.System.*&format=json",
#      "uri":"/metrics/find?query=DB.k2.*.System.*&format=json",
#      "peer_ip":"127.0.0.1","host":"carbonapi","format":"json","runtime":0.032905304,"http_code":200,
#      "from_cache":false,"used_backend_cache":false,"zipper_requests":1,"total_metrics_count":2,
#       "request_headers":{"X-Forwarded-User":"user"}
#    }
#  }

# Metrics find without arguments (query in body NOT LOGGED NOW !!!!)
#  {
#    "level":"INFO","timestamp":"2022-08-10T00:32:11.548+0300","logger":"access","message":"request served",
#    "data":{
#      "handler":"find","carbonapi_uuid":"65f77141-efba-47fc-94b5-af4426985489",
#      "url":"/metrics/find?from=1660078926&until=1660080732",
#      "uri":"/metrics/find?from=1660078926&until=1660080732",
#      "peer_ip":"127.0.0.1","host":"localhost:8888","runtime":0.021548235,"http_code":200,
#      "from_cache":false,"used_backend_cache":false,"zipper_requests":1,"total_metrics_count":53,
#      "request_headers":{"X-Forwarded-User":"dgoleo","X-Grafana-Org-Id":"1"}
#    }
#  }

# Tags autocompleter
# expr=name=status&expr=application=Test&expr=status_code=5*
#  {
#    "level":"INFO","timestamp":"2022-08-10T07:13:54.969+0300","logger":"access","message":"request served",
#    "data":{
#      "handler":"tags","carbonapi_uuid":"1ef6ed1c-4168-4b31-a563-538245832299", "peer_ip":"127.0.0.1","host":"localhost:8888",
#      "runtime":0.891524569,"http_code":200,
#      "url":"/tags/autoComplete/values",
#      "uri":"/tags/autoComplete/values?expr=name%3Dstatus%26expr%3Dapplication%3DTest%26expr%3Dstatus_code%3D5%2A&tag=project&valuePrefix=Clients",
#      "from_cache":false,"used_backend_cache":false,"request_headers":{"X-Forwarded-User":"user","X-Grafana-Org-Id":"1"}
#    }
#  }


import sys
import re
import json
import time
import dateutil.parser
from datetime import datetime
from datetime import timedelta

if sys.version_info >= (3, 3):
    import urllib.parse as urlparse
    quote_plus = urlparse.quote_plus

    def timestamp(dt):
        return dt.timestamp()
else:
    import urlparse
    import urllib
    quote_plus = urllib.quote_plus

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


def parse_line(line, urls):
    json_line = json.loads(line)
    if json_line.get('level') is None or json_line['level'] != 'INFO':
        return
    if json_line.get('logger') is None or json_line['logger'] != 'access':
        return
    if json_line.get('data') is None or not json_line['data']['url'].startswith('/render'):
        return
    if json_line['data'].get('targets') is None:
        return

    dt = dateutil.parser.parse(json_line['timestamp'])
    json_line['time'] = int(timestamp(dt))

    for target in json_line['data']['targets']:
        try:
            url = '&target=' + quote_plus(target)

            if url not in urls:
                urls.add(url)
        except:
            pass


def main():
    urls = set()

    for line in sys.stdin:
        parse_line(line, urls)

    # PrintCSV header
    print('target')

    for u in urls:
        print("%s" % u)


if __name__ == "__main__":
    main()
