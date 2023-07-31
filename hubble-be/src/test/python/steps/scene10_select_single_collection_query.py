# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("select_by_id query_collections -- (?P<text>.+)")
def step_impl(context, text):
    """
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/gremlin-collections"
    res = requests.get(url=http_url + "?page_size=50&page_no=1")
    context.http_url = http_url
    context.res_list = res.json()["data"]["records"]


@given("select_by_id query_collections")
def step_impl(context):
    """
    :type context: behave.runner.Context
    """
    each_json = context.res_list[0]
    select_single_url = context.http_url
    res_select_single = requests.get(url=select_single_url + "/" + str(each_json["id"]))
    context.res_select_single = res_select_single.json()


@then("select_by_id query_collections -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    print "res_select_single ---> "+str(context.res_select_single)
    ass_json = json.loads(ass)
    assert (context.res_select_single["status"] == ass_json["status"]) and (ass_json["message"] == str(context.res_select_single["message"]))