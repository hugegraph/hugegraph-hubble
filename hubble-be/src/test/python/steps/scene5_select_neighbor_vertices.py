# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("neighbor_vertices -- (?P<text>.+)")
def step_impl(context, text):
    """
    :type context: behave.runner.Context
    :type text: str
    """
    http_url = "http://" + text + "/api/v1.1/graph-connections"
    res = requests.get(http_url)
    print "select_connections : " + str(res.json())
    context.id = res.json()["data"]["records"][-1]["id"]
    context.url = text


@given("neighbor_vertices -- (?P<scene>.+) -- (?P<param>.+)")
def step_impl(context, scene, param):
    """
    :param scene:
    :type context: behave.runner.Context
    :type param: str
    """
    select_url = "http://" + context.url + "/api/v1.1/gremlin-query"
    param_json = json.loads(param)
    if "connection_id" not in scene:
        param_json["connection_id"] = context.id
    else:
        pass
    print "param_json: " + str(param_json)
    res = requests.put(url=select_url, json=param_json)
    context.res = res.json()


@then("neighbor_vertices -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    res_json = context.res
    print "res ---> " + str(res_json)
    ass_json = json.loads(ass)
    assert res_json["status"] == ass_json["status"]
