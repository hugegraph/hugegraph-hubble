# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")
### the premise
# http_url = "http://127.0.0.1:8088/api/v1.1/graph-connections"
# payload = {"name": "hugegraph3_ip",
#            "graph": "hugegraph3",
#            "host": "127.0.0.1",
#            "port": 8081,
#            "username": "hugegraph3",
#            "password": "9fd95c9c-711b-415b-b85f-d4df46ba5c31"}
# res = requests.post(url=http_url, json=payload)
# print "select_connections : "+str(res.json())
# id = res.json()["data"]["id"]


@when("select gremlin_query -- (?P<text>.+)")
def step_impl(context, text):
    """
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/graph-connections"
    res = requests.get(http_url)
    print "select_connections : "+str(res.json())
    context.id = res.json()["data"]["records"][-1]["id"]
    context.url = text


@given("select gremlin_query -- (?P<scene>.+) -- (?P<param>.+)")
def step_impl(context, scene,param):
    """
    :param text:
    :type context: behave.runner.Context
    :type param: str
    """
    select_url = "http://" + context.url + "/api/v1.1/gremlin-query"
    param_json = json.loads(param)
    if "connection_id" not in scene:
        param_json["connection_id"] = context.id
    else:
        pass
    # param_json["connection_id"] = id
    print "param_json: "+str(param_json)
    res = requests.post(url=select_url, json=param_json)
    context.res = res.json()


@then("select gremlin_query -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    res_json = context.res
    print "res ---> " + str(res_json)
    ass_json = json.loads(ass)
    assert (res_json["status"] == ass_json["status"]) and (str(res_json["message"]) == ass_json["message"])