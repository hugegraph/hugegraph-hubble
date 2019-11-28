# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("delete query_connections -- (?P<text>.+) -- (?P<param>.+)")
def step_impl(context, text, param):
    """
    :type context: behave.runner.Context
    :type text: str
    :type param: str
    """
    http_url = "http://" + text + "/api/v1.1/gremlin-collections"
    res = requests.get(url=http_url + "?" + param)
    context.http_url = http_url
    context.res_json = res.json()


@given("delete query_connections")
def step_impl(context):
    """
    :type context: behave.runner.Context
    """
    select_list = context.res_json["data"]["records"]
    context.select_list = select_list


@then("delete query_connections -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    ass_json = json.loads(ass)
    print "ass_json --" + str(ass_json)
    print " select_list " + str(context.select_list)
    flag = True
    for jn in context.select_list:
        id = jn["id"]
        del_url = context.http_url + "/" + str(id)
        del_res = requests.delete(url=del_url)
        print "del_res -- " + str(del_res.json())
        if (del_res.json()["status"] != ass_json["status"]) or (ass_json["message"] != str(del_res.json()["message"])):
            flag = False
            break
        else:
            pass
    assert flag
