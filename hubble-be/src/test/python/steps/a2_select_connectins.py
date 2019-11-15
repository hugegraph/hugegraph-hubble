# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")

@when("测试场景为:(?P<scene>.+)  请求路径:(?P<url>.+)")
def step_impl(context, scene, url):
    """
    :type context: behave.runner.Context
    :type scene: str
    :type url: str
    """
    http_url = "http://" + url + "/api/v1.1/graph-connections"
    context.http_url = http_url


@given("查询图链接的参数为(?P<param>.+)")
def step_impl(context, param):
    """
    :type context: behave.runner.Context
    :type param: str
    """
    if param == "null":
        res = requests.get(context.http_url)
        context.res_json = res.json()
    else:
        res = requests.get(url=context.http_url + param)
        context.res_json = res.json()


@then("请求值和断言为(?P<ass>.+)比较输出case的测试结果")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    res_json = context.res_json
    ass_json = json.loads(ass)

    if res_json["status"] == ass_json["status"]:
        ### 排序、分页 搜索 默认
        if (not ass_json.has_key("graph_order")) \
            and (not ass_json.has_key("page_size")) \
            and (not ass_json.has_key("content")):
            ### 默认分页为 10
            list = res_json["data"]["records"]
            list_sort = res_json["data"]["records"]
            size = len(list)
            if size <= 10:
                ### 默认 时间排序
                list_sort.sort()
                flag = True
                for n in range(0, size):
                    if list[n] == list_sort[n]:
                        pass
                    else:
                        flag = False
                assert flag
            else:
                pass
        else:
            pass

        ### 分页
        if ass_json.has_key("page_size"):
            assert True
        else:
            pass

        ### 排序
        if ass_json.has_key("graph_order"):
            assert True
        else:
            pass

        ### 搜索
        if ass_json.has_key("content"):
            assert True
        else:
            pass
    else:
        assert False
