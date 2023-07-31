# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("add query_connections -- (?P<text>.+)")
def step_impl(context, text):
    """
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/gremlin-collections"
    context.url = http_url


@given("add query_connections -- (?P<param>.+)")
def step_impl(context, param):
    """
    :type context: behave.runner.Context
    :type param: str
    """
    add_url = context.url
    payload = json.loads(param)
    add_res = requests.post(url=add_url, json=payload)
    context.add_res = add_res.json()


@then("add query_connections -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    add_res = context.add_res
    ass_json = json.loads(ass)
    print " ---> " + str(add_res)
    assert(add_res["status"] == ass_json["status"]) and (ass_json["message"] == str(add_res["message"]))