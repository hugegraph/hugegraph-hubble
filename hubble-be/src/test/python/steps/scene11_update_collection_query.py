# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("update query_collections -- (?P<text>.+)")
def step_impl(context, text):
    """
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/gremlin-collections"
    res = requests.get(url=http_url + "?page_size=50&page_no=1")
    context.http_url = http_url
    context.res_list = res.json()["data"]["records"]


@given("update query_collections -- (?P<action>.+)")
def step_impl(context, action):
    """
    :type context: behave.runner.Context
    """
    each_json = context.res_list[0]
    update_url = context.http_url
    update_json = {}
    if "name" in action:
        update_json["name"] = "testLXBtest"
        update_json["content"] = each_json["content"]
    elif "content" in action:
        update_json["content"] = "testLXBtest"
        update_json["name"] = each_json["name"]
    else:
        pass
    res_update = requests.put(url=update_url + "/" + str(each_json["id"]), json=update_json)
    context.res_ud = res_update.json()


@then("update query_collections -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    update_jn = context.res_ud
    print "update ---> " + str(update_jn)
    ass_json = json.loads(ass)
    assert (update_jn["status"] == ass_json["status"]) and (ass_json["message"] == str(update_jn["message"]))
