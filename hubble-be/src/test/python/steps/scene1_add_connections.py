# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("add connections -- request_host: (?P<text>.+)")
def step_impl(context, text):
    """
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/graph-connections"
    context.http_url = http_url


@given("add connections -- param: (?P<param>.+)")
def step_impl(context, param):
    """
    :type context: behave.runner.Context
    :type param: str
    """
    url = context.http_url
    payload = json.loads(param)
    res = requests.post(url=url, json=payload)
    context.res_json = res.json()


@then("add connections -- compare_assert: (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    :type scene: str
    """
    res_json = context.res_json
    print "res_json -- "+str(res_json)
    ass_json = json.loads(ass)
    print "ass_json --" + str(ass_json)
    assert (res_json["status"] == ass_json["status"]) and (str(res_json["message"]) == ass_json["message"])
