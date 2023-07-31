# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when('select query_collections -- (?P<text>.+)')
def step_impl(context, text):
    """
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/gremlin-collections"
    context.http_url = http_url


@given("select query_collections -- (?P<param>.+)")
def step_impl(context, param):
    """
    :type context: behave.runner.Context
    :type param: str
    """
    context.pa = param
    if param == "null":
        select_url = context.http_url
        select_res = requests.get(url=select_url)
        context.select_res = select_res.json()
    else:
        select_url = context.http_url + "?" + param
        select_res = requests.get(url=select_url)
        context.select_res = select_res.json()


@then("select query_collections -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    ass_json = json.loads(ass)
    param = context.pa
    res_json = context.select_res
    print "res_json ---> " + str(res_json)
    if ass_json["status"] == res_json["status"]:
        assert True
        # list_res = res_json["data"]["records"]
        #
        # if "content" in param: ### 验证 content
        #     pass
        # elif "order_name" in param: ### 验证 name_order
        #     pass
        # else:   ### 验证 默认情况 或者 page_size 和 page_no 有参数
        #     list_sort = res_json["data"]["records"]
        #     list_sort.sort()
        #     size_res = len(list_sort)
        #     flag = True
        #     for n in range(0,size_res):
        #         if list_sort[n] == list_res[n]:
        #             pass
        #         else:
        #             flag = False
        #     page_size = res_json["page_size"]
        #     page_no = ass_json["page_no"]
        #     if 14 >= page_size * page_no:
        #         assert (size_res == page_size)
        #     else:
        #         assert (size_res < page_size)
    else:
        assert False
