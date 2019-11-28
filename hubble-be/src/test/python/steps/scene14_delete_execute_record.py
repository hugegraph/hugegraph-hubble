# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("delete execute_records -- (?P<text>.+) -- (?P<select_param>.+)")
def step_impl(context, text, select_param):
    """
    :param select_param:
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/execute-histories"
    context.http_url = http_url
    select_url = http_url + "?" + select_param
    context.select_url = select_url


@given("delete execute_records")
def step_impl(context):
    """
    :type context: behave.runner.Context
    """
    select_res = requests.get(url=context.select_url)
    list_res = select_res.json()["data"]["records"]
    print "list_res --- " + str(list_res)
    context.del_list = list_res


@then("delete execute_records -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    ass_json = json.loads(ass)
    id = context.del_list[0]["id"]
    del_url = context.http_url + "/" + str(id)
    del_res = requests.delete(url=del_url)
    print "del_res ---"+str(del_res.json())
    assert (del_res.json()["status"] == ass_json["status"]) \
           and (del_res.json()["data"]["status"] == ass_json["data_status"])