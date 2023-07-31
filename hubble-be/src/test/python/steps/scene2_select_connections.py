# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("select connections -- request_host: (?P<text>.+)")
def step_impl(context, text):
    """
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/graph-connections"
    context.http_url = http_url


@given("select connections -- param: (?P<param>.+)")
def step_impl(context, param):
    """
    :type context: behave.runner.Context
    :type param: str
    """
    if param == "null":
        res = requests.get(context.http_url)
        context.res_json = res.json()

    else:
        res = requests.get(url=context.http_url + "?" + param)
        context.res_json = res.json()


@then("select connections -- compare_assert: (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    res_json = context.res_json
    print 'res_json ---> ' + str(res_json)
    ass_json = json.loads(ass)
    print 'ass_json ---> ' + str(ass_json)
    if res_json["status"] == ass_json["status"]:
        assert True
        # ### 排序、分页 搜索 默认
        # if (not ass_json.has_key("graphOrder")) \
        #         and (not ass_json.has_key("pageSize")) \
        #         and (not ass_json.has_key("content")):
        #     ### 默认分页为 10
        #     list = res_json["data"]["records"]
        #     list_sort = res_json["data"]["records"]
        #     size = len(list)
        #     if size <= 10:
        #         ### 默认 时间排序
        #         list_sort.sort()
        #         flag = True
        #         for n in range(0, size):
        #             if list[n] == list_sort[n]:
        #                 pass
        #             else:
        #                 flag = False
        #         assert flag
        #     else:
        #         pass
        # else:
        #     pass
        #
        # ### 分页
        # if ass_json.has_key("pageSize"):
        #     assert True
        # else:
        #     pass
        #
        # ### 排序
        # if ass_json.has_key("graphOrder"):
        #     assert True
        # else:
        #     pass
        #
        # ### 搜索
        # if ass_json.has_key("content"):
        #     content_list = res_json["data"]["records"]
        #     if ass_json["content"] == "id":
        #         if content_list[0]["id"] == ass_json["id"]:
        #             assert True
        #         else:
        #             assert False
        #     elif ass_json["content"] == "name":
        #         if content_list[0]["name"] == ass_json["name"]:
        #             assert True
        #         else:
        #             assert False
        #     else:
        #         assert False
        # else:
        #     pass
        # ### 默认查询 ###
        # if ass_json.has_key("default"):
        #     assert True
        # else:
        #     assert False
    else:
        assert False
