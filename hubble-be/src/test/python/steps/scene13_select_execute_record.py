# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("select execute_records -- (?P<text>.+)")
def step_impl(context, text):
    """
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/execute-histories"
    context.http_url = http_url


@given("select execute_records -- (?P<param>.+)")
def step_impl(context, param):
    """
    :type context: behave.runner.Context
    :type param: str
    """
    if param == "null":
        select_url = context.http_url
        select_res = requests.get(url=select_url)
        context.select_res = select_res.json()
    else:
        select_url = context.http_url + "?" + param
        select_res = requests.get(url=select_url)
        context.select_res = select_res.json()


@then("select execute_records -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    select_json = context.select_res
    list_dataset = select_json["data"]["records"]
    size = len(list_dataset)
    ass_json = json.loads(ass)
    page_size = ass_json["page_size"]
    page_no = ass_json["page_no"]
    print " -- select_json --> "+str(select_json)
    if 14 >= page_size*page_no:
        assert (select_json["status"] == ass_json["status"] and size == page_size)
    else:
        assert (select_json["status"] == ass_json["status"] and size < page_size)


