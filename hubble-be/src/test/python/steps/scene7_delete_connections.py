# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("delete hugeGraph's connections -- (?P<text>.+)")
def step_impl(context, text):
    """
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/graph-connections"
    res = requests.get(url=http_url)
    context.http_url = http_url
    print "res.json() --- " + str(res.json())
    context.res_json = res.json()


@given("delete hugeGraph's connections")
def step_impl(context):
    """
    :type context: behave.runner.Context
    """
    res_json = context.res_json
    if res_json["status"] == 200:
        list_res = res_json["data"]["records"]
        context.list_res = list_res
    else:
        print 'create connection : failed !'
        assert False


@then("delete hugeGraph's connections -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    ass_json = json.loads(ass)
    list_res = context.list_res
    flag = True
    for res_json in list_res:
        url = context.http_url + "/" + str(res_json["id"])
        del_json = requests.delete(url).json()
        if (del_json["status"] != ass_json["status"]) or (ass_json["message"] != str(del_json["message"])):
            assert False
            break
        else:
            pass
    assert flag
